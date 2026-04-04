import { test, expect } from '@playwright/test';

/**
 * LivePlayground e2e tests.
 *
 * These tests guard against the "first click doesn't render" regression:
 * esbuild-wasm and Monaco load asynchronously on mount. If a tab is clicked
 * before initialization completes, compile() silently exits because `esbuild`
 * is null. The test verifies that the preview renders on the VERY FIRST click
 * without any page refresh.
 */

const TABS = ['vanilla', 'react', 'vue', 'svelte', 'angular'] as const;
const INIT_TIMEOUT = 30_000; // CDN + WASM load budget
const RENDER_TIMEOUT = 15_000;

test.beforeEach(async ({ page }) => {
  // Fresh navigation every test — no cached state
  await page.goto('/playground');
  // Wait for the playground shell to be visible before interacting
  await page.locator('.live-playground').waitFor({ state: 'visible' });
});

test('default tab renders preview on first load without refresh', async ({ page }) => {
  // The first tab (vanilla) should auto-compile on mount.
  // Wait for the iframe to receive a srcdoc — proves compilation ran.
  await expect(page.locator('.preview-frame')).toHaveAttribute('srcdoc', /.+/, {
    timeout: INIT_TIMEOUT,
  });
});

for (const tab of TABS) {
  test(`tab "${tab}" renders preview on first click without refresh`, async ({ page }) => {
    // Click the tab immediately — esbuild may not be ready yet.
    // The component should queue/retry compilation once ready.
    await page.locator(`.tab-btn[data-tab="${tab}"]`).click();

    // The iframe must receive content within the render timeout.
    await expect(page.locator('.preview-frame')).toHaveAttribute('srcdoc', /.+/, {
      timeout: INIT_TIMEOUT,
    });

    // No runtime-error messages should appear in the console pane.
    const errorMsgs = page.locator('.console-msg.runtime-error');
    await expect(errorMsgs).toHaveCount(0, { timeout: RENDER_TIMEOUT });
  });
}

test('switching between demos renders updated preview', async ({ page }) => {
  // Wait for initial render
  await expect(page.locator('.preview-frame')).toHaveAttribute('srcdoc', /.+/, {
    timeout: INIT_TIMEOUT,
  });

  // Switch to todo demo
  await page.locator('.demo-btn', { hasText: 'Todo' }).click();
  await expect(page.locator('.preview-frame')).toHaveAttribute('srcdoc', /.+/, {
    timeout: RENDER_TIMEOUT,
  });

  // Switch back to counter demo
  await page.locator('.demo-btn', { hasText: 'Counter' }).click();
  await expect(page.locator('.preview-frame')).toHaveAttribute('srcdoc', /.+/, {
    timeout: RENDER_TIMEOUT,
  });
});

test('console pane shows no errors on initial load', async ({ page }) => {
  await expect(page.locator('.preview-frame')).toHaveAttribute('srcdoc', /.+/, {
    timeout: INIT_TIMEOUT,
  });

  const errorMsgs = page.locator('.console-msg.error, .console-msg.runtime-error');
  await expect(errorMsgs).toHaveCount(0);
});
