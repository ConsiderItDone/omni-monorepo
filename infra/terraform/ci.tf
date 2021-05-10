# Create service account

resource "google_service_account" "ci" {
  account_id   = "ci-service-account-id"
  display_name = "Service Account for CI/CD"
}

resource "google_project_iam_binding" "ci-storage-admin" {
  role    = "roles/storage.admin"

  members = [
    "serviceAccount:${google_service_account.ci.email}",
  ]
}

resource "google_service_account_key" "ci" {
  service_account_id = google_service_account.ci.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

output "ci-service-account-key" {
  value = base64decode(google_service_account_key.ci.private_key)
}

output "ci-service-account-email" {
  value = google_service_account.ci.email
}