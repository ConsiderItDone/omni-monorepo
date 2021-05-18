resource "google_sql_database_instance" "main" {
  name   = "nodle"
  database_version = "POSTGRES_12"

  depends_on = [google_service_networking_connection.private]

  settings {
    tier = local.db_tier
    availability_type = "ZONAL"
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
    }
    backup_configuration {
      enabled = true
      point_in_time_recovery_enabled = true
    }
  }
}

resource "google_sql_database" "nodle" {
  name     = var.db_name
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "nodle" {
  name     = var.db_user
  password = local.db_password
  instance = google_sql_database_instance.main.name
//  type     = "BUILT_IN"
}

output "db-private-ip" {
  value = google_sql_database_instance.main.private_ip_address
}