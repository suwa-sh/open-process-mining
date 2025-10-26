import { test, expect } from "@playwright/test";
import { fillInput, selectMuiOption } from "../helpers";

/**
 * E2E tests for Outcome Analysis
 */

test.describe("Outcome Analysis", () => {
  // Outcome analysis tests take longer due to metric calculations
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/outcome");
  });

  test("should display outcome analysis list page", async ({ page }) => {
    // Check page title
    await expect(page.locator('h4:has-text("成果分析")')).toBeVisible();

    // Check navigation buttons
    await expect(
      page.locator('button:has-text("プロセス分析")'),
    ).toBeVisible();
    await expect(page.locator('button:has-text("組織分析")')).toBeVisible();
    await expect(
      page.locator('button:has-text("+ 新規分析を作成")'),
    ).toBeVisible();
  });

  test("should create path outcome analysis", async ({ page }) => {
    // Click create button
    await page.click('button:has-text("+ 新規分析を作成")');

    // Wait for modal
    await expect(
      page.locator('h2:has-text("新規成果分析作成")'),
    ).toBeVisible();

    // Fill in fields
    const analysisName = `E2E Path Outcome ${Date.now()}`;
    await fillInput(
      page,
      page.locator('input[placeholder="例: 受注金額分析_2025-10"]'),
      analysisName,
    );

    // Select process type
    await selectMuiOption(page, "process-type-select", "order-to-cash");

    // Select date filter
    await page.locator('label:has-text("すべての期間を含める")').click();

    // Click create
    await page.locator('button:has-text("作成")').last().click();

    // Wait for redirect
    await expect(page).toHaveURL(/\/outcome\/[a-f0-9-]+/, { timeout: 30000 });

    // Verify analysis detail page (check for process type and back button)
    await expect(page.locator("text=プロセス: order-to-cash")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator('button:has-text("← 成果分析一覧に戻る")'),
    ).toBeVisible();
  });

  test("should create segment comparison analysis", async ({ page }) => {
    // Click create button
    await page.click('button:has-text("+ 新規分析を作成")');
    await expect(
      page.locator('h2:has-text("新規成果分析作成")'),
    ).toBeVisible();

    // Fill in fields
    const analysisName = `E2E Segment ${Date.now()}`;
    await fillInput(
      page,
      page.locator('input[placeholder="例: 受注金額分析_2025-10"]'),
      analysisName,
    );

    // Select process type
    await selectMuiOption(page, "process-type-select", "order-to-cash");

    // Select segment comparison (wait for analysis type select to be available)
    await expect(page.locator("#analysis-type-select")).toBeVisible();
    await selectMuiOption(page, "analysis-type-select", "segment-comparison");

    // Select date filter
    await page.locator('label:has-text("すべての期間を含める")').click();

    // Click create
    await page.locator('button:has-text("作成")').last().click();

    // Wait for redirect
    await expect(page).toHaveURL(/\/outcome\/[a-f0-9-]+/, { timeout: 30000 });

    // Verify segment comparison page
    await expect(page.locator("text=プロセス: order-to-cash")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=高成果群").first()).toBeVisible();
    await expect(page.locator("text=低成果群").first()).toBeVisible();
  });

  test("should switch display mode in path outcome", async ({ page }) => {
    // Create path outcome analysis
    await page.click('button:has-text("+ 新規分析を作成")');

    const analysisName = `E2E Mode ${Date.now()}`;
    await fillInput(
      page,
      page.locator('input[placeholder="例: 受注金額分析_2025-10"]'),
      analysisName,
    );

    // Select process type
    await selectMuiOption(page, "process-type-select", "order-to-cash");

    // Wait for metric selector to be available
    await expect(page.locator("#metric-select")).toBeVisible();
    await page.locator('label:has-text("すべての期間を含める")').click();
    await page.locator('button:has-text("作成")').last().click();
    await expect(page).toHaveURL(/\/outcome\/[a-f0-9-]+/, { timeout: 30000 });

    // Wait for initial load
    await expect(page.locator("text=プロセス: order-to-cash")).toBeVisible({
      timeout: 10000,
    });

    // Check for display mode toggle
    await expect(page.locator('label:has-text("平均値")')).toBeVisible();
    await expect(page.locator('label:has-text("中央値")')).toBeVisible();
    await expect(page.locator('label:has-text("合計値")')).toBeVisible();

    // Switch to median
    await page.locator('label:has-text("中央値")').click();

    // Verify median is selected
    const medianRadio = page.locator('input[value="median"]');
    await expect(medianRadio).toBeChecked();
  });

  test("should navigate back to list", async ({ page }) => {
    // Create analysis
    await page.click('button:has-text("+ 新規分析を作成")');

    const analysisName = `E2E Nav ${Date.now()}`;
    await fillInput(
      page,
      page.locator('input[placeholder="例: 受注金額分析_2025-10"]'),
      analysisName,
    );

    // Select process type
    await selectMuiOption(page, "process-type-select", "order-to-cash");

    // Wait for metric selector to be available
    await expect(page.locator("#metric-select")).toBeVisible();
    await page.locator('label:has-text("すべての期間を含める")').click();
    await page.locator('button:has-text("作成")').last().click();
    await expect(page).toHaveURL(/\/outcome\/[a-f0-9-]+/, { timeout: 30000 });

    // Click back button
    await page.click('button:has-text("← 成果分析一覧に戻る")');

    // Verify we're back
    await expect(page).toHaveURL("/outcome");
    await expect(page.locator('h4:has-text("成果分析")')).toBeVisible();
  });
});
