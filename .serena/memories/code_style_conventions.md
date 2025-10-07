# Code Style and Conventions

## General Principles

- **Separation of concerns**: Data engineers use CLI (dbt, Python scripts), analysts use Web UI
- **Reproducibility**: All data transformations are version-controlled and testable
- **Japanese support**: Analysis names, process types, and UI text support Japanese

## Python (Backend)

### Tools

- **Linter**: ruff
- **Formatter**: black
- **Security scanner**: bandit (excluding test files)
- **Type hints**: Use type annotations for function signatures

### Conventions

- Module structure: Clear separation between API routes, services, models
- PYTHONPATH: Always set to `/app` when running scripts in container
- Error handling: Return appropriate HTTP status codes with clear messages
- Database queries: Use SQLAlchemy ORM, avoid raw SQL when possible

### File Organization

- `api/`: Route handlers only (thin layer)
- `services/`: Business logic and data processing
- `models/`: SQLAlchemy ORM models
- `analysis/`: Core algorithms (DFG discovery, metrics calculation)

## TypeScript/JavaScript (Frontend)

### Tools

- **Formatter**: prettier
- **Linter**: radarlint (static analysis)

### Conventions

- **Component structure**: Functional components with hooks
- **Type safety**: Use TypeScript interfaces for all data structures
- **State management**: Zustand for global state, React hooks for local state
- **Naming**:
  - Components: PascalCase (e.g., `ProcessMap.tsx`)
  - Hooks: camelCase with `use` prefix (e.g., `useLayout.ts`)
  - Types: PascalCase in `types/` directory

### React Flow Patterns

- **Custom nodes**: Use `React.memo` for performance
- **Layout**: ELK.js for auto-layout, maintain user drag positions
- **Styling**: Data-driven (frequency → line thickness, waiting time → color)

## SQL (dbt)

### Tools

- **Linter/Formatter**: sqlfluff
- **Config**: `.sqlfluff` for Jinja2 template support

### Conventions

- **Materialization**:
  - Staging models: `view`
  - Marts models: `table`
- **Schema**: All tables in `public` schema
- **Naming**:
  - Staging: `stg_<source_name>.sql`
  - Facts: `fct_<entity_name>.sql`
  - Masters: `master_<entity_name>`

## Docker/Infrastructure

### Tools

- **Dockerfile linter**: hadolint
- **Dockerfile formatter**: dockerfmt
- **Security scanner**: checkov

### Conventions

- Use non-root users in containers
- Include HEALTHCHECK in Dockerfiles
- Docker Compose V2 syntax: `docker compose` (not `docker-compose`)

## Documentation

### Tools

- **Markdown linter**: markdownlint

### Conventions

- Keep documentation in sync with code
- CLAUDE.md: Developer guidance (this file)
- USAGE.md: User-facing documentation
- README.md: Project overview and quick start

## Testing

### Backend (pytest)

- Test files: `test_*.py` or `*_test.py`
- Location: `backend/tests/`
- Run: `docker compose exec backend pytest tests/`

### Frontend (Jest)

- Test files: `*.test.tsx` or `*.spec.tsx`
- Location: Co-located with components
- Run: `docker compose exec frontend npm run test`

### E2E (Playwright)

- Location: `e2e/` directory
- Coverage: Process analysis, organization analysis, outcome analysis
- Run: `cd e2e && npm test`

## Code Quality Workflow

1. Write code following conventions
2. Run `make fmt` to auto-format
3. Run `make lint` to check for issues
4. Run `make test-all` before committing
5. Fix any issues reported by linters/tests

## Important Exclusions

- Test directories and files excluded from bandit (security scanner)
- `scripts/generate_sample_data.py` excluded from bandit (uses random for sample data)
- Node modules, build artifacts, generated files excluded from all linters
