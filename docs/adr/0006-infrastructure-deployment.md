# 0006 Infrastructure and Deployment Strategy

Date: 2026-01-11

## Status

Accepted

---

## Context

Shuriken Note is designed as a personal note-taking application for daily use.

The application architecture has already been decided as follows.

- Web frontend: Next.js
- Backend API: Ruby on Rails (API-only)
- Database: PostgreSQL
- Search: PostgreSQL Full Text Search
- File upload: Active Storage + Direct Upload (S3-compatible storage)
- Auth: JWT + Refresh Token
- Both Web (Next.js) and iOS (SwiftUI) clients consume the same backend API

For infrastructure design, the following non-functional requirements are emphasized.

- The architecture must consider availability and fault tolerance
- The system must support future scalability and long-term operation
- Managed services should be leveraged to reduce operational overhead

Based on these requirements, it is necessary to determine which services will host the Web, API, Database, Storage, and CDN components.

---

## Decision

The following infrastructure configuration is adopted.

- Web frontend: Vercel (Next.js)
- Backend API: AWS ECS Fargate (Ruby on Rails)
- Database: AWS RDS PostgreSQL
- File Storage: AWS S3
- CDN / DNS / TLS: AWS CloudFront + Route53 + ACM
- Infrastructure as Code: Terraform
- Secrets Management: AWS SSM Parameter Store

### Network Configuration

- **NAT Gateway is intentionally not used** to reduce operational costs
- Fargate tasks are placed in public subnets with public IP assignment
- Security is enforced through Security Groups (ALB → ECS only)
- RDS is placed in private subnets, accessible only from ECS

### Phased Rollout

**Phase 1 (Initial Deployment)**

- API: ALB direct access (default DNS)
- Files: CloudFront → S3 (default CloudFront domain)
- No custom domain, HTTP only for API

**Phase 2 (Production Release)**

- Custom domain via Route53
- ACM certificates for TLS
- CloudFront integration for API
- HTTPS for all traffic

---

## Rationale

### Reason for adopting Vercel for Next.js hosting

- Vercel is optimized as the official hosting platform for Next.js
- Git-based automatic deployments and preview environments are provided by default
- Frontend deployment and operational overhead are minimized

### Reason for adopting AWS ECS Fargate for API hosting

- Ruby on Rails can be operated in a standard container-based environment
- Server management is abstracted away through a managed execution environment
- The ALB + ECS architecture is a widely used standard operational pattern

### Reason for adopting AWS RDS PostgreSQL for the database

- Managed PostgreSQL reduces operational burden for backups and failure handling
- High availability and maintainable database operations are supported

### Reason for adopting AWS S3 for file storage

- Naturally integrates with Active Storage's S3-compatible implementation
- Provides durable and highly scalable object storage

### Reason for adopting AWS CloudFront + Route53 + ACM for CDN / DNS / TLS

- Web, API, and file delivery can be managed in an integrated AWS environment
- Global CDN enables stable content delivery
- TLS certificate management is centralized through ACM

### Reason for adopting Terraform for Infrastructure as Code

- Infrastructure can be managed as code, ensuring reproducibility
- Future changes and expansions of the architecture become easier

### Reason for adopting SSM Parameter Store for secrets management

- Free tier available (Standard parameters)
- Sufficient for personal project without auto-rotation requirements
- Native integration with ECS Task Definitions
- Alternative considered: AWS Secrets Manager (rejected due to cost: $0.40/secret/month)

### Reason for not using NAT Gateway

- **Cost reduction**: NAT Gateway costs ~$30-45/month, which is significant for a personal project
- **Acceptable trade-off**: Fargate tasks in public subnets with Security Groups provide sufficient security
- **Simplicity**: Reduces network complexity for initial deployment
- **Future option**: Can add NAT Gateway later if private subnet requirements emerge

---

## Alternatives Considered

### Alternative A: Vercel + Render + Cloudflare R2 + Cloudflare

**Pros**

- Easy initial setup with low operational overhead
- Simple architecture based on managed services

**Cons**

- Cloud infrastructure is distributed across multiple vendors, making integrated management more complex
- Higher abstraction compared to standard IaaS-based operational design, reducing flexibility

---

### Alternative B: Full AWS adoption (including hosting Next.js on AWS)

**Pros**

- All components can be integrated within a single cloud provider
- Network and security design can be fully centralized

**Cons**

- Next.js hosting becomes more complex, reducing frontend development productivity
- The architecture becomes excessive relative to project requirements

---

### Alternative C: EC2 + Kamal deployment

**Pros**

- Lower cost (~$8/month for t3.micro vs ~$30/month for Fargate + ALB)
- Simpler deployment with Rails 8 default tooling
- Direct SSH access for debugging

**Cons**

- Server management overhead (OS updates, Docker maintenance)
- Less demonstrable cloud architecture skills for portfolio purposes
- Limited scalability without additional configuration

---

## Consequences

### Positive

- Managed-service-centric architecture reduces infrastructure operational overhead
- Reproducible infrastructure enables easier long-term evolution
- A standard cloud architecture with availability and fault tolerance is achieved
- Cost-optimized by avoiding NAT Gateway (~$30-45/month savings)
- Portfolio value: demonstrates AWS ECS, ALB, CloudFront, Terraform skills

### Negative / Constraints

- Initial infrastructure setup effort increases
- A baseline cloud infrastructure cost is incurred even for small-scale operation (~$55/month)
- Fargate in public subnet is less isolated than private subnet deployment

---

## Cost Estimate (Monthly)

| Service       | Specification     | Cost             |
| ------------- | ----------------- | ---------------- |
| ECS Fargate   | 0.25 vCPU / 512MB | ~$10             |
| ALB           | 1                 | ~$20             |
| RDS           | db.t3.micro       | ~$15 (free tier) |
| S3            | Few GB            | ~$1              |
| CloudFront    | Low traffic       | ~$1-5            |
| ECR           | Few GB            | ~$1              |
| CloudWatch    | Basic logs        | ~$1              |
| Data Transfer | Low volume        | ~$2              |
| **Total**     |                   | **~$55/month**   |

Note: NAT Gateway would add ~$30-45/month if used.

---

## Notes

- Rails API runs on ECS Fargate containers (0.25 vCPU / 512MB)
- API traffic is routed through ALB (Phase 1) or CloudFront → ALB (Phase 2)
- Active Storage Direct Upload sends files directly from clients to S3
- S3 files are served through CloudFront from Phase 1
- Private files are access-controlled using CloudFront signed URLs
- Database backups rely on RDS automated backup mechanisms
- Logs and metrics are centralized in CloudWatch
- Secrets are stored in SSM Parameter Store (SecureString)

---
