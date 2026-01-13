.PHONY: bash bundle console migrate credentials rspec swagger help

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
	@echo "  bash          Open bash in API container"
	@echo "  bundle        Install gems"
	@echo "  console       Open Rails console"
	@echo "  migrate       Run database migrations"
	@echo "  credentials   Edit Rails credentials"
	@echo "  rspec         Run RSpec tests"
	@echo "  swagger       Generate OpenAPI documentation"
