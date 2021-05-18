locals {
  environment = var.environment[terraform.workspace]

  gcp_project = var.gcp_project[terraform.workspace]

  db_tier  = var.db_tier[terraform.workspace]
  db_password  = var.db_password[terraform.workspace]
}