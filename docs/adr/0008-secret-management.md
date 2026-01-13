# 0008 Adopt Rails Credentials for Secret Management

Date: 2026-01-13

## Status
Accepted

---

## Context

Shuriken Note is built around a Rails API server and requires secure management
of sensitive information such as:

- JWT signing secret keys
- Future external service API keys (email delivery, file storage, etc.)
- Production database credentials

These secrets must not be stored in plaintext in the GitHub repository,
and should be managed consistently across both development and production environments.

The following approaches were considered:

- Rails credentials (encrypted file + master.key)
- Environment variables (12-factor app style)
- External secret management services (AWS Secrets Manager, HashiCorp Vault, etc.)

---

## Decision

- Secret management will use **Rails credentials**
- Secrets will be stored in the encrypted `config/credentials.yml.enc` file
- The decryption key `config/master.key` will be excluded from Git and passed via `RAILS_MASTER_KEY` environment variable during deployment
- Development environments will use `config/credentials/development.yml.enc` for environment separation

---

## Rationale

### Why Rails Credentials

- Built-in Rails feature requiring no additional dependencies
- Secrets can be committed to the repository in encrypted form
  - No need to synchronize secrets separately during deployment
  - Secret changes are tracked in Git history (in encrypted state)
- Structured YAML format allows organized secret management
- Follows Rails conventions, demonstrating familiarity with the Rails Way

---

### Why Not Environment Variables

- Environment variables provide a flat namespace; management becomes cumbersome as secrets grow
- Environment variable configuration must be done manually per deployment environment, prone to omissions
- Credentials allow hierarchical access like `Rails.application.credentials.dig(:jwt, :secret_key)`

---

### Why Not External Services

- AWS Secrets Manager and similar services incur operational costs
- Over-engineered for the current project scope
- Adds external dependencies and complicates local development setup

---

## Alternatives Considered

### Alternative A: Environment Variables Only

**Pros**
- Adheres to 12-factor app principles
- Simple and easy to understand
- Good compatibility with Docker / Kubernetes

**Cons**
- Difficult to manage a comprehensive list of secrets (hard to track which variables are required)
- Cannot have hierarchical structure; must rely on naming conventions
- Requires manual configuration per deployment environment

---

### Alternative B: External Secret Management Services

**Pros**
- Easy secret rotation
- Audit logs available
- Fine-grained access control for teams

**Cons**
- Incurs additional costs
- Adds external dependencies
- Complicates local development setup
- Over-engineered for the current project scope

---

## Consequences

### Positive

- Secret management unified under Rails standard approach
- New developers only need to receive `master.key` to set up their environment
- Secret additions and changes are trackable in Git history
- Environment-specific management (development / production) is supported

### Negative / Constraints

- Requires careful handling of `master.key` to prevent loss or leakage
  - If lost, credentials must be recreated from scratch
  - If leaked, all secrets must be rotated
- CI/CD environments require a secure mechanism to pass `RAILS_MASTER_KEY`
  - For GitHub Actions, register in Repository Secrets and reference via `${{ secrets.RAILS_MASTER_KEY }}`

### Accepted Trade-offs

The following are general disadvantages of Rails credentials,
but are acceptable for this project due to minimal impact:

| Trade-off                      | Reason                                                     | Project Decision                                    |
| ------------------------------ | ---------------------------------------------------------- | --------------------------------------------------- |
| No granular access control     | Anyone with `master.key` can access all secrets            | Not an issue for solo development                   |
| Merge conflicts are difficult  | Encrypted file diffs are unreadable; manual merge required | Will not occur in solo development                  |
| No automatic rotation          | Unlike external services, no built-in periodic rotation    | Manual rotation is sufficient for a small-scale app |
| Dual management with env vars  | `RAILS_MASTER_KEY` still needs to be passed as an env var  | Acceptable as only one env var is needed            |
| Key sharing required for teams | New team members need `master.key` shared securely         | Not applicable for solo development                 |

---

## Notes

### Usage

```bash
# Edit credentials (development)
docker compose exec api bin/rails credentials:edit

# Edit credentials (production)
docker compose exec api bin/rails credentials:edit --environment production
```

### Example Structure

```yaml
# Contents of config/credentials.yml.enc (after decryption)
jwt:
  secret_key: "random-secret-key"
  access_token_expiry: 15  # minutes
  refresh_token_expiry: 30 # days

# Potentially added in the future
# aws:
#   access_key_id: "..."
#   secret_access_key: "..."
#   s3_bucket: "..."
```

### Access Method

```ruby
# Accessing secrets in application code
Rails.application.credentials.dig(:jwt, :secret_key)
```

### For Forked Repository Users

Users who fork this repository will not have access to `master.key`,
and therefore cannot decrypt the existing `credentials.yml.enc`.

Setup instructions and required secrets are documented in the README
under the "Local Development" section.

```bash
# Setup steps for forked repositories
rm config/credentials.yml.enc          # Remove existing encrypted file
bin/rails credentials:edit             # Create new credentials (opens editor)
# → Add required secrets and save
```

---
