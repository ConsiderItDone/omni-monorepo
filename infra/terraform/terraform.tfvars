credentials = "./key.json"
gcp_project = "nodle-demo"

// Network
public_cidr = "10.0.0.0/24"
private_cidr = "10.0.1.0/24"
services_cidr = "10.200.0.0/20"
pods_cidr = "10.200.16.0/20"
master_cidr = "10.201.0.0/28"

// 2 CPU 3.75 GB memory
db_tier = "db-custom-2-3840"
db_name = "nodle"
db_user = "nodleuser"
db_password = "uf7HWNVuqYhoj27gD9hC05"

// GKE
app_node_count = 2

k8s_rabbitmq_url = "amqps://bxeqnybs:mWgk06St1xygCfY7tTTA9-kunar71hCX@jellyfish.rmq.cloudamqp.com/bxeqnybs"
k8s_chain_node = "ws://3.217.156.114:9944"