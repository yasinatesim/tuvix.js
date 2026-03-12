import { test, expect } from './fixtures/base';

test.describe('with-react-event-bus example', () => {
  test('renders the shell layout containers', async ({ page, consoleErrors }) => {
    await page.goto('/');

    await expect(page.locator('#header')).toBeVisible();
    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('#content')).toBeVisible();
  });
});
