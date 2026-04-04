import { describe, it, expect } from 'vitest';
import type { Component } from 'vue';
import { createVueMicroApp, createSsrVueMicroApp } from '../index';
import { renderVueToString } from '../server';

describe('createVueMicroApp', () => {
  it('should return a valid MicroAppModule', () => {
    const module = createVueMicroApp({
      name: 'test-vue-app',
      App: { template: '<div>Test</div>' },
    });

    expect(module).toBeDefined();
    expect(typeof module.mount).toBe('function');
    expect(typeof module.unmount).toBe('function');
    expect(typeof module.bootstrap).toBe('function');
  });

  it('should register in global module registry', () => {
    createVueMicroApp({
      name: 'test-global-vue',
      App: { template: '<div>Test</div>' },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = (window as any).__TUVIX_MODULES__;
    expect(registry['test-global-vue']).toBeDefined();
  });
});

describe('createSsrVueMicroApp', () => {
  it('should return a valid MicroAppModule', () => {
    const module = createSsrVueMicroApp({
      name: 'test-ssr-vue-app',
      App: { template: '<div>SSR Test</div>' },
    });

    expect(module).toBeDefined();
    expect(typeof module.mount).toBe('function');
    expect(typeof module.unmount).toBe('function');
    expect(typeof module.bootstrap).toBe('function');
  });

  it('should register in global module registry', () => {
    createSsrVueMicroApp({
      name: 'test-global-ssr-vue',
      App: { template: '<div>SSR Test</div>' },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = (window as any).__TUVIX_MODULES__;
    expect(registry['test-global-ssr-vue']).toBeDefined();
  });
});

describe('renderVueToString', () => {
  it('returns empty string in browser environment', async () => {
    // jsdom sets window, so this test exercises the browser guard
    const result = await renderVueToString({} as Component);
    expect(result).toBe('');
  });
});
