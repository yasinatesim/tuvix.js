import { test, expect } from './fixtures/base';

const LIGHT_BLUE = 'rgb(147, 197, 253)'; // page rule: p { color: #93c5fd }
const RED = 'rgb(240, 84, 84)'; // app1 rule inside its shadow root
const ORANGE = 'rgb(242, 163, 101)'; // app2 rule, no sandbox
const SHELL_CARD_BG = 'rgb(22, 33, 62)'; // page rule: .global-card { background: #16213e }

test.describe('with-react-sandbox example', () => {
  test('app1 renders inside an open shadow root, app2 in the light DOM', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('app1-paragraph')).toBeVisible();
    await expect(page.locator('#app2')).toContainText('App 2 (no sandbox)');

    const roots = await page.evaluate(() => ({
      app1: !!document.querySelector('#app1')?.shadowRoot,
      app1InShadow: !!document
        .querySelector('#app1')
        ?.shadowRoot?.querySelector('[data-testid="app1-paragraph"]'),
      app1InLight: !!document.querySelector(
        '#app1 [data-testid="app1-paragraph"]'
      ),
      app2: !!document.querySelector('#app2')?.shadowRoot,
    }));
    expect(roots).toEqual({
      app1: true,
      app1InShadow: true,
      app1InLight: false,
      app2: false,
    });
  });

  test("app1's CSS does not leak out of the shadow root", async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('app1-paragraph')).toBeVisible();

    // app1 styles every <p> red, but only inside its shadow root.
    await expect(page.getByTestId('app1-paragraph')).toHaveCSS('color', RED);
    await expect(page.getByTestId('shell-paragraph')).toHaveCSS(
      'color',
      LIGHT_BLUE
    );
    await expect(page.locator('#app2 p').first()).toHaveCSS(
      'color',
      LIGHT_BLUE
    );
    // app1's outline rule for .global-card does not reach the shell's card.
    await expect(page.locator('body > div > .global-card')).toHaveCSS(
      'outline-style',
      'none'
    );
  });

  test('page CSS does not leak into the shadow root', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');
    const card = page.getByTestId('app1-card');
    await expect(card).toBeVisible();

    // The page's .global-card background would apply if the rule crossed the boundary.
    const background = await card.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    expect(background).not.toBe(SHELL_CARD_BG);
    await expect(card).toHaveCSS('outline-style', 'dashed');
  });

  test('without a sandbox, app2 CSS restyles the shell (control case)', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');
    await expect(page.locator('#app2')).toContainText('App 2 (no sandbox)');

    await expect(page.getByTestId('shell-note')).toHaveCSS('color', ORANGE);
  });
});
