credentials = "./key.json"
gcp_project = {
  default = "block-explorer-testnet"
  prod = "block-explorer-312212"
}

// Network
public_cidr = "10.0.0.0/24"
private_cidr = "10.0.1.0/24"
services_cidr = "10.200.0.0/20"
pods_cidr = "10.200.16.0/20"
master_cidr = "10.201.0.0/28"

db_tier = {
  // 1 vCPU 1.7 GB memory
  default = "db-g1-small" // test
  // 2 CPU 3.75 GB memory
  prod    = "db-custom-2-3840"
}
db_name = "nodle"
db_user = "nodleuser"
db_password = {
  default = "uf7HWNVuqYhoj27gD9hC05"
  prod = "uf7HWNVuqYhoj27gD9hC05"
}

// GKE
app_node_count = 2

k8s_rabbitmq_url = "amqps://gfoenvmf:hGEmIw-UPg_Mmt16Q0OL4mYzswLTwcnz@baboon.rmq.cloudamqp.com/gfoenvmf"
