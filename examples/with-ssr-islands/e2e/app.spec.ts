import { test as base, expect, type Page } from '@playwright/test';

// Runs against the production build (`pnpm build && pnpm start`, port 5185).
// The last test is a smoke test against the Vite dev server (port 5186).

interface LifecycleRecord {
  type: 'mounted' | 'unmounted' | 'error';
  name: string;
  hydrated: boolean;
}

declare global {
  interface Window {
    __lifecycle: LifecycleRecord[];
    __pageMarker: string;
    __likeButton?: Element | null;
  }
}

/** Records every `tuvix:*` event and sets a marker that only a full page load resets. */
function recordLifecycle(): void {
  window.__lifecycle = [];
  window.__pageMarker = Math.random().toString(36).slice(2);
  for (const type of ['mounted', 'unmounted', 'error'] as const) {
    document.addEventListener(`tuvix:${type}`, (event) => {
      const { name, hydrated } = (event as CustomEvent<LifecycleRecord>).detail;
      window.__lifecycle.push({ type, name, hydrated });
    });
  }
}

// Fails the test on any console error or warning and any uncaught page error.
// Vue, React and Svelte report hydration mismatches through these channels.
const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('pageerror', (error) =>
        problems.push(`[pageerror] ${error.message}`)
      );
      page.on('console', (message) => {
        const type = message.type();
        if (type === 'error' || type === 'warning') {
          problems.push(`[console.${type}] ${message.text()}`);
        }
      });
      await page.addInitScript(recordLifecycle);
      await use(problems);
      expect(problems, 'console errors, warnings or page errors').toEqual([]);
    },
    { auto: true },
  ],
});

const island = (page: Page, name: string) =>
  page.locator(`[data-tuvix-app="${name}"]`);

function lifecycle(page: Page): Promise<LifecycleRecord[]> {
  return page.evaluate(() => window.__lifecycle);
}

async function waitForEvent(
  page: Page,
  record: LifecycleRecord
): Promise<void> {
  await expect.poll(() => lifecycle(page)).toContainEqual(record);
}

test.describe('server HTML without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('home islands are present and styled from the head stylesheets', async ({
    page,
  }) => {
    await page.goto('/');

    const vueCard = island(page, 'vue-card').locator('.card');
    await expect(vueCard).toContainText('Vue 3 single-file component');
    // `.card` is a scoped Vue class: the style only applies if the SFC's CSS file is linked.
    await expect(vueCard).toHaveCSS('border-top-color', 'rgb(65, 184, 131)');

    const counter = island(page, 'svelte-counter').locator('section');
    await expect(counter).toContainText('Svelte 5 counter');
    await expect(counter).toHaveAttribute('data-onmount', 'pending');
    await expect(counter).toHaveCSS('border-top-color', 'rgb(255, 62, 0)');

    // CSS Module class of the React micro app.
    const newsletterTitle = island(page, 'newsletter').locator('h2');
    await expect(newsletterTitle).toHaveText(
      'React micro app: micro frontends'
    );
    await expect(newsletterTitle).toHaveCSS('color', 'rgb(8, 126, 164)');

    await expect(island(page, 'ticker')).toHaveText('Loading live prices…');
  });

  test('the Angular island renders on the server with its component styles', async ({
    page,
  }) => {
    await page.goto('/lab');
    const contact = island(page, 'angular-contact').locator('.contact');
    // `heading` is an input, set on the server through the `props` option.
    await expect(contact.locator('h2')).toHaveText('Write to the lab');
    await expect(contact).toContainText('No messages sent yet.');
    await expect(contact).toHaveCSS('border-top-color', 'rgb(221, 0, 49)');
  });
});

test.describe('production build', () => {
  test('every island on the home page hydrates; the broken one reports an error', async ({
    page,
  }) => {
    await page.goto('/');
    for (const name of ['vue-card', 'svelte-counter', 'newsletter']) {
      await waitForEvent(page, { type: 'mounted', name, hydrated: true });
    }
    await waitForEvent(page, {
      type: 'error',
      name: 'ticker',
      hydrated: false,
    });

    const events = await lifecycle(page);
    expect(events.filter((event) => event.type === 'mounted')).toHaveLength(3);
    // The runtime marks islands from the lifecycle events alone.
    await expect(island(page, 'vue-card')).toHaveClass(/is-live/);
    await expect(island(page, 'svelte-counter')).toHaveClass(/is-live/);
    await expect(page.locator('[data-tilt]')).toHaveAttribute(
      'data-tilt-bound',
      ''
    );
    await expect(page.locator('html')).toHaveAttribute(
      'data-first-vue-mount',
      'hydrated'
    );
  });

  test('every island on the lab page hydrates, including Angular', async ({
    page,
  }) => {
    await page.goto('/lab');
    await waitForEvent(page, {
      type: 'mounted',
      name: 'angular-contact',
      hydrated: true,
    });
    await waitForEvent(page, {
      type: 'mounted',
      name: 'svelte-counter',
      hydrated: true,
    });
  });

  test('host re-renders keep the Vue island DOM and its listeners', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForEvent(page, {
      type: 'mounted',
      name: 'vue-card',
      hydrated: true,
    });

    const like = page.getByTestId('vue-like');
    await like.click();
    await expect(like).toHaveText('Likes: 1');
    await page.evaluate(() => {
      window.__likeButton = document.querySelector('[data-testid="vue-like"]');
    });

    const hostCounter = page.getByTestId('host-counter');
    await hostCounter.click();
    await hostCounter.click();
    await hostCounter.click();
    await expect(hostCounter).toHaveText('Re-render host (3)');
    // The new prop reached the island through `app.update()`.
    await expect(page.getByTestId('vue-host-renders')).toHaveText('3');

    const sameNode = await page.evaluate(
      () =>
        window.__likeButton ===
        document.querySelector('[data-testid="vue-like"]')
    );
    expect(sameNode).toBe(true);
    // The click listener Vue attached during hydration still works.
    await like.click();
    await expect(like).toHaveText('Likes: 2');
  });

  test('a link inside the Vue island navigates without a full reload', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForEvent(page, {
      type: 'mounted',
      name: 'vue-card',
      hydrated: true,
    });
    const marker = await page.evaluate(() => window.__pageMarker);

    await page.getByTestId('vue-link').click();
    await expect(page).toHaveURL(/\/lab$/);
    // Rendered in the browser this time, so `hydrated` is false.
    await waitForEvent(page, {
      type: 'mounted',
      name: 'angular-contact',
      hydrated: false,
    });
    await waitForEvent(page, {
      type: 'mounted',
      name: 'svelte-counter',
      hydrated: false,
    });
    expect(await page.evaluate(() => window.__pageMarker)).toBe(marker);
    // Client-only render: the input comes from the island's props.
    await expect(
      island(page, 'angular-contact').locator('.contact h2')
    ).toHaveText('Write to the lab');

    await page.getByTestId('angular-send').click();
    await expect(page.getByTestId('angular-status')).toHaveText(
      'Messages sent: 1'
    );
  });

  test('links inside the Svelte and Angular islands navigate without a full reload', async ({
    page,
  }) => {
    await page.goto('/lab');
    await waitForEvent(page, {
      type: 'mounted',
      name: 'angular-contact',
      hydrated: true,
    });
    const marker = await page.evaluate(() => window.__pageMarker);

    await page.getByTestId('angular-link').click();
    await expect(page).toHaveURL(/\/$/);
    await waitForEvent(page, {
      type: 'mounted',
      name: 'vue-card',
      hydrated: false,
    });

    await page.getByTestId('svelte-link').click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(
      page.getByRole('heading', { name: 'About this demo' })
    ).toBeVisible();
    expect(await page.evaluate(() => window.__pageMarker)).toBe(marker);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('vue-like')).toBeVisible();
    expect(await page.evaluate(() => window.__pageMarker)).toBe(marker);
  });

  test('the Svelte onMount effect runs after hydration', async ({
    page,
    request,
  }) => {
    const serverHtml = await (await request.get('/')).text();
    expect(serverHtml).toContain('data-onmount="pending"');

    await page.goto('/');
    const counter = island(page, 'svelte-counter').locator('section');
    await expect(counter).toHaveAttribute('data-onmount', 'ran');
    await expect(counter).toHaveClass(/entered/);
    await expect(counter).toHaveCSS('opacity', '1');

    await page.getByTestId('svelte-increment').click();
    await expect(page.getByTestId('svelte-count')).toHaveText('4');
  });

  test('the zoneless Angular island updates its view on click', async ({
    page,
  }) => {
    await page.goto('/lab');
    await waitForEvent(page, {
      type: 'mounted',
      name: 'angular-contact',
      hydrated: true,
    });
    // The client re-render receives the same input as the server render.
    await expect(
      island(page, 'angular-contact').locator('.contact h2')
    ).toHaveText('Write to the lab');
    const status = page.getByTestId('angular-status');
    await expect(status).toHaveText('No messages sent yet.');
    await page.getByTestId('angular-send').click();
    await expect(status).toHaveText('Messages sent: 1');
    await page.getByTestId('angular-send').click();
    await expect(status).toHaveText('Messages sent: 2');
    expect(await page.evaluate(() => 'Zone' in window)).toBe(false);
  });

  test('the broken island shows its fallback while the others keep working', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('ticker-fallback')).toHaveText(
      'Live prices are unavailable right now.'
    );
    await expect(island(page, 'ticker')).toHaveCount(0);

    await page.getByTestId('svelte-increment').click();
    await expect(page.getByTestId('svelte-count')).toHaveText('4');
    await page.getByTestId('react-subscribe').click();
    await expect(page.getByTestId('react-status')).toHaveText(
      'Subscribed. See you next week.'
    );
    await page.getByTestId('vue-like').click();
    await expect(page.getByTestId('vue-like')).toHaveText('Likes: 1');
  });
});

test.describe('dev server', () => {
  const devUrl = 'http://localhost:5186';

  test('islands hydrate under Vite middleware mode', async ({ page }) => {
    await page.goto(`${devUrl}/`);
    for (const name of ['vue-card', 'svelte-counter', 'newsletter']) {
      await waitForEvent(page, { type: 'mounted', name, hydrated: true });
    }
    await page.getByTestId('vue-link').click();
    await expect(page).toHaveURL(`${devUrl}/lab`);
    await waitForEvent(page, {
      type: 'mounted',
      name: 'angular-contact',
      hydrated: false,
    });
  });
});
