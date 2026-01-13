.PHONY: bash bundle console migrate credentials help

bash:
	docker compose exec api bash

bundle:
	docker compose exec api bundle install

console:
	docker compose exec api bin/rails console

migrate:
	docker compose exec api bin/rails db:migrate

credentials:
	docker compose exec -e EDITOR=vim api bin/rails credentials:edit

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "  bash          Open bash in API container"
	@echo "  bundle        Install gems"
	@echo "  console       Open Rails console"
	@echo "  migrate       Run database migrations"
	@echo "  credentials   Edit Rails credentials"
