import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import {
  FIXTURE_URL,
  TOOLBAR_SELECTORS,
  enterInspectMode,
  focusComponent,
  getInspectStateKind,
  getRenderCount,
  gotoFixture,
  inspectButton,
  notificationsButton,
  overlayPanel,
  toolbarWidget,
  waitForInspectStateKind,
  waitForToolbarReady,
} from "./helpers";

const TOOLBAR_STATE_KEY = "react-scan-toolbar-state-v1";
const WIDGET_SETTINGS_KEY = "react-scan-widget-settings-v2";
const AUDIO_NOTIFICATIONS_KEY = "react-scan-notifications-audio";
const SLOWDOWN_CAPTURE_WAIT_MS = 1_500;
const SNAP_ANIMATION_WAIT_MS = 500;
const PANEL_RESIZE_DISTANCE_PX = 80;

const openFocusedInspector = async (page: Page): Promise<void> => {
  await enterInspectMode(page);
  await focusComponent(page, '[data-testid="increment"]');
};

const recordSlowdownAndOpenNotifications = async (page: Page): Promise<void> => {
  await page.getByTestId("trigger-slow").click();
  await page.waitForTimeout(SLOWDOWN_CAPTURE_WAIT_MS);
  await notificationsButton(page).click();
  await expect(page.locator(`${TOOLBAR_SELECTORS.panel} >> text=History`).first()).toBeVisible();
  await expect
    .poll(async () => page.locator(`${TOOLBAR_SELECTORS.panel} >> text=No Events`).count())
    .toBe(0);
};

const selectFirstSlowdown = async (page: Page): Promise<void> => {
  const slowdownButton = overlayPanel(page).locator("button").filter({ hasText: /\d+ms/ }).first();
  await expect(slowdownButton).toBeVisible();
  await slowdownButton.click();
  await expect(overlayPanel(page).getByText("Ranked", { exact: true })).toBeVisible();
};

test.describe("Comprehensive toolbar interactions", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFixture(page);
    await waitForToolbarReady(page);
  });

  test("shows delayed tooltips for toolbar controls", async ({ page }) => {
    await inspectButton(page).hover();
    await expect(
      toolbarWidget(page).locator("div.pointer-events-none").filter({ hasText: "Inspect element" }),
    ).toBeVisible();

    await notificationsButton(page).hover();
    await expect(
      toolbarWidget(page).locator("div.pointer-events-none").filter({ hasText: "Notifications" }),
    ).toBeVisible();
  });

  test("keeps expanded and collapsed toolbar surfaces rounded", async ({ page }) => {
    const expandedSurface = toolbarWidget(page).locator(":scope > div").first();
    await expect
      .poll(() => expandedSurface.evaluate((element) => getComputedStyle(element).borderRadius))
      .not.toBe("0px");
    await expect
      .poll(() =>
        toolbarWidget(page).evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe("rgba(0, 0, 0, 0)");

    await page.getByTitle("Collapse React Scan").click();
    const collapsedSurface = page.getByTitle("Expand React Scan");
    await expect
      .poll(() => collapsedSurface.evaluate((element) => getComputedStyle(element).borderRadius))
      .not.toBe("0px");
  });

  test("collapses, expands, and restores collapse state after reload", async ({ page }) => {
    await page.getByTitle("Collapse React Scan").click();
    await expect(page.getByTitle("Expand React Scan")).toBeVisible();

    await page.reload();
    await expect(page.getByTitle("Expand React Scan")).toBeVisible();
    await page.getByTitle("Expand React Scan").click();
    await expect(page.getByTitle("Collapse React Scan")).toBeVisible();

    const collapsed = await page.evaluate((storageKey) => {
      const storedValue = localStorage.getItem(storageKey);
      return storedValue ? JSON.parse(storedValue).collapsed : null;
    }, TOOLBAR_STATE_KEY);
    expect(collapsed).toBe(false);
  });

  test("drags, snaps, persists, and restores the toolbar edge", async ({ page }) => {
    const toolbarBounds = await toolbarWidget(page).boundingBox();
    const viewport = page.viewportSize();
    expect(toolbarBounds).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (!toolbarBounds || !viewport) return;

    await page.mouse.move(toolbarBounds.x + 10, toolbarBounds.y + toolbarBounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(4, viewport.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(SNAP_ANIMATION_WAIT_MS);

    await expect
      .poll(() =>
        page.evaluate((storageKey) => {
          const storedValue = localStorage.getItem(storageKey);
          return storedValue ? JSON.parse(storedValue).edge : null;
        }, TOOLBAR_STATE_KEY),
      )
      .toBe("left");

    await page.reload();
    await waitForToolbarReady(page);
    await expect
      .poll(async () => (await toolbarWidget(page).boundingBox())?.x ?? Infinity)
      .toBeLessThan(30);
  });

  test("maximizes and restores panel width from the resize handle", async ({ page }) => {
    await notificationsButton(page).click();
    const initialBounds = await overlayPanel(page).boundingBox();
    expect(initialBounds).not.toBeNull();
    if (!initialBounds) return;

    const leftResizeHandle = overlayPanel(page).locator(".resize-left");
    await leftResizeHandle.dblclick({ force: true });
    await expect
      .poll(async () => (await overlayPanel(page).boundingBox())?.width ?? 0)
      .toBeGreaterThan(initialBounds.width);

    const isFullWidth = await page.evaluate((storageKey) => {
      const storedValue = localStorage.getItem(storageKey);
      return storedValue ? Boolean(JSON.parse(storedValue).dimensions?.isFullWidth) : false;
    }, WIDGET_SETTINGS_KEY);
    expect(isFullWidth).toBe(true);

    await page.waitForTimeout(SNAP_ANIMATION_WAIT_MS);
    const maximizedBounds = await overlayPanel(page).boundingBox();
    await leftResizeHandle.dispatchEvent("dblclick");
    await expect
      .poll(async () => (await overlayPanel(page).boundingBox())?.width ?? Infinity)
      .toBeLessThan(maximizedBounds?.width ?? Infinity);
  });

  test("resizes with a pointer drag while preserving rounded corners", async ({ page }) => {
    await notificationsButton(page).click();
    const panel = overlayPanel(page);
    const panelContent = panel.locator(".react-scan-panel-content");
    const topResizeHandle = panel.locator(".resize-top");
    const initialPanelBounds = await panel.boundingBox();
    const handleBounds = await topResizeHandle.boundingBox();
    expect(initialPanelBounds).not.toBeNull();
    expect(handleBounds).not.toBeNull();
    if (!initialPanelBounds || !handleBounds) return;

    expect(handleBounds.y).toBeLessThan(initialPanelBounds.y);
    const initialBorderRadius = await panelContent.evaluate(
      (element) => getComputedStyle(element).borderRadius,
    );
    expect(initialBorderRadius).not.toBe("0px");

    const handleCenterX = handleBounds.x + handleBounds.width / 2;
    const handleCenterY = handleBounds.y + handleBounds.height / 2;
    await page.mouse.move(handleCenterX, handleCenterY);
    await page.mouse.down();
    await page.mouse.move(handleCenterX, handleCenterY - PANEL_RESIZE_DISTANCE_PX);
    await page.mouse.up();

    await expect
      .poll(async () => (await panel.boundingBox())?.height ?? 0)
      .toBeGreaterThan(initialPanelBounds.height);

    const leftResizeHandle = panel.locator(".resize-left");
    const leftHandleBounds = await leftResizeHandle.boundingBox();
    expect(leftHandleBounds).not.toBeNull();
    if (!leftHandleBounds) return;
    const leftHandleCenterX = leftHandleBounds.x + leftHandleBounds.width / 2;
    const leftHandleCenterY = leftHandleBounds.y + leftHandleBounds.height / 2;
    await page.mouse.move(leftHandleCenterX, leftHandleCenterY);
    await page.mouse.down();
    await page.mouse.move(leftHandleCenterX - PANEL_RESIZE_DISTANCE_PX, leftHandleCenterY);
    await page.mouse.up();

    await expect
      .poll(async () => (await panel.boundingBox())?.width ?? 0)
      .toBeGreaterThan(initialPanelBounds.width);
    await expect
      .poll(() => panelContent.evaluate((element) => getComputedStyle(element).borderRadius))
      .toBe(initialBorderRadius);
  });

  test("tracks host light and dark theme markers", async ({ page }) => {
    const root = page.locator(TOOLBAR_SELECTORS.root);
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
    await expect(root).toHaveAttribute("data-react-scan-theme", "light");

    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    });
    await expect(root).toHaveAttribute("data-react-scan-theme", "dark");
  });

  test("disposes and recreates the toolbar through public options", async ({ page }) => {
    await page.getByTestId("hide-toolbar").click();
    await expect(page.locator(TOOLBAR_SELECTORS.root)).toHaveCount(0);

    await page.getByTestId("show-toolbar").click();
    await waitForToolbarReady(page);
    await expect(page.locator(TOOLBAR_SELECTORS.root)).toHaveCount(1);
  });
});

test.describe("Comprehensive inspector interactions", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFixture(page);
    await waitForToolbarReady(page);
  });

  test("copies a focused element and closes after feedback", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openFocusedInspector(page);

    await page.locator('.react-scan-close-button[title^="Copy element"]').dispatchEvent("click");
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain("Counter");
    await waitForInspectStateKind(page, "inspect-off");
  });

  test("copies with the keyboard shortcut", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openFocusedInspector(page);

    await page.keyboard.press("ControlOrMeta+C");
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain("Counter");
  });

  test("searches component names and navigates matches", async ({ page }) => {
    await openFocusedInspector(page);
    const searchInput = page.locator('input[placeholder="Component name, /regex/, or [type]"]');

    await searchInput.fill("Counter");
    await expect(page.locator(".react-scan-components-tree").getByText(/\d+\|\d+/)).toBeVisible();
    await searchInput.press("Enter");
    await searchInput.press("Shift+Enter");
    await searchInput.press("Control+Enter");
    expect(await getInspectStateKind(page)).toBe("focused");

    await inspectButton(page).dispatchEvent("click");
    await waitForInspectStateKind(page, "inspecting");
    await focusComponent(page, '[data-testid="memo-child"]');
    await searchInput.fill("[memo]");
    await expect(page.locator(".react-scan-components-tree").getByText(/\d+\|\d+/)).toBeVisible();
    await searchInput.press("Control+Enter");
    await expect(page.locator(".react-scan-header span[title*='MemoChild']")).toBeVisible();
  });

  test("keeps copy shortcuts scoped away from search input", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openFocusedInspector(page);
    const searchInput = page.locator('input[placeholder="Component name, /regex/, or [type]"]');
    await searchInput.fill("Counter");
    await searchInput.focus();

    await page.keyboard.press("ControlOrMeta+C");
    expect(await getInspectStateKind(page)).toBe("focused");
    await expect(searchInput).toBeFocused();
  });

  test("shows prop changes after a focused memo component rerenders", async ({ page }) => {
    await enterInspectMode(page);
    await focusComponent(page, '[data-testid="memo-child"]');
    await page.getByTestId("trigger-unstable").dispatchEvent("click");

    await expect(
      page.locator(TOOLBAR_SELECTORS.inspectorPanel).getByText("Changed Props", { exact: true }),
    ).toBeVisible();
  });
});

test.describe("Comprehensive notification interactions", () => {
  test.beforeEach(async ({ page }) => {
    await gotoFixture(page);
    await waitForToolbarReady(page);
  });

  test("toggles and restores audio alerts", async ({ page }) => {
    await notificationsButton(page).click();
    const enableAudioButton = overlayPanel(page).getByRole("button", {
      name: "Enable audio alerts",
    });
    await enableAudioButton.click();
    await expect(
      overlayPanel(page).getByRole("button", {
        name: "Disable audio alerts",
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        (storageKey) => localStorage.getItem(storageKey),
        AUDIO_NOTIFICATIONS_KEY,
      ),
    ).toBe("true");

    await page.reload();
    await waitForToolbarReady(page);
    await notificationsButton(page).click();
    const disableAudioButton = overlayPanel(page).getByRole("button", {
      name: "Disable audio alerts",
    });
    await disableAudioButton.click();
    expect(
      await page.evaluate(
        (storageKey) => localStorage.getItem(storageKey),
        AUDIO_NOTIFICATIONS_KEY,
      ),
    ).toBe("false");
  });

  test("selects a slowdown and switches visualization routes", async ({ page }) => {
    await recordSlowdownAndOpenNotifications(page);
    await selectFirstSlowdown(page);

    await overlayPanel(page).getByText("Overview", { exact: true }).click();
    await expect(page.locator("#overview-scroll-container")).toBeVisible();
    await expect(page.locator('[id^="react-scan-overview-bar-"]').first()).toBeVisible();

    await overlayPanel(page).getByText("Ranked", { exact: true }).click();
    await expect(overlayPanel(page).getByText("Ranked", { exact: true })).toBeVisible();
  });

  test("opens render explanations and returns to ranked renders", async ({ page }) => {
    await recordSlowdownAndOpenNotifications(page);
    await selectFirstSlowdown(page);

    const renderBar = overlayPanel(page).locator('button[class*="w-[90%]"]').first();
    await expect(renderBar).toBeVisible();
    await renderBar.click();
    await expect(
      overlayPanel(page).getByText(/No changes detected|How to stop renders/),
    ).toBeVisible();

    await overlayPanel(page).getByRole("button", { name: "Overview" }).last().click();
    await expect(overlayPanel(page).getByText("Ranked", { exact: true })).toBeVisible();
  });

  test("groups and expands repeated keyboard slowdowns", async ({ page }) => {
    await page.getByTestId("slow-input").pressSequentially("abc");
    await page.waitForTimeout(SLOWDOWN_CAPTURE_WAIT_MS);
    await notificationsButton(page).click();

    const collapsedKeyboardEvent = overlayPanel(page)
      .locator("button")
      .filter({ hasText: "SlowInput" })
      .first();
    await expect(collapsedKeyboardEvent).toContainText(/x[2-9]\d*/);
    const collapsedEventText = await collapsedKeyboardEvent.textContent();
    const groupedEventCount = Number(collapsedEventText?.match(/x(\d+)/)?.[1]);
    await collapsedKeyboardEvent.click();
    await expect(overlayPanel(page).locator("button").filter({ hasText: /\d+ms/ })).toHaveCount(
      groupedEventCount,
    );
  });

  test("clears slowdown history and resets selected details", async ({ page }) => {
    await recordSlowdownAndOpenNotifications(page);
    await selectFirstSlowdown(page);

    await overlayPanel(page).getByTitle("Clear all events").click();
    await expect(overlayPanel(page).getByText("No Events")).toBeVisible();
    await expect(overlayPanel(page).getByText(/Scanning for slowdowns/)).toBeVisible();
  });

  test("closes notifications from a selected event header", async ({ page }) => {
    await recordSlowdownAndOpenNotifications(page);
    await selectFirstSlowdown(page);

    await overlayPanel(page).getByTitle("Close").click();
    await expect(overlayPanel(page)).toBeHidden();
    await expect(notificationsButton(page)).toHaveAttribute("aria-pressed", "false");
  });
});

test("renders outlines on the main thread when workers are disabled", async ({ page }) => {
  await gotoFixture(page, `${FIXTURE_URL}&outlines=main-thread`);
  await waitForToolbarReady(page);

  expect(
    await page.evaluate(
      () => window.__REACT_SCAN__?.ReactScanInternals?.options?.value?.useOffscreenCanvasWorker,
    ),
  ).toBe(false);
  await page.getByTestId("increment").click();
  await expect.poll(() => getRenderCount(page)).toBeGreaterThan(0);
  await expect(page.locator("canvas").first()).toBeAttached();
});
