import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadScript } from '../script-loader';

describe('loadScript — script type detection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.head.innerHTML = '';
  });

  function interceptNextScript(): { getScript: () => HTMLScriptElement } {
    let captured: HTMLScriptElement | undefined;

    vi.spyOn(document.head, 'appendChild').mockImplementationOnce((node) => {
      const script = node as HTMLScriptElement;
      captured = script;
      // Trigger onload so the promise resolves
      setTimeout(() => script.onload?.(new Event('load')), 0);
      return node;
    });

    return {
      getScript: () => {
        if (!captured) throw new Error('No script was appended');
        return captured;
      },
    };
  }

  it('injects .tsx files as type="module"', async () => {
    const { getScript } = interceptNextScript();
    await loadScript('/src/apps/home/main.tsx');
    expect(getScript().type).toBe('module');
  });

  it('injects .ts files as type="module"', async () => {
    const { getScript } = interceptNextScript();
    await loadScript('/src/shell.ts');
    expect(getScript().type).toBe('module');
  });

  it('injects .mts files as type="module"', async () => {
    const { getScript } = interceptNextScript();
    await loadScript('/src/util.mts');
    expect(getScript().type).toBe('module');
  });

  it('injects .mjs files as type="module"', async () => {
    const { getScript } = interceptNextScript();
    await loadScript('/dist/app.mjs');
    expect(getScript().type).toBe('module');
  });

  it('injects .jsx files as type="module"', async () => {
    const { getScript } = interceptNextScript();
    await loadScript('/src/App.jsx');
    expect(getScript().type).toBe('module');
  });

  it('handles query strings on ES module URLs', async () => {
    const { getScript } = interceptNextScript();
    await loadScript('/src/main.tsx?v=abc123');
    expect(getScript().type).toBe('module');
  });

  it('injects .js bundles as type="text/javascript"', async () => {
    const { getScript } = interceptNextScript();
    await loadScript('/dist/bundle.umd.js');
    expect(getScript().type).toBe('text/javascript');
  });

  it('injects .js bundles with query strings as type="text/javascript"', async () => {
    const { getScript } = interceptNextScript();
    await loadScript('/dist/bundle.js?v=1');
    expect(getScript().type).toBe('text/javascript');
  });

  it('skips re-injection when the same URL is already in the DOM', async () => {
    // Manually insert a script tag with that src to simulate a previous load
    const existing = document.createElement('script');
    existing.src = '/src/apps/home/main.tsx';
    document.head.appendChild(existing);

    const appendSpy = vi.spyOn(document.head, 'appendChild');
    await loadScript('/src/apps/home/main.tsx');
    expect(appendSpy).not.toHaveBeenCalled();
  });
});
