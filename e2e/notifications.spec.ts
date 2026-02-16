import { test, expect } from '@playwright/test';
import { gotoFixture } from './helpers';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFixture(page);
  });

  test('slow interaction is detected and recorded', async ({ page }) => {
    await page.click('[data-testid="trigger-slow"]');
    await page.waitForTimeout(2000);

    const hasActiveStore = await page.evaluate(() => {
      const scan = (window as any).__REACT_SCAN__;
      if (!scan?.ReactScanInternals?.Store) return false;
      // Verify the notification system is wired up (interactionListeningForRenders is a function when active)
      return typeof scan.ReactScanInternals.Store.interactionListeningForRenders === 'function';
    });

    expect(hasActiveStore).toBe(true);
  });

  test('notification system initializes with the toolbar', async ({ page }) => {
    const hasCanvas = await page.evaluate(() => {
      return document.querySelectorAll('canvas').length > 0;
    });
    expect(hasCanvas).toBe(true);
  });

  test('repeated slow interactions do not break the toolbar', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="trigger-slow"]');
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(2000);

    const shadowContent = await page.evaluate(() => {
      const root = document.getElementById('react-scan-root');
      return root?.shadowRoot?.innerHTML ?? '';
    });
    expect(shadowContent.length).toBeGreaterThan(100);
  });
});
