resource "aws_s3_bucket" "terraform_backend_bucket" {
      bucket = "terraform-state-9f11z3esd941lw7iji5lqqgr41s14xtwnwtlic1f76z4j"
}

terraform {
  required_providers {
    aws =  {
    source = "hashicorp/aws"
    version = ">= 2.7.0"
    }
  }
}

provider "aws" {
    region = "us-west-2"
}

