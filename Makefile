#Helps to have a line like %sudo ALL=(ALL) NOPASSWD: /bin/systemctl
include .env

CONTAINERS=ui postgis pgbouncer redis client gunicorn nginx pruner sizer

OPERATIONS=reset logs bash

IMAGES=ui-image graphql-image postgis-image client-image

GIT_VERSION=$(shell git rev-parse HEAD)

TATOR_PY_WHEEL_VERSION=$(shell python3 -c 'import json; a = json.load(open("scripts/packages/tator-py/config.json", "r")); print(a.get("packageVersion"))')
TATOR_PY_WHEEL_FILE=scripts/packages/tator-py/dist/tator-$(TATOR_PY_WHEEL_VERSION)-py3-none-any.whl

TATOR_JS_MODULE_FILE=scripts/packages/tator-js/pkg/src/index.js

# Defaults to detecting what the current's node APT is, if cross-dist building:
# or http://archive.ubuntu.com/ubuntu/ is a safe value.
# Set this ENV to http://us-east-1.ec2.archive.ubuntu.com/ubuntu/ for 
# faster builds on AWS ec2
# Set this ENV to http://iad-ad-1.clouds.archive.ubuntu.com/ubuntu/ for
# faster builds on Oracle OCI 
APT_REPO_HOST ?= $(shell cat /etc/apt/sources.list | grep "focal main" | head -n1 | awk '{print $$2}')

#############################
## Help Rule + Generic targets
#############################
.PHONY: help
help:
	@echo "Tator Online Makefile System"
	@echo  "Generic container operations: (container-action)"
	@echo "\tValid Containers:"
	@echo $(foreach  container, $(CONTAINERS), "\t\t- ${container}\n")
	@echo "\t\t- algorithm"
	@echo "\tValid Operations:"
	@echo $(foreach  operation, $(OPERATIONS), "\t\t- ${operation}\n")
	@echo "\tExample: "
	@echo "\t\tmake tator-reset"
	@echo "\nOther useful targets: "
	@echo "\t\t - collect-static : Runs collect-static on server (manage.py)."
	@echo "\t\t - migrate : Runs migrate on server (manage.py)"
	@echo "\t\t - status : Prints status of container deployment"
	@echo "\t\t - reset : Reset all pods"

	@echo "\t\t - imageQuery: Make sentinel files match docker registry"
	@echo "\t\t - imageHold: Hold sentinel files to current time"
	@echo "\t\t - imageClean: Delete sentinel files + generated dockerfiles"

#TODO Reimplement
#ui_bash:
#	kubectl exec -it $$(kubectl get pod -l "app=ui" -o name | head -n 1 | sed 's/pod\///') -- /bin/sh

#TODO Enable
# Top-level rule to catch user action + podname and whether it is present
# Sets pod name to the command to execute on each pod.
#define generate_rule
#$(1)-$(2):
#	make podname=$(1) _$(2);
#endef

#TODO Enable
#$(foreach action,$(OPERATIONS),$(foreach container,$(CONTAINERS),$(eval $(call generate_rule,$(container),$(action)))))

#TODO Reimplement
# Generic handlers (variable podname is set to the requested pod)
#_reset:
#	kubectl delete pods -l app=$(podname)

#TODO Reimplement
#_bash:
#	kubectl exec -it $$(kubectl get pod -l "app=$(podname)" -o name | head -n 1 | sed 's/pod\///') -- /bin/bash

#TODO Reimplement
#_logs:
#	kubectl describe pod $$(kubectl get pod -l "app=$(podname)" -o name | head -n 1 | sed 's/pod\///')
#	kubectl logs $$(kubectl get pod -l "app=$(podname)" -o name | head -n 1 | sed 's/pod\///') -f

#TODO Reimplement
#django-shell:
#	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- python3 manage.py shell


#####################################
## Custom rules below:
#####################################
#TODO Reimplement
#.PHONY: status
#status:
#	kubectl get --watch pods -o wide --sort-by="{.spec.nodeName}"

.ONESHELL:

.PHONY: check-migration
check-migration:
	scripts/check-migration.sh $(pwd)

.PHONY: compose
compose:
	docker compose up

.PHONY: clean
clean:
	docker compose down

clean-tokens:
	rm -fr .token

# GIT-based diff for image generation
# Available for tator-image, change dep to ".token/tator_online_$(GIT_VERSION)"
# Will cause a rebuild on any dirty working tree OR if the image has been built with a token generated
ifeq ($(shell git diff main | wc -l), 0)
.token/tator_online_$(GIT_VERSION):
	@echo "No git changes detected"
	make tator-image
else
.PHONY: .token/tator_online_$(GIT_VERSION)
.token/tator_online_$(GIT_VERSION):
	@echo "Git changes detected"
	$(MAKE) tator-image
endif

.PHONY: tator-image
tator-image:
	DOCKER_BUILDKIT=1 docker build --build-arg GIT_VERSION=$(GIT_VERSION) --build-arg DOCKERHUB_USER=$(REGISTRY) --build-arg APT_REPO_HOST=$(APT_REPO_HOST) --network host -t $(REGISTRY)/tator_online:$(GIT_VERSION) -f containers/tator/Dockerfile . || exit 255
	docker push $(REGISTRY)/tator_online:$(GIT_VERSION)
	mkdir -p .token
	touch .token/tator_online_$(GIT_VERSION)

.PHONY: ui-image
ui-image: webpack
	DOCKER_BUILDKIT=1 docker build --build-arg GIT_VERSION=$(GIT_VERSION) --build-arg REGISTRY=$(REGISTRY) --network host -t $(REGISTRY)/tator_ui:$(GIT_VERSION) -f containers/tator_ui/Dockerfile . || exit 255
	docker push $(REGISTRY)/tator_ui:$(GIT_VERSION)

.PHONY: graphql-image
graphql-image: doc/_build/schema.yaml
	DOCKER_BUILDKIT=1 docker build --network host -t $(REGISTRY)/tator_graphql:$(GIT_VERSION) -f containers/tator_graphql/Dockerfile . || exit 255
	docker push $(REGISTRY)/tator_graphql:$(GIT_VERSION)

.PHONY: postgis-image
postgis-image:
	DOCKER_BUILDKIT=1 docker build --network host -t $(REGISTRY)/tator_postgis:$(GIT_VERSION) --build-arg APT_REPO_HOST=$(APT_REPO_HOST) -f containers/postgis/Dockerfile . || exit 255
	docker push $(REGISTRY)/tator_postgis:$(GIT_VERSION)

EXPERIMENTAL_DOCKER=$(shell docker version --format '{{json .Client.Experimental}}')
ifeq ($(EXPERIMENTAL_DOCKER), true)
# exists if experimental docker is not found
.PHONY: experimental_docker
experimental_docker:
	@echo "NOTICE:\tDetected experimental docker"
else
.PHONY: experimental_docker
experimental_docker:
	@echo  "ERROR:\tImage build requires '--platform' argument which requires docker client experimental features"
	@echo "\tUpgrade to docker client version >= 20.10.17 or turn on the experimental flag manually in config.json"
	@echo "\tFor more info, see 'man docker-config-json'"
	exit 255
endif


ifeq ($(USE_VPL),True)
.PHONY: client-vpl
client-vpl: $(TATOR_PY_WHEEL_FILE)
	DOCKER_BUILDKIT=1 docker build --platform linux/amd64 --network host -t $(REGISTRY)/tator_client_vpl:$(GIT_VERSION) -f containers/tator_client/Dockerfile.vpl . || exit 255
	docker push $(REGISTRY)/tator_client_vpl:$(GIT_VERSION)
else
.PHONY: client-vpl
client-vpl: $(TATOR_PY_WHEEL_FILE)
	@echo "Skipping VPL Build"
endif

.PHONY: client-amd64
client-amd64: $(TATOR_PY_WHEEL_FILE)
	DOCKER_BUILDKIT=1 docker build --platform linux/amd64 --network host -t $(REGISTRY)/tator_client_amd64:$(GIT_VERSION) --build-arg APT_REPO_HOST=$(APT_REPO_HOST)  -f containers/tator_client/Dockerfile . || exit 255

.PHONY: client-aarch64
client-aarch64: $(TATOR_PY_WHEEL_FILE)
		DOCKER_BUILDKIT=1 docker build --platform linux/aarch64 --network host -t $(REGISTRY)/tator_client_aarch64:$(GIT_VERSION) -f containers/tator_client/Dockerfile_arm . || exit 255

# Publish client image to dockerhub so it can be used cross-cluster
.PHONY: client-image
client-image: experimental_docker client-vpl client-amd64 client-aarch64
	docker push $(REGISTRY)/tator_client_amd64:$(GIT_VERSION)
	docker push $(REGISTRY)/tator_client_aarch64:$(GIT_VERSION)
	docker manifest create --insecure $(REGISTRY)/tator_client:$(GIT_VERSION) --amend $(REGISTRY)/tator_client_amd64:$(GIT_VERSION) --amend $(REGISTRY)/tator_client_aarch64:$(GIT_VERSION)
	docker manifest create --insecure $(REGISTRY)/tator_client:latest --amend $(REGISTRY)/tator_client_amd64:$(GIT_VERSION) --amend $(REGISTRY)/tator_client_aarch64:$(GIT_VERSION)
	docker manifest push $(REGISTRY)/tator_client:$(GIT_VERSION)
	docker manifest push $(REGISTRY)/tator_client:latest

.PHONY: client-latest
client-latest: client-image
	docker tag $(REGISTRY)/tator_client:$(GIT_VERSION) cvisionai/tator_client:latest
	docker push cvisionai/tator_client:latest

.PHONY: braw-image
braw-image:
	DOCKER_BUILDKIT=1 docker build --network host -t $(REGISTRY)/tator_client_braw:$(GIT_VERSION) -f containers/tator_client_braw/Dockerfile . || exit 255
	docker push $(REGISTRY)/tator_client_braw:$(GIT_VERSION)
	docker tag $(REGISTRY)/tator_client_braw:$(GIT_VERSION) $(REGISTRY)/tator_client_braw:latest
	docker push $(REGISTRY)/tator_client_braw:latest


ifeq ($(shell cat main/version.py), $(shell ./scripts/version.sh))
.PHONY: main/version.py
main/version.py:
	@echo "Version file already generated"
else
.PHONY: main/version.py
main/version.py:
	./scripts/version.sh > main/version.py
	chmod +x main/version.py
endif

#TODO Reimplement
#collect-static: webpack
#	@scripts/collect-static.sh

#TODO Reimplement
#dev-push:
#	@scripts/dev-push.sh

ifeq ($(USE_MIN_JS),True)
webpack: $(TATOR_JS_MODULE_FILE)
	@echo "Building webpack bundles for production, because USE_MIN_JS is true"
	cd ui && npm install && python3 make_index_files.py && npm run build
else
webpack: $(TATOR_JS_MODULE_FILE)
	@echo "Building webpack bundles for development, because USE_MIN_JS is false"
	cd ui && npm install && python3 make_index_files.py && npm run buildDev
endif

#TODO Reimplement
#.PHONY: migrate
#migrate:
#	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- python3 manage.py makemigrations
#	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- python3 manage.py migrate

#TODO Reimplement
#.PHONY: testinit
#testinit:
#	kubectl exec -it $$(kubectl get pod -l "app=postgis" -o name | head -n 1 | sed 's/pod\///') -- psql -U django -d tator_online -c 'CREATE DATABASE test_tator_online';
#	kubectl exec -it $$(kubectl get pod -l "app=postgis" -o name | head -n 1 | sed 's/pod\///') -- psql -U django -d test_tator_online -c 'CREATE EXTENSION IF NOT EXISTS LTREE';
#	kubectl exec -it $$(kubectl get pod -l "app=postgis" -o name | head -n 1 | sed 's/pod\///') -- psql -U django -d test_tator_online -c 'CREATE EXTENSION IF NOT EXISTS POSTGIS';
#	kubectl exec -it $$(kubectl get pod -l "app=postgis" -o name | head -n 1 | sed 's/pod\///') -- psql -U django -d test_tator_online -c 'CREATE EXTENSION IF NOT EXISTS vector';
#	kubectl exec -it $$(kubectl get pod -l "app=postgis" -o name | head -n 1 | sed 's/pod\///') -- psql -U django -d test_tator_online -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm';
	
#TODO Reimplement
#.PHONY: test
#test:
#	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- sh -c 'python3 manage.py test --keep'

#TODO Reimplement
#.PHONY: cache_clear
#cache-clear:
#	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- python3 -c 'from main.cache import TatorCache;TatorCache().invalidate_all()'

.PHONY: images
images: ${IMAGES}
	@echo "Built ${IMAGES}"

$(TATOR_PY_WHEEL_FILE): doc/_build/schema.yaml
	cp doc/_build/schema.yaml scripts/packages/tator-py/.
	cd scripts/packages/tator-py
	rm -rf dist
	python3 setup.py sdist bdist_wheel
	if [ ! -f dist/*.whl ]; then
		exit 1
	fi
	cd ../../..

# OBE with partial rebuilds working, here for backwards compatibility.
.PHONY: python-bindings-only
python-bindings-only:
	$(MAKE) python-bindings

.PHONY: python-bindings
python-bindings:
	make $(TATOR_PY_WHEEL_FILE)

$(TATOR_JS_MODULE_FILE): doc/_build/schema.yaml
	rm -f scripts/packages/tator-js/tator-openapi-schema.yaml
	cp doc/_build/schema.yaml scripts/packages/tator-js/.
	cd scripts/packages/tator-js
	rm -rf pkg && mkdir pkg && mkdir pkg/src
	./codegen.py tator-openapi-schema.yaml
	docker run --rm \
		-v $(shell pwd)/scripts/packages/tator-js:/pwd \
		openapitools/openapi-generator-cli:v6.1.0 \
		generate -c /pwd/config.json \
		-i /pwd/tator-openapi-schema.yaml \
		-g javascript -o /pwd/pkg -t /pwd/templates
	docker run --rm \
		-v $(shell pwd)/scripts/packages/tator-js:/pwd \
		openapitools/openapi-generator-cli:v6.1.0 \
		chmod -R 777 /pwd/pkg
	cp -r examples pkg/examples
	cp -r utils pkg/src/utils
	cd pkg && npm install
	npm install -D @playwright/test \
		isomorphic-fetch fetch-retry spark-md5 uuid querystring

.PHONY: js-bindings
js-bindings: .token/tator_online_$(GIT_VERSION)
	make $(TATOR_JS_MODULE_FILE)

.PHONY: r-docs
r-docs: doc/_build/schema.yaml
	docker inspect --type=image $(REGISTRY)/tator_online:$(GIT_VERSION) && \
	cp doc/_build/schema.yaml scripts/packages/tator-r/.
	rm -rf scripts/packages/tator-r/tmp
	mkdir -p scripts/packages/tator-r/tmp
	./scripts/packages/tator-r/codegen.py $(shell pwd)/scripts/packages/tator-r/schema.yaml
	docker run --rm \
		-v $(shell pwd)/scripts/packages/tator-r:/pwd \
		-v $(shell pwd)/scripts/packages/tator-r/tmp:/out openapitools/openapi-generator-cli:v5.0.0-beta \
		generate -c /pwd/config.json \
		-i /pwd/schema.yaml \
		-g r -o /out/tator-r-new-bindings -t /pwd/templates
	docker run --rm \
		-v $(shell pwd)/scripts/packages/tator-r/tmp:/out openapitools/openapi-generator-cli:v5.0.0-beta \
		/bin/sh -c "chown -R nobody:nogroup /out"
	rm -f scripts/packages/tator-r/R/generated_*
	rm scripts/packages/tator-r/schema.yaml
	cd $(shell pwd)/scripts/packages/tator-r/tmp/tator-r-new-bindings/R && \
		for f in $$(ls -l | awk -F':[0-9]* ' '/:/{print $$2}'); do cp -- "$$f" "../../../R/generated_$$f"; done
	docker run --rm \
		-v $(shell pwd)/scripts/packages/tator-r:/tator \
		rocker/tidyverse:latest \
		/bin/sh -c "R --slave -e \"devtools::install_deps('/tator')\"; \
		R CMD build tator; R CMD INSTALL tator_*.tar.gz; \
		R --slave -e \"install.packages('pkgdown')\"; \
		Rscript -e \"devtools::document('tator')\"; \
		Rscript -e \"pkgdown::build_site('tator')\"; \
		chown -R $(shell id -u):$(shell id -g) /tator"
	rm -rf $(shell pwd)/doc/_build/html/tator-r
	cp -r $(shell pwd)/scripts/packages/tator-r/docs $(shell pwd)/doc/_build/html/tator-r
	touch $(shell pwd)/doc/tator-r/overview.rst
	touch $(shell pwd)/doc/tator-r/reference/api.rst
	cd ../../..

TOKEN=$(shell cat token.txt)
HOST=http://localhost:$(PORT)
.PHONY: pytest
pytest:
	cd scripts/packages/tator-py && pip3 install . --upgrade && pytest --full-trace --host $(HOST) --token $(TOKEN)

.PHONY: markdown-docs
markdown-docs:
	sphinx-build -M markdown ./doc ./doc/_build
	mkdir -p ./doc/_build/tator-py
	python3 scripts/format_markdown.py ./doc/_build/markdown/tator-py/utilities.md ./doc/_build/tator-py/utilities.md
	python3 scripts/format_markdown.py ./doc/_build/markdown/tator-py/api.md ./doc/_build/tator-py/api.md
	python3 scripts/format_markdown.py ./doc/_build/markdown/tator-py/models.md ./doc/_build/tator-py/models.md
	python3 scripts/format_markdown.py ./doc/_build/markdown/tator-py/exceptions.md ./doc/_build/tator-py/exceptions.md


# Only run if schema changes
doc/_build/schema.yaml: $(shell find main/schema/ -name "*.py") .token/tator_online_$(GIT_VERSION)
	rm -fr doc/_build/schema.yaml
	mkdir -p doc/_build
	docker run --rm -e DJANGO_SECRET_KEY=1337 -e ELASTICSEARCH_HOST=127.0.0.1 -e TATOR_DEBUG=false -e TATOR_USE_MIN_JS=false $(REGISTRY)/tator_online:$(GIT_VERSION) python3 manage.py getschema > doc/_build/schema.yaml
	sed -i "s/\^\@//g" doc/_build/schema.yaml

# Hold over
.PHONY: schema
schema:
	$(MAKE) doc/_build/schema.yaml

.PHONY: check_schema
check_schema:
	docker run --rm -e DJANGO_SECRET_KEY=1337 -e ELASTICSEARCH_HOST=127.0.0.1 -e TATOR_DEBUG=false -e TATOR_USE_MIN_JS=false $(REGISTRY)/tator_online:$(GIT_VERSION) python3 manage.py getschema

.PHONY: clean_schema
clean_schema:
	rm -f doc/_build/schema.yaml

