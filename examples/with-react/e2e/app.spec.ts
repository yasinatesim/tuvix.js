import { test, expect } from './fixtures/base';

test.describe('with-react example', () => {
  test('renders the shell and mounts micro apps', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('#app')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('displays navigation links', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('nav a')).toHaveCount(2);
  });
});
