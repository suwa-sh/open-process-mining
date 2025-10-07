# Task Completion Checklist

When completing a development task, follow these steps:

## 1. Code Quality Checks

### Format Code

```bash
make fmt
```

This runs `qlty fmt` to auto-format all code files.

### Lint Code

```bash
make lint
```

This runs:

- `qlty check`: All configured linters (ruff, prettier, hadolint, etc.)
- `sqlfluff`: SQL linting for backend/sql/ and dbt/models/

Fix any issues reported by the linters.

## 2. Run Tests

### All Tests

```bash
make test-all
```

This runs both backend and E2E tests.

### Backend Tests Only

```bash
make test
# Or: docker compose exec backend pytest tests/
```

### E2E Tests Only

```bash
make test-e2e
# Or: cd e2e && npm test
```

### For Backend Changes

If you modified backend code:

1. Write/update unit tests in `backend/tests/`
2. Run `docker compose exec backend pytest tests/`
3. Ensure all tests pass

### For Frontend Changes

If you modified frontend code:

1. Test manually in browser (<http://localhost:5173>)
2. Run E2E tests: `cd e2e && npm test`
3. Consider adding new E2E test cases if adding new features

### For dbt Changes

If you modified dbt models:

1. Run `dbt test` to validate data quality
2. Check that models materialize correctly
3. Verify event log schema matches expectations

## 3. Database Considerations

### After Schema Changes

If you modified database schema:

1. Update `backend/sql/init.sql` if needed
2. Test with fresh database: `docker compose down -v && docker compose up -d`
3. Regenerate sample data: `python scripts/generate_sample_data.py`
4. Run dbt pipeline: `docker compose exec backend bash -c "cd /app/dbt && dbt seed && dbt run"`

### After dbt Model Changes

```bash
docker compose exec backend bash
cd /app/dbt
dbt run        # Run transformations
dbt test       # Validate data quality
```

## 4. Documentation

### Update Documentation If

- Adding new API endpoints → Update OpenAPI docstrings in route handlers
- Adding new features → Update USAGE.md with user-facing instructions
- Changing architecture → Update CLAUDE.md or README.md
- Adding new commands → Update this file or suggested_commands.md

## 5. Commit Checklist

Before committing:

- [ ] Code is formatted (`make fmt`)
- [ ] No linter errors (`make lint`)
- [ ] All tests pass (`make test-all`)
- [ ] Documentation is updated if needed
- [ ] No debugging code (console.log, print statements, etc.)
- [ ] Environment variables are not hardcoded
- [ ] Secrets are not committed

## 6. Special Considerations

### For UI/UX Changes

Follow the UI/UX design principles in CLAUDE.md:

- Modal size: `size="xl"`
- Analysis name defaults: Include required fields + date
- Filter labels: "フィルター:"
- Navigation buttons: Use consistent color schemes (blue/purple/green)
- Zero state messages: Show in list area, not full screen

### For API Changes

- Maintain backward compatibility when possible
- Update OpenAPI documentation in route handlers
- Test with Swagger UI: <http://localhost:8000/docs>
- Verify CORS settings for frontend integration

### For Performance-Critical Changes

- Test with realistic data volumes (use sample data generator)
- Monitor React Flow performance (60 FPS for 1000+ nodes/edges)
- Use `React.memo` for custom nodes
- Optimize database queries (check with EXPLAIN ANALYZE)

## 7. Cleanup

```bash
make clean  # Remove generated files and caches
```

## Quick Reference

```bash
# Complete task workflow
make fmt        # Format
make lint       # Check for issues
make test-all   # Run all tests
# Commit if all pass
```
