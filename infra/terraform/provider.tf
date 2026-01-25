provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "shuriken-note"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
