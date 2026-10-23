import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  emitLifecycle,
  getRegisteredModule,
  hasServerMarkup,
  isMounted,
  onLifecycle,
  registerModule,
  unregisterModule,
  whenMounted,
} from '../runtime';
import type { MicroAppModule } from '../types';

// jsdom's window has no type for the globals the runtime owns.
const tuvixWindow = window as unknown as {
  __TUVIX_MODULES__?: Record<string, unknown>;
  __TUVIX_RUNTIME__?: unknown;
};

function container(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
  // Each test starts with a clean shared registry.
  delete tuvixWindow.__TUVIX_RUNTIME__;
  delete tuvixWindow.__TUVIX_MODULES__;
});

describe('module registry', () => {
  it('exposes registered modules through window.__TUVIX_MODULES__ for the loader', () => {
    const mod: MicroAppModule = { mount: vi.fn(), unmount: vi.fn() };
    registerModule('cart', mod);

    expect(tuvixWindow.__TUVIX_MODULES__?.cart).toBe(mod);
    expect(getRegisteredModule('cart')).toBe(mod);
  });

  it('keeps modules written to __TUVIX_MODULES__ before the runtime started', () => {
    const early: MicroAppModule = { mount: vi.fn(), unmount: vi.fn() };
    tuvixWindow.__TUVIX_MODULES__ = { early };
    expect(getRegisteredModule('early')).toBe(early);
  });

  it('forgets a module after unregisterModule', () => {
    registerModule('cart', { mount: vi.fn(), unmount: vi.fn() });
    unregisterModule('cart');
    expect(getRegisteredModule('cart')).toBeUndefined();
  });
});

describe('lifecycle events', () => {
  it('dispatches a bubbling tuvix:mounted event that document listeners receive', () => {
    const el = container();
    const seen: unknown[] = [];
    const off = onLifecycle('mounted', (detail) => seen.push(detail));

    emitLifecycle('mounted', { name: 'footer', container: el, hydrated: true });

    expect(seen).toEqual([{ name: 'footer', container: el, hydrated: true }]);
    off();
    emitLifecycle('mounted', {
      name: 'footer',
      container: el,
      hydrated: false,
    });
    expect(seen).toHaveLength(1);
  });

  it('reaches document listeners once when the container was already removed', () => {
    const el = container();
    emitLifecycle('mounted', {
      name: 'island',
      container: el,
      hydrated: false,
    });
    const seen: HTMLElement[] = [];
    const off = onLifecycle('unmounted', (detail) =>
      seen.push(detail.container)
    );

    // A host framework (React) removed the island before the adapter reported.
    el.remove();
    emitLifecycle('unmounted', {
      name: 'island',
      container: el,
      hydrated: false,
    });

    expect(seen).toEqual([el]);
    expect(isMounted('island')).toBe(false);
    off();
  });

  it('dispatches on an attached container, bubbling to document exactly once', () => {
    const el = container();
    const onElement = vi.fn();
    const onDocument = vi.fn();
    el.addEventListener('tuvix:mounted', onElement);
    const off = onLifecycle('mounted', onDocument);

    emitLifecycle('mounted', {
      name: 'island',
      container: el,
      hydrated: false,
    });

    expect(onElement).toHaveBeenCalledTimes(1);
    expect(onDocument).toHaveBeenCalledTimes(1);
    off();
  });

  it('tracks mounted state across mount and unmount', () => {
    const el = container();
    expect(isMounted('footer')).toBe(false);
    emitLifecycle('mounted', {
      name: 'footer',
      container: el,
      hydrated: false,
    });
    expect(isMounted('footer')).toBe(true);
    emitLifecycle('unmounted', {
      name: 'footer',
      container: el,
      hydrated: false,
    });
    expect(isMounted('footer')).toBe(false);
  });

  it('stays mounted until every container of the same app unmounts', async () => {
    const first = container();
    const second = container();
    emitLifecycle('mounted', {
      name: 'card',
      container: first,
      hydrated: false,
    });
    emitLifecycle('mounted', {
      name: 'card',
      container: second,
      hydrated: false,
    });

    emitLifecycle('unmounted', {
      name: 'card',
      container: first,
      hydrated: false,
    });
    expect(isMounted('card')).toBe(true);
    await expect(whenMounted('card')).resolves.toMatchObject({
      container: second,
    });

    emitLifecycle('unmounted', {
      name: 'card',
      container: second,
      hydrated: false,
    });
    expect(isMounted('card')).toBe(false);
  });

  it('ignores an unmount for a container that never mounted', () => {
    const mounted = container();
    emitLifecycle('mounted', {
      name: 'card',
      container: mounted,
      hydrated: false,
    });
    emitLifecycle('unmounted', {
      name: 'card',
      container: container(),
      hydrated: false,
    });
    expect(isMounted('card')).toBe(true);
  });

  it('does not mark an app mounted when only an error was emitted', () => {
    const el = container();
    emitLifecycle('error', {
      name: 'footer',
      container: el,
      hydrated: false,
      error: new Error('x'),
    });
    expect(isMounted('footer')).toBe(false);
  });

  it('dispatches tuvix:error with the thrown value', () => {
    const el = container();
    const error = new Error('render failed');
    const seen: unknown[] = [];
    const off = onLifecycle('error', (detail) => seen.push(detail.error));
    emitLifecycle('error', {
      name: 'footer',
      container: el,
      hydrated: false,
      error,
    });
    off();
    expect(seen).toEqual([error]);
  });

  it('listens on a custom target', () => {
    const host = container();
    const el = document.createElement('div');
    host.appendChild(el);
    const outside = container();
    const inHost: string[] = [];
    const off = onLifecycle('mounted', (d) => inHost.push(d.name), host);

    emitLifecycle('mounted', { name: 'inner', container: el, hydrated: false });
    emitLifecycle('mounted', {
      name: 'outer',
      container: outside,
      hydrated: false,
    });
    off();
    expect(inHost).toEqual(['inner']);
  });
});

describe('whenMounted', () => {
  it('resolves later, when the app mounts', async () => {
    const el = container();
    const pending = whenMounted('blog');
    emitLifecycle('mounted', { name: 'blog', container: el, hydrated: true });
    await expect(pending).resolves.toMatchObject({
      name: 'blog',
      hydrated: true,
    });
  });

  it('resolves immediately for an app that is already mounted', async () => {
    const el = container();
    emitLifecycle('mounted', { name: 'blog', container: el, hydrated: false });
    await expect(whenMounted('blog')).resolves.toMatchObject({ container: el });
  });

  it('ignores mounts of other apps', async () => {
    const el = container();
    let settled = false;
    void whenMounted('blog').then(() => (settled = true));
    emitLifecycle('mounted', {
      name: 'header',
      container: el,
      hydrated: false,
    });
    await Promise.resolve();
    expect(settled).toBe(false);
  });

  it('resolves every waiter for the same app', async () => {
    const el = container();
    const first = whenMounted('blog');
    const second = whenMounted('blog');
    emitLifecycle('mounted', { name: 'blog', container: el, hydrated: false });
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
  });

  it('rejects with the abort reason and stops waiting', async () => {
    const controller = new AbortController();
    const pending = whenMounted('blog', { signal: controller.signal });
    controller.abort(new Error('route left'));
    await expect(pending).rejects.toThrow('route left');
    const runtime = tuvixWindow.__TUVIX_RUNTIME__ as {
      waiters: Map<string, unknown>;
    };
    expect(runtime.waiters.has('blog')).toBe(false);
  });

  it('rejects at once when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort(new Error('gone'));
    await expect(
      whenMounted('blog', { signal: controller.signal })
    ).rejects.toThrow('gone');
  });
});

describe('hasServerMarkup', () => {
  it('ignores whitespace and comments', () => {
    const el = container();
    el.innerHTML = '\n  <!-- island -->  \n';
    expect(hasServerMarkup(el)).toBe(false);
  });

  it('detects element or text content', () => {
    const el = container();
    el.innerHTML = '<p>hi</p>';
    expect(hasServerMarkup(el)).toBe(true);
    el.innerHTML = 'plain text';
    expect(hasServerMarkup(el)).toBe(true);
  });
});

describe('separately bundled copies', () => {
  it('share the registry, mounted state and waiters through window', async () => {
    vi.resetModules();
    const a = await import('../runtime');
    vi.resetModules();
    const b = await import('../runtime');
    expect(b).not.toBe(a);

    const mod: MicroAppModule = { mount: vi.fn(), unmount: vi.fn() };
    a.registerModule('shared', mod);
    expect(b.getRegisteredModule('shared')).toBe(mod);

    const el = container();
    const pending = b.whenMounted('shared');
    a.emitLifecycle('mounted', {
      name: 'shared',
      container: el,
      hydrated: false,
    });
    await expect(pending).resolves.toMatchObject({ container: el });
    expect(b.isMounted('shared')).toBe(true);

    b.emitLifecycle('unmounted', {
      name: 'shared',
      container: el,
      hydrated: false,
    });
    expect(a.isMounted('shared')).toBe(false);
  });
});
