# 0013 VPS Migration and Hybrid Deployment

Date: 2026-03-04

## Status

Proposed

---

## Context

ADR 0006 adopted AWS ECS Fargate for the backend API and RDS PostgreSQL for the database. This architecture is a standard, managed-service-centric cloud design with low operational overhead and good availability.

However, after running this configuration in production, the following cost issue became apparent.

| Service | Monthly Cost |
|---------|-------------|
| ECS Fargate (0.25 vCPU / 512MB) | ~$10 |
| ALB | ~$20 |
| RDS (db.t3.micro) | ~$15 |
| S3 + CloudFront | ~$2-5 |
| ECR / CloudWatch / Data Transfer | ~$4 |
| **Total** | **~$55** |

$55/month is disproportionate for a single-user personal application.

The following observations were also made.

- Application traffic is minimal (single user)
- High availability and auto-scaling are unnecessary for compute and database
- File storage (S3) provides high value through durability and low operational overhead
- The Terraform AWS infrastructure definitions in `infra/terraform/` are complete and can be reused if re-migration to AWS is needed

Based on these factors, the hosting strategy needs to be re-evaluated on a per-component basis.

---

## Decision

Migrate compute and database to a VPS while continuing to use AWS S3 for file storage, adopting a hybrid deployment architecture.

### Post-Migration Architecture

| Component | Before (ADR 0006) | After |
|-----------|-------------------|-------|
| Web frontend | Vercel | Vercel (unchanged) |
| Backend API | AWS ECS Fargate + ALB | VPS + Kamal (Docker) |
| Database | AWS RDS PostgreSQL | VPS + PostgreSQL (Kamal accessory) |
| File Storage | AWS S3 + CloudFront | AWS S3 + CloudFront (unchanged) |
| IaC | Terraform (AWS) | Kamal (VPS) + Terraform (AWS S3/CloudFront) |
| Secrets | AWS SSM Parameter Store | Kamal secrets (.kamal/secrets) |
| Deploy | GitHub Actions → ECS | Kamal deploy (SSH) |

### VPS Deployment Configuration

- Kamal manages API container deployment and lifecycle
- PostgreSQL runs as a Kamal accessory on the same VPS
- kamal-proxy handles TLS termination, Let's Encrypt certificate provisioning, and zero-downtime deployments
- `kamal deploy` provides SSH-based deployment (can also be triggered from GitHub Actions)

### Handling of Existing AWS Resources

- Terraform code under `infra/terraform/` is preserved (not deleted)
- ECS, ALB, RDS, and related resources are destroyed via `terraform destroy`
- S3 bucket and CloudFront distribution (for file delivery) are retained
- API CloudFront distribution is decommissioned

---

## Rationale

### Reason for migrating compute and database to VPS

- The ECS Fargate + ALB + RDS combination cost ~$45/month, which can be replaced by a single VPS at $12/month
- Container orchestration, load balancing, and managed database are over-engineered for a single-user application

### Reason for adopting Kamal for VPS deployment

- Kamal is the standard deployment tool for Rails 8, aligning with framework conventions
- Provides zero-downtime deployments via SSH without custom deploy scripts
- Includes kamal-proxy for automatic TLS termination, Let's Encrypt certificate provisioning, and reverse proxy configuration
- Manages PostgreSQL as an accessory, integrating database container lifecycle management
- Consolidates functionality that would otherwise require separate Docker Compose, Caddy/Nginx, and deploy script configurations

### Reason for continuing to use S3 for file storage

- S3 provides 99.999999999% (eleven nines) durability, which cannot be replicated on VPS local storage
- Active Storage S3 integration is already implemented, requiring zero migration effort
- S3 + CloudFront costs ~$2-5/month, which is well justified by the value provided
- Direct Upload (client → S3) bypasses the VPS entirely, so VPS resources are unaffected

### Reason for preserving Terraform code

- The completed AWS infrastructure definitions (VPC / ECS / ALB / RDS / IAM / SSM) remain reusable
- They serve as a foundation for re-migration to AWS if traffic growth warrants it in the future

---

## Alternatives Considered

### Alternative A: Keep AWS and optimize costs only

**Pros**

- No infrastructure changes required
- Fargate Spot and RDS Reserved Instances can provide some cost reduction

**Cons**

- ALB alone costs ~$20/month as a fixed cost, preventing meaningful reduction
- Architecture complexity remains disproportionate for a single-user application

---

### Alternative B: Full VPS migration (replace S3 with MinIO or similar)

**Pros**

- Eliminates all AWS dependency, reducing monthly cost to $10-12
- Infrastructure consolidates to a single provider

**Cons**

- Self-hosted object storage (MinIO) adds significant operational overhead
- VPS disk capacity management and backups must be handled manually
- S3 durability (eleven nines) cannot be reproduced with self-hosted storage
- Active Storage S3 integration would need to be reconfigured
- The $2-5/month savings do not justify the lost value

---

### Alternative C: Docker Compose + Caddy manual configuration

**Pros**

- Simple and easy to understand
- No Kamal learning curve

**Cons**

- Deploy automation (SSH → pull → restart) must be built manually
- Zero-downtime deployment requires additional tooling
- TLS termination via Caddy/Nginx must be set up and maintained separately
- Kamal provides equivalent or superior functionality as a Rails ecosystem standard, making manual configuration redundant

---

## Consequences

### Positive

- Monthly cost reduced from ~$55 to ~$15-17 (VPS $12 + S3/CloudFront $2-5)
- S3 durability and operational simplicity are preserved while compute costs are minimized
- Per-component hosting selection results in a pragmatic, well-reasoned architecture
- Kamal establishes a Rails-standard deployment flow with zero-downtime deployments
- Existing Terraform code is preserved, maintaining a migration path back to AWS if needed

### Negative / Constraints

- VPS OS updates and security patches must be managed manually
- Database backups must be configured independently (e.g., scheduled pg_dump)
- VPS failure recovery is manual (no automatic failover like RDS)
- AWS credentials must be managed on the VPS for S3 access
- Kamal configuration and operations introduce a learning curve (mitigated by extensive Rails community documentation)

---

## Cost Estimate (Monthly)

### Post-Migration

| Service | Specification | Cost |
|---------|--------------|------|
| VPS (Vultr vc2-1c-2gb, Tokyo) | 1 vCPU / 2GB RAM / 55GB SSD | $10 |
| VPS Automatic Backups | | $2 |
| S3 | Few GB | ~$1 |
| CloudFront | Low traffic | ~$1-3 |
| **Total** | | **~$15-17** |

### Comparison

| Configuration | Monthly | Annual |
|--------------|---------|--------|
| Full AWS (before) | ~$55 | ~$660 |
| Hybrid (after) | ~$15-17 | ~$180-204 |
| **Annual savings** | | **~$456-480** |

---

## Notes

- ADR 0006 status remains Accepted (the AWS architecture is a valid design decision)
- Terraform code under `infra/terraform/` is preserved and documented in the README as an AWS reference implementation
- Kamal configuration (`config/deploy.yml`) is placed within the application repository
- VPS provider: Vultr (Tokyo region, Ubuntu 24.04 LTS)
- Active Storage configuration remains unchanged (S3)
- PostgreSQL backup strategy on VPS will be designed separately
- The VPS is intended to host multiple services (separate domains) in the future; resource limits, Docker network isolation, and database design guidelines will be documented separately

---
