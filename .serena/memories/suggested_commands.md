# Suggested Commands

## Environment Setup

### Initial Setup

```bash
# Copy environment variables
cp .env.example .env

# Generate sample data (run from project root)
python scripts/generate_sample_data.py

# Start containers
docker compose up -d

# Load data with dbt
docker compose exec backend bash -c "cd /app/dbt && dbt deps && dbt seed && dbt run"
```

### Checking Status

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f
docker compose logs backend -f
docker compose logs frontend -f
```

## Development Commands

### Code Quality

```bash
# Format all code
make fmt

# Run all linters (qlty + sqlfluff)
make lint

# Individual qlty commands
qlty check                          # All linters/formatters
qlty fmt                            # Auto-fix issues
qlty check backend/src/main.py     # Check specific file
```

### Testing

```bash
# Run all tests (backend + E2E)
make test-all

# Backend tests only
make test
# Or: docker compose exec backend pytest tests/

# E2E tests only
make test-e2e
# Or: cd e2e && npm test

# E2E test modes
cd e2e
npm run test:ui      # UI mode (interactive debugging)
npm run test:headed  # Browser visible mode
npm run test:debug   # Debug mode (step execution)
```

### Database Operations

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U process_mining -d process_mining_db

# Check event log counts
docker compose exec -T postgres psql -U process_mining -d process_mining_db -c \
  "SELECT process_type, COUNT(*) FROM fct_event_log GROUP BY process_type;"

# View analysis results
docker compose exec -T postgres psql -U process_mining -d process_mining_db -c \
  "SELECT analysis_id, analysis_name, created_at FROM analysis_results;"

# Complete database reset
docker compose down -v
docker compose up -d
python scripts/generate_sample_data.py
docker compose exec backend bash -c "cd /app/dbt && dbt seed && dbt run"
```

### dbt Operations

```bash
# Enter backend container
docker compose exec backend bash

# Navigate to dbt directory
cd /app/dbt

# Install dependencies
dbt deps

# Load sample data
dbt seed

# Run transformations
dbt run

# Run tests
dbt test
```

### API Testing

```bash
# Health check (using Python since curl is not available in container)
docker compose exec -T backend python -c "import requests; print(requests.get('http://localhost:8000/health').json())"

# List analyses
docker compose exec -T backend python -c "import requests; print(requests.get('http://localhost:8000/process/analyses').json())"

# From host machine (if curl is available)
curl http://localhost:8000/health
curl http://localhost:8000/docs  # Swagger UI
```

### Cleanup

```bash
# Clean generated files and caches
make clean

# Stop containers
docker compose down

# Stop containers and remove volumes (complete reset)
docker compose down -v
```

## Access URLs

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:8000>
- **Swagger UI**: <http://localhost:8000/docs>
- **ReDoc**: <http://localhost:8000/redoc>
- **PostgreSQL**: localhost:5432

## Important Notes

- Use `docker compose` (not `docker-compose`) - V2 syntax
- Always set `PYTHONPATH=/app` when running Python scripts in backend container
- dbt creates tables in `public` schema
- Sample data covers 2024 (Jan 1 - Dec 31) for 6 process types
