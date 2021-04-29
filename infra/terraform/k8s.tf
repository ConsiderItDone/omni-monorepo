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