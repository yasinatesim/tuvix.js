import { test, expect } from './fixtures/base';

test.describe('with-vue example', () => {
  test('mounts both apps and passes the shell props', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');

    await expect(page.locator('#home h2')).toHaveText('Home App');
    await expect(page.getByTestId('home-greeting')).toContainText(
      'Hello, Alice'
    );
    await expect(page.locator('#profile h2')).toHaveText('Profile App');
    await expect(page.getByTestId('profile-theme')).toHaveText(
      'Theme prop: dark'
    );
  });

  test('the home app reacts to clicks', async ({ page, consoleErrors }) => {
    await page.goto('/');
    const counter = page.getByTestId('home-counter');
    await expect(counter).toHaveText('Clicked 0 times');

    await counter.click();
    await counter.click();

    await expect(counter).toHaveText('Clicked 2 times');
  });

  test('each adapter emits tuvix:mounted for its app', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');
    await expect(page.locator('#profile h2')).toHaveText('Profile App');

    const mounted = await page.evaluate(() => {
      const runtime = (
        window as unknown as {
          __TUVIX_RUNTIME__?: { mounted: Map<string, unknown> };
        }
      ).__TUVIX_RUNTIME__;
      return Array.from(runtime?.mounted.keys() ?? []).sort();
    });
    expect(mounted).toEqual(['home', 'profile']);
  });
});
