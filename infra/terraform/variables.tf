variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  default     = "europe-west3"
  description = "GCP region"
}

variable "github_deployer_sa_email" {
  type        = string
  description = "Github deployer service account email"
}

variable "backend_stage" {
  type        = string
  description = "Backend app stage"
  default     = "dev"
}