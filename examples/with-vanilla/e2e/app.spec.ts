import { test, expect } from './fixtures/base';

test.describe('with-vanilla example', () => {
  test('redirects / to /home and renders shell props', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.locator('#app h1')).toHaveText('🏠 Home');
    await expect(page.getByTestId('home-user')).toHaveText('Alice');
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
    await expect(page.locator('#app')).not.toContainText('Welcome');

    await page.locator('nav a', { hasText: 'Home' }).click();
    await expect(page.locator('#app h1')).toHaveText('🏠 Home');

    const sameDocument = await page.evaluate(
      () => (window as unknown as { __noReload?: boolean }).__noReload === true
    );
    expect(sameDocument).toBe(true);
  });

  test('defineMicroApp apps report tuvix:mounted and tuvix:unmounted', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/home');
    await expect(page.locator('#app h1')).toHaveText('🏠 Home');

    const mountedNames = () =>
      page.evaluate(() => {
        const runtime = (
          window as unknown as {
            __TUVIX_RUNTIME__?: { mounted: Map<string, unknown> };
          }
        ).__TUVIX_RUNTIME__;
        return Array.from(runtime?.mounted.keys() ?? []).sort();
      });
    expect(await mountedNames()).toEqual(['home']);

    await page.locator('nav a', { hasText: 'About' }).click();
    await expect(page.locator('#app h1')).toHaveText('ℹ️ About');
    await expect.poll(mountedNames).toEqual(['about']);
  });
});
