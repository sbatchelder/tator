# Build librclone shared object
FROM golang:latest AS build_librclone
WORKDIR /go
RUN git clone -b v1.58.1 --single-branch https://github.com/rclone/rclone.git

WORKDIR /go/rclone/librclone/
RUN go build --buildmode=c-shared -o librclone.so github.com/rclone/rclone/librclone

FROM ubuntu:20.04
MAINTAINER CVision AI <info@cvisionai.com>

# Copy librclone shared object to this container
COPY --from=build_librclone /go/rclone/librclone/librclone.so /usr/local/lib/

# Install apt packages
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        python3 python3-pip libgraphviz-dev xdot \
        python3-setuptools python3-dev gcc libgdal-dev git vim curl libffi-dev \
        ffmpeg wget && rm -rf /var/lib/apt/lists

# Install pip packages
RUN python3 -m pip --no-cache-dir --timeout=1000 install --upgrade pip
RUN pip3 --no-cache-dir --timeout=1000 install wheel
COPY ./tator_requirements.txt ./requirements.txt
RUN pip3 --no-cache-dir --timeout=1000 install -r ./requirements.txt

# Get acme_tiny.py for certificate renewal
WORKDIR /
RUN wget https://raw.githubusercontent.com/diafygi/acme-tiny/4.1.0/acme_tiny.py 

# Install kubectl
RUN wget https://storage.googleapis.com/kubernetes-release/release/v1.16.9/bin/linux/amd64/kubectl
RUN chmod +x kubectl
RUN mv kubectl /usr/local/bin/.

# Install fork of openapi-core that works in DRF views
WORKDIR /working
RUN git clone https://github.com/jrtcppv/openapi-core.git
WORKDIR /working/openapi-core
RUN python3 setup.py install

# Copy over the project
COPY . /tator_online
COPY ui/dist/* /tator_online/main/static/

# Delete front end unit tests
RUN rm -fr /tator_online/test
WORKDIR /tator_online
RUN rm -rf helm
