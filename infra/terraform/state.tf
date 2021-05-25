terraform {
  backend "gcs" {
    bucket  = "nodle-terraform"
    credentials = "./key.json"
  }
}