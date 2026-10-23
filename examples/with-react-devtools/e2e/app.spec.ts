import { test, expect } from './fixtures/base';

test.describe('with-react-devtools example', () => {
  test('mounts both apps with their shell props', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');

    await expect(page.locator('#app1 h2')).toHaveText('Left App');
    await expect(page.locator('#app2 h2')).toHaveText('Right App');
  });

  test('the panel lists both apps as mounted', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');

    const apps = page.locator('#tuvix-dt-apps');
    await expect(apps).toContainText('🟢 app1');
    await expect(apps).toContainText('🟢 app2');
  });

  test('the panel logs events emitted on the shared bus', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');
    await expect(page.locator('#app1 h2')).toHaveText('Left App');

    await page.locator('#app1 button', { hasText: 'Emit app1:ping' }).click();

    await expect(page.locator('#tuvix-dt-events')).toContainText('app1:ping');
  });

  test('the toggle button hides and shows the panel', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');
    const panel = page.locator('#tuvix-dt-panel');
    await expect(panel).toBeVisible();

    await page.locator('#tuvix-dt-toggle').click();
    await expect(panel).toBeHidden();

    await page.locator('#tuvix-dt-toggle').click();
    await expect(panel).toBeVisible();
  });
});
