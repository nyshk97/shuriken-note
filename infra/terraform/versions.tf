terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for remote state (uncomment after creating S3 bucket)
  # backend "s3" {
  #   bucket         = "shuriken-note-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "ap-northeast-1"
  #   encrypt        = true
  #   dynamodb_table = "shuriken-note-terraform-lock"
  # }
}
