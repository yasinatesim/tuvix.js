import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { SvelteMap } from 'svelte/reactivity';
import { getRegisteredModule, isMounted } from '@tuvix.js/loader';
import type { LifecycleDetail } from '@tuvix.js/loader';
import { createSsrSvelteMicroApp, createSvelteMicroApp } from '../index';
import { renderSvelteToString } from '../server';
import { compileSvelte } from './compile-svelte';

// No imports from 'svelte': the server build of this component is rendered
// in this jsdom file, where 'svelte' resolves to the client runtime.
const GREETING = `
<script>
  let { name = 'world', log = [] } = $props();
  let count = $state(0);
  $effect(() => {
    const current = name;
    log.push('effect:' + current);
    return () => log.push('cleanup:' + current);
  });
</script>
<p class="greeting">Hello {name}</p>
<button onclick={() => count++}>clicked {count}</button>
<style>
  .greeting { color: rebeccapurple; }
</style>
`;

const HOOKED = `
<script>
  import { onMount } from 'svelte';
  let { log } = $props();
  onMount(() => {
    log.push('mount');
    return () => log.push('destroy');
  });
</script>
<p>hooked</p>
`;

const LEGACY = `
<script>
  export let name = 'world';
</script>
<p>Hi {name}</p>
`;

const BROKEN = `
<script>
  throw new Error('boom');
</script>
<p>never</p>
`;

let Greeting: unknown;
let GreetingServer: unknown;
let Hooked: unknown;
let Legacy: unknown;
let Broken: unknown;

beforeAll(async () => {
  Greeting = await compileSvelte(GREETING, { generate: 'client' });
  GreetingServer = await compileSvelte(GREETING, {
    generate: 'server',
    css: 'injected',
  });
  Hooked = await compileSvelte(HOOKED, { generate: 'client' });
  Legacy = await compileSvelte(LEGACY, { generate: 'client' });
  Broken = await compileSvelte(BROKEN, { generate: 'client' });
});

const containers: HTMLElement[] = [];

function makeContainer(html = ''): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  containers.push(el);
  return el;
}

function record(
  container: HTMLElement,
  type: 'mounted' | 'unmounted' | 'error'
): LifecycleDetail[] {
  const seen: LifecycleDetail[] = [];
  container.addEventListener(`tuvix:${type}`, (event) => {
    seen.push((event as CustomEvent<LifecycleDetail>).detail);
  });
  return seen;
}

async function serverHtml(props: Record<string, unknown>): Promise<string> {
  // renderSvelteToString is server-only; hide jsdom's window for the call.
  vi.stubGlobal('window', undefined);
  try {
    return await renderSvelteToString(GreetingServer, props);
  } finally {
    vi.unstubAllGlobals();
  }
}

afterEach(() => {
  for (const el of containers.splice(0)) el.remove();
});

describe('createSvelteMicroApp with Svelte 5', () => {
  it('mounts a compiled component and runs effects before tuvix:mounted', async () => {
    const log: string[] = [];
    const container = makeContainer();
    const app = createSvelteMicroApp({ name: 'sv5-mount', App: Greeting });
    const logAtMounted: string[][] = [];
    container.addEventListener('tuvix:mounted', () => {
      logAtMounted.push([...log]);
    });
    const mounted = record(container, 'mounted');

    await app.mount({ container, props: { name: 'Ada', log } });

    expect(container.querySelector('p')?.textContent).toBe('Hello Ada');
    expect(mounted).toEqual([
      { name: 'sv5-mount', container, hydrated: false },
    ]);
    expect(logAtMounted).toEqual([['effect:Ada']]);
    expect(isMounted('sv5-mount')).toBe(true);
  });

  it('runs onMount before tuvix:mounted and its teardown on unmount', async () => {
    const log: string[] = [];
    const container = makeContainer();
    const app = createSvelteMicroApp({ name: 'sv5-hooked', App: Hooked });
    const logAtMounted: string[][] = [];
    container.addEventListener('tuvix:mounted', () => {
      logAtMounted.push([...log]);
    });

    await app.mount({ container, props: { log } });
    expect(logAtMounted).toEqual([['mount']]);

    await app.unmount({ container });
    expect(log).toEqual(['mount', 'destroy']);
  });

  it('registers the module under its name', () => {
    const app = createSvelteMicroApp({ name: 'sv5-registry', App: Greeting });
    expect(getRegisteredModule('sv5-registry')).toBe(app);
  });

  it('replaces existing markup when ssr is off', async () => {
    const container = makeContainer('<p>loading</p>');
    const app = createSvelteMicroApp({ name: 'sv5-fresh', App: Greeting });

    await app.mount({ container, props: { name: 'Ada' } });

    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]?.textContent).toBe('Hello Ada');
  });

  it('updates props in place without remounting when given SvelteMap', async () => {
    const log: string[] = [];
    const container = makeContainer();
    const app = createSvelteMicroApp({
      name: 'sv5-update',
      App: Greeting,
      SvelteMap,
    });
    await app.mount({ container, props: { name: 'Ada', log } });
    const paragraph = container.querySelector('p');

    await app.update?.({ props: { name: 'Grace', log } });

    expect(container.querySelector('p')).toBe(paragraph);
    expect(paragraph?.textContent).toBe('Hello Grace');
    expect(log).toEqual(['effect:Ada', 'cleanup:Ada', 'effect:Grace']);

    // A prop missing from the new set falls back to the component default.
    await app.update?.({ props: { log } });
    expect(paragraph?.textContent).toBe('Hello world');
  });

  it('remounts on update by default and dispatches tuvix:mounted again', async () => {
    const log: string[] = [];
    const container = makeContainer();
    const app = createSvelteMicroApp({ name: 'sv5-remount', App: Greeting });
    const mounted = record(container, 'mounted');
    await app.mount({ container, props: { name: 'Ada', log } });
    const paragraph = container.querySelector('p');

    await app.update?.({ props: { name: 'Grace', log } });

    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(container.querySelector('p')).not.toBe(paragraph);
    expect(container.querySelector('p')?.textContent).toBe('Hello Grace');
    expect(log).toEqual(['effect:Ada', 'cleanup:Ada', 'effect:Grace']);
    expect(mounted).toEqual([
      { name: 'sv5-remount', container, hydrated: false },
      { name: 'sv5-remount', container, hydrated: false },
    ]);

    await app.unmount({ container });
    expect(log).toEqual([
      'effect:Ada',
      'cleanup:Ada',
      'effect:Grace',
      'cleanup:Grace',
    ]);
    expect(container.childNodes).toHaveLength(0);
  });

  it('updates legacy-mode components (export let) in place', async () => {
    const container = makeContainer();
    const app = createSvelteMicroApp({
      name: 'sv5-legacy',
      App: Legacy,
      SvelteMap,
    });
    await app.mount({ container, props: { name: 'Ada' } });
    const paragraph = container.querySelector('p');

    await app.update?.({ props: { name: 'Linus' } });

    expect(container.querySelector('p')).toBe(paragraph);
    expect(paragraph?.textContent).toBe('Hi Linus');
  });

  it('unmount runs teardown, empties the container and emits tuvix:unmounted', async () => {
    const log: string[] = [];
    const container = makeContainer();
    const app = createSvelteMicroApp({ name: 'sv5-unmount', App: Greeting });
    const unmounted = record(container, 'unmounted');
    await app.mount({ container, props: { name: 'Ada', log } });

    await app.unmount({ container });

    expect(log).toEqual(['effect:Ada', 'cleanup:Ada']);
    expect(container.childNodes).toHaveLength(0);
    expect(unmounted).toEqual([
      { name: 'sv5-unmount', container, hydrated: false },
    ]);
    expect(isMounted('sv5-unmount')).toBe(false);
  });

  it('unmount called during mount waits for it and leaves no instance behind', async () => {
    const log: string[] = [];
    const container = makeContainer();
    const app = createSvelteMicroApp({ name: 'sv5-race', App: Greeting });
    const order: string[] = [];
    container.addEventListener('tuvix:mounted', () => order.push('mounted'));
    container.addEventListener('tuvix:unmounted', () =>
      order.push('unmounted')
    );

    const mounting = app.mount({ container, props: { name: 'Ada', log } });
    const unmounting = app.unmount({ container });
    await Promise.all([mounting, unmounting]);

    expect(order).toEqual(['mounted', 'unmounted']);
    expect(log).toEqual(['effect:Ada', 'cleanup:Ada']);
    expect(container.childNodes).toHaveLength(0);

    // A later update must not touch the destroyed instance.
    await app.update?.({ props: { name: 'Grace', log } });
    expect(log).toEqual(['effect:Ada', 'cleanup:Ada']);
  });

  it('keeps one instance per container', async () => {
    const first = makeContainer();
    const second = makeContainer();
    const app = createSvelteMicroApp({ name: 'sv5-multi', App: Greeting });
    await app.mount({ container: first, props: { name: 'One' } });
    await app.mount({ container: second, props: { name: 'Two' } });

    await app.update?.({ props: { name: 'Uno' }, container: first });
    expect(first.textContent).toContain('Hello Uno');
    expect(second.textContent).toContain('Hello Two');

    await app.update?.({ props: { name: 'All' } });
    expect(first.textContent).toContain('Hello All');
    expect(second.textContent).toContain('Hello All');

    await app.unmount({ container: first });
    expect(first.childNodes).toHaveLength(0);
    expect(second.querySelector('p')?.textContent).toBe('Hello All');
  });

  it('emits tuvix:error and rethrows when the component throws', async () => {
    const container = makeContainer();
    const app = createSvelteMicroApp({ name: 'sv5-error', App: Broken });
    const errors = record(container, 'error');

    await expect(app.mount({ container })).rejects.toThrow('boom');

    expect(errors).toHaveLength(1);
    expect(errors[0]?.name).toBe('sv5-error');
    expect((errors[0]?.error as Error).message).toMatch(/^boom/);
    // Unmount after a failed mount is a no-op, not a second error.
    await expect(app.unmount({ container })).resolves.toBeUndefined();
  });

  it('unmount on a container it never mounted leaves it untouched', async () => {
    const container = makeContainer('<p>host content</p>');
    const paragraph = container.querySelector('p');
    const app = createSvelteMicroApp({ name: 'sv5-foreign', App: Greeting });
    const unmounted = record(container, 'unmounted');

    await app.unmount({ container });

    expect(container.querySelector('p')).toBe(paragraph);
    expect(container.innerHTML).toBe('<p>host content</p>');
    expect(unmounted).toEqual([]);
  });
});

describe('createSsrSvelteMicroApp with Svelte 5', () => {
  it('hydrates server markup: keeps nodes, runs effects and attaches handlers', async () => {
    const html = await serverHtml({ name: 'Ada' });
    expect(html).toMatch(/^<style id="svelte-[a-z0-9]+">/);
    const container = makeContainer(html);
    const paragraph = container.querySelector('p');
    const button = container.querySelector('button');
    const log: string[] = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const app = createSsrSvelteMicroApp({
      name: 'sv5-hydrate',
      App: Greeting,
      SvelteMap,
    });
    const mounted = record(container, 'mounted');

    await app.mount({ container, props: { name: 'Ada', log } });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
    expect(mounted).toEqual([
      { name: 'sv5-hydrate', container, hydrated: true },
    ]);
    expect(container.querySelector('p')).toBe(paragraph);
    expect(container.querySelector('button')).toBe(button);
    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(log).toEqual(['effect:Ada']);

    button?.click();
    await Promise.resolve();
    expect(button?.textContent).toBe('clicked 1');

    await app.update?.({ props: { name: 'Grace', log } });
    expect(paragraph?.textContent).toBe('Hello Grace');

    await app.unmount({ container });
    expect(log).toEqual([
      'effect:Ada',
      'cleanup:Ada',
      'effect:Grace',
      'cleanup:Grace',
    ]);
    expect(container.childNodes).toHaveLength(0);
  });

  it('renders fresh when the container holds only whitespace', async () => {
    const container = makeContainer('\n  <!-- island -->\n');
    const app = createSsrSvelteMicroApp({ name: 'sv5-empty', App: Greeting });
    const mounted = record(container, 'mounted');

    await app.mount({ container, props: { name: 'Ada' } });

    expect(mounted[0]?.hydrated).toBe(false);
    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(container.querySelector('p')?.textContent).toBe('Hello Ada');
  });
});

describe('renderSvelteToString in a browser', () => {
  it('returns an empty string', async () => {
    expect(await renderSvelteToString(GreetingServer, { name: 'Ada' })).toBe(
      ''
    );
  });
});

describe('Svelte 5 components compiled with dev: true', () => {
  // vite-plugin-svelte compiles with dev: true in serve mode.
  let GreetingDev: unknown;
  let GreetingDevServer: unknown;

  beforeAll(async () => {
    GreetingDev = await compileSvelte(GREETING, {
      generate: 'client',
      dev: true,
    });
    GreetingDevServer = await compileSvelte(GREETING, {
      generate: 'server',
      css: 'injected',
      dev: true,
    });
  });

  it('hydrates dev server output and updates in place', async () => {
    vi.stubGlobal('window', undefined);
    let html: string;
    try {
      html = await renderSvelteToString(GreetingDevServer, { name: 'Ada' });
    } finally {
      vi.unstubAllGlobals();
    }
    const container = makeContainer(html);
    const paragraph = container.querySelector('p');
    const log: string[] = [];
    const app = createSsrSvelteMicroApp({
      name: 'sv5-dev-hydrate',
      App: GreetingDev,
      SvelteMap,
    });
    const mounted = record(container, 'mounted');

    await app.mount({ container, props: { name: 'Ada', log } });

    expect(mounted[0]?.hydrated).toBe(true);
    expect(container.querySelector('p')).toBe(paragraph);
    expect(log).toEqual(['effect:Ada']);

    await app.update?.({ props: { name: 'Grace', log } });
    expect(paragraph?.textContent).toBe('Hello Grace');

    await app.unmount({ container });
    expect(log).toEqual([
      'effect:Ada',
      'cleanup:Ada',
      'effect:Grace',
      'cleanup:Grace',
    ]);
    expect(container.childNodes).toHaveLength(0);
  });

  it('mounts fresh and remounts on update without SvelteMap', async () => {
    const container = makeContainer();
    const app = createSvelteMicroApp({ name: 'sv5-dev', App: GreetingDev });

    await app.mount({ container, props: { name: 'Ada' } });
    expect(container.querySelector('p')?.textContent).toBe('Hello Ada');

    await app.update?.({ props: { name: 'Linus' } });
    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(container.querySelector('p')?.textContent).toBe('Hello Linus');
  });
});
