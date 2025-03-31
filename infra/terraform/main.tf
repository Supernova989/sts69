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

locals {
  required_apis = [
    "cloudresourcemanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudtasks.googleapis.com",
    "secretmanager.googleapis.com",
    "compute.googleapis.com",
  ]
}

resource "google_project_service" "enabled" {
  for_each           = toset(local.required_apis)
  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

#######################################################
# Secret: stripe secret key
#######################################################
resource "google_secret_manager_secret" "stripe_private_key" {
  depends_on = [google_project_service.enabled]
  secret_id = "STRIPE_PRIVATE_KEY"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "initial_stripe_key" {
  depends_on = [google_project_service.enabled]
  secret      = google_secret_manager_secret.stripe_private_key.id
  secret_data = "dummy-value"
}

resource "google_secret_manager_secret_iam_member" "stripe_secret_access" {
  depends_on = [google_project_service.enabled]
  secret_id = google_secret_manager_secret.stripe_private_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.github_deployer_sa_email}"
}

#######################################################
# Secret: database url
#######################################################
resource "google_secret_manager_secret" "database_url" {
  depends_on = [google_project_service.enabled]
  secret_id = "DATABASE_URL"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "initial_database_url" {
  depends_on = [google_project_service.enabled]
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "dummy-value"
}

resource "google_secret_manager_secret_iam_member" "database_url_access" {
  depends_on = [google_project_service.enabled]
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.github_deployer_sa_email}"
}


#######################################################
# GCS Buckets
#######################################################

# Frontend bucket (SPA)
resource "google_storage_bucket" "frontend_bucket" {
  name                        = "${var.project_id}-frontend"
  location                    = var.region
  uniform_bucket_level_access = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
}

# Make the frontend be available publicly
resource "google_storage_bucket_iam_member" "frontend_public_read" {
  bucket = google_storage_bucket.frontend_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Public general-purpose bucket
resource "google_storage_bucket" "public_assets" {
  name     = "${var.project_id}-public"
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
  name     = "${var.project_id}-private"
  location = var.region
  uniform_bucket_level_access = true
}

# Bucket for cloud functions
resource "google_storage_bucket" "cloud_functions" {
  name     = "${var.project_id}-functions"
  location = var.region
  uniform_bucket_level_access = true
}

#######################################################
# Cloud Run: Backend
#######################################################

resource "google_cloud_run_v2_service" "backend" {
  name     = "backend-service"
  location = var.region

  depends_on = [
    google_project_service.enabled,
    google_secret_manager_secret_version.initial_database_url,
    google_secret_manager_secret_version.initial_stripe_key
  ]

  template {
    service_account = var.github_deployer_sa_email

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
        value = var.github_deployer_sa_email
      }

      env {
        name = "STAGE"
        value = var.backend_stage
      }
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}

resource "google_cloud_run_service_iam_member" "backend_public" {
  location = var.region
  project  = var.project_id
  service  = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

#######################################################
# Cloud Function: cancel-stripe-session
#######################################################

# Source for the function
resource "google_storage_bucket_object" "cancel_stripe_session_zip" {
  name   = "empty-gcf-source.zip"
  bucket = google_storage_bucket.cloud_functions.name
  source = "empty-gcf-source.zip"

  depends_on = [
    google_storage_bucket.cloud_functions
  ]
}

resource "google_cloudfunctions2_function" "cancel_stripe_session" {
  name      = "cancel-stripe-session"
  location  = var.region

  depends_on = [
    google_project_service.enabled,
    google_storage_bucket.cloud_functions,
    google_secret_manager_secret_version.initial_database_url,
    google_secret_manager_secret_version.initial_stripe_key
  ]

  service_config {
    service_account_email   = var.github_deployer_sa_email
    max_instance_count      = 3
    available_memory        = "256M"
    timeout_seconds         = 60

    secret_environment_variables {
      key                   = "DATABASE_URL"
      project_id            = var.project_id
      secret                = google_secret_manager_secret.database_url.secret_id
      version               = "latest"
    }

    secret_environment_variables {
      key                   = "STRIPE_PRIVATE_KEY"
      project_id            = var.project_id
      secret                = google_secret_manager_secret.stripe_private_key.secret_id
      version               = "latest"
    }
  }

  build_config {
    runtime = "nodejs22"
    entry_point = "handler"

    source {
      storage_source {
        bucket = google_storage_bucket.cloud_functions.name
        object = google_storage_bucket_object.cancel_stripe_session_zip.name
      }
    }
  }
}

resource "google_cloudfunctions_function_iam_member" "cancel_session_invoker" {
  project        = var.project_id
  region         = var.region
  cloud_function = google_cloudfunctions2_function.cancel_stripe_session.name
  role           = "roles/cloudfunctions.invoker"
  member         = "serviceAccount:${var.github_deployer_sa_email}"
}


#######################################################
# Cloud Task Queue
#######################################################
resource "google_cloud_tasks_queue" "cancel_checkout_sessions" {
  name  = "cancel-stripe-checkout-session"
  location = var.region

  depends_on = [google_project_service.enabled]

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
# Load Balancing + CDN
#######################################################

resource "google_compute_backend_bucket" "frontend_backend_bucket" {
  name        = "frontend-bucket-backend"
  bucket_name = google_storage_bucket.frontend_bucket.name
  enable_cdn  = true
}

resource "google_compute_url_map" "frontend_url_map" {
  name            = "frontend-url-map"
  default_service = google_compute_backend_bucket.frontend_backend_bucket.id

  default_route_action {
    cors_policy {
      allow_origins         = ["*"]
      allow_methods         = ["GET", "HEAD", "OPTIONS"]
      allow_headers         = ["*"]
      max_age               = 3600
      expose_headers        = ["Content-Length", "Content-Type"]
    }
  }

  path_matcher {
    name            = "spa-matcher"
    default_service = google_compute_backend_bucket.frontend_backend_bucket.id

    path_rule {
      paths   = ["/*"]
      service = google_compute_backend_bucket.frontend_backend_bucket.id
    }
  }
}

# 4. Managed SSL for Custom Domain
resource "google_compute_managed_ssl_certificate" "ssl_cert" {
  name = "spa-ssl-cert"
  managed {
    domains = [var.frontend_domain_name]
  }
}

resource "google_compute_global_address" "frontend_ip" {
  name = "frontend-ip"
}

# 6. HTTPS Proxy
resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "ui-https-proxy"
  url_map          = google_compute_url_map.frontend_url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.ssl_cert.id]
}

# 7. Forwarding Rule
resource "google_compute_global_forwarding_rule" "https_forwarding" {
  name                  = "ui-https-forwarding"
  target                = google_compute_target_https_proxy.https_proxy.id
  port_range            = "443"
  ip_protocol           = "TCP"
  ip_address            = google_compute_global_address.frontend_ip.address
}