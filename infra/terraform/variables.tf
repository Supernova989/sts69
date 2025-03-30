variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  default     = "europe-west3"
  description = "GCP region"
}

variable "frontend_bucket_name" {
  type        = string
  description = "Frontend GCS bucket name"
}

variable "public_bucket_name" {
  type        = string
  description = "General-purpose public bucket"
}

variable "private_bucket_name" {
  type        = string
  description = "General-purpose private bucket"
}

# variable "backend_image" {
#   type        = string
#   description = "Docker image for Cloud Run backend (e.g. gcr.io/your-project/backend:latest)"
# }

variable "backend_stage" {
  type        = string
  description = ""
  default = "dev"
}