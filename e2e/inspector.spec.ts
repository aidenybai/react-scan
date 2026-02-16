import { test, expect } from '@playwright/test';
import { gotoFixture } from './helpers';

test.describe('Inspector', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFixture(page);
  });

  test('inspect state is available in React Scan internals', async ({ page }) => {
    const hasInspectState = await page.evaluate(() => {
      const scan = (window as any).__REACT_SCAN__;
      if (!scan?.ReactScanInternals?.Store) return false;
      const inspectState = scan.ReactScanInternals.Store.inspectState;
      return inspectState !== undefined && inspectState !== null;
    });

    expect(hasInspectState).toBe(true);
  });

  test('inspect state starts as inspect-off', async ({ page }) => {
    const kind = await page.evaluate(() => {
      const scan = (window as any).__REACT_SCAN__;
      return scan?.ReactScanInternals?.Store?.inspectState?.value?.kind ?? null;
    });

    expect(kind).toBe('inspect-off');
  });

  test('shadow DOM contains toolbar elements', async ({ page }) => {
    const elementCount = await page.evaluate(() => {
      const root = document.getElementById('react-scan-root');
      return root?.shadowRoot?.querySelectorAll('*').length ?? 0;
    });
    expect(elementCount).toBeGreaterThan(5);
  });

  test('inspect state can be set programmatically', async ({ page }) => {
    const activated = await page.evaluate(() => {
      const scan = (window as any).__REACT_SCAN__;
      if (!scan?.ReactScanInternals?.Store?.inspectState) return false;
      scan.ReactScanInternals.Store.inspectState.value = { kind: 'focused', focusedDomElement: null };
      return scan.ReactScanInternals.Store.inspectState.value.kind === 'focused';
    });

    expect(activated).toBe(true);
  });
});
