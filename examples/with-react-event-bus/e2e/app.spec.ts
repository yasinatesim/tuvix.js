import { test, expect } from './fixtures/base';

test.describe('with-react-event-bus example', () => {
  test('mounts the header, sidebar and content apps', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');

    await expect(page.locator('#header')).toContainText('publishes user:login');
    await expect(page.locator('#sidebar')).toContainText('No events yet');
    await expect(page.locator('#content')).toContainText(
      'Pick a user from the header'
    );
  });

  test('an event emitted by the header updates both receivers', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');
    const loginAsBob = page.locator('#header button', {
      hasText: 'Login as Bob',
    });
    await expect(loginAsBob).toBeVisible();

    await loginAsBob.click();

    await expect(page.locator('#content h2')).toHaveText('Welcome, Bob!');
    await expect(page.locator('#content')).toContainText('User ID: 2');
    await expect(page.locator('#sidebar li')).toHaveCount(1);
    await expect(page.locator('#sidebar li').first()).toContainText('Bob');

    await page.locator('#header button', { hasText: 'Login as Alice' }).click();

    await expect(page.locator('#content h2')).toHaveText('Welcome, Alice!');
    await expect(page.locator('#sidebar li')).toHaveCount(2);
    await expect(page.locator('#sidebar li').first()).toContainText('Alice');
  });

  test('the shell orchestrator and the apps share one global bus', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');
    await expect(page.locator('#content')).toContainText(
      'Pick a user from the header'
    );

    // Emit from outside any app, through the bus stored on window.
    await page.evaluate(() => {
      const bus = (
        window as unknown as {
          __TUVIX_GLOBAL_BUS__?: { emit(e: string, d: unknown): void };
        }
      ).__TUVIX_GLOBAL_BUS__;
      if (!bus) throw new Error('global bus missing');
      bus.emit('user:login', { userId: 9, username: 'Dana', avatar: 'D' });
    });

    await expect(page.locator('#content h2')).toHaveText('Welcome, Dana!');
  });
});
