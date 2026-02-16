import { type Page } from '@playwright/test';

export const FIXTURE_URL = '/?example=e2e-fixture';

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
