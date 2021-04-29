resource "google_compute_network" "main" {
  name                    = "nodle"
  auto_create_subnetworks = "false"
}

resource "google_compute_subnetwork" "public" {
  name = "public"

  ip_cidr_range = var.public_cidr
  network = google_compute_network.main.id
  region = "us-central1"

}

resource "google_compute_subnetwork" "private" {
  name = "private"

  ip_cidr_range = var.private_cidr
  network = google_compute_network.main.id
  region = "us-central1"

  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "services-range"
    ip_cidr_range =  var.services_cidr
  }

  secondary_ip_range {
    range_name    = "pod-ranges"
    ip_cidr_range = var.pods_cidr
  }
}

resource "google_compute_router" "router" {
  name    = "private-router"
  network = google_compute_network.main.name
}

resource "google_compute_router_nat" "nat" {
  name                               = "nat"
  router                             = google_compute_router.router.name
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"
  subnetwork {
    name = google_compute_subnetwork.private.self_link
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }
}

// Firewalls
resource "google_compute_firewall" "external-ssh" {
  name    = "external-ssh"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  target_tags = ["external-ssh"]

  source_ranges = ["0.0.0.0/0"]
}
resource "google_compute_firewall" "internal-ssh" {
  name    = "internal-ssh"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  target_tags = ["internal-ssh"]

  source_ranges = [var.private_cidr, var.public_cidr]
}

// Bastion host
resource "google_compute_instance" "bastion" {
  name         = "bastion-host"
  machine_type = "f1-micro"

  boot_disk {
    initialize_params {
      size = 10
      image = "ubuntu-os-cloud/ubuntu-2004-lts"
    }
  }

  tags = ["external-ssh"]

  network_interface {
    subnetwork = google_compute_subnetwork.public.self_link

    access_config {
    }
  }
}
resource "google_compute_instance" "privatevm" {
  name         = "private-vm"
  machine_type = "f1-micro"

  boot_disk {
    initialize_params {
      size = 10
      image = "ubuntu-os-cloud/ubuntu-2004-lts"
    }
  }

  tags = ["external-ssh"]

  network_interface {
    subnetwork = google_compute_subnetwork.private.self_link
  }
}

// Private Service Connection
resource "google_compute_global_address" "private_ip_alloc" {
  name          = "private-ip-alloc"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 20
  network       = google_compute_network.main.id
}

resource "google_service_networking_connection" "private" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_alloc.name]
}
