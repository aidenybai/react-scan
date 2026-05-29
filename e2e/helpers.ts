import { type Locator, type Page } from '@playwright/test';

export const FIXTURE_URL = '/?example=e2e-fixture';

export const TOOLBAR_SELECTORS = {
  root: '#react-scan-root',
  widget: '#react-scan-toolbar',
  inspectButton: '#react-scan-inspect-element',
  notificationsButton: '#react-scan-notifications',
  outlineToggle: '.react-scan-toggle input[type="checkbox"]',
  closeButton: '.react-scan-close-button[title="Close"]',
  inspectorPanel: '.react-scan-inspector',
  overlayCanvas: 'canvas.react-scan-inspector-overlay',
} as const;

export type InspectStateKind =
  | 'uninitialized'
  | 'inspect-off'
  | 'inspecting'
  | 'focused';

export async function gotoFixture(page: Page): Promise<void> {
  await page.goto(FIXTURE_URL);
  await page.waitForSelector('[data-testid="heading"]', { timeout: 10_000 });
  // Wait for React Scan to boot and expose __REACT_SCAN__
  await page.waitForFunction(
    () => typeof (window as any).__REACT_SCAN__?.ReactScanInternals !== 'undefined',
    { timeout: 15_000 },
  );
  // Install a render counter by patching the onRender option on the signal
  await page.evaluate(() => {
    (window as any).__E2E_RENDER_COUNT__ = 0;
    const internals = (window as any).__REACT_SCAN__?.ReactScanInternals;
    if (internals?.options) {
      const prev = internals.options.value;
      const prevOnRender = prev.onRender;
      internals.options.value = {
        ...prev,
        onRender: (...args: any[]) => {
          (window as any).__E2E_RENDER_COUNT__++;
          if (prevOnRender) prevOnRender(...args);
        },
      };
    }
  });
  // Wait for initial mount renders to settle then reset
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    (window as any).__E2E_RENDER_COUNT__ = 0;
  });
}

export async function getRenderCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as any).__E2E_RENDER_COUNT__ ?? 0);
}

export async function waitForRenders(
  page: Page,
  timeout = 5000,
): Promise<number> {
  const startCount = await getRenderCount(page);
  return page.evaluate(
    ({ start, t }) => {
      return new Promise<number>((resolve) => {
        const check = () => {
          const current = (window as any).__E2E_RENDER_COUNT__ ?? 0;
          if (current > start) {
            resolve(current - start);
            return true;
          }
          return false;
        };
        if (check()) return;
        const interval = setInterval(() => {
          if (check()) clearInterval(interval);
        }, 50);
        setTimeout(() => {
          clearInterval(interval);
          resolve(0);
        }, t);
      });
    },
    { start: startCount, t: timeout },
  );
}

export async function isReactScanActive(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return typeof (window as any).__REACT_SCAN__ !== 'undefined';
  });
}

export async function hasShadowRoot(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return document.getElementById('react-scan-root')?.shadowRoot != null;
  });
}

export async function getInspectStateKind(
  page: Page,
): Promise<InspectStateKind | null> {
  return page.evaluate(() => {
    const scan = (window as any).__REACT_SCAN__;
    return scan?.ReactScanInternals?.Store?.inspectState?.value?.kind ?? null;
  });
}

export async function waitForInspectStateKind(
  page: Page,
  expectedKind: InspectStateKind,
  timeout = 5000,
): Promise<void> {
  await page.waitForFunction(
    (kind) => {
      const scan = (window as any).__REACT_SCAN__;
      return (
        scan?.ReactScanInternals?.Store?.inspectState?.value?.kind === kind
      );
    },
    expectedKind,
    { timeout },
  );
}

export async function isOutlineInstrumentationPaused(
  page: Page,
): Promise<boolean | null> {
  return page.evaluate(() => {
    const scan = (window as any).__REACT_SCAN__;
    const instrumentation = scan?.ReactScanInternals?.instrumentation;
    return instrumentation?.isPaused?.value ?? null;
  });
}

// The overlay UI is mounted inside an open shadow root; Playwright CSS
// locators pierce open shadow roots automatically, so plain selectors work.
export function toolbarWidget(page: Page): Locator {
  return page.locator(TOOLBAR_SELECTORS.widget);
}

export function inspectButton(page: Page): Locator {
  return page.locator(TOOLBAR_SELECTORS.inspectButton);
}

export function notificationsButton(page: Page): Locator {
  return page.locator(TOOLBAR_SELECTORS.notificationsButton);
}

export function outlineToggle(page: Page): Locator {
  return page.locator(TOOLBAR_SELECTORS.outlineToggle);
}

export async function waitForToolbarReady(page: Page): Promise<void> {
  await inspectButton(page).waitFor({ state: 'visible', timeout: 10_000 });
}

// When the widget is expanded, the absolutely-positioned resize handles sit on
// top of the toolbar controls and swallow coordinate-based pointer events.
// Dispatching the click directly on the control drives its handler regardless
// of layering, which is what we want when asserting control behavior.
export async function clickToolbarControl(locator: Locator): Promise<void> {
  await locator.dispatchEvent('click');
}

// The overlay buttons live in the shadow root, so clicking them makes the
// shadow host the document's active element. Blurring restores focus to the
// page, matching the scenario the global Escape shortcut is meant for.
export async function blurOverlay(page: Page): Promise<void> {
  await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    active?.blur();
  });
}

export async function enterInspectMode(page: Page): Promise<void> {
  await waitForToolbarReady(page);
  await inspectButton(page).click();
  await waitForInspectStateKind(page, 'inspecting');
}

export async function focusComponent(
  page: Page,
  targetSelector: string,
): Promise<void> {
  // While inspecting, the overlay event-catcher covers the page, so the
  // standard element-targeted click fails Playwright actionability checks.
  // Drive raw pointer coordinates instead: the overlay resolves the element
  // under the cursor on pointermove (throttled at 32ms) and locks focus on
  // click. Two nudged moves defeat the throttle's leading-edge gate.
  const box = await page.locator(targetSelector).boundingBox();
  if (!box) {
    throw new Error(`Target ${targetSelector} has no bounding box`);
  }
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  await page.mouse.move(centerX, centerY);
  await page.waitForTimeout(40);
  await page.mouse.move(centerX + 1, centerY + 1);
  await page.waitForTimeout(40);
  await page.mouse.click(centerX, centerY);
  await waitForInspectStateKind(page, 'focused');
}
