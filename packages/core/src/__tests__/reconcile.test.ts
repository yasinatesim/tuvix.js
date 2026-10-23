import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGlobalBus, resetGlobalBus } from '@tuvix.js/event-bus';
import { registerModule, unregisterModule } from '@tuvix.js/loader';
import type { MicroAppModule, MountContext } from '@tuvix.js/loader';
import { Orchestrator } from '../orchestrator';
import type { OrchestratorConfig, RouterSource } from '../types';

interface Deferred<T = void> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T = void>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

interface StubApp {
  module: MicroAppModule;
  /** Function entry the loader calls; counts loads. */
  entry: () => Promise<MicroAppModule>;
  loads: number;
  mounts: MountContext[];
  unmounts: number;
  /** Set before a load/mount/unmount to hold it open until resolved. */
  loadGate: Deferred | null;
  mountGate: Deferred | null;
  unmountGate: Deferred | null;
}

/** Shared timeline of lifecycle calls across every stub app in a test. */
let log: string[];

function stubApp(name: string): StubApp {
  const app: StubApp = {
    loads: 0,
    mounts: [],
    unmounts: 0,
    loadGate: null,
    mountGate: null,
    unmountGate: null,
    module: {
      async mount(ctx) {
        log.push(`mount:${name}`);
        app.mounts.push(ctx);
        if (app.mountGate) await app.mountGate.promise;
        const el = document.createElement('p');
        el.dataset.app = name;
        el.textContent = name;
        ctx.container.appendChild(el);
        log.push(`mounted:${name}`);
      },
      async unmount({ container }) {
        log.push(`unmount:${name}`);
        app.unmounts += 1;
        if (app.unmountGate) await app.unmountGate.promise;
        container.querySelector(`[data-app="${name}"]`)?.remove();
        log.push(`unmounted:${name}`);
      },
    },
    entry: async () => {
      app.loads += 1;
      if (app.loadGate) await app.loadGate.promise;
      return app.module;
    },
  };
  return app;
}

function renderedApps(selector = '#main'): string[] {
  const root = document.querySelector(selector) as HTMLElement;
  const scope: ParentNode =
    root.shadowRoot?.querySelector('[data-tuvix-sandbox-root]') ?? root;
  return Array.from(scope.querySelectorAll<HTMLElement>('[data-app]')).map(
    (el) => el.dataset.app as string
  );
}

let orchestrator: Orchestrator;

function create(config: OrchestratorConfig = {}): Orchestrator {
  orchestrator = new Orchestrator({ loader: { retries: 0 }, ...config });
  return orchestrator;
}

/** Register three apps that share #main, one per top-level path. */
function registerABC(): Record<'a' | 'b' | 'c', StubApp> {
  const apps = { a: stubApp('a'), b: stubApp('b'), c: stubApp('c') };
  for (const [name, app] of Object.entries(apps)) {
    orchestrator.register({
      name,
      entry: app.entry,
      container: '#main',
      activeWhen: `/${name}`,
    });
  }
  return apps;
}

beforeEach(() => {
  log = [];
  resetGlobalBus();
  window.history.replaceState(null, '', '/');
  document.body.innerHTML = '<div id="main"></div><div id="side"></div>';
});

afterEach(async () => {
  await orchestrator?.destroy();
  vi.restoreAllMocks();
});

describe('activeWhen matching', () => {
  it('keeps an app mounted when only the query string changes', async () => {
    create();
    const { a } = registerABC();

    await orchestrator.reconcile('/a?tab=1');
    await orchestrator.reconcile('/a?tab=2#section');

    expect(orchestrator.getMountedApps()).toEqual(['a']);
    expect(a.mounts).toHaveLength(1);
    expect(a.unmounts).toBe(0);
  });

  it('supports :param patterns', async () => {
    create();
    const user = stubApp('user');
    orchestrator.register({
      name: 'user',
      entry: user.entry,
      container: '#main',
      activeWhen: '/users/:id',
    });

    await orchestrator.reconcile('/users');
    expect(orchestrator.getAppStatus('user')).toBe('registered');

    await orchestrator.reconcile('/users/42');
    expect(orchestrator.getMountedApps()).toEqual(['user']);
    expect(renderedApps()).toEqual(['user']);
  });

  it('matches sub-paths on segment boundaries only', async () => {
    create();
    registerABC();

    await orchestrator.reconcile('/a/deep/page');
    expect(orchestrator.getMountedApps()).toEqual(['a']);

    await orchestrator.reconcile('/abc');
    expect(orchestrator.getMountedApps()).toEqual([]);
  });

  it('activates apps named by router routes when they have no activeWhen', async () => {
    window.history.replaceState(null, '', '/');
    create({ router: { routes: [{ path: '/shop/*', app: 'shop' }] } });
    const shop = stubApp('shop');
    orchestrator.register({
      name: 'shop',
      entry: shop.entry,
      container: '#main',
    });

    await orchestrator.reconcile('/shop/cart?coupon=1');
    expect(orchestrator.getMountedApps()).toEqual(['shop']);

    await orchestrator.reconcile('/home');
    expect(orchestrator.getMountedApps()).toEqual([]);
  });

  it('leaves apps without activeWhen or a route alone', async () => {
    create();
    registerABC();
    const widget = stubApp('widget');
    orchestrator.register({
      name: 'widget',
      entry: widget.entry,
      container: '#side',
    });

    await orchestrator.mountApp('widget');
    await orchestrator.reconcile('/a');
    await orchestrator.reconcile('/b');

    expect(orchestrator.getAppStatus('widget')).toBe('mounted');
    expect(widget.unmounts).toBe(0);
  });
});

describe('reconcile serialization', () => {
  it('unmounts outgoing apps before mounting incoming ones', async () => {
    create();
    const { a } = registerABC();
    await orchestrator.reconcile('/a');

    a.unmountGate = deferred();
    log = [];
    const done = orchestrator.reconcile('/b');
    await vi.waitFor(() => expect(log).toContain('unmount:a'));
    // B must not start while A still owns the container.
    expect(log).not.toContain('mount:b');

    a.unmountGate.resolve();
    await done;

    expect(log).toEqual(['unmount:a', 'unmounted:a', 'mount:b', 'mounted:b']);
    expect(renderedApps()).toEqual(['b']);
  });

  it('only reconciles the newest of several queued paths', async () => {
    create();
    const { a, b, c } = registerABC();
    await orchestrator.reconcile('/a');

    b.loadGate = deferred();
    const toB = orchestrator.reconcile('/b');
    await vi.waitFor(() => expect(b.loads).toBe(1));
    const toC = orchestrator.reconcile('/c');
    const toA = orchestrator.reconcile('/a');

    b.loadGate.resolve();
    await Promise.all([toB, toC, toA]);

    // C was superseded before its turn; B turned inactive while loading.
    expect(c.loads).toBe(0);
    expect(b.mounts).toHaveLength(0);
    expect(a.mounts).toHaveLength(2);
    expect(orchestrator.getMountedApps()).toEqual(['a']);
    expect(renderedApps()).toEqual(['a']);
  });

  it('A -> B -> A while B is mounting ends with only A mounted', async () => {
    create();
    const { b } = registerABC();
    await orchestrator.reconcile('/a');

    b.mountGate = deferred();
    const toB = orchestrator.reconcile('/b');
    await vi.waitFor(() => expect(log).toContain('mount:b'));
    const toA = orchestrator.reconcile('/a');

    b.mountGate.resolve();
    await Promise.all([toB, toA]);

    expect(b.mounts).toHaveLength(1);
    expect(b.unmounts).toBe(1);
    expect(orchestrator.getAppStatus('b')).toBe('unmounted');
    expect(orchestrator.getMountedApps()).toEqual(['a']);
    expect(renderedApps()).toEqual(['a']);
    // B's teardown finished before A rendered again.
    expect(log.indexOf('unmounted:b')).toBeLessThan(log.lastIndexOf('mount:a'));
  });

  it('A -> B -> A while A is unmounting remounts A and never mounts B', async () => {
    create();
    const { a, b } = registerABC();
    await orchestrator.reconcile('/a');

    a.unmountGate = deferred();
    const toB = orchestrator.reconcile('/b');
    await vi.waitFor(() => expect(log).toContain('unmount:a'));
    const toA = orchestrator.reconcile('/a');

    a.unmountGate.resolve();
    await Promise.all([toB, toA]);

    expect(b.loads).toBe(0);
    expect(orchestrator.getMountedApps()).toEqual(['a']);
    expect(renderedApps()).toEqual(['a']);
  });
});

describe('manual mount/unmount overlap', () => {
  it('unmountApp waits for an in-flight mount, then unmounts', async () => {
    create();
    const x = stubApp('x');
    x.mountGate = deferred();
    orchestrator.register({ name: 'x', entry: x.entry, container: '#main' });

    const mounting = orchestrator.mountApp('x');
    await vi.waitFor(() => expect(log).toContain('mount:x'));
    const unmounting = orchestrator.unmountApp('x');
    x.mountGate.resolve();
    // Resolving means the app is gone, not just that a request was queued.
    await unmounting;

    expect(log).toEqual(['mount:x', 'mounted:x', 'unmount:x', 'unmounted:x']);
    expect(orchestrator.getAppStatus('x')).toBe('unmounted');
    expect(renderedApps()).toEqual([]);
    await mounting;
  });

  it('unmountApp during load skips the mount entirely', async () => {
    create();
    const x = stubApp('x');
    x.loadGate = deferred();
    orchestrator.register({ name: 'x', entry: x.entry, container: '#main' });

    const mounting = orchestrator.mountApp('x');
    await vi.waitFor(() => expect(x.loads).toBe(1));
    const unmounting = orchestrator.unmountApp('x');
    x.loadGate.resolve();
    await Promise.all([mounting, unmounting]);

    expect(x.mounts).toHaveLength(0);
    expect(orchestrator.getAppStatus('x')).toBe('bootstrapped');
  });

  it('mountApp rejects with the mount error and renders the fallback', async () => {
    const onError = vi.fn();
    create({ onError });
    orchestrator.register({
      name: 'broken',
      entry: async () => ({
        mount: () => {
          throw new Error('boom');
        },
        unmount: () => {},
      }),
      container: '#main',
      fallback: '<p>down</p>',
    });

    await expect(orchestrator.mountApp('broken')).rejects.toThrow('boom');
    expect(orchestrator.getAppStatus('broken')).toBe('error');
    expect(document.querySelector('#main')!.innerHTML).toBe('<p>down</p>');
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 'broken');
  });

  it('updateAppProps waits for a pending mount and reaches the mounted instance', async () => {
    create();
    const x = stubApp('x');
    const update = vi.fn();
    x.module.update = update;
    x.mountGate = deferred();
    orchestrator.register({
      name: 'x',
      entry: x.entry,
      container: '#main',
      props: { theme: 'dark' },
    });

    const mounting = orchestrator.mountApp('x');
    await vi.waitFor(() => expect(log).toContain('mount:x'));
    const updating = orchestrator.updateAppProps('x', { user: 'ada' });
    x.mountGate.resolve();
    await Promise.all([mounting, updating]);

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0]?.[0]).toMatchObject({
      props: { theme: 'dark', user: 'ada' },
      container: document.querySelector('#main'),
    });
    expect(orchestrator.getAppStatus('x')).toBe('mounted');
  });
});

describe('mount context and event bus', () => {
  it('passes name, props and the orchestrator bus to mount', async () => {
    create();
    const x = stubApp('x');
    orchestrator.register({
      name: 'x',
      entry: x.entry,
      container: '#main',
      props: { n: 1 },
    });

    await orchestrator.mountApp('x');

    const ctx = x.mounts[0] as MountContext;
    expect(ctx.name).toBe('x');
    expect(ctx.props).toEqual({ n: 1 });
    expect(ctx.bus).toBe(orchestrator.getEventBus());
    expect(ctx.container).toBe(document.querySelector('#main'));
  });

  it('uses the global bus by default so getGlobalBus() sees orchestrator events', async () => {
    create();
    const seen = vi.fn();
    getGlobalBus().on('tuvix:app:mount', seen);
    const x = stubApp('x');
    orchestrator.register({ name: 'x', entry: x.entry, container: '#main' });

    await orchestrator.mountApp('x');

    expect(orchestrator.getEventBus()).toBe(getGlobalBus());
    expect(seen).toHaveBeenCalledWith({ name: 'x' });
  });

  it('leaves the global bus usable after destroy', async () => {
    create();
    await orchestrator.destroy();
    const handler = vi.fn();
    getGlobalBus().on('still-alive', handler);
    getGlobalBus().emit('still-alive', 1);
    expect(handler).toHaveBeenCalledWith(1);
  });

  it('creates and destroys a private bus when eventBus options are passed', async () => {
    create({ eventBus: {} });
    const bus = orchestrator.getEventBus();
    expect(bus).not.toBe(getGlobalBus());

    await orchestrator.destroy();
    expect(() => bus.emit('x')).toThrow(/destroyed/);
  });
});

describe('connectRouter', () => {
  function fakeRouter(initial: string) {
    const listeners = new Set<() => void>();
    let path = initial;
    const unsubscribe = vi.fn();
    const source: RouterSource = {
      subscribe(cb) {
        listeners.add(cb);
        return () => {
          unsubscribe();
          listeners.delete(cb);
        };
      },
      getPath: () => path,
    };
    return {
      source,
      unsubscribe,
      navigate(next: string) {
        path = next;
        for (const cb of listeners) cb();
      },
    };
  }

  it('reconciles on start and on every navigation the router reports', async () => {
    create();
    registerABC();
    const router = fakeRouter('/a');
    orchestrator.connectRouter(router.source);

    await orchestrator.start();
    expect(orchestrator.getMountedApps()).toEqual(['a']);

    router.navigate('/b?ref=nav');
    await vi.waitFor(() =>
      expect(orchestrator.getMountedApps()).toEqual(['b'])
    );
    expect(renderedApps()).toEqual(['b']);
  });

  it('reconciles right away when connected to a started orchestrator', async () => {
    create();
    registerABC();
    await orchestrator.start();
    expect(orchestrator.getMountedApps()).toEqual([]);

    orchestrator.connectRouter(fakeRouter('/c').source);
    await vi.waitFor(() =>
      expect(orchestrator.getMountedApps()).toEqual(['c'])
    );
  });

  it('stops following the router after disconnect', async () => {
    create();
    registerABC();
    const router = fakeRouter('/a');
    const disconnect = orchestrator.connectRouter(router.source);
    await orchestrator.start();

    disconnect();
    expect(router.unsubscribe).toHaveBeenCalledTimes(1);
    router.navigate('/b');
    await orchestrator.reconcile();

    // With the source gone, reconcile() falls back to window.location ('/').
    expect(orchestrator.getMountedApps()).toEqual([]);
    expect(log).not.toContain('mount:b');
  });

  it('unsubscribes on destroy', async () => {
    create();
    const router = fakeRouter('/');
    orchestrator.connectRouter(router.source);
    await orchestrator.destroy();
    expect(router.unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('loader options', () => {
  it('passes config.loader to the module loader', async () => {
    const attempt = vi.fn(async (): Promise<MicroAppModule> => {
      throw new Error('offline');
    });

    create({ loader: { retries: 2, retryDelay: 0 } });
    orchestrator.register({ name: 'x', entry: attempt, container: '#main' });
    await expect(orchestrator.mountApp('x')).rejects.toThrow('offline');

    // 1 attempt + 2 retries; the old orchestrator ignored config.loader.
    expect(attempt).toHaveBeenCalledTimes(3);
  });
});

describe('CSS sandbox', () => {
  const styleUrl = 'https://cdn.example.com/sandboxed/style.css';

  beforeEach(() => {
    unregisterModule('boxed');
  });

  it('mounts inside a shadow root, loads entry styles there and survives remount', async () => {
    create();
    const boxed = stubApp('boxed');
    registerModule('boxed', boxed.module);
    orchestrator.register({
      name: 'boxed',
      entry: { scripts: [], styles: [styleUrl] },
      container: '#main',
      sandbox: true,
    });
    const container = document.querySelector('#main') as HTMLElement;

    const mounting = orchestrator.mountApp('boxed');
    let link: HTMLLinkElement | null = null;
    await vi.waitFor(() => {
      link =
        container.shadowRoot?.querySelector<HTMLLinkElement>(
          `link[href="${styleUrl}"]`
        ) ?? null;
      expect(link).not.toBeNull();
    });
    // The app waits for its stylesheet before rendering.
    expect(boxed.mounts).toHaveLength(0);
    link!.dispatchEvent(new Event('load'));
    await mounting;

    expect(document.head.querySelector(`link[href="${styleUrl}"]`)).toBeNull();
    expect(container.querySelector('[data-app]')).toBeNull();
    expect(renderedApps()).toEqual(['boxed']);
    const target = boxed.mounts[0]?.container as HTMLElement;
    expect(target.getRootNode()).toBe(container.shadowRoot);

    const shadowRoot = container.shadowRoot;
    await orchestrator.unmountApp('boxed');
    expect(renderedApps()).toEqual([]);
    await orchestrator.mountApp('boxed');

    expect(container.shadowRoot).toBe(shadowRoot);
    expect(boxed.mounts[1]?.container.getRootNode()).toBe(shadowRoot);
    expect(
      shadowRoot!.querySelectorAll('[data-tuvix-sandbox-root]')
    ).toHaveLength(1);
    expect(renderedApps()).toEqual(['boxed']);
    expect(
      container.shadowRoot!.querySelectorAll(`link[href="${styleUrl}"]`)
    ).toHaveLength(1);
  });

  it('{ css: false } renders into the light DOM', async () => {
    create();
    const plain = stubApp('boxed');
    registerModule('boxed', plain.module);
    orchestrator.register({
      name: 'boxed',
      entry: { scripts: [] },
      container: '#main',
      sandbox: { css: false },
    });

    await orchestrator.mountApp('boxed');

    const container = document.querySelector('#main') as HTMLElement;
    expect(container.shadowRoot).toBeNull();
    expect(container.querySelector('[data-app="boxed"]')).not.toBeNull();
  });

  it.each([
    ['sandbox: true', true],
    ['sandbox: { css: true }', { css: true }],
  ] as const)(
    'a plain app mounted after a %s app in the same container is visible',
    async (_label, sandbox) => {
      create();
      const boxed = stubApp('boxed');
      const plain = stubApp('plain');
      orchestrator.register({
        name: 'boxed',
        entry: boxed.entry,
        container: '#main',
        activeWhen: '/boxed',
        sandbox,
      });
      orchestrator.register({
        name: 'plain',
        entry: plain.entry,
        container: '#main',
        activeWhen: '/plain',
      });
      const container = document.querySelector('#main') as HTMLElement;

      await orchestrator.reconcile('/boxed');
      expect(boxed.mounts[0]?.container.getRootNode()).toBe(
        container.shadowRoot
      );

      await orchestrator.reconcile('/plain');

      // The shadow root cannot be removed; it must now pass light DOM through.
      const shadowRoot = container.shadowRoot!;
      expect(shadowRoot.querySelector('[data-tuvix-sandbox-root]')).toBeNull();
      const slot = shadowRoot.querySelector('slot');
      expect(slot).not.toBeNull();
      const rendered = container.querySelector('[data-app="plain"]');
      expect(rendered?.parentElement).toBe(container);
      expect(slot!.assignedNodes()).toContain(rendered);

      // And the sandboxed app still isolates when it comes back.
      await orchestrator.reconcile('/boxed');
      expect(shadowRoot.querySelector('slot')).toBeNull();
      expect(boxed.mounts[1]?.container.getRootNode()).toBe(shadowRoot);
      expect(renderedApps()).toEqual(['boxed']);
    }
  );

  it('does not wrap the container when the mount is skipped during load', async () => {
    create();
    const boxed = stubApp('boxed');
    boxed.loadGate = deferred();
    orchestrator.register({
      name: 'boxed',
      entry: boxed.entry,
      container: '#main',
      sandbox: true,
    });

    const mounting = orchestrator.mountApp('boxed');
    await vi.waitFor(() => expect(boxed.loads).toBe(1));
    const unmounting = orchestrator.unmountApp('boxed');
    boxed.loadGate.resolve();
    await Promise.all([mounting, unmounting]);

    expect(boxed.mounts).toHaveLength(0);
    expect(document.querySelector('#main')!.shadowRoot).toBeNull();
  });
});

describe('prefetching', () => {
  function prefetchLinks(url: string): number {
    return document.head.querySelectorAll(`link[href="${url}"]`).length;
  }

  it("'hover' prefetches only the app a hovered link activates, once", async () => {
    const aUrl = 'https://cdn.example.com/hover-a.js';
    const bUrl = 'https://cdn.example.com/hover-b.js';
    create({ prefetch: { strategy: 'hover' } });
    orchestrator.register({
      name: 'a',
      entry: aUrl,
      container: '#main',
      activeWhen: '/a',
    });
    orchestrator.register({
      name: 'b',
      entry: bUrl,
      container: '#main',
      activeWhen: '/b/*',
    });
    await orchestrator.start();

    // The old strategy prefetched everything on the first mouseover anywhere.
    document.body.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(prefetchLinks(aUrl) + prefetchLinks(bUrl)).toBe(0);

    const link = document.createElement('a');
    link.href = '/b/pricing?plan=pro';
    document.body.appendChild(link);
    link.dispatchEvent(new Event('pointerenter'));
    link.dispatchEvent(new Event('pointerenter'));

    expect(prefetchLinks(bUrl)).toBe(1);
    expect(prefetchLinks(aUrl)).toBe(0);
  });

  it("'hover' listeners are removed on destroy", async () => {
    const url = 'https://cdn.example.com/hover-destroyed.js';
    create({ prefetch: { strategy: 'hover' } });
    orchestrator.register({
      name: 'a',
      entry: url,
      container: '#main',
      activeWhen: '/a',
    });
    await orchestrator.start();
    await orchestrator.destroy();

    const link = document.createElement('a');
    link.href = '/a';
    document.body.appendChild(link);
    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(prefetchLinks(url)).toBe(0);
  });

  it("'idle' prefetch is cancelled by destroy", async () => {
    const url = 'https://cdn.example.com/idle.js';
    const callbacks = new Map<number, () => void>();
    let nextHandle = 1;
    const win = window as unknown as {
      requestIdleCallback?: unknown;
      cancelIdleCallback?: unknown;
    };
    const originalRequest = win.requestIdleCallback;
    const originalCancel = win.cancelIdleCallback;
    win.requestIdleCallback = (cb: () => void) => {
      callbacks.set(nextHandle, cb);
      return nextHandle++;
    };
    win.cancelIdleCallback = (handle: number) => callbacks.delete(handle);

    try {
      create({ prefetch: { strategy: 'idle' } });
      orchestrator.register({
        name: 'a',
        entry: url,
        container: '#main',
        activeWhen: '/a',
      });
      await orchestrator.start();
      expect(callbacks.size).toBe(1);

      await orchestrator.destroy();
      expect(callbacks.size).toBe(0);
      expect(prefetchLinks(url)).toBe(0);
    } finally {
      win.requestIdleCallback = originalRequest;
      win.cancelIdleCallback = originalCancel;
    }
  });

  it("'idle' prefetch runs when the browser goes idle", async () => {
    const url = 'https://cdn.example.com/idle-runs.js';
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const win = window as unknown as { requestIdleCallback?: unknown };
    const originalRequest = win.requestIdleCallback;
    win.requestIdleCallback = undefined;

    try {
      create({ prefetch: { strategy: 'idle' } });
      orchestrator.register({
        name: 'a',
        entry: url,
        container: '#main',
        activeWhen: '/a',
      });
      await orchestrator.start();
      expect(prefetchLinks(url)).toBe(0);

      vi.advanceTimersByTime(250);
      expect(prefetchLinks(url)).toBe(1);
    } finally {
      win.requestIdleCallback = originalRequest;
      vi.useRealTimers();
    }
  });
});

describe('destroy', () => {
  it('waits for a running reconcile and leaves nothing mounted', async () => {
    create();
    const { a } = registerABC();
    a.mountGate = deferred();
    const toA = orchestrator.reconcile('/a');
    await vi.waitFor(() => expect(log).toContain('mount:a'));

    const destroying = orchestrator.destroy();
    a.mountGate.resolve();
    await Promise.all([toA, destroying]);

    expect(log).toEqual(['mount:a', 'mounted:a', 'unmount:a', 'unmounted:a']);
    expect(renderedApps()).toEqual([]);
  });
});

describe('lifecycle failures', () => {
  function errorEvents(): Array<{ name: string; phase: string; error: Error }> {
    const seen: Array<{ name: string; phase: string; error: Error }> = [];
    orchestrator
      .getEventBus()
      .on<{ name: string; phase: string; error: Error }>(
        'tuvix:app:error',
        (e) => seen.push(e)
      );
    return seen;
  }

  it('runs bootstrap again on the next mount after it threw', async () => {
    create();
    const x = stubApp('x');
    let attempts = 0;
    x.module.bootstrap = () => {
      attempts += 1;
      if (attempts === 1) throw new Error('config fetch failed');
    };
    orchestrator.register({ name: 'x', entry: x.entry, container: '#main' });
    const seen = errorEvents();

    await expect(orchestrator.mountApp('x')).rejects.toThrow(
      'config fetch failed'
    );
    expect(x.mounts).toHaveLength(0);
    expect(seen.map((e) => e.phase)).toEqual(['bootstrap']);

    await orchestrator.mountApp('x');

    expect(attempts).toBe(2);
    expect(orchestrator.getAppStatus('x')).toBe('mounted');
    expect(renderedApps()).toEqual(['x']);

    // A successful bootstrap is not repeated on remount.
    await orchestrator.unmountApp('x');
    await orchestrator.mountApp('x');
    expect(attempts).toBe(2);
  });

  it('emits tuvix:app:error with the phase for load, mount, update and unmount failures', async () => {
    const onError = vi.fn();
    create({ onError });
    const seen = errorEvents();

    orchestrator.register({
      name: 'offline',
      entry: async (): Promise<MicroAppModule> => {
        throw new Error('404');
      },
      container: '#main',
    });
    await expect(orchestrator.mountApp('offline')).rejects.toThrow('404');

    orchestrator.register({
      name: 'no-render',
      entry: async () => ({
        mount: () => {
          throw new Error('render');
        },
        unmount: () => {},
      }),
      container: '#side',
    });
    await expect(orchestrator.mountApp('no-render')).rejects.toThrow('render');

    const flaky = stubApp('flaky');
    flaky.module.update = () => {
      throw new Error('bad props');
    };
    orchestrator.register({
      name: 'flaky',
      entry: flaky.entry,
      container: '#main',
    });
    await orchestrator.mountApp('flaky');
    await expect(
      orchestrator.updateAppProps('flaky', { a: 1 })
    ).rejects.toThrow('bad props');

    const sticky = stubApp('sticky');
    sticky.module.unmount = () => {
      throw new Error('stuck');
    };
    orchestrator.register({
      name: 'sticky',
      entry: sticky.entry,
      container: '#side',
    });
    await orchestrator.mountApp('sticky');
    await expect(orchestrator.unmountApp('sticky')).rejects.toThrow('stuck');

    expect(seen.map((e) => [e.name, e.phase, e.error.message])).toEqual([
      ['offline', 'load', '404'],
      ['no-render', 'mount', 'render'],
      ['flaky', 'update', 'bad props'],
      ['sticky', 'unmount', 'stuck'],
    ]);
    expect(onError.mock.calls.map((c) => c[1])).toEqual([
      'offline',
      'no-render',
      'flaky',
      'sticky',
    ]);
  });
});

describe('register after start', () => {
  it('mounts a routed app registered later when the current path activates it', async () => {
    create();
    const router = { path: '/late/page', listeners: new Set<() => void>() };
    orchestrator.connectRouter({
      subscribe: (cb) => {
        router.listeners.add(cb);
        return () => router.listeners.delete(cb);
      },
      getPath: () => router.path,
    });
    await orchestrator.start();

    const late = stubApp('late');
    const other = stubApp('other');
    orchestrator.register({
      name: 'late',
      entry: late.entry,
      container: '#main',
      activeWhen: '/late',
    });
    orchestrator.register({
      name: 'other',
      entry: other.entry,
      container: '#side',
      activeWhen: '/other',
    });

    await vi.waitFor(() =>
      expect(orchestrator.getMountedApps()).toEqual(['late'])
    );
    expect(renderedApps()).toEqual(['late']);
    expect(other.loads).toBe(0);
  });

  it('observes a mountWhenVisible app registered later, even with no viewport app at start', async () => {
    const observed: Element[] = [];
    let trigger: ((entries: IntersectionObserverEntry[]) => void) | null = null;
    class FakeObserver {
      constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
        trigger = cb;
      }
      observe(el: Element): void {
        observed.push(el);
      }
      unobserve(): void {}
      disconnect(): void {}
    }
    vi.stubGlobal('IntersectionObserver', FakeObserver);

    try {
      create();
      await orchestrator.start();

      const lazy = stubApp('lazy');
      orchestrator.register({
        name: 'lazy',
        entry: lazy.entry,
        container: '#side',
        mountWhenVisible: true,
      });
      const side = document.querySelector('#side') as HTMLElement;
      expect(observed).toEqual([side]);

      // Only the two fields the orchestrator reads.
      const entry = { isIntersecting: true, target: side };
      trigger!([entry as unknown as IntersectionObserverEntry]);
      await vi.waitFor(() =>
        expect(orchestrator.getAppStatus('lazy')).toBe('mounted')
      );
      expect(renderedApps('#side')).toEqual(['lazy']);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('unregister during navigation', () => {
  it('a reconcile that arrives while unregister unmounts does not mount the app again', async () => {
    create();
    const { a } = registerABC();
    await orchestrator.reconcile('/a');

    a.unmountGate = deferred();
    const removing = orchestrator.unregister('a');
    await vi.waitFor(() => expect(log).toContain('unmount:a'));
    // Navigation back to /a while A is still tearing down.
    const navigating = orchestrator.reconcile('/a');
    a.unmountGate.resolve();
    await Promise.all([removing, navigating]);

    expect(a.mounts).toHaveLength(1);
    expect(renderedApps()).toEqual([]);
    expect(orchestrator.getRegisteredApps()).toEqual(['b', 'c']);
    expect(orchestrator.getAppStatus('a')).toBeNull();
    await expect(orchestrator.mountApp('a')).rejects.toThrow(/not registered/);
  });
});

describe('hover prefetch link resolution', () => {
  function prefetchLinks(url: string): number {
    return document.head.querySelectorAll(`link[href="${url}"]`).length;
  }

  it('strips the router base and ignores SVG links', async () => {
    const url = 'https://cdn.example.com/hover-base.js';
    window.history.replaceState(null, '', '/app');
    create({
      router: { base: '/app', routes: [] },
      prefetch: { strategy: 'hover' },
    });
    orchestrator.register({
      name: 'docs',
      entry: url,
      container: '#main',
      activeWhen: '/docs',
    });
    await orchestrator.start();

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const svgLink = document.createElementNS('http://www.w3.org/2000/svg', 'a');
    svgLink.setAttribute('href', '/app/docs');
    svg.appendChild(svgLink);
    document.body.appendChild(svg);
    svgLink.dispatchEvent(new Event('pointerenter'));
    expect(prefetchLinks(url)).toBe(0);

    const outside = document.createElement('a');
    outside.href = '/docs';
    document.body.appendChild(outside);
    outside.dispatchEvent(new Event('pointerenter'));
    expect(prefetchLinks(url)).toBe(0);

    const inside = document.createElement('a');
    inside.href = '/app/docs/intro';
    document.body.appendChild(inside);
    inside.dispatchEvent(new Event('pointerenter'));
    expect(prefetchLinks(url)).toBe(1);
  });
});
