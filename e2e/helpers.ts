import { Page, Locator, expect } from "@playwright/test";

/**
 * E2Eテスト用の共通ヘルパー関数
 */

/**
 * 入力フィールドに値を入力するヘルパー関数
 * React 18のイベント処理に対応した方法で値を設定する
 *
 * @param page - Playwrightのページオブジェクト
 * @param locator - 入力フィールドのlocator
 * @param value - 入力する値
 */
export async function fillInput(page: Page, locator: Locator, value: string) {
  await locator.evaluate(
    (el: HTMLInputElement | HTMLTextAreaElement, val: string) => {
      // React 18の新しいイベント処理に対応
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        el instanceof HTMLTextAreaElement
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype,
        "value",
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, val);
      } else {
        el.value = val;
      }

      // inputイベントを発火してReactの状態を更新
      const event = new Event("input", { bubbles: true });
      el.dispatchEvent(event);
    },
    value,
  );
}

/**
 * MUI Selectコンポーネントでオプションを選択するヘルパー関数
 *
 * @param page - Playwrightのページオブジェクト
 * @param selectId - SelectコンポーネントのIDまたはdata-testid
 * @param optionValue - 選択するオプションのdata-value値
 */
export async function selectMuiOption(
  page: Page,
  selectId: string,
  optionValue: string,
) {
  // Selectをクリックして開く
  // data-testidがあればそちらを優先（詳細画面内のSelect用）
  // なければ通常のID（モーダル内のSelect用）
  const triggerLocator = page.locator(`[data-testid="${selectId}-trigger"]`);
  const hasTrigger = (await triggerLocator.count()) > 0;

  const selectElement = hasTrigger
    ? triggerLocator
    : page.locator(`#${selectId}`);

  await expect(selectElement).toBeVisible();

  // MUI Selectはmousedownイベントに反応するため、dispatchEventを使用
  if (hasTrigger) {
    await selectElement.dispatchEvent("mousedown");
  } else {
    await selectElement.click();
  }

  // listboxが表示されるのを待つ
  const listbox = page.locator('[role="listbox"]');
  await expect(listbox).toBeVisible({ timeout: 5000 });

  // オプションを選択
  const option = page.locator(`[role="option"][data-value="${optionValue}"]`);
  await expect(option).toBeVisible();
  await option.click();

  // listboxが閉じるのを待つ
  await expect(listbox).not.toBeVisible();
}

/**
 * フォーカスを外すためのヘルパー関数
 * モーダル内のタイトルなどをクリックしてフォーカスを解除
 *
 * @param page - Playwrightのページオブジェクト
 * @param titleText - クリックするタイトルのテキスト
 */
export async function blurFocus(page: Page, titleText: string) {
  await page.locator(`h2:has-text("${titleText}")`).click();
  // フォーカスが外れるまで少し待つ
  await page.waitForTimeout(100);
}
