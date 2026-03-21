import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAngularMicroApp, createSsrAngularMicroApp } from '../index';
import { renderAngularToString } from '../server';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAppRef = { destroy: vi.fn() };
const mockPlatformRef = {
  bootstrapModule: vi.fn(),
  destroy: vi.fn(),
};
const mockPlatformBrowserDynamic = vi.fn(() => mockPlatformRef);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createAngularMicroApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlatformRef.bootstrapModule.mockResolvedValue(mockAppRef);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).__TUVIX_MODULES__;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).__TUVIX_ANGULAR_PROPS__;
  });

  it('should return a valid MicroAppModule', () => {
    const module = createAngularMicroApp({
      name: 'test-angular-app',
      module: class AppModule {},
      platform: mockPlatformBrowserDynamic,
    });

    expect(module).toBeDefined();
    expect(typeof module.bootstrap).toBe('function');
    expect(typeof module.mount).toBe('function');
    expect(typeof module.unmount).toBe('function');
    expect(typeof module.update).toBe('function');
  });

  it('should register in global module registry', () => {
    createAngularMicroApp({
      name: 'test-registry-app',
      module: class AppModule {},
      platform: mockPlatformBrowserDynamic,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = (window as any).__TUVIX_MODULES__;
    expect(registry['test-registry-app']).toBeDefined();
  });

  describe('bootstrap()', () => {
    it('should call config.bootstrap if provided', async () => {
      const onBootstrap = vi.fn().mockResolvedValue(undefined);
      const module = createAngularMicroApp({
        name: 'bootstrap-test',
        module: class AppModule {},
        platform: mockPlatformBrowserDynamic,
        bootstrap: onBootstrap,
      });

      await module.bootstrap!();

      expect(onBootstrap).toHaveBeenCalledOnce();
    });

    it('should not throw if no config.bootstrap is provided', async () => {
      const module = createAngularMicroApp({
        name: 'bootstrap-no-hook',
        module: class AppModule {},
        platform: mockPlatformBrowserDynamic,
      });

      await expect(module.bootstrap!()).resolves.toBeUndefined();
    });
  });

  describe('mount()', () => {
    it('should append an app-root element to the container by default', async () => {
      const container = document.createElement('div');
      const module = createAngularMicroApp({
        name: 'mount-root-test',
        module: class AppModule {},
        platform: mockPlatformBrowserDynamic,
      });

      await module.mount({ container, props: {} });

      const appRoot = container.querySelector('app-root');
      expect(appRoot).not.toBeNull();
    });

    it('should append element with custom selector', async () => {
      const container = document.createElement('div');
      const module = createAngularMicroApp({
        name: 'mount-selector-test',
        module: class AppModule {},
        platform: mockPlatformBrowserDynamic,
        selector: 'app-custom',
      });

      await module.mount({ container, props: {} });

      const appRoot = container.querySelector('app-custom');
      expect(appRoot).not.toBeNull();
    });

    it('should call platformBrowserDynamic and bootstrapModule', async () => {
      const container = document.createElement('div');
      const FakeModule = class AppModule {};
      const module = createAngularMicroApp({
        name: 'mount-platform-test',
        module: FakeModule,
        platform: mockPlatformBrowserDynamic,
      });

      await module.mount({ container, props: {} });

      expect(mockPlatformBrowserDynamic).toHaveBeenCalledOnce();
      expect(mockPlatformRef.bootstrapModule).toHaveBeenCalledWith(
        FakeModule,
        undefined
      );
    });

    it('should pass compilerOptions to bootstrapModule', async () => {
      const container = document.createElement('div');
      const compilerOptions = { preserveWhitespaces: true };
      const module = createAngularMicroApp({
        name: 'mount-options-test',
        module: class AppModule {},
        platform: mockPlatformBrowserDynamic,
        compilerOptions,
      });

      await module.mount({ container, props: {} });

      expect(mockPlatformRef.bootstrapModule).toHaveBeenCalledWith(
        expect.anything(),
        compilerOptions
      );
    });
  });

  describe('unmount()', () => {
    it('should destroy appRef and platformRef after mount', async () => {
      const container = document.createElement('div');
      const module = createAngularMicroApp({
        name: 'unmount-destroy-test',
        module: class AppModule {},
        platform: mockPlatformBrowserDynamic,
      });

      await module.mount({ container, props: {} });
      await module.unmount({ container });

      expect(mockAppRef.destroy).toHaveBeenCalledOnce();
      expect(mockPlatformRef.destroy).toHaveBeenCalledOnce();
    });

    it('should clear the container innerHTML', async () => {
      const container = document.createElement('div');
      const module = createAngularMicroApp({
        name: 'unmount-clear-test',
        module: class AppModule {},
        platform: mockPlatformBrowserDynamic,
      });

      await module.mount({ container, props: {} });
      await module.unmount({ container });

      expect(container.innerHTML).toBe('');
    });

    it('should be safe to call without prior mount (no-op)', async () => {
      const container = document.createElement('div');
      const module = createAngularMicroApp({
        name: 'unmount-noop-test',
        module: class AppModule {},
        platform: mockPlatformBrowserDynamic,
      });

      await expect(module.unmount({ container })).resolves.toBeUndefined();
      expect(mockAppRef.destroy).not.toHaveBeenCalled();
      expect(mockPlatformRef.destroy).not.toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('should set props on __TUVIX_ANGULAR_PROPS__ when appRef is mounted', async () => {
      const container = document.createElement('div');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__TUVIX_ANGULAR_PROPS__ = {};
      const module = createAngularMicroApp({
        name: 'update-props-test',
        module: class AppModule {},
        platform: mockPlatformBrowserDynamic,
      });

      await module.mount({ container, props: {} });
      await module.update({ props: { theme: 'dark' } });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((window as any).__TUVIX_ANGULAR_PROPS__['update-props-test']).toEqual({
        theme: 'dark',
      });
    });

    it('should not throw if __TUVIX_ANGULAR_PROPS__ is not set', async () => {
      const container = document.createElement('div');
      const module = createAngularMicroApp({
        name: 'update-no-registry-test',
        module: class AppModule {},
        platform: mockPlatformBrowserDynamic,
      });

      await module.mount({ container, props: {} });
      await expect(
        module.update({ props: { theme: 'dark' } })
      ).resolves.toBeUndefined();
    });

    it('should not throw if called before mount', async () => {
      const module = createAngularMicroApp({
        name: 'update-before-mount-test',
        module: class AppModule {},
        platform: mockPlatformBrowserDynamic,
      });

      await expect(
        module.update({ props: { x: 1 } })
      ).resolves.toBeUndefined();
    });

    it('should not write to __TUVIX_ANGULAR_PROPS__ when appRef is null (before mount)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__TUVIX_ANGULAR_PROPS__ = {};
      const module = createAngularMicroApp({
        name: 'update-null-appref-test',
        module: class AppModule {},
        platform: mockPlatformBrowserDynamic,
      });

      await module.update({ props: { x: 1 } });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((window as any).__TUVIX_ANGULAR_PROPS__['update-null-appref-test']).toBeUndefined();
    });
  });
});

// ─── createSsrAngularMicroApp ────────────────────────────────────────────────

describe('createSsrAngularMicroApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).__TUVIX_MODULES__;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).__TUVIX_ANGULAR_PROPS__;
  });

  it('should return a valid MicroAppModule', () => {
    const module = createSsrAngularMicroApp({
      name: 'ssr-angular-app',
      component: class StandaloneComponent {},
    });

    expect(module).toBeDefined();
    expect(typeof module.bootstrap).toBe('function');
    expect(typeof module.mount).toBe('function');
    expect(typeof module.unmount).toBe('function');
    expect(typeof module.update).toBe('function');
  });

  it('should register in global module registry', () => {
    createSsrAngularMicroApp({
      name: 'ssr-registry-test',
      component: class StandaloneComponent {},
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = (window as any).__TUVIX_MODULES__;
    expect(registry['ssr-registry-test']).toBeDefined();
  });

  it('should call config.bootstrap if provided', async () => {
    const onBootstrap = vi.fn().mockResolvedValue(undefined);
    const module = createSsrAngularMicroApp({
      name: 'ssr-bootstrap-test',
      component: class StandaloneComponent {},
      bootstrap: onBootstrap,
    });

    await module.bootstrap!();

    expect(onBootstrap).toHaveBeenCalledOnce();
  });
});

// ─── renderAngularToString ───────────────────────────────────────────────────

describe('renderAngularToString', () => {
  it('returns empty string in browser environment', async () => {
    // jsdom sets window, so this test exercises the browser guard
    const result = await renderAngularToString({});
    expect(result).toBe('');
  });
});

