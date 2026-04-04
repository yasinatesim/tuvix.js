import { describe, it, expect } from 'vitest';
import { createSvelteMicroApp, createSsrSvelteMicroApp } from '../index';
import { renderSvelteToString } from '../server';

describe('createSvelteMicroApp', () => {
  it('should return a valid MicroAppModule', () => {
    const module = createSvelteMicroApp({
      name: 'test-svelte-app',
      App: class FakeComponent {
        $destroy() {}
      },
    });

    expect(module).toBeDefined();
    expect(typeof module.mount).toBe('function');
    expect(typeof module.unmount).toBe('function');
    expect(typeof module.bootstrap).toBe('function');
  });

  it('should register in global module registry', () => {
    createSvelteMicroApp({
      name: 'test-global-svelte',
      App: class FakeComponent {
        $destroy() {}
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = (window as any).__TUVIX_MODULES__;
    expect(registry['test-global-svelte']).toBeDefined();
  });
});

describe('createSsrSvelteMicroApp', () => {
  it('should return a valid MicroAppModule', () => {
    const module = createSsrSvelteMicroApp({
      name: 'test-ssr-svelte-app',
      App: class FakeComponent {
        $destroy() {}
      },
    });

    expect(module).toBeDefined();
    expect(typeof module.mount).toBe('function');
    expect(typeof module.unmount).toBe('function');
    expect(typeof module.bootstrap).toBe('function');
  });

  it('should register in global module registry', () => {
    createSsrSvelteMicroApp({
      name: 'test-global-ssr-svelte',
      App: class FakeComponent {
        $destroy() {}
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = (window as any).__TUVIX_MODULES__;
    expect(registry['test-global-ssr-svelte']).toBeDefined();
  });
});

describe('renderSvelteToString', () => {
  it('returns empty string in browser environment', async () => {
    // jsdom defines window, so the guard should short-circuit and return ''
    const result = await renderSvelteToString(class {}, {});
    expect(result).toBe('');
  });
});
