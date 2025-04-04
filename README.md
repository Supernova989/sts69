### 1. Simple Ticket System

The goal of the project is to provide an easy way to manage events and tickets.


#### Stack
* Typescript
* NestJS
* React
* PostgreSQL
* Docker
* Google Cloud Platform


### 2. Deployment
#### 2.1 Create Artifact registry (run once)

First, an artifact registry for docker images should be created. In the cloud console, run:

```
gcloud artifacts repositories create "backend" \
  --repository-format=docker \
  --location="europe-west3" \
  --project="sts69" \
  --description="Docker images for backend service"
```
Make sure that your account has the role `roles/artifactregistry.admin`.

#### 2.2 

