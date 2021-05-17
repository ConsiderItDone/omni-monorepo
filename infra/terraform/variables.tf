variable "gcp_project" {
  type = string
}

variable "credentials" {
  type = string
}

variable "private_cidr" {
  description = "CIDR for private subnet"
  type = string
}

variable "public_cidr" {
  description = "CIDR for public subnet"
  type = string
}
variable "services_cidr" {
  description = "Secondary IP CIDR range for K8S services"
  type = string
}
variable "pods_cidr" {
  description = "Secondary IP CIDR range for K8S pods"
  type = string
}
variable "master_cidr" {
  description = "IP CIDR range for K8S master"
  type = string
}

// Database settings
variable "db_name" {
  type = string
}
variable "db_tier" {
  type = string
}
variable "db_user" {
  type = string
}
variable "db_password" {
  type = string
}

// gke
variable "app_node_count" {
  type = number
}
//variable "system_node_count" {
//  type = number
//}

# google_client_config and kubernetes provider must be explicitly specified like the following.
data "google_client_config" "gke" {}

variable "k8s_rabbitmq_url" {
  type = string
}
variable "k8s_chain_node" {
  type = string
}