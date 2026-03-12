import { test, expect } from './fixtures/base';

test.describe('with-vue example', () => {
  test('renders the shell with home and profile containers', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('#home')).toBeVisible();
    await expect(page.locator('#profile')).toBeVisible();
  });

  test('displays the framework label', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('body')).toContainText('Vue 3');
  });
});
