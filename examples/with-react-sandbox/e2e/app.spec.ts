import { test, expect } from './fixtures/base';

test.describe('with-react-sandbox example', () => {
  test('renders the shell with sandboxed app containers', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('#app1')).toBeVisible();
    await expect(page.locator('#app2')).toBeVisible();
  });

  test('displays sandbox heading', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('body')).toContainText('Sandbox Example');
  });
});
