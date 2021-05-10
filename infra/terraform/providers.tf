provider "google" {
  project     = var.gcp_project
  credentials = var.credentials
  region      = "us-central1"
  zone        = "us-central1-c"
}
