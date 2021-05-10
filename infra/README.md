# Nodle infrastructure

## Create project

First we need to [create new project](https://cloud.google.com/resource-manager/docs/creating-managing-projects#console) 
in GCP. Let's name it for example `nodle-demo`.

## Terraform State

We need to create Cloud Storage Bucker to keep terraform state in it

```
gsutil mb -p nodle-demo gs://cidt-nodle-demo-terraform
```

Enable an object versioning

```
gsutil versioning set on gs://cidt-nodle-demo-terraform
```


## GCP Service account for terraform

In order to make requests against the GCP API, you need to authenticate to prove 
that it's you making the request. The preferred method of provisioning resources 
with Terraform is to use a [GCP service account](https://cloud.google.com/docs/authentication/getting-started), 
a "robot account" that can be granted a limited set of IAM permissions.

From the service account key page in the Cloud Console choose an existing account,
or create a new one. Next, download the JSON key file. Name it `key.json`, and store it in current directory.


## Github Actions setup

Create secrets:
1. `GCP_CREDENTIALS` with json content from `ci-service-account-key` output
2. `GCP_EMAIL` is the email from the `ci-service-account-email` output 
3. `GCP_PROJECT_ID` is your $PROJECT_ID, for example `nodle-demo`