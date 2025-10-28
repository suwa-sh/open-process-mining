# E2E Tests with Playwright

End-to-end tests for open-process-mining using Playwright.

## Prerequisites

1. Docker Compose services running with sample data:

```bash
# From project root
docker compose -f compose.dev.yml up -d

# Wait for all services to be healthy
docker compose -f compose.dev.yml ps

# Load sample data
docker compose -f compose.dev.yml exec backend bash
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

## Helper Functions

The `helpers.ts` file provides utility functions for interacting with MUI components:

### selectMuiOption(page, selectId, optionValue)

Selects an option from a MUI Select component.

```typescript
import { selectMuiOption } from "./helpers";

// For modal Selects (using id attribute)
await selectMuiOption(page, "process-type-select", "order-to-cash");

// For detail screen Selects (using data-testid)
await selectMuiOption(page, "aggregation-level-select", "department");
```

**How it works:**

- Checks for `data-testid="${selectId}-trigger"` first (detail screens)
- Falls back to `#${selectId}` (modal dialogs)
- Uses `mousedown` event for data-testid elements (MUI Select requirement)
- Uses regular `click()` for id-based elements
- Waits for listbox to appear and closes

### fillInput(page, locator, value)

Fills input fields with React 18 event handling support.

```typescript
import { fillInput } from "./helpers";

const nameInput = page.locator('input[name="analysisName"]');
await fillInput(page, nameInput, "My Analysis");
```

### blurFocus(page, titleText)

Removes focus from input fields by clicking a title.

```typescript
import { blurFocus } from "./helpers";

await blurFocus(page, "新規分析を作成");
```

## Troubleshooting

### Services not ready

Make sure all Docker Compose services are healthy:

```bash
docker compose -f compose.dev.yml ps
# All services should show (healthy)
```

### Sample data missing

Load sample data before running tests:

```bash
docker compose -f compose.dev.yml run --rm dbt bash -c "cd /app/dbt && dbt seed && dbt run"
```

### Port conflicts

Ensure ports 5173, 8000, and 5432 are not in use by other applications.

### MUI Select not opening in tests

If MUI Select components are not opening during tests:

1. **For modal Selects**: Ensure the Select has an `id` attribute

   ```tsx
   <Select id="process-type-select" ...>
   ```

2. **For detail screen Selects**: Add `SelectDisplayProps` with `data-testid`

   ```tsx
   <Select
     id="aggregation-level-select"
     SelectDisplayProps={{
       "data-testid": "aggregation-level-select-trigger"
     }}
   >
   ```

3. **Use the helper function**: Always use `selectMuiOption()` instead of direct
   `click()`

   ```typescript
   // ✅ Correct
   await selectMuiOption(page, "process-type-select", "order-to-cash");

   // ❌ Wrong - listbox won't open
   await page.locator("#process-type-select").click();
   ```

**Technical background**: MUI Select has a transparent native input that covers the
visible display div when `fullWidth` is used. The `selectMuiOption()` helper handles
this by using `mousedown` events for data-testid elements.
