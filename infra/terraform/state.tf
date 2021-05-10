terraform {
  backend "gcs" {
    bucket  = "cidt-nodle-demo-terraform"
    credentials = "./key.json"
  }
}