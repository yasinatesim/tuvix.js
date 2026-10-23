import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { defineComponent, h, inject, ref } from 'vue';
import type { Component } from 'vue';
import type { LifecycleDetail } from '@tuvix.js/loader';
import { getRegisteredModule, isMounted } from '@tuvix.js/loader';
import {
  TUVIX_PROPS_KEY,
  createSsrVueMicroApp,
  createVueMicroApp,
} from '../index';
import { renderVueToString } from '../server';

// A counter whose text depends on a prop and on local state, so tests can tell
// a re-render apart from a fresh mount and see whether listeners are attached.
const Counter = defineComponent({
  props: { label: { type: String, default: 'count' } },
  setup(props) {
    const count = ref(0);
    return () =>
      h('div', { class: 'counter' }, [
        h('span', { class: 'text' }, `${props.label}: ${count.value}`),
        h('button', { onClick: () => count.value++ }, '+'),
      ]);
  },
});

let seq = 0;
const uniqueName = (base: string): string => `${base}-${++seq}`;

function makeContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function collect(
  container: HTMLElement,
  type: 'mounted' | 'unmounted' | 'error'
): LifecycleDetail[] {
  const seen: LifecycleDetail[] = [];
  container.addEventListener(`tuvix:${type}`, (event) => {
    seen.push((event as CustomEvent<LifecycleDetail>).detail);
  });
  return seen;
}

// Server markup comes from the real `renderVueToString`; hiding `window`
// takes it past the browser guard the same way a Node server would.
async function serverRender(
  App: Component,
  props?: Record<string, unknown>
): Promise<string> {
  vi.stubGlobal('window', undefined);
  try {
    return await renderVueToString(App, props);
  } finally {
    vi.unstubAllGlobals();
  }
}

function hydrationMessages(spies: MockInstance[]): string[] {
  return spies
    .flatMap((spy) => spy.mock.calls)
    .map((args) => args.map(String).join(' '))
    .filter((msg) => /hydrat/i.test(msg));
}

describe('createSsrVueMicroApp hydration', () => {
  let warn: MockInstance;
  let error: MockInstance;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    error = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('adopts server-rendered nodes without a mismatch and attaches listeners', async () => {
    const html = await serverRender(Counter, { label: 'clicks' });
    expect(html).toContain('clicks: 0');

    const container = makeContainer();
    container.innerHTML = html;
    const serverButton = container.querySelector('button');
    const serverText = container.querySelector('.text');
    const mounted = collect(container, 'mounted');

    const name = uniqueName('hydrate');
    const app = createSsrVueMicroApp({ name, App: Counter });
    await app.mount({ container, props: { label: 'clicks' } });

    // Same DOM nodes: Vue hydrated them instead of re-rendering.
    expect(container.querySelector('button')).toBe(serverButton);
    expect(container.querySelector('.text')).toBe(serverText);
    expect(hydrationMessages([warn, error])).toEqual([]);

    // The click listener landed on the server node.
    serverButton!.click();
    await Promise.resolve();
    expect(serverText!.textContent).toBe('clicks: 1');

    expect(mounted).toHaveLength(1);
    expect(mounted[0]).toMatchObject({ name, container, hydrated: true });
    expect(isMounted(name)).toBe(true);

    await app.unmount({ container });
  });

  it('reports a mismatch when server markup differs (guards the spy above)', async () => {
    const container = makeContainer();
    container.innerHTML =
      '<div class="counter"><span class="text">stale: 9</span><button>+</button></div>';

    const app = createSsrVueMicroApp({
      name: uniqueName('mismatch'),
      App: Counter,
    });
    await app.mount({ container, props: { label: 'fresh' } });

    expect(hydrationMessages([warn, error]).length).toBeGreaterThan(0);
    expect(container.querySelector('.text')!.textContent).toBe('fresh: 0');

    await app.unmount({ container });
  });

  it('renders fresh into an empty container even with ssr on', async () => {
    const container = makeContainer();
    const mounted = collect(container, 'mounted');
    const app = createSsrVueMicroApp({
      name: uniqueName('empty'),
      App: Counter,
    });

    await app.mount({ container, props: { label: 'new' } });

    expect(container.querySelector('.text')!.textContent).toBe('new: 0');
    expect(mounted).toEqual([expect.objectContaining({ hydrated: false })]);
    expect(hydrationMessages([warn, error])).toEqual([]);

    await app.unmount({ container });
  });

  it('replaces server markup when ssr is off', async () => {
    const container = makeContainer();
    container.innerHTML = await serverRender(Counter, { label: 'x' });
    const serverButton = container.querySelector('button');
    const mounted = collect(container, 'mounted');

    const app = createVueMicroApp({ name: uniqueName('csr'), App: Counter });
    await app.mount({ container, props: { label: 'x' } });

    expect(container.querySelector('button')).not.toBe(serverButton);
    expect(container.querySelectorAll('.counter')).toHaveLength(1);
    expect(mounted).toEqual([expect.objectContaining({ hydrated: false })]);

    await app.unmount({ container });
  });
});

describe('createVueMicroApp', () => {
  beforeEach(() => {
    // Silence Vue's dev warnings from the components that throw on purpose.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('registers the module under its name', () => {
    const name = uniqueName('registry');
    const app = createVueMicroApp({ name, App: Counter });
    expect(getRegisteredModule(name)).toBe(app);
  });

  it('re-renders when update() changes props, keeping component state', async () => {
    const container = makeContainer();
    const app = createVueMicroApp({ name: uniqueName('update'), App: Counter });
    await app.mount({ container, props: { label: 'before' } });

    const text = container.querySelector('.text')!;
    container.querySelector('button')!.click();
    await Promise.resolve();
    expect(text.textContent).toBe('before: 1');

    await app.update!({ props: { label: 'after' } });

    // Same node, new prop, local count survived: a re-render, not a remount.
    expect(container.querySelector('.text')).toBe(text);
    expect(text.textContent).toBe('after: 1');

    await app.unmount({ container });
  });

  it("provides the reactive props object under 'tuvixProps'", async () => {
    let injected: Record<string, unknown> | undefined;
    const Reader = defineComponent({
      setup() {
        injected = inject<Record<string, unknown>>(TUVIX_PROPS_KEY);
        return () => h('p', String(injected?.theme ?? 'none'));
      },
    });

    const container = makeContainer();
    const app = createVueMicroApp({ name: uniqueName('inject'), App: Reader });
    await app.mount({ container, props: { theme: 'dark', stale: true } });
    expect(container.textContent).toBe('dark');

    await app.update!({ props: { theme: 'light' } });

    expect(container.textContent).toBe('light');
    expect(injected).toEqual({ theme: 'light' });

    await app.unmount({ container });
  });

  it('mounts into two containers with separate apps and props', async () => {
    const a = makeContainer();
    const b = makeContainer();
    const app = createVueMicroApp({ name: uniqueName('multi'), App: Counter });

    await app.mount({ container: a, props: { label: 'a' } });
    await app.mount({ container: b, props: { label: 'b' } });

    a.querySelector('button')!.click();
    await Promise.resolve();
    expect(a.querySelector('.text')!.textContent).toBe('a: 1');
    expect(b.querySelector('.text')!.textContent).toBe('b: 0');

    // An update naming a container touches only that one.
    await app.update!({ props: { label: 'B' }, container: b });
    expect(a.querySelector('.text')!.textContent).toBe('a: 1');
    expect(b.querySelector('.text')!.textContent).toBe('B: 0');

    // Without a container, every mount gets the props.
    await app.update!({ props: { label: 'all' } });
    expect(a.querySelector('.text')!.textContent).toBe('all: 1');
    expect(b.querySelector('.text')!.textContent).toBe('all: 0');

    // Unmounting one leaves the other alive and reactive.
    await app.unmount({ container: a });
    expect(a.childNodes).toHaveLength(0);
    b.querySelector('button')!.click();
    await Promise.resolve();
    expect(b.querySelector('.text')!.textContent).toBe('all: 1');

    await app.unmount({ container: b });
  });

  it('unmount tears down the app, clears the container and emits', async () => {
    const unmountedHook = vi.fn();
    const App = defineComponent({
      unmounted: unmountedHook,
      render: () => h('p', 'hello'),
    });
    const container = makeContainer();
    const name = uniqueName('unmount');
    const app = createVueMicroApp({ name, App });
    const unmounted = collect(container, 'unmounted');

    await app.mount({ container });
    expect(container.textContent).toBe('hello');
    expect(isMounted(name)).toBe(true);

    await app.unmount({ container });

    expect(unmountedHook).toHaveBeenCalledTimes(1);
    expect(container.childNodes).toHaveLength(0);
    expect(unmounted).toHaveLength(1);
    expect(unmounted[0]).toMatchObject({ name, container, hydrated: false });
    expect(isMounted(name)).toBe(false);

    // A second unmount is a no-op.
    await app.unmount({ container });
    expect(unmounted).toHaveLength(1);
    expect(unmountedHook).toHaveBeenCalledTimes(1);
  });

  it('marks the app unmounted even when a component throws during unmount', async () => {
    const boom = new Error('beforeUnmount failed');
    const App = defineComponent({
      beforeUnmount() {
        throw boom;
      },
      render: () => h('p', 'bye'),
    });
    const container = makeContainer();
    const name = uniqueName('unmount-error');
    const order: string[] = [];
    container.addEventListener('tuvix:error', () => order.push('error'));
    container.addEventListener('tuvix:unmounted', () =>
      order.push('unmounted')
    );
    const app = createVueMicroApp({ name, App });

    await app.mount({ container });
    expect(isMounted(name)).toBe(true);

    await expect(app.unmount({ container })).rejects.toBe(boom);

    expect(order).toEqual(['error', 'unmounted']);
    expect(isMounted(name)).toBe(false);
    expect(container.childNodes).toHaveLength(0);

    // The instance is forgotten: a second unmount does nothing.
    await app.unmount({ container });
    expect(order).toEqual(['error', 'unmounted']);
  });

  it('remounting the same container tears down the previous app first', async () => {
    const unmountedHook = vi.fn();
    const App = defineComponent({
      props: { n: Number },
      unmounted: unmountedHook,
      render() {
        return h('p', `n=${this.n}`);
      },
    });
    const container = makeContainer();
    const app = createVueMicroApp({ name: uniqueName('remount'), App });

    await app.mount({ container, props: { n: 1 } });
    await app.mount({ container, props: { n: 2 } });

    expect(unmountedHook).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(container.textContent).toBe('n=2');

    await app.unmount({ container });
  });

  it('emits tuvix:error and rejects when the component throws during mount', async () => {
    const boom = new Error('setup failed');
    const App = defineComponent({
      setup() {
        throw boom;
      },
    });
    const container = makeContainer();
    const name = uniqueName('error');
    const errors = collect(container, 'error');
    const mounted = collect(container, 'mounted');
    const app = createVueMicroApp({ name, App });

    await expect(app.mount({ container })).rejects.toBe(boom);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ name, container, error: boom });
    expect(mounted).toHaveLength(0);
    expect(isMounted(name)).toBe(false);
    // The failed instance is gone: update and unmount do nothing.
    await app.update!({ props: { x: 1 } });
    await app.unmount({ container });
  });

  it('still calls a plugin-installed errorHandler on mount failure', async () => {
    const handler = vi.fn();
    const App = defineComponent({
      setup() {
        throw new Error('nope');
      },
    });
    const app = createVueMicroApp({
      name: uniqueName('handler'),
      App,
      plugins: [
        (vueApp) => {
          vueApp.config.errorHandler = handler;
        },
      ],
    });

    await expect(app.mount({ container: makeContainer() })).rejects.toThrow(
      'nope'
    );
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('installs plugins on every app, with tuple options', async () => {
    const install = vi.fn((vueApp, options: { greeting: string }) => {
      vueApp.provide('greeting', options.greeting);
    });
    const App = defineComponent({
      setup() {
        const greeting = inject<string>('greeting');
        return () => h('p', greeting);
      },
    });
    const app = createVueMicroApp({
      name: uniqueName('plugins'),
      App,
      plugins: [[{ install }, { greeting: 'hi' }]],
    });
    const a = makeContainer();
    const b = makeContainer();

    await app.mount({ container: a });
    await app.mount({ container: b });

    expect(install).toHaveBeenCalledTimes(2);
    expect(a.textContent).toBe('hi');
    expect(b.textContent).toBe('hi');

    await app.unmount({ container: a });
    await app.unmount({ container: b });
  });
});

describe('renderVueToString in the browser', () => {
  it('returns an empty string', async () => {
    expect(await renderVueToString(Counter)).toBe('');
  });
});
