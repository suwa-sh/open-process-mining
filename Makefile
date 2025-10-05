.PHONY: help fmt lint test test-e2e test-all clean

# Default target - show help
help:
	@echo "Available targets:"
	@echo "  make fmt        - Format all code (qlty fmt)"
	@echo "  make lint       - Run all linters (qlty check + sqlfluff)"
	@echo "  make test       - Run backend tests (pytest)"
	@echo "  make test-e2e   - Run E2E tests (Playwright)"
	@echo "  make test-all   - Run all tests (backend + E2E)"
	@echo "  make clean      - Clean up generated files and caches"

# Format all code
fmt:
	@echo "Running qlty fmt..."
	qlty fmt

# Run all linters
lint:
	@echo "Running qlty check..."
	-qlty check
	@echo ""
	@echo "Running sqlfluff on backend SQL files..."
	-~/.qlty/cache/tools/sqlfluff/3.4.0-f921ba7a9b1c/bin/sqlfluff lint backend/sql/ --dialect postgres
	@echo ""
	@echo "Running sqlfluff on dbt models..."
	-~/.qlty/cache/tools/sqlfluff/3.4.0-f921ba7a9b1c/bin/sqlfluff lint dbt/models/ --dialect postgres

# Run backend tests
test:
	@echo "Running backend tests..."
	docker compose exec backend pytest tests/

# Run E2E tests
test-e2e:
	@echo "Running E2E tests..."
	cd e2e && npm test

# Run all tests
test-all: test test-e2e
	@echo ""
	@echo "All tests completed!"

# Clean up
clean:
	@echo "Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "Clean completed!"
