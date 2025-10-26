import { test, expect } from "@playwright/test";
import { fillInput, selectMuiOption } from "../helpers";

/**
 * E2E tests for Organization Analysis
 */

test.describe("Organization Analysis", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/organization");
  });

  test("should display organization analysis list page", async ({ page }) => {
    // Check page title
    await expect(page.locator('h4:has-text("組織分析")')).toBeVisible();

    // Check navigation buttons
    await expect(
      page.locator('button:has-text("プロセス分析")'),
    ).toBeVisible();
    await expect(page.locator('button:has-text("成果分析")')).toBeVisible();
    await expect(
      page.locator('button:has-text("+ 新規組織分析を作成")'),
    ).toBeVisible();
  });

  test("should create new organization analysis", async ({ page }) => {
    // Click create button
    await page.click('button:has-text("+ 新規組織分析を作成")');

    // Wait for modal
    await expect(
      page.locator('h2:has-text("新規組織分析を作成")'),
    ).toBeVisible();

    // Fill in analysis name
    const analysisName = `E2E Org Test ${Date.now()}`;
    await fillInput(
      page,
      page.locator('input[placeholder="例: employee-onboarding_組織分析_2025-10-04"]'),
      analysisName,
    );

    // Select process type
    await selectMuiOption(page, "process-type-select", "order-to-cash");

    // Select date filter (all periods) - use label click instead of input
    await page.locator('label:has-text("すべての期間を含める")').click();

    // Click create button
    await page.click('button:has-text("分析を実行")');

    // Wait for redirect to detail page
    await expect(page).toHaveURL(/\/organization\/[a-f0-9-]+/, {
      timeout: 30000,
    });

    // Verify analysis detail page (wait for tabs to appear)
    await expect(
      page.getByRole("tab", { name: /ハンドオーバー分析/ }),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("tab", { name: /作業負荷分析/ })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /パフォーマンス分析/ }),
    ).toBeVisible();
  });

  test("should switch aggregation level", async ({ page }) => {
    // Create analysis first
    await page.click('button:has-text("+ 新規組織分析を作成")');

    const analysisName = `E2E Agg Test ${Date.now()}`;
    await fillInput(
      page,
      page.locator('input[placeholder="例: employee-onboarding_組織分析_2025-10-04"]'),
      analysisName,
    );

    // Select process type
    await selectMuiOption(page, "process-type-select", "order-to-cash");

    await page.locator('label:has-text("すべての期間を含める")').click();
    await page.click('button:has-text("分析を実行")');
    await expect(page).toHaveURL(/\/organization\/[a-f0-9-]+/, {
      timeout: 30000,
    });

    // Wait for initial load (wait for tabs to appear)
    await expect(
      page.getByRole("tab", { name: /ハンドオーバー分析/ }),
    ).toBeVisible({
      timeout: 10000,
    });

    // Wait for graph to be fully rendered before interacting with controls
    await expect(page.locator("[data-id]").first()).toBeVisible({ timeout: 10000 });

    // Switch to department level
    await selectMuiOption(page, "aggregation-level-select", "department");

    // Wait for data to reload - check that a node is still visible
    await expect(page.locator("[data-id]").first()).toBeVisible({ timeout: 10000 });
  });

  test("should navigate back to list", async ({ page }) => {
    // Create analysis
    await page.click('button:has-text("+ 新規組織分析を作成")');

    const analysisName = `E2E Nav Test ${Date.now()}`;
    await fillInput(
      page,
      page.locator('input[placeholder="例: employee-onboarding_組織分析_2025-10-04"]'),
      analysisName,
    );

    // Select process type
    await selectMuiOption(page, "process-type-select", "order-to-cash");

    await page.locator('label:has-text("すべての期間を含める")').click();
    await page.click('button:has-text("分析を実行")');
    await expect(page).toHaveURL(/\/organization\/[a-f0-9-]+/, {
      timeout: 30000,
    });

    // Click back button
    await page.click('button:has-text("組織分析一覧に戻る")');

    // Verify we're back
    await expect(page).toHaveURL("/organization");
    await expect(page.locator('h4:has-text("組織分析")')).toBeVisible();
  });
});
