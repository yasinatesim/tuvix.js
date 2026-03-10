import { describe, it, expect } from 'vitest';
import { createReactMicroApp } from '../index';

describe('createReactMicroApp', () => {
  it('should return a valid MicroAppModule', () => {
    const module = createReactMicroApp({
      name: 'test-react-app',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      App: (() => null) as any,
    });

    expect(module).toBeDefined();
    expect(typeof module.mount).toBe('function');
    expect(typeof module.unmount).toBe('function');
    expect(typeof module.update).toBe('function');
    expect(typeof module.bootstrap).toBe('function');
  });

  it('should register in global module registry', () => {
    createReactMicroApp({
      name: 'test-global-react',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      App: (() => null) as any,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = (window as any).__TUVIX_MODULES__;
    expect(registry['test-global-react']).toBeDefined();
  });
});
