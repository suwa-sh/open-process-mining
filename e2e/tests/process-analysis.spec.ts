import { test, expect } from "@playwright/test";
import { fillInput, selectMuiOption } from "../helpers";

/**
 * E2E tests for Process Analysis
 *
 * Prerequisites:
 * - docker compose up -d (all services healthy)
 * - dbt deps, dbt seed, dbt run (sample data loaded)
 */

test.describe("Process Analysis", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display process analysis list page", async ({ page }) => {
    // Check page title
    await expect(page.locator("text=プロセス分析")).toBeVisible();

    // Check navigation buttons
    await expect(page.locator("text=組織分析")).toBeVisible();
    await expect(page.locator("text=成果分析")).toBeVisible();
    await expect(page.locator("text=+ 新規分析を作成")).toBeVisible();
  });

  test("should create new process analysis", async ({ page }) => {
    // Click create button
    await page.click('button:has-text("+ 新規分析を作成")');

    // Wait for modal to appear
    await expect(
      page.locator('h2:has-text("新規分析を作成")'),
    ).toBeVisible();

    // Fill in analysis name
    const analysisName = `E2E Test Process ${Date.now()}`;
    await fillInput(
      page,
      page.locator('input[placeholder="例: 受注から配送_2025-10"]'),
      analysisName,
    );

    // Select process type
    await selectMuiOption(page, "process-type-select", "order-to-cash");

    // Select date filter option (all periods) - use label click
    await page.locator('label:has-text("すべての期間を含める")').click();

    // Wait for preview to auto-load
    await expect(page.locator("text=対象ケース数")).toBeVisible({
      timeout: 10000,
    });

    // Click analyze button
    await page.click('button:has-text("分析を実行")');

    // Wait for analysis to complete and redirect
    await expect(page).toHaveURL(/\/process\/[a-f0-9-]+/, { timeout: 30000 });

    // Verify process map is displayed
    await expect(page.locator("[data-id]").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("should display process map with nodes and edges", async ({ page }) => {
    // Create a test analysis first (or use existing one)
    await page.click('button:has-text("+ 新規分析を作成")');

    const analysisName = `E2E Map Test ${Date.now()}`;
    await fillInput(
      page,
      page.locator('input[placeholder="例: 受注から配送_2025-10"]'),
      analysisName,
    );

    // Select process type
    await selectMuiOption(page, "process-type-select", "order-to-cash");

    await page.locator('label:has-text("すべての期間を含める")').click();
    await expect(page.locator("text=対象ケース数")).toBeVisible({
      timeout: 10000,
    });
    await page.click('button:has-text("分析を実行")');
    await expect(page).toHaveURL(/\/process\/[a-f0-9-]+/, { timeout: 30000 });

    // Verify process map elements
    const nodes = page.locator("[data-id]");
    await expect(nodes.first()).toBeVisible();

    // Check for metric toggle
    await expect(page.locator('label:has-text("頻度")')).toBeVisible();
    await expect(page.locator('label:has-text("平均待機時間")')).toBeVisible();

    // Check for path filter (Chakra UI Slider uses role="slider")
    await expect(page.locator("role=slider")).toBeVisible();
  });

  test("should navigate back to list", async ({ page }) => {
    // Navigate to a detail page first
    await page.click('button:has-text("+ 新規分析を作成")');

    const analysisName = `E2E Nav Test ${Date.now()}`;
    await fillInput(
      page,
      page.locator('input[placeholder="例: 受注から配送_2025-10"]'),
      analysisName,
    );

    // Select process type
    await selectMuiOption(page, "process-type-select", "order-to-cash");

    await page.locator('label:has-text("すべての期間を含める")').click();
    await expect(page.locator("text=対象ケース数")).toBeVisible({
      timeout: 10000,
    });
    await page.click('button:has-text("分析を実行")');
    await expect(page).toHaveURL(/\/process\/[a-f0-9-]+/, { timeout: 30000 });

    // Click back button
    await page.click('button:has-text("← 一覧に戻る")');

    // Verify we're back on the list page
    await expect(page).toHaveURL("/");
    await expect(page.locator("text=プロセス分析")).toBeVisible();
  });
});
