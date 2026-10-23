import { test, expect } from './fixtures/base';

test.describe('with-module-federation-react example', () => {
  test('mounts both webpack remotes into the Vite shell', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');

    await expect(page.locator('#remote1-container h2')).toHaveText('Remote 1');
    await expect(page.locator('#remote2-container h2')).toHaveText('Remote 2');
    await expect(page.locator('#remote1-container')).toContainText(
      'localhost:3001'
    );
    await expect(page.locator('#remote2-container')).toContainText(
      'localhost:3002'
    );
  });

  test('each remote entry script loads once', async ({
    page,
    consoleErrors,
  }) => {
    const remoteEntries: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('/remoteEntry.js'))
        remoteEntries.push(request.url());
    });

    await page.goto('/');
    await expect(page.locator('#remote2-container h2')).toHaveText('Remote 2');

    expect(remoteEntries.sort()).toEqual([
      'http://localhost:3001/remoteEntry.js',
      'http://localhost:3002/remoteEntry.js',
    ]);
  });

  test('a remote that fails to load shows its fallback and leaves the other running', async ({
    page,
  }) => {
    await page.route('http://localhost:3002/remoteEntry.js', (route) =>
      route.abort()
    );
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    await expect(page.locator('#remote1-container h2')).toHaveText('Remote 1');
    await expect(page.locator('#remote2-container')).toHaveText(
      'Remote 2 is unavailable.',
      {
        timeout: 45_000,
      }
    );
    expect(
      errors.some((text) => text.includes('[Shell] App "remote2" failed'))
    ).toBe(true);
  });
});
