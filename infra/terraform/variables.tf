# -----------------------------------------------------------------------------
# General
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "shuriken-note"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

# -----------------------------------------------------------------------------
# Network
# -----------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones to use"
  type        = list(string)
  default     = ["ap-northeast-1a", "ap-northeast-1c"]
}

# -----------------------------------------------------------------------------
# ECS
# -----------------------------------------------------------------------------

variable "ecs_task_cpu" {
  description = "CPU units for ECS task (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 3000
}

# -----------------------------------------------------------------------------
# RDS
# -----------------------------------------------------------------------------

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "shuriken_note_production"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "shuriken_note"
}

# -----------------------------------------------------------------------------
# Secrets (sensitive - provide via terraform.tfvars or environment variables)
# -----------------------------------------------------------------------------

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "rails_master_key" {
  description = "Rails master key for credentials decryption"
  type        = string
  sensitive   = true
}
