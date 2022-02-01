Architectural Pieces
====================

So what is Tator? Put simply, Tator is a web application. Like any web 
application, it consists of a backend (software that run on remote servers)
and a front-end (software that runs in a browser). This section will go through
the components that make up each of these in detail.


.. figure:: https://user-images.githubusercontent.com/7937658/130495996-069fcca5-7950-4b68-8657-7773d18ffbaf.png
   :scale: 50 %
   :align: center
   :alt: Top-level architectural components
   :figclass: align-center

    A Tator deployment makes use of one or more kubernetes clusters: one for serving
    the web application, and either the same cluster or other remote clusters for 
    running heavy workloads such as transcodes and algorithms.
    The green/blue boxes above denote where one can seperate the deployment to two
    seperate kubernetes clusters.

Kubernetes
----------

Tator is cloud-agnostic: It runs on bare metal or on any major cloud service 
provider such as AWS, GCP, or Azure. As a distributed application
(an application that runs on multiple physical nodes), it is scalable and 
highly available. These features are made possible because Tator runs on
`Kubernetes <https://kubernetes.io>`_, a container orchestration framework
originally developed by Google. All major cloud service providers provide
managed Kubernetes services, and on bare metal we recommend using a 
distribution of Kubernetes developed by Canonical called 
`microk8s <https://microk8s.io>`_. These services simply make Kubernetes 
clusters easier to manage and maintain. Kubernetes abstracts away 
physical hardware and allows Tator to run in containers. 

But what is actually running on Kubernetes? It turns out there are only three
core, custom Tator workloads running on any given Tator deployment: 
the Tator REST (Representational State Transfer) API, asynchronous
transcodes (video conversion workloads), and maintenance cron jobs which are
used for various functions such as database cleanup. Each of these runs in one
of the two primary custom container images defined in Tator, respectively: a
`backend container <https://hub.docker.com/repository/docker/cvisionai/tator_online>`_
and a `client container <https://hub.docker.com/repository/docker/cvisionai/tator_client>`_. 
The rest of the software that runs on Kubernetes is either a third-party 
dependency or a user defined algorithm workflow.

Helm
----

There are two "add-ons" that we use to make Kubernetes more useful. The first
is `Helm <https://helm.sh/>`_. Helm can be thought of as a package manager
for Kubernetes applications. Packages in Helm are called "charts". All major
third-party services maintain a Helm chart or have a community maintained 
Helm chart. Tator itself is distributed as a Helm chart, and it is through
this chart that we define required third party dependencies and manage the
configuration of all pieces of a Tator deployment. Helm has many features
that help with continuous deployment, such as the ability to rollback
application updates and to rollout application updates with zero downtime.

Argo
----

The second Kubernetes add-on that we use is 
`Argo <https://argoproj.github.io/argo-workflows/>`_. Argo allows Tator to
execute long running tasks on Kubernetes asynchronously. It is implemented
as a `custom resource definition (CRD) <https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/>`_, an extension of Kubernetes. Specifically,
it introduces a new Kubernetes object called a "workflow". A workflow 
consists of a series of steps, each of which is executed in a specified
container image. A workflow can be as simple as a single command run in a 
single container, or a complex directed acyclic graph, complete with 
step dependencies and parallel execution. The only core workflow that is
initiated by Tator is the transcode workflow, which is used to convert videos
to a streaming format compatible with Tator's player or to a download-optimized
format upon media upload. All other workflows that run in Tator are 
user-defined custom workflows, which may be algorithms for processing videos
or report generation workflows. Transcodes in Tator can be run
on the same Kubernetes cluster as the Tator REST API, or on a separate 
Kubernetes cluster defined via the Helm configuration file. Likewise, custom
user-defined workflows can be run on user-defined Kubernetes clusters (and
in many cases custom workflows must be run on a separate cluster for 
security reasons; this requirement can be enforced via a Helm configuration
parameter).

Use of managed services
-----------------------

Now we can discuss the various third-party dependencies that run on Kubernetes
with the Tator REST API. We can group these dependencies into four functions:
serving the application, object storage, databases, and administration. Many 
of these services may be managed services rather than running on
Kubernetes. This can be configured using the Helm chart configuration file, 
and is the recommended configuration for production deployments of Tator.

Serving the application
-----------------------

Clients communicate with the Tator REST API using HTTP or HTTPS requests. All
of these requests are proxied by `NGINX <https://www.nginx.com/>`_, a web 
serving application. In the case of HTTPS, NGINX is the endpoint for encrypted
traffic; all upstream services are communicated to via HTTP. NGINX is also used
for serving static assets, including the front-end code and documentation. In Kubernetes,
all applications are implemented as "Deployment" objects, and have a 
corresponding "Service" object that specifies how the application can be 
accessed. In the case of NGINX, the service object is of type "LoadBalancer".
This means that the service accepts external traffic, routes it into the 
internal container network, and uses a load balancing strategy to distribute
traffic among one of multiple NGINX containers. For cloud service providers,
the LoadBalancer object is implemented using a managed load balancing service.
For example, on AWS a Kubernetes LoadBalancer is fulfilled by Elastic Load
Balancer (ELB). On bare metal, we use an application called 
`MetalLB <https://metallb.universe.tf/>`_ to implement LoadBalancer objects.
This allows Kubernetes to accept traffic on a specific IP address in a
local area network using standard routing protocols.

Object storage
--------------




.. glossary::
   Kubernetes
     

   MetalLB
     The load balancer used in a bare metal deployment of kubernetes. The load
     balancer is configured via :term:`loadBalancerIp` to forward traffic seen
     at that IP to the internal software network of kubernetes.

   Job Server
     The job server is the kuberneters cluster that has :term:`Argo` installed
     to run asynchronous jobs for the tator deployment. Asynchronous work can include
     transcodes, GPU and/or CPU algorithms, report generation, and more.

   Argo
     An extension to kubernetes to define a new job type called a *workflow*.
     This allows for defining the execution of complex algorithms or routines
     across a series of pods based on the description.
     `Argo <https://argoproj.github.io/projects/argo/>`_ is developed and
     maintained by `Intuit <https://www.intuit.com/>`_.

   NGINX
     The `web server <https://www.nginx.com/>`_ used to handle both static
     serving of files as well as forwarding to dynamic content created by
     django.

   Django
     The `python web framework <https://www.djangoproject.com/>`_ used by
     Tator for handling dynamic web content and REST interactions.

   Elasticsearch
     Complement to the :term:`PostgresSQL` database to allow for 
     `faster searches and analytics <https://www.elastic.co/>`_.

   PostgresSQL
     `SQL-compliant database <https://www.postgresql.org/>`_ used to store
     project configurations as well as media and associated metadata.

   Redis
     Provides `in-memory caching <https://www.redis.io>` of temporary data.

   MinIO
     An S3-compatible object storage suite used to store and retrieve all
     media files.

   Kubernetes
     The underlying system used to deploy and manage the containerized
     application. `Kubernetes <https://kubernetes.io/>`_ or k8s relays on
     a working `Docker <https://www.docker.com/>`_ installation.

