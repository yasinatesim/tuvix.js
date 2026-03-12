import { test, expect } from './fixtures/base';

test.describe('with-react-devtools example', () => {
  test('renders the shell with app containers', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('#app1')).toBeVisible();
    await expect(page.locator('#app2')).toBeVisible();
  });

  test('displays devtools heading', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('body')).toContainText('DevTools Integration');
  });
});
