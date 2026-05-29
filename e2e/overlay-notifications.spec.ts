import { test, expect, type Page } from '@playwright/test';
import {
  gotoFixture,
  notificationsButton,
  toolbarWidget,
  getInspectStateKind,
  waitForToolbarReady,
  TOOLBAR_SELECTORS,
} from './helpers';

const historyHeader = (page: Page) =>
  page.locator(`${TOOLBAR_SELECTORS.widget} >> text=History`).first();

const widgetHeight = async (page: Page): Promise<number> => {
  const box = await toolbarWidget(page).boundingBox();
  return box?.height ?? 0;
};

test.describe('Overlay notifications panel', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFixture(page);
    await waitForToolbarReady(page);
  });

  test('clicking the notifications button opens the panel', async ({ page }) => {
    await notificationsButton(page).click();
    await expect(historyHeader(page)).toBeVisible();
  });

  test('panel shows an empty state before any slowdowns', async ({ page }) => {
    await notificationsButton(page).click();
    await expect(historyHeader(page)).toBeVisible();
    await expect(
      page.locator(`${TOOLBAR_SELECTORS.widget} >> text=No Events`),
    ).toBeVisible();
  });

  test('clicking the notifications button again closes the panel', async ({
    page,
  }) => {
    const minimizedHeight = await widgetHeight(page);

    await notificationsButton(page).click();
    await expect
      .poll(async () => widgetHeight(page))
      .toBeGreaterThan(minimizedHeight + 50);

    await notificationsButton(page).click();
    await expect
      .poll(async () => widgetHeight(page))
      .toBeLessThan(minimizedHeight + 50);
  });

  test('opening notifications turns inspection off', async ({ page }) => {
    await notificationsButton(page).click();
    await expect(historyHeader(page)).toBeVisible();
    expect(await getInspectStateKind(page)).toBe('inspect-off');
  });

  test('a slow interaction is recorded and surfaced in the panel', async ({
    page,
  }) => {
    await page.click('[data-testid="trigger-slow"]');
    await page.waitForTimeout(1500);

    await notificationsButton(page).click();
    await expect(historyHeader(page)).toBeVisible();

    await expect
      .poll(
        async () =>
          page
            .locator(`${TOOLBAR_SELECTORS.widget} >> text=No Events`)
            .count(),
        { timeout: 10_000 },
      )
      .toBe(0);
  });
});
