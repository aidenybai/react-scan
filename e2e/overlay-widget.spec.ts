import { test, expect } from "./fixtures";
import {
  gotoFixture,
  overlayPanel,
  toolbarWidget,
  notificationsButton,
  isReactScanActive,
  waitForToolbarReady,
  TOOLBAR_SELECTORS,
} from "./helpers";

const LOCALSTORAGE_WIDGET_KEY = "react-scan-widget-settings-v2";
const LOCALSTORAGE_TOOLBAR_KEY = "react-scan-toolbar-state-v1";

test.describe("Overlay widget container", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFixture(page);
    await waitForToolbarReady(page);
  });

  test("widget mounts with the expected identity attributes", async ({ page }) => {
    const widget = toolbarWidget(page);
    await expect(widget).toBeVisible();
    await expect(widget).toHaveAttribute("dir", "ltr");
  });

  test("widget fades in to full opacity", async ({ page }) => {
    await expect
      .poll(async () => toolbarWidget(page).evaluate((el) => Number(getComputedStyle(el).opacity)))
      .toBeGreaterThan(0.9);
  });

  test("all four resize handles are present in the DOM", async ({ page }) => {
    const handles = page.locator(
      `${TOOLBAR_SELECTORS.panel} .resize-left, ${TOOLBAR_SELECTORS.panel} .resize-right, ${TOOLBAR_SELECTORS.panel} .resize-top, ${TOOLBAR_SELECTORS.panel} .resize-bottom`,
    );
    await expect(handles).toHaveCount(4);
  });

  test("widget settings are persisted to localStorage", async ({ page }) => {
    await expect
      .poll(async () =>
        page.evaluate((key) => localStorage.getItem(key) !== null, LOCALSTORAGE_WIDGET_KEY),
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

  test("widget survives repeated host-app interactions", async ({ page }) => {
    for (let clickIndex = 0; clickIndex < 5; clickIndex++) {
      await page.click('[data-testid="increment"]');
    }
    await expect(toolbarWidget(page)).toBeVisible();
    expect(await isReactScanActive(page)).toBe(true);
  });

  test("opening a panel leaves the toolbar compact", async ({ page }) => {
    const toolbarBox = await toolbarWidget(page).boundingBox();
    expect(toolbarBox).not.toBeNull();
    await expect(overlayPanel(page)).toBeHidden();

    await notificationsButton(page).click();
    await expect(overlayPanel(page)).toBeVisible();

    const openToolbarBox = await toolbarWidget(page).boundingBox();
    expect(openToolbarBox?.width).toBeCloseTo(toolbarBox?.width ?? 0, 0);
  });

  test("toolbar collapse state is persisted", async ({ page }) => {
    await page.getByTitle("Collapse React Scan").click();
    await expect(page.getByTitle("Expand React Scan")).toBeVisible();

    const state = await page.evaluate((key) => {
      const rawState = localStorage.getItem(key);
      return rawState ? JSON.parse(rawState) : null;
    }, LOCALSTORAGE_TOOLBAR_KEY);
    expect(state?.collapsed).toBe(true);
  });
});
