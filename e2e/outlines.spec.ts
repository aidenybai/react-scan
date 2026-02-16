import { test, expect, type Page } from '@playwright/test';
import { gotoFixture, getRenderCount } from './helpers';

async function clickAndCountRenders(
  page: Page,
  selector: string,
  waitMs = 1000,
): Promise<number> {
  await page.evaluate(() => {
    (window as any).__E2E_RENDER_COUNT__ = 0;
  });
  await page.click(selector);
  await page.waitForTimeout(waitMs);
  return getRenderCount(page);
}

test.describe('Render Outlines', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFixture(page);
  });

  test('state update triggers render tracking', async ({ page }) => {
    const count = await clickAndCountRenders(page, '[data-testid="increment"]');
    expect(count).toBeGreaterThan(0);
  });

  test('rapid updates produce multiple tracked renders', async ({ page }) => {
    const count = await clickAndCountRenders(page, '[data-testid="trigger-rapid"]', 2000);
    expect(count).toBeGreaterThan(5);
  });

  test('outline canvas exists on the page', async ({ page }) => {
    const hasCanvas = await page.evaluate(() => {
      return document.querySelectorAll('canvas').length > 0;
    });
    expect(hasCanvas).toBe(true);
  });

  test('context change triggers render tracking', async ({ page }) => {
    const count = await clickAndCountRenders(page, '[data-testid="toggle-theme"]');
    expect(count).toBeGreaterThan(0);
  });

  test('unstable props on memo components trigger render tracking', async ({ page }) => {
    const count = await clickAndCountRenders(page, '[data-testid="trigger-unstable"]');
    expect(count).toBeGreaterThan(0);
  });

  test('render count accumulates with repeated clicks', async ({ page }) => {
    await page.evaluate(() => { (window as any).__E2E_RENDER_COUNT__ = 0; });

    await page.click('[data-testid="increment"]');
    await page.waitForTimeout(300);
    const after1 = await getRenderCount(page);

    await page.click('[data-testid="increment"]');
    await page.waitForTimeout(300);
    const after2 = await getRenderCount(page);

    await page.click('[data-testid="increment"]');
    await page.waitForTimeout(300);
    const after3 = await getRenderCount(page);

    expect(after1).toBeGreaterThan(0);
    expect(after2).toBeGreaterThan(after1);
    expect(after3).toBeGreaterThan(after2);
  });
});
