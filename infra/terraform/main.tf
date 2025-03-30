terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.13.0"
    }
  }
}
provider "google" {
  project = var.project_id
  region  = var.region
}

########################
# GitHub CI Service Account
########################

resource "google_service_account" "github_ci" {
  account_id   = "github-deployer"
  display_name = "GitHub CI/CD deployer"
}

resource "google_project_iam_member" "github_ci_roles" {
  for_each = toset([
    "roles/run.admin",
    "roles/storage.admin",
    "roles/cloudfunctions.developer",
    "roles/artifactregistry.writer",
    "roles/viewer",
    "roles/cloudtasks.admin"
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.github_ci.email}"
}

########################
# General-purpose GCS Buckets
########################

# Frontend bucket (SPA)
resource "google_storage_bucket" "frontend" {
  name                        = var.frontend_bucket_name
  location                    = var.region
  uniform_bucket_level_access = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
}

# Make the frontend be available publicly
resource "google_storage_bucket_iam_member" "frontend_public_read" {
  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Public general-purpose bucket
resource "google_storage_bucket" "public_assets" {
  name     = var.public_bucket_name
  location = var.region
  uniform_bucket_level_access = true
}

# Make the public general-purpose bucket be available publicly
resource "google_storage_bucket_iam_member" "public_assets_read" {
  bucket = google_storage_bucket.public_assets.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Private general-purpose bucket
resource "google_storage_bucket" "private_assets" {
  name     = var.private_bucket_name
  location = var.region
  uniform_bucket_level_access = true
}

# Bucket for cloud functions
resource "google_storage_bucket" "cloud_functions" {
  name     = "${var.project_id}-functions"
  location = var.region
  uniform_bucket_level_access = true
}

########################
# Cloud Run: Backend
########################

resource "google_cloud_run_v2_service" "backend" {
  name     = "backend-service"
  location = var.region

  template {
    scaling {
      max_instance_count = 2
    }

    containers {
      image = "gcr.io/cloudrun/hello"

      env {
        name = "STRIPE_PRIVATE_KEY"
        value_source {
          secret_key_ref {
            secret = google_secret_manager_secret.stripe_private_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "TASKS_SA_EMAIL"
        value = google_service_account.github_ci.email
      }

      env {
        name = "STAGE"
        value = var.backend_stage
      }
    }
    service_account_name = google_service_account.github_ci.email
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

resource "google_cloud_run_service_iam_member" "backend_public" {
  location = var.region
  project  = var.project_id
  service  = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

########################
# Cloud Function: cancelSession
########################

# Source for the function
resource "google_storage_bucket_object" "cancel_session_zip" {
  name   = "cancel-session/index.zip"
  bucket = google_storage_bucket.cloud_functions.name
  source = "${path.module}/../../cloud-functions/cancel-session/index.zip"
}

resource "google_cloudfunctions_function" "cancel_session" {
  name        = "cancelSession"
  runtime     = "nodejs22"
  region      = var.region
  source_archive_bucket = google_storage_bucket.cloud_functions.name
  source_archive_object = google_storage_bucket_object.cancel_session_zip.name
  entry_point = "cancelStripeSession"
  trigger_http = true
  available_memory_mb = 256
  service_account_email = google_service_account.github_ci.email

  secret_environment_variables {
    key    = "STRIPE_SECRET_KEY"
    project_id = var.project_id
    secret = google_secret_manager_secret.stripe_private_key.secret_id
    version = "latest"
  }
}

resource "google_cloudfunctions_function_iam_member" "cancel_session_invoker" {
  project        = var.project_id
  region         = var.region
  cloud_function = google_cloudfunctions_function.cancel_session.name
  role           = "roles/cloudfunctions.invoker"
  member         = "serviceAccount:${google_service_account.github_ci.email}"
}


#######################################################
# Cloud Task Queue
#######################################################
resource "google_cloud_tasks_queue" "cancel_checkout_sessions" {
  name  = "cancel-stripe-checkout-sessions"
  location = var.region

  rate_limits {
    max_dispatches_per_second = 5
    max_concurrent_dispatches = 10
  }

  retry_config {
    max_attempts       = 10
    max_retry_duration = "10s"
    min_backoff        = "1s"
    max_backoff        = "10s"
  }
}

#######################################################
# Secret: stripe secret key
#######################################################
resource "google_secret_manager_secret" "stripe_private_key" {
  secret_id = "STRIPE_SECRET_KEY"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "initial_stripe_key" {
  secret      = google_secret_manager_secret.stripe_private_key.id
  secret_data = "dummy-value"
}

resource "google_secret_manager_secret_iam_member" "stripe_secret_access" {
  secret_id = google_secret_manager_secret.stripe_private_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.github_ci.email}"
}

#######################################################
# Secret: database url
#######################################################
resource "google_secret_manager_secret" "database_url" {
  secret_id = "DATABASE_URL"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "initial_database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "dummy-value"
}

resource "google_secret_manager_secret_iam_member" "database_url_access" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.github_ci.email}"
}
