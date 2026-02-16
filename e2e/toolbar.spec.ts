import { test, expect } from '@playwright/test';
import { gotoFixture, isReactScanActive, hasShadowRoot } from './helpers';

test.describe('Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFixture(page);
  });

  test('React Scan initializes and attaches to the page', async ({ page }) => {
    const active = await isReactScanActive(page);
    expect(active).toBe(true);
  });

  test('React Scan internals are accessible', async ({ page }) => {
    const hasInternals = await page.evaluate(() => {
      const scan = (window as any).__REACT_SCAN__;
      return (
        scan?.ReactScanInternals !== undefined &&
        scan.ReactScanInternals.options !== undefined &&
        scan.ReactScanInternals.Store !== undefined
      );
    });
    expect(hasInternals).toBe(true);
  });

  test('options are set correctly', async ({ page }) => {
    const options = await page.evaluate(() => {
      const scan = (window as any).__REACT_SCAN__;
      const opts = scan?.ReactScanInternals?.options?.value;
      if (!opts) return null;
      return {
        enabled: opts.enabled,
        dangerouslyForceRunInProduction: opts.dangerouslyForceRunInProduction,
        showToolbar: opts.showToolbar,
      };
    });
    expect(options).toEqual({
      enabled: true,
      dangerouslyForceRunInProduction: true,
      showToolbar: true,
    });
  });

  test('shadow DOM root is created', async ({ page }) => {
    await page.waitForTimeout(1000);
    expect(await hasShadowRoot(page)).toBe(true);
  });

  test('toolbar has content in shadow DOM', async ({ page }) => {
    await page.waitForTimeout(1000);
    const childCount = await page.evaluate(() => {
      const root = document.getElementById('react-scan-root');
      return root?.shadowRoot?.children.length ?? 0;
    });
    expect(childCount).toBeGreaterThan(0);
  });

  test('toolbar persists across interactions', async ({ page }) => {
    await page.click('[data-testid="increment"]');
    await page.waitForTimeout(500);

    const active = await isReactScanActive(page);
    expect(active).toBe(true);

    const options = await page.evaluate(() => {
      return (window as any).__REACT_SCAN__?.ReactScanInternals?.options?.value?.enabled;
    });
    expect(options).toBe(true);
  });
});
