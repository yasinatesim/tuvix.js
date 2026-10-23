import { test, expect } from './fixtures/base';

test.describe('with-react example', () => {
  test('redirects / to /home and mounts the home app with shell props', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.locator('#app')).toContainText('Welcome, Alice!');
    await expect(page.locator('#app')).toContainText('theme="dark"');
  });

  test('nav links swap apps without a full page load', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/home');
    await expect(page.locator('#app h1')).toHaveText('🏠 Home');
    await page.evaluate(() => {
      (window as unknown as { __noReload: boolean }).__noReload = true;
    });

    await page.locator('nav a', { hasText: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('#app h1')).toHaveText('ℹ️ About');
    await expect(page.locator('#app')).not.toContainText('Welcome, Alice!');

    await page.goBack();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.locator('#app h1')).toHaveText('🏠 Home');

    const sameDocument = await page.evaluate(
      () => (window as unknown as { __noReload?: boolean }).__noReload === true
    );
    expect(sameDocument).toBe(true);
  });
});
