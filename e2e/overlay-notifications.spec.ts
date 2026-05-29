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

  test('panel renders the slowdown history chrome', async ({ page }) => {
    await notificationsButton(page).click();
    await expect(historyHeader(page)).toBeVisible();
    // The "Clear all events" control is always present in the history panel,
    // unlike the "No Events" empty state which disappears if React Scan
    // incidentally records a slow render (e.g. under CPU contention).
    await expect(
      page.locator(
        `${TOOLBAR_SELECTORS.widget} button[title="Clear all events"]`,
      ),
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
