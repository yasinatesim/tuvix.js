import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fakeResources, tick, type FakeResources } from './fake-resources';
import type * as ScriptLoader from '../script-loader';

// script-loader keeps per-URL state at module level. Each test imports a fresh
// copy after vi.resetModules(), so tests do not depend on run order.
let sl: typeof ScriptLoader;
let server: FakeResources | undefined;

beforeEach(async () => {
  vi.resetModules();
  sl = await import('../script-loader');
  document.head.innerHTML = '';
});

afterEach(() => {
  server?.stop();
  server = undefined;
  document.head.innerHTML = '';
});

function scripts(): HTMLScriptElement[] {
  return Array.from(document.head.querySelectorAll('script'));
}

function links(): HTMLLinkElement[] {
  return Array.from(document.head.querySelectorAll('link'));
}

describe('loadScript: script type', () => {
  it.each([
    ['/src/apps/home/main.tsx', 'module'],
    ['/src/shell.ts', 'module'],
    ['/src/util.mts', 'module'],
    ['/dist/app.mjs', 'module'],
    ['/src/App.jsx', 'module'],
    ['/src/main.tsx?v=abc123', 'module'],
    ['/dist/bundle.umd.js', 'text/javascript'],
    ['/dist/bundle.js?v=1', 'text/javascript'],
  ])('infers %s as %s', async (url, type) => {
    server = fakeResources();
    await sl.loadScript(url);
    expect(scripts().map((s) => s.type)).toEqual([type]);
  });

  it('honours an explicit type over the extension', async () => {
    server = fakeResources();
    await sl.loadScript('/assets/vite-entry.js', { type: 'module' });
    await sl.loadScript('/legacy.mjs', { type: 'classic' });
    expect(scripts().map((s) => s.type)).toEqual(['module', 'text/javascript']);
  });

  it('sets integrity from a string or an options object', async () => {
    server = fakeResources();
    await sl.loadScript('/a.js', 'sha384-aaa');
    await sl.loadScript('/b.js', { integrity: 'sha384-bbb' });
    expect(scripts().map((s) => s.integrity)).toEqual([
      'sha384-aaa',
      'sha384-bbb',
    ]);
  });
});

describe('loadScript: dedupe, failure, abort', () => {
  it('shares one tag between concurrent calls for the same URL', async () => {
    server = fakeResources({ '/app.js': () => 'hang' });
    const first = sl.loadScript('/app.js');
    const second = sl.loadScript('/app.js');
    await tick();
    expect(scripts()).toHaveLength(1);

    server.release('/app.js');
    await expect(Promise.all([first, second])).resolves.toEqual([
      undefined,
      undefined,
    ]);

    await sl.loadScript('/app.js');
    expect(server.requests).toEqual(['/app.js']);
  });

  it('removes a failed tag so the next call appends a fresh one', async () => {
    let attempt = 0;
    server = fakeResources({
      '/flaky.js': () => (++attempt === 1 ? 'error' : undefined),
    });

    await expect(sl.loadScript('/flaky.js')).rejects.toThrow(
      'Failed to load script: /flaky.js'
    );
    expect(scripts()).toHaveLength(0);

    await sl.loadScript('/flaky.js');
    expect(server.requests).toEqual(['/flaky.js', '/flaky.js']);
    expect(scripts()).toHaveLength(1);
  });

  it('removes the tag when the only waiter aborts', async () => {
    server = fakeResources({ '/slow.js': () => 'hang' });
    const controller = new AbortController();
    const pending = sl.loadScript('/slow.js', { signal: controller.signal });
    expect(scripts()).toHaveLength(1);

    const reason = new Error('timed out');
    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
    expect(scripts()).toHaveLength(0);

    // A later call starts over instead of reusing the aborted load.
    const again = sl.loadScript('/slow.js');
    await tick();
    server.release('/slow.js');
    await again;
    expect(server.requests).toEqual(['/slow.js', '/slow.js']);
  });

  it('keeps the tag while another caller still waits for it', async () => {
    server = fakeResources({ '/shared.js': () => 'hang' });
    const controller = new AbortController();
    const aborted = sl.loadScript('/shared.js', { signal: controller.signal });
    const kept = sl.loadScript('/shared.js');

    controller.abort();
    await expect(aborted).rejects.toBeDefined();
    expect(scripts()).toHaveLength(1);

    await tick();
    server.release('/shared.js');
    await expect(kept).resolves.toBeUndefined();
  });

  it('rejects at once when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort(new Error('stop'));
    await expect(
      sl.loadScript('/never.js', { signal: controller.signal })
    ).rejects.toThrow('stop');
    expect(scripts()).toHaveLength(0);
  });

  it('removeScript drops the tag and lets the URL load again', async () => {
    server = fakeResources();
    await sl.loadScript('/app.js');
    sl.removeScript('/app.js');
    expect(scripts()).toHaveLength(0);

    await sl.loadScript('/app.js');
    expect(server.requests).toEqual(['/app.js', '/app.js']);
  });

  it('removeScript rejects a load still in flight and frees the URL', async () => {
    server = fakeResources({ '/app.js': () => 'hang' });
    const pending = sl.loadScript('/app.js');
    sl.removeScript('/app.js');
    await expect(pending).rejects.toThrow('Removed before load');
    expect(scripts()).toHaveLength(0);

    void sl.loadScript('/app.js').catch(() => undefined);
    expect(scripts()).toHaveLength(1);
  });

  it('removes the tag once every waiter aborted', async () => {
    server = fakeResources({ '/both.js': () => 'hang' });
    const one = new AbortController();
    const two = new AbortController();
    const first = sl.loadScript('/both.js', { signal: one.signal });
    const second = sl.loadScript('/both.js', { signal: two.signal });

    two.abort();
    await expect(second).rejects.toBeDefined();
    expect(scripts()).toHaveLength(1);
    one.abort();
    await expect(first).rejects.toBeDefined();
    expect(scripts()).toHaveLength(0);
  });

  it('ignores an abort that arrives after the script loaded', async () => {
    server = fakeResources();
    const controller = new AbortController();
    await sl.loadScript('/done.js', { signal: controller.signal });
    controller.abort();

    expect(scripts()).toEqual([expect.objectContaining({ isConnected: true })]);
    await sl.loadScript('/done.js');
    expect(server.requests).toEqual(['/done.js']);
  });

  it('loads scripts and styles with crossorigin="anonymous"', async () => {
    server = fakeResources();
    await sl.loadScript('/cors.js');
    await sl.loadStyle('/cors.css');
    expect(scripts()[0]?.crossOrigin).toBe('anonymous');
    expect(links()[0]?.crossOrigin).toBe('anonymous');
  });
});

describe('loadStyle: abort', () => {
  it('removes the link when the only waiter aborts', async () => {
    server = fakeResources({ '/slow.css': () => 'hang' });
    const controller = new AbortController();
    const pending = sl.loadStyle('/slow.css', { signal: controller.signal });
    expect(links()).toHaveLength(1);

    controller.abort(new Error('timed out'));
    await expect(pending).rejects.toThrow('timed out');
    expect(links()).toHaveLength(0);
  });

  it('keeps the link while another caller still waits for it', async () => {
    server = fakeResources({ '/shared.css': () => 'hang' });
    const controller = new AbortController();
    const aborted = sl.loadStyle('/shared.css', { signal: controller.signal });
    const kept = sl.loadStyle('/shared.css');

    controller.abort();
    await expect(aborted).rejects.toBeDefined();
    expect(links()).toHaveLength(1);

    await tick();
    server.release('/shared.css');
    await expect(kept).resolves.toBeUndefined();
  });
});

describe('loadStyle', () => {
  it('appends one stylesheet link per URL with integrity', async () => {
    server = fakeResources();
    await Promise.all([
      sl.loadStyle('/app.css', { integrity: 'sha384-css' }),
      sl.loadStyle('/app.css'),
    ]);
    expect(links().map((l) => [l.rel, l.integrity])).toEqual([
      ['stylesheet', 'sha384-css'],
    ]);
  });

  it('removes the link when it times out', async () => {
    server = fakeResources({ '/slow.css': () => 'hang' });
    await expect(sl.loadStyle('/slow.css', 20)).rejects.toThrow(
      'Style load timed out: /slow.css'
    );
    expect(links()).toHaveLength(0);
  });

  it('removes the link when it fails', async () => {
    server = fakeResources({ '/missing.css': () => 'error' });
    await expect(sl.loadStyle('/missing.css')).rejects.toThrow(
      'Failed to load style: /missing.css'
    );
    expect(links()).toHaveLength(0);
  });

  it('removeStyle drops the link and lets the URL load again', async () => {
    server = fakeResources();
    await sl.loadStyle('/app.css');
    sl.removeStyle('/app.css');
    expect(links()).toHaveLength(0);

    await sl.loadStyle('/app.css');
    expect(links()).toHaveLength(1);
  });
});

describe('prefetchResource', () => {
  it('uses modulepreload for module scripts', () => {
    sl.prefetchResource('/assets/index.js', {
      type: 'module',
      integrity: 'sha384-x',
    });
    const [link] = links();
    expect(link?.rel).toBe('modulepreload');
    expect(link?.getAttribute('as')).toBeNull();
    expect(link?.crossOrigin).toBe('anonymous');
    expect(link?.integrity).toBe('sha384-x');
  });

  it('uses prefetch as=script for classic scripts and as=style for CSS', () => {
    sl.prefetchResource('/bundle.js');
    sl.prefetchResource('/app.css?v=2');
    expect(links().map((l) => [l.rel, l.as])).toEqual([
      ['prefetch', 'script'],
      ['prefetch', 'style'],
    ]);
  });

  it('skips URLs already prefetched or loaded', async () => {
    server = fakeResources();
    await sl.loadScript('/loaded.js');
    sl.prefetchResource('/loaded.js');
    sl.prefetchResource('/x.mjs');
    sl.prefetchResource('/x.mjs');
    expect(links().map((l) => l.getAttribute('href'))).toEqual(['/x.mjs']);
  });
});
