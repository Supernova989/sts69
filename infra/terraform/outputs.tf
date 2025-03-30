output "frontend_url" {
  value = "https://storage.googleapis.com/${google_storage_bucket.frontend_bucket.name}/index.html"
}

output "backend_url" {
  value = google_cloud_run_v2_service.backend.uri
}

output "cancel_session_url" {
  value = google_cloudfunctions2_function.cancel_session.url
}

output "cancel_checkout_sessions_queue" {
  value = google_cloud_tasks_queue.cancel_checkout_sessions.name
}