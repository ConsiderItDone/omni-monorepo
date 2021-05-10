

resource "google_container_cluster" "main" {
  name               = "nodle"
  location           = "us-central1-a"

  network    = google_compute_network.main.id
  subnetwork = google_compute_subnetwork.private.id

  ip_allocation_policy {
    cluster_secondary_range_name  = "services-range"
    services_secondary_range_name = google_compute_subnetwork.private.secondary_ip_range.1.range_name
  }

  private_cluster_config {
    enable_private_nodes = true
    enable_private_endpoint = false
    master_ipv4_cidr_block = var.master_cidr
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}

# Separately Managed Node Pool
resource "google_container_node_pool" "app_nodes" {
  name       = "${google_container_cluster.main.name}-app-node-pool"
  cluster    = google_container_cluster.main.name
  location = "us-central1-a"
  node_count = var.app_node_count

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]

//    labels = {
//      env = var.project_id
//    }

    # preemptible  = true
    machine_type = "n1-standard-1"
    tags         = ["internal-ssh"]
  }
}

//output "gke-name" {
//  value = google_container_cluster.main.id
//}

//
//module "gke" {
//  source = "terraform-google-modules/kubernetes-engine/google"
//  name = "nodle"
//  project_id = var.gcp_project
//  region = "us-central1"
//  zones = ["us-central1-a", "us-central1-b", "us-central1-f"]
//  network = google_compute_network.main.name
//  subnetwork = "us-central1-01"
//  ip_range_pods = "us-central1-01-gke-01-pods"
//  ip_range_services = "us-central1-01-gke-01-services"
//
//  node_pools = [
//    {
//      name               = "app-node-pool"
//      machine_type       = "e2-medium"
//      node_locations     = "us-central1-b,us-central1-c"
//      min_count          = 1
//      max_count          = 4
//      local_ssd_count    = 0
//      disk_size_gb       = 10
//      disk_type          = "pd-standard"
//      image_type         = "cos_containerd"
//      auto_repair        = true
//      auto_upgrade       = true
//      initial_node_count = 2
//    },
//    {
//      name               = "system-node-pool"
//      machine_type       = "e2-medium"
//      node_locations     = "us-central1-b,us-central1-c"
//      min_count          = 1
//      max_count          = 4
//      local_ssd_count    = 0
//      disk_size_gb       = 10
//      disk_type          = "pd-standard"
//      image_type         = "cos_containerd"
//      auto_repair        = true
//      auto_upgrade       = true
//      initial_node_count = 2
//    },
//  ]
//}
//
//output "kubernetes_endpoint" {
//  sensitive = true
//  value     = module.gke.endpoint
//}
//
//output "client_token" {
//  sensitive = true
//  value     = base64encode(data.google_client_config.gke.access_token)
//}
//
//output "ca_certificate" {
//  sensitive = true
//  value = module.gke.ca_certificate
//}