//provider "kubernetes" {
//  load_config_file       = false
//  host                   = "https://${google_container_cluster.main.endpoint}"
//  token                  = data.google_client_config.gke.access_token
//  cluster_ca_certificate = base64decode(google_container_cluster.main.master_auth)
//}

provider "helm" {
  kubernetes {
    host = "https://${google_container_cluster.main.endpoint}"
    token                  = data.google_client_config.gke.access_token
    cluster_ca_certificate = base64decode(google_container_cluster.main.master_auth.0.cluster_ca_certificate)
  }
}

resource "helm_release" "prometheus-stack" {
  name       = "prometheus-community"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace = "monitoring"
  create_namespace = true

//  values = [
//    file("k8s/loki-values.yaml")
//  ]

}

resource "helm_release" "loki" {
  name       = "loki"
  repository = "https://grafana.github.io/loki/charts"
  chart      = "loki"
  namespace = "monitoring"
  create_namespace = true

//  values = [
//    file("k8s/loki-values.yaml")
//  ]

}
resource "helm_release" "promtail" {
  name       = "promtail"
  repository = "https://grafana.github.io/loki/charts"
  chart      = "promtail"
  namespace = "monitoring"
  create_namespace = true

  values = [
    file("k8s/promtail-values.yaml")
  ]

}

resource "helm_release" "app" {
  name       = "app2"
  chart      = "../chart/nodle"
//  reuse_values = true

  values = [
    file("k8s/app-values.yaml")
  ]

  set_sensitive {
    name  = "secrets.databaseHost"
    value = google_sql_database_instance.main.private_ip_address
  }
  set_sensitive {
    name  = "secrets.databaseUser"
    value = var.db_user
  }
  set_sensitive {
    name  = "secrets.databaseName"
    value = var.db_name
  }
  set_sensitive {
    name  = "secrets.databasePassword"
    value = var.db_password
  }
  set_sensitive {
    name  = "secrets.rabbitMQURL"
    value = var.k8s_rabbitmq_url
  }
  set_sensitive {
    name  = "secrets.chainNode"
    value = var.k8s_chain_node
  }
}
