# E2E Tests with Playwright

End-to-end tests for open-process-mining using Playwright.

## Prerequisites

1. Docker Compose services running with sample data:

```bash
# From project root
docker compose up -d

# Wait for all services to be healthy
docker compose ps

# Load sample data
docker compose exec backend bash
cd /app/dbt
dbt deps
dbt seed
dbt run
dbt test
exit
```

2. Install Playwright dependencies:

```bash
cd e2e
npm install
npx playwright install chromium
```

## Running Tests

### Run all tests (headless)

```bash
npm test
```

### Run tests with UI mode

```bash
npm run test:ui
```

### Run tests in headed mode (see browser)

```bash
npm run test:headed
```

### Debug mode

```bash
npm run test:debug
```

### View test report

```bash
npm run report
```

## Test Coverage

### Process Analysis
- Display list page
- Create new analysis
- Display process map with nodes and edges
- Navigate back to list

### Organization Analysis
- Display list page
- Create new analysis
- Switch aggregation level (employee/department)
- Navigate back to list

### Outcome Analysis
- Display list page
- Create path outcome analysis
- Create segment comparison analysis
- Switch display mode (average/median/total)
- Navigate back to list

## CI Integration

Tests can be run in CI environment:

```bash
# GitHub Actions will automatically run tests on PR
# See ../.github/workflows/e2e.yml
```

## Troubleshooting

### Services not ready

Make sure all Docker Compose services are healthy:

```bash
docker compose ps
# All services should show (healthy)
```

### Sample data missing

Load sample data before running tests:

```bash
docker compose exec backend bash -c "cd /app/dbt && dbt seed && dbt run"
```

### Port conflicts

Ensure ports 5173, 8000, and 5432 are not in use by other applications.
