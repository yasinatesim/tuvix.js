import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { getRegisteredModule, isMounted } from '@tuvix.js/loader';
import {
  createReactMicroApp,
  createSsrReactMicroApp,
  TuvixReactApp,
} from '../index';
import { attachHtml, recordLifecycle, tick } from './helpers';
import type { LifecycleRecorder } from './helpers';

function Counter({ label }: { label: string }) {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount((n) => n + 1)}>
      {label}:{count}
    </button>
  );
}

let lifecycle: LifecycleRecorder;
let consoleError: MockInstance;

beforeEach(() => {
  lifecycle = recordLifecycle();
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  lifecycle.stop();
  consoleError.mockRestore();
  document.body.replaceChildren();
});

function container(): HTMLElement {
  return attachHtml('');
}

describe('createReactMicroApp', () => {
  it('registers through the shared runtime', () => {
    const module = createReactMicroApp({ name: 'registry-app', App: Counter });
    expect(getRegisteredModule('registry-app')).toBe(module);
  });

  // Catches: mount resolving before React committed (root.render is async).
  it('renders the component before mount resolves and emits mounted', async () => {
    const el = container();
    const module = createReactMicroApp({ name: 'counter', App: Counter });

    await module.mount({ container: el, props: { label: 'hits' } });

    expect(el.querySelector('button')?.textContent).toBe('hits:0');
    expect(lifecycle.events).toEqual([
      { type: 'mounted', name: 'counter', container: el, hydrated: false },
    ]);
    expect(isMounted('counter')).toBe(true);

    await module.unmount({ container: el });
    expect(el.childNodes).toHaveLength(0);
    expect(lifecycle.events.at(-1)).toMatchObject({
      type: 'unmounted',
      container: el,
    });
    expect(isMounted('counter')).toBe(false);
  });

  // Catches: update remounting the root (state reset) or doing nothing.
  it('update re-renders with new props and keeps component state', async () => {
    const el = container();
    const module = createReactMicroApp({ name: 'stateful', App: Counter });
    await module.mount({ container: el, props: { label: 'a' } });

    el.querySelector('button')!.click();
    await vi.waitFor(() => expect(el.textContent).toBe('a:1'));

    await module.update!({ props: { label: 'b' } });
    await vi.waitFor(() => expect(el.textContent).toBe('b:1'));

    await module.unmount({ container: el });
  });

  // Catches: one module-level root shared by every container.
  it('keeps an independent root per container', async () => {
    const first = container();
    const second = container();
    const module = createReactMicroApp({ name: 'twice', App: Counter });

    await module.mount({ container: first, props: { label: 'one' } });
    await module.mount({ container: second, props: { label: 'two' } });
    expect(first.textContent).toBe('one:0');
    expect(second.textContent).toBe('two:0');

    await module.update!({ props: { label: 'uno' }, container: first });
    await vi.waitFor(() => expect(first.textContent).toBe('uno:0'));
    expect(second.textContent).toBe('two:0');

    await module.unmount({ container: first });
    expect(first.childNodes).toHaveLength(0);

    second.querySelector('button')!.click();
    await vi.waitFor(() => expect(second.textContent).toBe('two:1'));
    await module.update!({ props: { label: 'dos' } });
    await vi.waitFor(() => expect(second.textContent).toBe('dos:1'));

    await module.unmount({ container: second });
    expect(second.childNodes).toHaveLength(0);
  });

  // Catches: unmount during `await import('react-dom/client')` leaving an orphan root.
  it('unmount during a pending mount leaves no root behind', async () => {
    const el = container();
    const module = createReactMicroApp({ name: 'raced', App: Counter });

    const mounting = module.mount({ container: el, props: { label: 'late' } });
    const unmounting = module.unmount({ container: el });
    await Promise.all([mounting, unmounting]);
    await tick();
    await tick();

    expect(el.childNodes).toHaveLength(0);
    expect(lifecycle.events.filter((e) => e.type === 'mounted')).toHaveLength(
      0
    );

    // The container is free for a fresh mount afterwards.
    await module.mount({ container: el, props: { label: 'again' } });
    expect(el.textContent).toBe('again:0');
    await module.unmount({ container: el });
  });

  // Catches: first-render errors swallowed, mount resolving with a blank app.
  it('rejects mount, clears the container and emits error when the first render throws', async () => {
    const el = container();
    const boom = new Error('render failed');
    const Broken = (): never => {
      throw boom;
    };
    const module = createReactMicroApp({ name: 'broken', App: Broken });

    await expect(module.mount({ container: el })).rejects.toBe(boom);
    expect(el.childNodes).toHaveLength(0);
    expect(lifecycle.events).toEqual([
      {
        type: 'error',
        name: 'broken',
        container: el,
        hydrated: false,
        error: boom,
      },
    ]);

    // A failed mount leaves nothing to unmount.
    await module.unmount({ container: el });
    expect(lifecycle.events).toHaveLength(1);
  });

  // Catches: render errors after mount escaping to the host or going unreported.
  it('emits error when a later render throws', async () => {
    const el = container();
    const boom = new Error('later');
    function Fragile({ crash }: { crash: boolean }) {
      if (crash) throw boom;
      return <p>fine</p>;
    }
    const module = createReactMicroApp({ name: 'fragile', App: Fragile });
    await module.mount({ container: el, props: { crash: false } });

    await module.update!({ props: { crash: true }, container: el });
    await vi.waitFor(() =>
      expect(lifecycle.events.at(-1)).toMatchObject({
        type: 'error',
        error: boom,
      })
    );
    expect(el.textContent).toBe('');
    await module.unmount({ container: el });
  });

  // Catches: hasChildNodes() treating whitespace as server markup.
  it('renders fresh into a container holding only whitespace and comments', async () => {
    const el = attachHtml('');
    el.innerHTML = '\n  <!-- placeholder -->\n';
    const module = createSsrReactMicroApp({ name: 'blank-ssr', App: Counter });

    await module.mount({ container: el, props: { label: 'fresh' } });
    expect(el.textContent).toBe('fresh:0');
    expect(lifecycle.events[0]).toMatchObject({
      type: 'mounted',
      hydrated: false,
    });
    expect(consoleError).not.toHaveBeenCalled();
    await module.unmount({ container: el });
  });

  // Catches: createRoot replacing server DOM, or a tree that does not match
  // TuvixReactApp's server output (hydration mismatch).
  it('hydrates markup rendered by TuvixReactApp and keeps the server nodes', async () => {
    const html = renderToString(
      <TuvixReactApp name="ssr-counter" App={Counter} label="ssr" />
    );
    const page = attachHtml(html);
    const el = page.querySelector<HTMLElement>(
      '[data-tuvix-app="ssr-counter"]'
    )!;
    const serverButton = el.querySelector('button')!;
    const module = createSsrReactMicroApp({
      name: 'ssr-counter',
      App: Counter,
    });

    await module.mount({ container: el, props: { label: 'ssr' } });

    expect(el.querySelector('button')).toBe(serverButton);
    expect(lifecycle.events[0]).toMatchObject({
      type: 'mounted',
      hydrated: true,
    });
    serverButton.click();
    await vi.waitFor(() => expect(serverButton.textContent).toBe('ssr:1'));
    expect(consoleError).not.toHaveBeenCalled();
    await module.unmount({ container: el });
  });

  // Catches: a second mount silently acting as update (no events, state kept),
  // unlike the Vue, Svelte and Angular adapters.
  it('mount on a held container tears down and renders fresh', async () => {
    const el = container();
    const module = createReactMicroApp({ name: 'remount', App: Counter });
    await module.mount({ container: el, props: { label: 'a' } });
    const firstButton = el.querySelector('button')!;
    firstButton.click();
    await vi.waitFor(() => expect(el.textContent).toBe('a:1'));

    await module.mount({ container: el, props: { label: 'b' } });

    expect(el.textContent).toBe('b:0');
    expect(el.querySelector('button')).not.toBe(firstButton);
    expect(lifecycle.events.map((e) => e.type)).toEqual([
      'mounted',
      'unmounted',
      'mounted',
    ]);
    expect(lifecycle.events.every((e) => e.container === el)).toBe(true);
    await module.unmount({ container: el });
  });

  it('accepts a component with required props', async () => {
    function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
      return <article>{page}</article>;
    }
    // Type-level check: this line failed to compile when App was typed
    // ComponentType<Record<string, unknown>>.
    const module = createSsrReactMicroApp({
      name: 'legal-app',
      App: LegalPage,
    });
    const el = container();

    await module.mount({ container: el, props: { page: 'privacy' } });
    expect(el.textContent).toBe('privacy');
    await module.unmount({ container: el });
  });
});
