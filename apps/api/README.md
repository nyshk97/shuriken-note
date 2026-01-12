# Shuriken Note API

Rails API backend for Shuriken Note.

## Tech Stack

- Ruby 3.3
- Rails 8.1 (API mode)
- PostgreSQL 16

## Development Setup

### Prerequisites

- Docker and Docker Compose

### Quick Start

From the project root directory:

```bash
# Build and start containers
docker compose up --build

# In another terminal, create the database
docker compose exec api bin/rails db:create
```

The API will be available at http://localhost:3000

### Environment Variables

| Variable            | Description               | Default                                                              |
| ------------------- | ------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`      | PostgreSQL connection URL | `postgres://postgres:password@db:5432/shuriken_note_api_development` |
| `RAILS_ENV`         | Rails environment         | `development`                                                        |
| `RAILS_MAX_THREADS` | Puma thread count         | `5`                                                                  |

### Common Commands

```bash
# Start containers
docker compose up

# Stop containers
docker compose down

# Run Rails console
docker compose exec api bin/rails console

# Run database migrations
docker compose exec api bin/rails db:migrate

# View logs
docker compose logs -f api
```

## Testing

RSpec will be configured for testing (TODO).

## API Documentation

OpenAPI/Swagger documentation will be available (TODO).
