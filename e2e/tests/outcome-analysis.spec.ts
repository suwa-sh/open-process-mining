import { test, expect } from "@playwright/test";

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
    await expect(page.locator('h2:has-text("成果分析")')).toBeVisible();

    // Check navigation buttons
    await expect(
      page.locator('button:has-text("📈 プロセス分析")'),
    ).toBeVisible();
    await expect(page.locator('button:has-text("🏢 組織分析")')).toBeVisible();
    await expect(
      page.locator('button:has-text("+ 新規分析を作成")'),
    ).toBeVisible();
  });

  test("should create path outcome analysis", async ({ page }) => {
    // Click create button
    await page.click('button:has-text("+ 新規分析を作成")');

    // Wait for modal
    await expect(
      page.locator('header:has-text("新規成果分析作成")'),
    ).toBeVisible();

    // Fill in fields
    const analysisName = `E2E Path Outcome ${Date.now()}`;
    await page.fill(
      'input[placeholder="例: 受注金額分析_2025-10"]',
      analysisName,
    );

    // Select process type
    const processTypeSelect = page
      .locator('label:has-text("プロセスタイプ")')
      .locator("..")
      .locator("select");
    await processTypeSelect.selectOption("order-to-cash");

    // Wait for metrics to load (wait for select to have options)
    const metricSelect = page
      .locator('label:has-text("メトリック")')
      .locator("..")
      .locator("select");
    await metricSelect.waitFor({ state: "attached", timeout: 5000 });
    await page.waitForTimeout(3000); // Additional wait for API response
    await expect(metricSelect).not.toHaveValue("", { timeout: 10000 });

    // Analysis type select (path-outcome is default)
    const analysisTypeSelect = page
      .locator('label:has-text("分析タイプ")')
      .locator("..")
      .locator("select");
    await expect(analysisTypeSelect).toHaveValue("path-outcome");

    // Select date filter
    await page.locator('label:has-text("すべての期間を含める")').click();

    // Click create (use the button inside the modal footer)
    await page.locator('.chakra-modal__footer button:has-text("作成")').click();

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
      page.locator('header:has-text("新規成果分析作成")'),
    ).toBeVisible();

    // Fill in fields
    const analysisName = `E2E Segment ${Date.now()}`;
    await page.fill(
      'input[placeholder="例: 受注金額分析_2025-10"]',
      analysisName,
    );

    // Select process type
    const processTypeSelect = page
      .locator('label:has-text("プロセスタイプ")')
      .locator("..")
      .locator("select");
    await processTypeSelect.selectOption("order-to-cash");

    // Wait for metrics to load
    const metricSelect = page
      .locator('label:has-text("メトリック")')
      .locator("..")
      .locator("select");
    await metricSelect.waitFor({ state: "attached", timeout: 5000 });
    await page.waitForTimeout(3000);

    // Select segment comparison
    const analysisTypeSelect = page
      .locator('label:has-text("分析タイプ")')
      .locator("..")
      .locator("select");
    await analysisTypeSelect.selectOption("segment-comparison");

    // Select date filter
    await page.locator('label:has-text("すべての期間を含める")').click();

    // Click create (use the button inside the modal footer)
    await page.locator('.chakra-modal__footer button:has-text("作成")').click();

    // Wait for redirect
    await expect(page).toHaveURL(/\/outcome\/[a-f0-9-]+/, { timeout: 30000 });

    // Wait for page to fully load (notifications may appear)
    await page.waitForTimeout(2000);

    // Verify segment comparison page
    await expect(page.locator("text=プロセス: order-to-cash")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('h2:has-text("高成果群")').first()).toBeVisible();
    await expect(page.locator('h2:has-text("低成果群")').first()).toBeVisible();
  });

  test("should switch display mode in path outcome", async ({ page }) => {
    // Create path outcome analysis
    await page.click('button:has-text("+ 新規分析を作成")');
    await page.fill(
      'input[placeholder="例: 受注金額分析_2025-10"]',
      `E2E Mode ${Date.now()}`,
    );
    const processTypeSelect = page
      .locator('label:has-text("プロセスタイプ")')
      .locator("..")
      .locator("select");
    await processTypeSelect.selectOption("order-to-cash");
    const metricSelect = page
      .locator('label:has-text("メトリック")')
      .locator("..")
      .locator("select");
    await metricSelect.waitFor({ state: "attached", timeout: 5000 });
    await page.waitForTimeout(3000);
    await page.locator('label:has-text("すべての期間を含める")').click();
    await page.locator('.chakra-modal__footer button:has-text("作成")').click();
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
    await page.waitForTimeout(1000);

    // Verify median is selected
    const medianRadio = page.locator('input[value="median"]');
    await expect(medianRadio).toBeChecked();
  });

  test("should navigate back to list", async ({ page }) => {
    // Create analysis
    await page.click('button:has-text("+ 新規分析を作成")');
    await page.fill(
      'input[placeholder="例: 受注金額分析_2025-10"]',
      `E2E Nav ${Date.now()}`,
    );
    const processTypeSelect = page
      .locator('label:has-text("プロセスタイプ")')
      .locator("..")
      .locator("select");
    await processTypeSelect.selectOption("order-to-cash");
    const metricSelect = page
      .locator('label:has-text("メトリック")')
      .locator("..")
      .locator("select");
    await metricSelect.waitFor({ state: "attached", timeout: 5000 });
    await page.waitForTimeout(3000);
    await page.locator('label:has-text("すべての期間を含める")').click();
    await page.locator('.chakra-modal__footer button:has-text("作成")').click();
    await expect(page).toHaveURL(/\/outcome\/[a-f0-9-]+/, { timeout: 30000 });

    // Click back button
    await page.click('button:has-text("← 成果分析一覧に戻る")');

    // Verify we're back
    await expect(page).toHaveURL("/outcome");
    await expect(page.locator('h2:has-text("成果分析")')).toBeVisible();
  });
});
