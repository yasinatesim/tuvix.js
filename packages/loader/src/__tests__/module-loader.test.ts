import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fakeResources, tick, type FakeResources } from './fake-resources';
import type * as Loader from '../index';
import type { MicroAppModule } from '../types';
import { normalizeEntry, delay, withTimeout, withRetry } from '../utils';

// ─── Utils ────────────────────────────────────────

describe('normalizeEntry', () => {
  it('should convert string entry to EntryConfig', () => {
    const result = normalizeEntry('https://cdn.example.com/app.js');
    expect(result).toEqual({ scripts: ['https://cdn.example.com/app.js'] });
  });

  it('should return EntryConfig as-is', () => {
    const config = {
      scripts: ['https://cdn.example.com/app.js'],
      styles: ['https://cdn.example.com/app.css'],
    };
    expect(normalizeEntry(config)).toBe(config);
  });
});

describe('delay', () => {
  it('should wait for specified ms', async () => {
    const start = Date.now();
    await delay(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});

describe('withTimeout', () => {
  it('should resolve if fn completes in time', async () => {
    const result = await withTimeout(() => Promise.resolve('done'), 1000);
    expect(result).toBe('done');
  });

  it('rejects and aborts the signal it gave fn when time runs out', async () => {
    let seen: AbortSignal | undefined;
    await expect(
      withTimeout(
        (signal) => {
          seen = signal;
          return new Promise((resolve) => setTimeout(resolve, 500));
        },
        10,
        'Timed out!'
      )
    ).rejects.toThrow('Timed out!');
    expect(seen?.aborted).toBe(true);
    expect((seen?.reason as Error).message).toBe('Timed out!');
  });

  it('should skip timeout if timeoutMs is 0', async () => {
    const result = await withTimeout(() => Promise.resolve('instant'), 0);
    expect(result).toBe('instant');
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const result = await withRetry(() => Promise.resolve('ok'), 3, 10);
    expect(result).toBe('ok');
  });

  it('should retry on failure', async () => {
    let attempt = 0;
    const result = await withRetry(
      () => {
        attempt++;
        if (attempt < 3) throw new Error('fail');
        return Promise.resolve('success');
      },
      3,
      10
    );
    expect(result).toBe('success');
    expect(attempt).toBe(3);
  });

  it('should throw after all retries exhausted', async () => {
    await expect(
      withRetry(() => Promise.reject(new Error('always fail')), 2, 10)
    ).rejects.toThrow('always fail');
  });
});

// ─── ModuleLoader ─────────────────────────────────

// The loader keeps per-URL and claimed-global state at module level, and the
// registry lives on window. Each test gets a fresh copy of both.
let lib: typeof Loader;
let server: FakeResources | undefined;
const win = window as unknown as Record<string, unknown>;
const testGlobals = new Set<string>();

function setGlobal(key: string, value: unknown): void {
  testGlobals.add(key);
  win[key] = value;
}

function fakeApp(label = 'app'): MicroAppModule & { label: string } {
  return {
    label,
    mount: vi.fn(({ container }) => {
      container.textContent = label;
    }),
    unmount: vi.fn(({ container }) => {
      container.textContent = '';
    }),
  };
}

function scripts(): string[] {
  return Array.from(document.head.querySelectorAll('script')).map(
    (s) => s.getAttribute('src') ?? ''
  );
}

function stylesheets(): string[] {
  return Array.from(
    document.head.querySelectorAll('link[rel="stylesheet"]')
  ).map((l) => l.getAttribute('href') ?? '');
}

beforeEach(async () => {
  delete win.__TUVIX_RUNTIME__;
  delete win.__TUVIX_MODULES__;
  document.head.innerHTML = '';
  vi.resetModules();
  lib = await import('../index');
});

afterEach(() => {
  server?.stop();
  server = undefined;
  for (const key of testGlobals) delete win[key];
  testGlobals.clear();
  document.head.innerHTML = '';
});

describe('ModuleLoader: loader-function entries', () => {
  it('loads a module returned by the function and mounts it', async () => {
    const app = fakeApp('hello');
    const loader = new lib.ModuleLoader();
    const result = await loader.load('hello', async () => app);

    expect(result.status).toBe('loaded');
    expect(result.module).toBe(app);
    const container = document.createElement('div');
    await result.module!.mount({ container });
    expect(container.textContent).toBe('hello');
    expect(loader.getStatus('hello')).toBe('loaded');
  });

  it('unwraps an ES module namespace with a default export', async () => {
    const app = fakeApp();
    const loader = new lib.ModuleLoader();
    const result = await loader.load('ns', async () => ({ default: app }));
    expect(result.module).toBe(app);
  });

  it('falls back to the module the import registered', async () => {
    const app = fakeApp();
    const loader = new lib.ModuleLoader();
    const result = await loader.load('side-effect', async () => {
      lib.registerModule('side-effect', app);
      return {} as { default: MicroAppModule };
    });
    expect(result.module).toBe(app);
  });

  it('reports an error when the function yields no module', async () => {
    const loader = new lib.ModuleLoader({ retries: 0 });
    const result = await loader.load('empty', async () => ({}) as never);
    expect(result.status).toBe('error');
    expect(result.error?.message).toContain('loader function for "empty"');
    expect(loader.isLoaded('empty')).toBe(false);
  });

  it('passes a signal that aborts when the attempt times out, then retries', async () => {
    const app = fakeApp();
    const signals: AbortSignal[] = [];
    const loader = new lib.ModuleLoader({
      timeout: 20,
      retries: 1,
      retryDelay: 0,
    });
    const result = await loader.load('slow', ({ signal }) => {
      signals.push(signal);
      return signals.length === 1
        ? new Promise(() => undefined)
        : Promise.resolve(app);
    });

    expect(result.module).toBe(app);
    expect(signals.map((s) => s.aborted)).toEqual([true, false]);
  });

  it('calls the function once for concurrent loads of one name', async () => {
    const app = fakeApp();
    const entry = vi.fn(async () => app);
    const loader = new lib.ModuleLoader();
    const [a, b] = await Promise.all([
      loader.load('once', entry),
      loader.load('once', entry),
    ]);
    expect(entry).toHaveBeenCalledTimes(1);
    expect(a.module).toBe(b.module);
  });
});

describe('ModuleLoader: script entries', () => {
  it('appends the script and resolves the module it registers', async () => {
    const app = fakeApp();
    server = fakeResources({
      '/app.js': () => lib.registerModule('app', app),
    });
    const loader = new lib.ModuleLoader();
    const result = await loader.load('app', '/app.js');

    expect(result.status).toBe('loaded');
    expect(result.module).toBe(app);
    expect(scripts()).toEqual(['/app.js']);
  });

  it('applies EntryConfig.type and integrity to the tags', async () => {
    server = fakeResources({
      '/assets/index.js': () => lib.registerModule('vite', fakeApp()),
    });
    const loader = new lib.ModuleLoader();
    await loader.load('vite', {
      scripts: ['/assets/index.js'],
      styles: ['/assets/index.css'],
      type: 'module',
      integrity: {
        '/assets/index.js': 'sha384-js',
        '/assets/index.css': 'sha384-css',
      },
    });

    const script = document.head.querySelector('script')!;
    const link = document.head.querySelector('link')!;
    expect(script.type).toBe('module');
    expect(script.integrity).toBe('sha384-js');
    expect(link.integrity).toBe('sha384-css');
  });

  it('loads different apps in parallel', async () => {
    const fast = fakeApp('fast');
    server = fakeResources({
      '/slow.js': () => 'hang',
      '/fast.js': () => lib.registerModule('fast', fast),
    });
    const loader = new lib.ModuleLoader();

    const slow = loader.load('slow', '/slow.js');
    const fastResult = await loader.load('fast', '/fast.js');

    // A serialized loader would still be waiting on /slow.js here.
    expect(fastResult.module).toBe(fast);
    expect(loader.getStatus('slow')).toBe('loading');

    lib.registerModule('slow', fakeApp('slow'));
    server.release('/slow.js');
    expect((await slow).status).toBe('loaded');
  });

  it('fetches a script shared by two entries once, and runs scripts in order', async () => {
    server = fakeResources({
      '/vendor.js': () => 'hang',
      '/a.js': () => lib.registerModule('a', fakeApp('a')),
      '/b.js': () => lib.registerModule('b', fakeApp('b')),
    });
    const loader = new lib.ModuleLoader();
    const a = loader.load('a', { scripts: ['/vendor.js', '/a.js'] });
    const b = loader.load('b', { scripts: ['/vendor.js', '/b.js'] });
    await tick();
    // Each entry's own script waits for vendor.js.
    expect(server.requests).toEqual(['/vendor.js']);
    server.release('/vendor.js');

    const results = await Promise.all([a, b]);
    expect(results.map((r) => r.status)).toEqual(['loaded', 'loaded']);
    expect(server.requests.filter((u) => u === '/vendor.js')).toHaveLength(1);
  });

  it('removes a failed script and retries with a new element', async () => {
    const app = fakeApp();
    let first: HTMLElement | undefined;
    server = fakeResources({
      '/flaky.js': (element) => {
        if (!first) {
          first = element;
          return 'error';
        }
        lib.registerModule('flaky', app);
      },
    });
    const loader = new lib.ModuleLoader({ retries: 1, retryDelay: 0 });
    const result = await loader.load('flaky', '/flaky.js');

    expect(result.module).toBe(app);
    expect(server.requests).toEqual(['/flaky.js', '/flaky.js']);
    const tags = document.head.querySelectorAll('script');
    expect(tags).toHaveLength(1);
    expect(tags[0]).not.toBe(first);
    expect(first?.isConnected).toBe(false);
  });

  it('removes the script of a timed-out attempt and retries with a new tag', async () => {
    const app = fakeApp();
    let attempt = 0;
    server = fakeResources({
      '/hang.js': () => {
        attempt++;
        if (attempt === 1) return 'hang';
        lib.registerModule('hang', app);
      },
    });
    const loader = new lib.ModuleLoader({
      timeout: 20,
      retries: 1,
      retryDelay: 0,
    });
    const result = await loader.load('hang', '/hang.js');

    expect(result.module).toBe(app);
    expect(server.requests).toEqual(['/hang.js', '/hang.js']);
    expect(scripts()).toEqual(['/hang.js']);
  });

  it('reports a timeout and leaves no script or stylesheet behind', async () => {
    server = fakeResources({
      '/never.js': () => 'hang',
      '/never.css': () => 'hang',
    });
    const loader = new lib.ModuleLoader({ timeout: 20, retries: 0 });
    const result = await loader.load('never', {
      scripts: ['/never.js'],
      styles: ['/never.css'],
    });

    expect(result.status).toBe('error');
    expect(result.error?.message).toContain('timed out after 20ms');
    expect(scripts()).toEqual([]);
    expect(stylesheets()).toEqual([]);
  });

  it('keeps a script another app still waits for when one load times out', async () => {
    server = fakeResources({
      '/vendor.js': () => 'hang',
      '/b.js': () => lib.registerModule('b', fakeApp('b')),
    });
    const impatient = new lib.ModuleLoader({ timeout: 20, retries: 0 });
    const patient = new lib.ModuleLoader({ timeout: 0 });
    const a = impatient.load('a', { scripts: ['/vendor.js', '/a.js'] });
    const b = patient.load('b', { scripts: ['/vendor.js', '/b.js'] });

    expect((await a).status).toBe('error');
    expect(scripts()).toEqual(['/vendor.js']);

    server.release('/vendor.js');
    expect((await b).status).toBe('loaded');
  });

  it('writes LoaderOptions.globals before the script runs', async () => {
    const shared = { version: '18' };
    let seen: unknown;
    server = fakeResources({
      '/needs-global.js': () => {
        seen = win.SharedReact;
        lib.registerModule('needs-global', fakeApp());
      },
    });
    testGlobals.add('SharedReact');
    const loader = new lib.ModuleLoader({ globals: { SharedReact: shared } });
    await loader.load('needs-global', '/needs-global.js');
    expect(seen).toBe(shared);
  });

  it('explains a script entry that exposes no module', async () => {
    server = fakeResources();
    const loader = new lib.ModuleLoader({ retries: 0 });
    const result = await loader.load('silent', '/silent.js');
    expect(result.status).toBe('error');
    expect(result.error?.message).toContain(
      'Module "silent" loaded but no exports found'
    );
  });

  it('rejects a module without unmount', async () => {
    const loader = new lib.ModuleLoader({ retries: 0 });
    const result = await loader.load(
      'half',
      async () =>
        ({
          mount: () => undefined,
        }) as unknown as MicroAppModule
    );
    expect(result.status).toBe('error');
    expect(result.error?.message).toContain('missing required "unmount"');
    expect(loader.isLoaded('half')).toBe(false);
  });
});

describe('ModuleLoader: UMD globals', () => {
  it('resolves a global the script added', async () => {
    const app = fakeApp();
    server = fakeResources({ '/umd.js': () => setGlobal('UmdApp', app) });
    const loader = new lib.ModuleLoader();
    expect((await loader.load('umd', '/umd.js')).module).toBe(app);
  });

  it('gives each parallel load the global its own script defined', async () => {
    const a = fakeApp('a');
    const b = fakeApp('b');
    server = fakeResources({
      '/a.js': () => setGlobal('BundleA', a),
      '/a.css': () => 'hang',
      '/b.js': () => setGlobal('BundleB', b),
    });
    const loader = new lib.ModuleLoader();
    const aLoad = loader.load('one', {
      scripts: ['/a.js'],
      styles: ['/a.css'],
    });
    const bLoad = loader.load('two', '/b.js');

    // Both scripts have run; app "one" still waits for its stylesheet.
    expect((await bLoad).module).toBe(b);
    server.release('/a.css');
    expect((await aLoad).module).toBe(a);
  });

  it('resolves globals of scripts that finish in reverse order', async () => {
    const first = fakeApp('first');
    const second = fakeApp('second');
    server = fakeResources({
      '/first.js': () => 'hang',
      '/second.js': () => 'hang',
    });
    const loader = new lib.ModuleLoader();
    const firstLoad = loader.load('one', '/first.js');
    const secondLoad = loader.load('two', '/second.js');
    await tick();

    server.release('/second.js', () => setGlobal('SecondBundle', second));
    server.release('/first.js', () => setGlobal('FirstBundle', first));

    expect((await firstLoad).module).toBe(first);
    expect((await secondLoad).module).toBe(second);
  });

  it('picks the global named after the app when a script defines several', async () => {
    const header = fakeApp('header');
    server = fakeResources({
      '/header.js': () => {
        setGlobal('HeaderWidgets', fakeApp('widgets'));
        setGlobal('SiteHeader', header);
      },
    });
    const loader = new lib.ModuleLoader();
    expect((await loader.load('site-header', '/header.js')).module).toBe(
      header
    );
  });

  it('fails instead of guessing between unrelated globals', async () => {
    server = fakeResources({
      '/two-globals.js': () => {
        setGlobal('Alpha', fakeApp());
        setGlobal('Beta', fakeApp());
      },
    });
    const loader = new lib.ModuleLoader({ retries: 0 });
    const result = await loader.load('gamma', '/two-globals.js');
    expect(result.status).toBe('error');
    expect(result.error?.message).toContain('Alpha, Beta');
  });

  it('does not hand a claimed global from a shared script to a second app', async () => {
    const app = fakeApp();
    server = fakeResources({ '/bundle.js': () => setGlobal('Shared', app) });
    const loader = new lib.ModuleLoader({ retries: 0 });
    expect((await loader.load('first', '/bundle.js')).module).toBe(app);
    const second = await loader.load('second', '/bundle.js');
    expect(second.status).toBe('error');
  });

  it('resolves the new object after unload when the script assigns the same global again', async () => {
    let runs = 0;
    server = fakeResources({
      '/umd.js': () => setGlobal('Reloadable', fakeApp(`run ${++runs}`)),
    });
    const loader = new lib.ModuleLoader({ retries: 0 });
    const first = await loader.load('reloadable', '/umd.js');
    loader.unload('reloadable');

    const second = await loader.load('reloadable', '/umd.js');
    expect(runs).toBe(2);
    expect(second.module).toBe(win.Reloadable);
    expect(second.module).not.toBe(first.module);
  });
});

describe('ModuleLoader: styles and unload', () => {
  it('removeStyles takes the stylesheet out and load waits for it to return', async () => {
    let cssRequests = 0;
    server = fakeResources({
      '/shop.js': () => lib.registerModule('shop', fakeApp()),
      '/shop.css': () => (++cssRequests === 2 ? 'hang' : undefined),
    });
    const loader = new lib.ModuleLoader();
    const entry = { scripts: ['/shop.js'], styles: ['/shop.css'] };
    await loader.load('shop', entry);
    expect(stylesheets()).toEqual(['/shop.css']);

    loader.removeStyles('shop');
    expect(stylesheets()).toEqual([]);

    let settled = false;
    const again = loader.load('shop', entry).then((r) => {
      settled = true;
      return r;
    });
    await tick();
    expect(stylesheets()).toEqual(['/shop.css']);
    expect(settled).toBe(false);

    server.release('/shop.css');
    expect((await again).status).toBe('loaded');
    expect(server.requests.filter((u) => u === '/shop.js')).toHaveLength(1);
  });

  it('keeps a stylesheet only while another attached app uses it', async () => {
    const loader = new lib.ModuleLoader();
    server = fakeResources();
    lib.registerModule('a', fakeApp());
    lib.registerModule('b', fakeApp());
    await loader.load('a', { scripts: [], styles: ['/base.css', '/a.css'] });
    await loader.load('b', { scripts: [], styles: ['/base.css'] });

    loader.removeStyles('a');
    expect(stylesheets()).toEqual(['/base.css']);
    loader.removeStyles('b');
    expect(stylesheets()).toEqual([]);
  });

  it('unload unregisters the module and removes its tags', async () => {
    let runs = 0;
    server = fakeResources({
      '/re.js': () => {
        runs++;
        lib.registerModule('re', fakeApp(`run ${runs}`));
      },
    });
    const loader = new lib.ModuleLoader();
    const entry = { scripts: ['/re.js'], styles: ['/re.css'] };
    const first = await loader.load('re', entry);

    loader.unload('re');
    expect(lib.getRegisteredModule('re')).toBeUndefined();
    expect(scripts()).toEqual([]);
    expect(stylesheets()).toEqual([]);
    expect(loader.isLoaded('re')).toBe(false);

    const second = await loader.load('re', entry);
    expect(runs).toBe(2);
    expect(second.module).not.toBe(first.module);
    expect(second.module?.label).toBe('run 2');
  });

  it('unload leaves a module registered by someone else', async () => {
    const mine = fakeApp('mine');
    const theirs = fakeApp('theirs');
    const loader = new lib.ModuleLoader();
    await loader.load('x', async () => mine);
    lib.registerModule('x', theirs);

    loader.unload('x');
    expect(lib.getRegisteredModule('x')).toBe(theirs);
  });

  it('clearCache unloads every module', async () => {
    server = fakeResources({
      '/a.js': () => lib.registerModule('a', fakeApp()),
      '/b.js': () => lib.registerModule('b', fakeApp()),
    });
    const loader = new lib.ModuleLoader();
    await loader.load('a', '/a.js');
    await loader.load('b', '/b.js');
    expect(loader.getCachedNames()).toEqual(['a', 'b']);

    loader.clearCache();
    expect(loader.getCachedNames()).toEqual([]);
    expect(lib.getRegisteredModule('a')).toBeUndefined();
    expect(lib.getRegisteredModule('b')).toBeUndefined();
    expect(scripts()).toEqual([]);
  });
});

describe('ModuleLoader: prefetch', () => {
  function prefetchLinks(): string[][] {
    return Array.from(document.head.querySelectorAll('link')).map((l) => [
      l.rel,
      l.getAttribute('href') ?? '',
    ]);
  }

  it('uses modulepreload for module entries and prefetch for styles', () => {
    const loader = new lib.ModuleLoader();
    loader.prefetch({
      scripts: ['/assets/index.js'],
      styles: ['/assets/index.css'],
      type: 'module',
    });
    expect(prefetchLinks()).toEqual([
      ['modulepreload', '/assets/index.js'],
      ['prefetch', '/assets/index.css'],
    ]);
  });

  it('does nothing for loader-function entries', () => {
    const entry = vi.fn(async () => fakeApp());
    new lib.ModuleLoader().prefetch(entry);
    expect(entry).not.toHaveBeenCalled();
    expect(prefetchLinks()).toEqual([]);
  });
});

describe('createLoader', () => {
  it('passes options to the ModuleLoader it creates', async () => {
    const loader = lib.createLoader({ timeout: 20, retries: 0 });
    expect(loader).toBeInstanceOf(lib.ModuleLoader);
    const result = await loader.load(
      'hangs',
      () => new Promise(() => undefined)
    );
    expect(result.error?.message).toContain('timed out after 20ms');
  });
});
