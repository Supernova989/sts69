output "service_account_email" {
  value = google_service_account.github_ci.email
}

output "frontend_url" {
  value = "https://storage.googleapis.com/${google_storage_bucket.frontend.name}/index.html"
}

output "backend_url" {
  value = google_cloud_run_v2_service.backend.uri
}

output "cancel_session_url" {
  value = google_cloudfunctions_function.cancel_session.https_trigger_url
}

output "cancel_checkout_sessions_queue" {
  value = google_cloud_tasks_queue.cancel_checkout_sessions.name
}