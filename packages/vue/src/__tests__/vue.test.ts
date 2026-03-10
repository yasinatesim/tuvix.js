import { describe, it, expect } from 'vitest';
import { createVueMicroApp } from '../index';

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
