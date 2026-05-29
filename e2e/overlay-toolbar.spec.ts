import { test, expect } from '@playwright/test';
import {
  gotoFixture,
  toolbarWidget,
  inspectButton,
  notificationsButton,
  outlineToggle,
  getInspectStateKind,
  waitForInspectStateKind,
  waitForToolbarReady,
  isOutlineInstrumentationPaused,
  TOOLBAR_SELECTORS,
} from './helpers';

test.describe('Overlay toolbar UI', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFixture(page);
    await waitForToolbarReady(page);
  });

  test('renders the toolbar widget and its core controls', async ({ page }) => {
    await expect(toolbarWidget(page)).toBeVisible();
    await expect(inspectButton(page)).toBeVisible();
    await expect(notificationsButton(page)).toBeVisible();
    await expect(inspectButton(page)).toHaveAttribute('title', 'Inspect element');
    await expect(notificationsButton(page)).toHaveAttribute(
      'title',
      'Notifications',
    );
  });

  test('FPS meter is rendered in the toolbar', async ({ page }) => {
    // The meter starts blank and only paints once its 200ms sampling interval
    // ticks, which can lag under CPU contention, so poll the widget text.
    await expect
      .poll(
        async () =>
          toolbarWidget(page).evaluate((el) => el.textContent ?? ''),
        { timeout: 20_000 },
      )
      .toContain('FPS');
  });

  test('clicking inspect button enters inspecting mode', async ({ page }) => {
    expect(await getInspectStateKind(page)).toBe('inspect-off');

    await inspectButton(page).click();
    await waitForInspectStateKind(page, 'inspecting');
    expect(await getInspectStateKind(page)).toBe('inspecting');
  });

  test('inspect button icon color reflects inspecting state', async ({
    page,
  }) => {
    const inactiveColor = await inspectButton(page).evaluate(
      (el) => (el as HTMLElement).style.color,
    );
    expect(inactiveColor).toBe('rgb(153, 153, 153)');

    await inspectButton(page).click();
    await waitForInspectStateKind(page, 'inspecting');

    await expect
      .poll(async () =>
        inspectButton(page).evaluate((el) => (el as HTMLElement).style.color),
      )
      .toBe('rgb(142, 97, 227)');
  });

  test('clicking inspect button twice toggles inspecting off', async ({
    page,
  }) => {
    await inspectButton(page).click();
    await waitForInspectStateKind(page, 'inspecting');

    await inspectButton(page).click();
    await waitForInspectStateKind(page, 'inspect-off');
    expect(await getInspectStateKind(page)).toBe('inspect-off');
  });

  test('outline toggle starts enabled (instrumentation active)', async ({
    page,
  }) => {
    await expect(outlineToggle(page)).toBeChecked();
    expect(await isOutlineInstrumentationPaused(page)).toBe(false);
  });

  test('toggling outlines off pauses instrumentation and persists', async ({
    page,
  }) => {
    await outlineToggle(page).click();

    await expect
      .poll(async () => isOutlineInstrumentationPaused(page))
      .toBe(true);
    await expect(outlineToggle(page)).not.toBeChecked();

    const persistedEnabled = await page.evaluate(() => {
      const raw = localStorage.getItem('react-scan-options');
      return raw ? JSON.parse(raw).enabled : null;
    });
    expect(persistedEnabled).toBe(false);
  });

  test('toggling outlines off then on restores instrumentation', async ({
    page,
  }) => {
    await outlineToggle(page).click();
    await expect
      .poll(async () => isOutlineInstrumentationPaused(page))
      .toBe(true);

    await outlineToggle(page).click();
    await expect
      .poll(async () => isOutlineInstrumentationPaused(page))
      .toBe(false);
    await expect(outlineToggle(page)).toBeChecked();
  });
});
