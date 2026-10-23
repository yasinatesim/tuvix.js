import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/base';

async function markDocument(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { __noReload: boolean }).__noReload = true;
  });
}

async function isSameDocument(page: Page): Promise<boolean> {
  return page.evaluate(
    () => (window as unknown as { __noReload?: boolean }).__noReload === true
  );
}

test.describe('with-react-router example', () => {
  test('redirects / to /dashboard and mounts the dashboard app', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('#app h1')).toContainText('Dashboard');
    await expect(page.locator('nav a[aria-current="page"]')).toContainText(
      'Dashboard'
    );
  });

  test('clicking nav links mounts the matching app without a full reload', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/dashboard');
    await expect(page.locator('#app h1')).toContainText('Dashboard');
    await markDocument(page);

    await page.locator('nav a', { hasText: 'Profile' }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator('#app h1')).toHaveText('Profile');
    await expect(page.locator('#app')).not.toContainText('Revenue');
    await expect(page.locator('nav a[aria-current="page"]')).toContainText(
      'Profile'
    );

    await page.locator('nav a', { hasText: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.locator('#app h1')).toContainText('Settings');
    // Only one app owns the shared container at a time.
    await expect(page.locator('#app > *')).toHaveCount(1);

    expect(await isSameDocument(page)).toBe(true);
  });

  test('back and forward re-mount the previous app', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/dashboard');
    await expect(page.locator('#app h1')).toContainText('Dashboard');
    await markDocument(page);

    await page.locator('nav a', { hasText: 'Settings' }).click();
    await expect(page.locator('#app h1')).toContainText('Settings');

    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('#app h1')).toContainText('Dashboard');

    await page.goForward();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.locator('#app h1')).toContainText('Settings');

    expect(await isSameDocument(page)).toBe(true);
  });

  test('settings app state works after a client-side navigation', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/dashboard');
    await page.locator('nav a', { hasText: 'Settings' }).click();

    const themeToggle = page.locator('#app button').first();
    await expect(themeToggle).toHaveText('dark');
    await themeToggle.click();
    await expect(themeToggle).toHaveText('light');
  });

  test('a direct load of a deep path mounts that app', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/profile');

    await expect(page.locator('#app h1')).toHaveText('Profile');
  });
});
