import { test, expect } from './fixtures/base';

test.describe('with-react-router example', () => {
  test('renders the shell with navigation and app container', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('#app')).toBeVisible();
  });

  test('displays navigation links for all routes', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('nav')).toContainText('Dashboard');
    await expect(page.locator('nav')).toContainText('Profile');
    await expect(page.locator('nav')).toContainText('Settings');
  });
});
