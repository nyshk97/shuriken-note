.PHONY: up stop bash bundle console migrate credentials rspec swagger help

# Start API and Web (both background)
up:
	docker compose up -d
	@mkdir -p apps/web/log
	npm run dev --prefix apps/web > apps/web/log/dev.log 2>&1 &
	@echo "API: http://localhost:3000 (log: apps/api/log/development.log)"
	@echo "Web: http://localhost:3001 (log: apps/web/log/dev.log)"

# Stop API and Web
stop:
	-lsof -ti:3001 | xargs kill -9 2>/dev/null
	docker compose stop

bash:
	docker compose exec api bash

bundle:
	docker compose run --rm api bundle install

console:
	docker compose exec api bin/rails console

migrate:
	docker compose exec api bin/rails db:migrate

credentials:
	docker compose exec -e EDITOR=vim api bin/rails credentials:edit

rspec:
	docker compose exec -e RAILS_ENV=test api bundle exec rspec

swagger:
	docker compose exec -e RAILS_ENV=test api bundle exec rake rswag:specs:swaggerize

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "  up            Start API and Web servers"
	@echo "  stop          Stop API and Web servers"
	@echo "  bash          Open bash in API container"
	@echo "  bundle        Install gems"
	@echo "  console       Open Rails console"
	@echo "  migrate       Run database migrations"
	@echo "  credentials   Edit Rails credentials"
	@echo "  rspec         Run RSpec tests"
	@echo "  swagger       Generate OpenAPI documentation"
