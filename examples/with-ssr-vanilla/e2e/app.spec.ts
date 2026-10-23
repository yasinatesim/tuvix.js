import { test, expect } from './fixtures/base';

test.describe('with-ssr-vanilla example', () => {
  // The page must be complete before any client JavaScript runs.
  test.use({ javaScriptEnabled: false });

  test('serves both fragments composed into the shell template', async ({
    page,
    consoleErrors,
  }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('text/html');

    await expect(page.locator('h1')).toHaveText('Dashboard SSR');
    await expect(
      page.locator('h2', { hasText: 'Left Service (Vanilla JS)' })
    ).toBeVisible();
    await expect(
      page.locator('h2', { hasText: 'Right Service (Vanilla JS)' })
    ).toBeVisible();
  });

  test('replaces every slot, fallback content included', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');

    await expect(page.locator('tuvix-slot')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('fallback');
  });
});
