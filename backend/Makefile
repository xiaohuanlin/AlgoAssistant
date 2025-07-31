# AlgoAssistant Backend Makefile

.PHONY: help install install-dev test lint format clean run docker-build docker-run

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Show this help message
	@echo "$(GREEN)AlgoAssistant Backend$(NC)"
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

install: ## Install production dependencies
	@echo "$(GREEN)Installing dependencies with uv...$(NC)"
	uv sync --no-dev

install-dev: ## Install development dependencies
	@echo "$(GREEN)Installing development dependencies with uv...$(NC)"
	uv sync

install-all: ## Install all dependencies including optional
	@echo "$(GREEN)Installing all dependencies with uv...$(NC)"
	uv sync --all-extras

test: ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	uv run pytest

test-cov: ## Run tests with coverage report
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	uv run pytest --cov=app --cov-report=html --cov-report=xml

test-unit: ## Run unit tests only
	@echo "$(GREEN)Running unit tests...$(NC)"
	uv run pytest -m unit

test-integration: ## Run integration tests only
	@echo "$(GREEN)Running integration tests...$(NC)"
	uv run pytest -m integration

lint: ## Run all linting checks
	@echo "$(GREEN)Running linting checks...$(NC)"
	uv run flake8 .
	uv run mypy .
	uv run bandit -r app/

format: ## Format code with black and isort
	@echo "$(GREEN)Formatting code...$(NC)"
	uv run black .
	uv run isort .

format-check: ## Check code formatting
	@echo "$(GREEN)Checking code formatting...$(NC)"
	uv run black --check --diff .
	uv run isort --check-only --diff .

security: ## Run security checks
	@echo "$(GREEN)Running security checks...$(NC)"
	uv run bandit -r app/
	uv run safety check

quality: format-check lint security ## Run all quality checks

run: ## Run the development server
	@echo "$(GREEN)Starting development server...$(NC)"
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run-prod: ## Run the production server
	@echo "$(GREEN)Starting production server...$(NC)"
	uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	uv run alembic upgrade head

migrate-create: ## Create new migration
	@echo "$(GREEN)Creating new migration...$(NC)"
	@read -p "Enter migration message: " msg; \
	uv run alembic revision --autogenerate -m "$$msg"

clean: ## Clean up cache files
	@echo "$(GREEN)Cleaning up...$(NC)"
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf coverage.xml

clean-venv: ## Remove virtual environment
	@echo "$(GREEN)Removing virtual environment...$(NC)"
	rm -rf .venv

reinstall: clean-venv install-dev ## Reinstall everything from scratch

docker-build: ## Build Docker image
	@echo "$(GREEN)Building Docker image...$(NC)"
	docker build -t algoassistant-backend .

docker-run: ## Run Docker container
	@echo "$(GREEN)Running Docker container...$(NC)"
	docker run -p 8000:8000 algoassistant-backend

docker-dev: ## Run Docker container in development mode
	@echo "$(GREEN)Running Docker container in development mode...$(NC)"
	docker run -p 8000:8000 -v $(PWD):/app algoassistant-backend

deps-update: ## Update all dependencies
	@echo "$(GREEN)Updating dependencies...$(NC)"
	uv sync --upgrade

deps-add: ## Add a new dependency (usage: make deps-add PACKAGE=package_name)
	@echo "$(GREEN)Adding dependency: $(PACKAGE)$(NC)"
	uv add $(PACKAGE)

deps-add-dev: ## Add a new development dependency
	@echo "$(GREEN)Adding development dependency: $(PACKAGE)$(NC)"
	uv add --group dev $(PACKAGE)

lock: ## Generate lock file
	@echo "$(GREEN)Generating lock file...$(NC)"
	uv lock

info: ## Show project information
	@echo "$(GREEN)Project Information:$(NC)"
	@echo "Python version: $$(cat .python-version)"
	@echo "UV version: $$(uv --version)"
	@echo "Virtual environment: $$(uv venv --show-path 2>/dev/null || echo 'Not created')"
	@echo "Dependencies: $$(uv tree 2>/dev/null | wc -l) packages"

# Development workflow shortcuts
dev-setup: install-dev ## Complete development setup
	@echo "$(GREEN)Development setup complete!$(NC)"
	@echo "Run 'make run' to start the development server"

ci: quality test ## Run CI pipeline locally
	@echo "$(GREEN)CI pipeline completed successfully!$(NC)"
