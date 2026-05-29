import { test, expect } from '@playwright/test';
import {
  gotoFixture,
  toolbarWidget,
  notificationsButton,
  isReactScanActive,
  waitForToolbarReady,
  TOOLBAR_SELECTORS,
} from './helpers';

const LOCALSTORAGE_WIDGET_KEY = 'react-scan-widget-settings-v2';

test.describe('Overlay widget container', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFixture(page);
    await waitForToolbarReady(page);
  });

  test('widget mounts with the expected identity attributes', async ({
    page,
  }) => {
    const widget = toolbarWidget(page);
    await expect(widget).toBeVisible();
    await expect(widget).toHaveAttribute('dir', 'ltr');
  });

  test('widget fades in to full opacity', async ({ page }) => {
    await expect
      .poll(async () =>
        toolbarWidget(page).evaluate((el) =>
          Number(getComputedStyle(el).opacity),
        ),
      )
      .toBeGreaterThan(0.9);
  });

  test('all four resize handles are present in the DOM', async ({ page }) => {
    const handles = page.locator(
      `${TOOLBAR_SELECTORS.root} .resize-left, ${TOOLBAR_SELECTORS.root} .resize-right, ${TOOLBAR_SELECTORS.root} .resize-top, ${TOOLBAR_SELECTORS.root} .resize-bottom`,
    );
    await expect(handles).toHaveCount(4);
  });

  test('widget settings are persisted to localStorage', async ({ page }) => {
    await expect
      .poll(async () =>
        page.evaluate(
          (key) => localStorage.getItem(key) !== null,
          LOCALSTORAGE_WIDGET_KEY,
        ),
      )
      .toBe(true);

    const settings = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, LOCALSTORAGE_WIDGET_KEY);
    expect(settings).not.toBeNull();
    expect(settings.corner).toBeTruthy();
    expect(settings.dimensions).toBeTruthy();
  });

  test('widget survives repeated host-app interactions', async ({ page }) => {
    for (let clickIndex = 0; clickIndex < 5; clickIndex++) {
      await page.click('[data-testid="increment"]');
    }
    await expect(toolbarWidget(page)).toBeVisible();
    expect(await isReactScanActive(page)).toBe(true);
  });

  test('opening a panel expands the widget', async ({ page }) => {
    const minimizedBox = await toolbarWidget(page).boundingBox();
    expect(minimizedBox).not.toBeNull();

    await notificationsButton(page).click();
    await page.waitForTimeout(600);

    await expect
      .poll(async () => {
        const box = await toolbarWidget(page).boundingBox();
        return box?.width ?? 0;
      })
      .toBeGreaterThan(minimizedBox?.width ?? 0);
  });
});
