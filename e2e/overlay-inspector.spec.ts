import { test, expect } from '@playwright/test';
import {
  gotoFixture,
  enterInspectMode,
  focusComponent,
  inspectButton,
  clickToolbarControl,
  blurOverlay,
  getInspectStateKind,
  waitForInspectStateKind,
  waitForToolbarReady,
  TOOLBAR_SELECTORS,
} from './helpers';

const COMPONENT_TREE_SEARCH = 'input[placeholder="Component name, /regex/, or [type]"]';

test.describe('Overlay inspector flow', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFixture(page);
    await waitForToolbarReady(page);
  });

  test('inspecting mode activates the overlay canvas', async ({ page }) => {
    await enterInspectMode(page);
    const overlay = page.locator(TOOLBAR_SELECTORS.overlayCanvas);
    await expect(overlay).toHaveCount(1);
  });

  test('clicking a component while inspecting focuses it', async ({ page }) => {
    await enterInspectMode(page);
    await focusComponent(page, '[data-testid="increment"]');
    expect(await getInspectStateKind(page)).toBe('focused');
  });

  test('focusing a component opens the inspector panel', async ({ page }) => {
    await enterInspectMode(page);
    await focusComponent(page, '[data-testid="increment"]');

    await expect(page.locator(TOOLBAR_SELECTORS.inspectorPanel)).toBeVisible();
    await expect(page.locator(COMPONENT_TREE_SEARCH)).toBeVisible();
  });

  test('inspector header shows the focused component name', async ({ page }) => {
    await enterInspectMode(page);
    await focusComponent(page, '[data-testid="increment"]');

    await expect(
      page.locator(`${TOOLBAR_SELECTORS.widget} >> text=Counter`).first(),
    ).toBeVisible();
  });

  test('a copy button appears when a component is focused', async ({ page }) => {
    await enterInspectMode(page);
    await focusComponent(page, '[data-testid="increment"]');

    await expect(
      page.locator('.react-scan-close-button[title*="Copy element"]'),
    ).toBeVisible();
  });

  test('close button exits inspection back to inspect-off', async ({ page }) => {
    await enterInspectMode(page);
    await focusComponent(page, '[data-testid="increment"]');

    await clickToolbarControl(page.locator(TOOLBAR_SELECTORS.closeButton));
    await waitForInspectStateKind(page, 'inspect-off');
    expect(await getInspectStateKind(page)).toBe('inspect-off');
  });

  test('pressing Escape returns from focused to inspecting', async ({ page }) => {
    await enterInspectMode(page);
    await focusComponent(page, '[data-testid="increment"]');

    await blurOverlay(page);
    await page.keyboard.press('Escape');
    await waitForInspectStateKind(page, 'inspecting');
    expect(await getInspectStateKind(page)).toBe('inspecting');
  });

  test('re-focusing a different component keeps the inspector open', async ({
    page,
  }) => {
    await enterInspectMode(page);
    await focusComponent(page, '[data-testid="increment"]');
    expect(await getInspectStateKind(page)).toBe('focused');

    await blurOverlay(page);
    await page.keyboard.press('Escape');
    await waitForInspectStateKind(page, 'inspecting');

    await focusComponent(page, '[data-testid="toggle-theme"]');
    expect(await getInspectStateKind(page)).toBe('focused');
    await expect(page.locator(TOOLBAR_SELECTORS.inspectorPanel)).toBeVisible();
  });

  test('toggling inspect button off while focused tears down the panel', async ({
    page,
  }) => {
    await enterInspectMode(page);
    await focusComponent(page, '[data-testid="increment"]');

    // From "focused" the inspect button advances to "inspecting".
    await clickToolbarControl(inspectButton(page));
    await waitForInspectStateKind(page, 'inspecting');
    expect(await getInspectStateKind(page)).toBe('inspecting');
  });
});
