import { test, expect } from './fixtures/base';

test.describe('with-multiple-frameworks example', () => {
  test('mounts a React app and a Vue app on the same page', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');

    await expect(page.locator('#react-app h2')).toHaveText('React Micro App');
    await expect(page.locator('#vue-app h2')).toHaveText('Vue 3 Micro App');
  });

  test('a click in the React app reaches the Vue app over the global bus', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');
    const received = page.getByTestId('vue-received');
    await expect(received).toHaveText('Clicks received from React: 0');

    await page.getByTestId('react-send').click();
    await page.getByTestId('react-send').click();

    await expect(page.getByTestId('react-send')).toHaveText(
      'Send click to Vue (2)'
    );
    await expect(received).toHaveText('Clicks received from React: 2');
  });
});
