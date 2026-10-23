import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';

/**
 * LivePlayground e2e tests.
 *
 * These tests guard against the "first click doesn't render" regression:
 * esbuild-wasm and Monaco load asynchronously on mount. If a tab is clicked
 * before initialization completes, compile() silently exits because `esbuild`
 * is null. The test verifies that the preview renders on the VERY FIRST click
 * without any page refresh.
 *
 * The playground imports each tuvix package from esm.sh at the version in its
 * repo package.json. A release commit bumps those versions before
 * `changeset publish` runs, so esm.sh cannot serve them yet and the release
 * job would wait on its own e2e gate forever. The tests therefore answer those
 * esm.sh requests with the locally built `dist/index.mjs` of each package:
 * they check the repo code, not npm availability. Framework packages (React,
 * Vue, Svelte, Angular) still come from the CDN.
 */

const TABS = ['vanilla', 'react', 'vue', 'svelte', 'angular'] as const;
const INIT_TIMEOUT = 30_000; // CDN + WASM load budget
const RENDER_TIMEOUT = 15_000;

const PACKAGES_DIR = path.resolve(__dirname, '../../packages');

/** `https://esm.sh/*@tuvix.js/core@0.5.0` → `core`; `…/*tuvix.js@0.5.0` → `tuvix`. */
const TUVIX_ESM_URL =
  /^https:\/\/esm\.sh\/\*(?:@tuvix\.js\/([\w-]+)|tuvix\.js)@[^/?#]+$/;

test.beforeEach(async ({ page }) => {
  await page.route(TUVIX_ESM_URL, async (route) => {
    const match = TUVIX_ESM_URL.exec(route.request().url());
    const dir = match?.[1] ?? 'tuvix';
    const body = await readFile(
      path.join(PACKAGES_DIR, dir, 'dist', 'index.mjs'),
      'utf8'
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      headers: { 'access-control-allow-origin': '*' },
      body,
    });
  });
  // Fresh navigation every test — no cached state
  await page.goto('/playground');
  // Wait for the playground shell to be visible before interacting
  await page.locator('.live-playground').waitFor({ state: 'visible' });
});

test('default tab renders preview on first load without refresh', async ({
  page,
}) => {
  // The first tab (vanilla) should auto-compile on mount.
  // Wait for the iframe to receive a srcdoc — proves compilation ran.
  await expect(page.locator('.preview-frame')).toHaveAttribute('srcdoc', /.+/, {
    timeout: INIT_TIMEOUT,
  });
});

for (const tab of TABS) {
  test(`tab "${tab}" renders preview on first click without refresh`, async ({
    page,
  }) => {
    // Click the tab immediately — esbuild may not be ready yet.
    // The component should queue/retry compilation once ready.
    await page.locator(`.tab-btn[data-tab="${tab}"]`).click();

    // The iframe must receive content within the render timeout.
    await expect(page.locator('.preview-frame')).toHaveAttribute(
      'srcdoc',
      /.+/,
      {
        timeout: INIT_TIMEOUT,
      }
    );

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

  const errorMsgs = page.locator(
    '.console-msg.error, .console-msg.runtime-error'
  );
  await expect(errorMsgs).toHaveCount(0);
});

const LABELS: Record<(typeof TABS)[number], string> = {
  vanilla: 'Vanilla JS',
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  angular: 'Angular',
};

for (const tab of TABS) {
  for (const demo of ['Counter', 'Todo'] as const) {
    test(`${tab} ${demo.toLowerCase()} demo renders with the repo package versions`, async ({
      page,
    }) => {
      // Errors raised inside the preview iframe: failed module loads, bad
      // import map entries, API mismatches between the demo and the package.
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error')
          errors.push(`${msg.location().url}: ${msg.text()}`);
      });

      await page.locator(`.tab-btn[data-tab="${tab}"]`).click();
      await page.locator('.demo-btn', { hasText: demo }).click();

      const heading = page.frameLocator('.preview-frame').locator('#app h2');
      await expect(heading).toHaveText(`${demo} — ${LABELS[tab]}`, {
        timeout: INIT_TIMEOUT,
      });

      await expect(
        page.locator('.console-msg.error, .console-msg.runtime-error')
      ).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }
}
