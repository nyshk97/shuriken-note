# -----------------------------------------------------------------------------
# Network
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

# -----------------------------------------------------------------------------
# ALB
# -----------------------------------------------------------------------------

output "alb_dns_name" {
  description = "ALB DNS name (use this as API endpoint)"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID"
  value       = aws_lb.main.zone_id
}

# -----------------------------------------------------------------------------
# ECS
# -----------------------------------------------------------------------------

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.api.name
}

# -----------------------------------------------------------------------------
# RDS
# -----------------------------------------------------------------------------

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

# -----------------------------------------------------------------------------
# S3
# -----------------------------------------------------------------------------

output "s3_bucket_name" {
  description = "S3 bucket name for Active Storage"
  value       = aws_s3_bucket.storage.id
}

output "s3_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name"
  value       = aws_s3_bucket.storage.bucket_regional_domain_name
}

# -----------------------------------------------------------------------------
# CloudFront (Storage)
# -----------------------------------------------------------------------------

output "cloudfront_storage_distribution_id" {
  description = "CloudFront distribution ID for S3 storage"
  value       = aws_cloudfront_distribution.storage.id
}

output "cloudfront_storage_domain_name" {
  description = "CloudFront domain name for file URLs"
  value       = aws_cloudfront_distribution.storage.domain_name
}

# -----------------------------------------------------------------------------
# CloudFront (API)
# -----------------------------------------------------------------------------

output "cloudfront_api_distribution_id" {
  description = "CloudFront distribution ID for API HTTPS"
  value       = aws_cloudfront_distribution.api.id
}

output "cloudfront_api_domain_name" {
  description = "CloudFront domain name for API (use this as NEXT_PUBLIC_API_URL)"
  value       = "https://${aws_cloudfront_distribution.api.domain_name}"
}

# -----------------------------------------------------------------------------
# ECR
# -----------------------------------------------------------------------------

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.api.repository_url
}

# -----------------------------------------------------------------------------
# Connection Info (for application configuration)
# -----------------------------------------------------------------------------

output "database_url" {
  description = "Database connection URL (without password)"
  value       = "postgres://${var.db_username}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive   = true
}
