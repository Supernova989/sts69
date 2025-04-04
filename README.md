### 1. Simple Ticket System

The goal of the project is to provide an easy way to manage events and tickets.


#### Stack
* Typescript
* NestJS
* React
* PostgreSQL
* Docker
* Google Cloud Platform


### 2. GCP project initialization

#### 2.1 Create a CI service account 

```shell
gcloud iam service-accounts create ci-deployer \
  --description="Service account for CI" \
  --display-name="CI Service Account"
```

#### 2.1 Assign the roles to the service account 

```shell
PROJECT_ID=your-project-id
SA_EMAIL="ci-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

ROLES=(
  roles/artifactregistry.writer
  roles/cloudfunctions.developer
  roles/run.admin
  roles/cloudtasks.admin
  roles/editor
  roles/secretmanager.admin
  roles/iam.serviceAccountUser
  roles/serviceusage.serviceUsageAdmin
  roles/storage.admin
  roles/viewer
  roles/compute.loadBalancerAdmin               # for managing SSL certificates
  roles/compute.networkAdmin                    # for creating VPCs and subnets
  roles/cloudbuild.builds.editor                # for Cloud Build
)
 
for ROLE in "${ROLES[@]}"; do
  echo "\nAssigning role $ROLE to $SA_EMAIL\n"

  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$ROLE"
done

```

#### 2.3 Download the SA key and get a base64-version of it

```shell
base64 < service_account.json
```

#### 2.4 Set up Gitflow env
Variables from [infra.yaml](.github/workflows/infra.yaml) need to be set up in the Gitflow environment.
