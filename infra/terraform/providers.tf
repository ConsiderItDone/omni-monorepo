provider "google" {
  project     = local.gcp_project
  credentials = var.credentials
  region      = "us-central1"
  zone        = "us-central1-c"
}
