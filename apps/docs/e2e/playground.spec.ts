import { test, expect } from '@playwright/test';

test.describe('Live Playground', () => {
  test('renders vanilla micro-app output', async ({ page }) => {
    await page.goto('/docs/getting-started');
    const frame = page.frameLocator('iframe[title="Live Preview"]');
    await expect(frame.locator('#app h1')).toContainText('Hello Tuvix!', { timeout: 15_000 });
  });

  test('console area is visible', async ({ page }) => {
    await page.goto('/docs/getting-started');
    await expect(page.locator('iframe[title="Live Preview"]')).toBeVisible();
  });
});
