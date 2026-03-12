import { test, expect } from './fixtures/base';

test.describe('with-multiple-frameworks example', () => {
  test('renders both React and Vue app containers', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('#react-app')).toBeVisible();
    await expect(page.locator('#vue-app')).toBeVisible();
  });

  test('displays the polyglot heading', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('body')).toContainText('React + Vue 3 Together');
  });
});
