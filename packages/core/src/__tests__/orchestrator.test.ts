import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Orchestrator } from '../orchestrator';
import { defineMicroApp } from '../micro-app';

function setupDOM() {
  document.body.innerHTML = `
    <div id="header"></div>
    <div id="main"></div>
    <div id="sidebar"></div>
  `;
}

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    setupDOM();
    orchestrator = new Orchestrator();
  });

  describe('register', () => {
    it('should register a micro app', () => {
      orchestrator.register({
        name: 'test-app',
        entry: 'https://example.com/app.js',
        container: '#main',
      });

      expect(orchestrator.getRegisteredApps()).toContain('test-app');
    });

    it('should throw on duplicate registration', () => {
      orchestrator.register({
        name: 'test-app',
        entry: 'https://example.com/app.js',
        container: '#main',
      });

      expect(() => {
        orchestrator.register({
          name: 'test-app',
          entry: 'https://example.com/app2.js',
          container: '#main',
        });
      }).toThrow(/already registered/);
    });

    it('should throw on empty name', () => {
      expect(() => {
        orchestrator.register({
          name: '',
          entry: 'https://example.com/app.js',
          container: '#main',
        });
      }).toThrow(/name is required/);
    });

    it('should throw on missing entry', () => {
      expect(() => {
        orchestrator.register({
          name: 'test',
          entry: '',
          container: '#main',
        });
      }).toThrow(/requires an entry/);
    });

    it('should throw on missing container', () => {
      expect(() => {
        orchestrator.register({
          name: 'test',
          entry: 'https://example.com/app.js',
          container: '',
        });
      }).toThrow(/requires a container/);
    });

    it('should set initial status to registered', () => {
      orchestrator.register({
        name: 'test-app',
        entry: 'https://example.com/app.js',
        container: '#main',
      });

      expect(orchestrator.getAppStatus('test-app')).toBe('registered');
    });
  });

  describe('getRegisteredApps', () => {
    it('should return empty array initially', () => {
      expect(orchestrator.getRegisteredApps()).toEqual([]);
    });

    it('should return all registered app names', () => {
      orchestrator.register({
        name: 'app-a',
        entry: 'https://example.com/a.js',
        container: '#main',
      });
      orchestrator.register({
        name: 'app-b',
        entry: 'https://example.com/b.js',
        container: '#sidebar',
      });

      const apps = orchestrator.getRegisteredApps();
      expect(apps).toContain('app-a');
      expect(apps).toContain('app-b');
      expect(apps).toHaveLength(2);
    });
  });

  describe('getAppStatus', () => {
    it('should return null for unregistered app', () => {
      expect(orchestrator.getAppStatus('nonexistent')).toBeNull();
    });
  });

  describe('getMountedApps', () => {
    it('should return empty array initially', () => {
      expect(orchestrator.getMountedApps()).toEqual([]);
    });
  });

  describe('getEventBus', () => {
    it('should return event bus instance', () => {
      const bus = orchestrator.getEventBus();
      expect(bus).toBeDefined();
      expect(typeof bus.on).toBe('function');
      expect(typeof bus.emit).toBe('function');
    });
  });

  describe('destroy', () => {
    it('should clear all registrations', async () => {
      orchestrator.register({
        name: 'test-app',
        entry: 'https://example.com/app.js',
        container: '#main',
      });

      await orchestrator.destroy();

      expect(orchestrator.getRegisteredApps()).toEqual([]);
    });

    it('should throw when using destroyed orchestrator', async () => {
      await orchestrator.destroy();

      expect(() => {
        orchestrator.register({
          name: 'test',
          entry: 'https://example.com/app.js',
          container: '#main',
        });
      }).toThrow(/destroyed/);
    });
  });

  describe('event emission', () => {
    it('should emit APP_REGISTERED event', () => {
      const handler = vi.fn();
      orchestrator.getEventBus().on('tuvix:app:registered', handler);

      orchestrator.register({
        name: 'test-app',
        entry: 'https://example.com/app.js',
        container: '#main',
      });

      expect(handler).toHaveBeenCalledWith({ name: 'test-app' });
    });
  });
});

// Helper: pre-register a module in the global registry so the loader
// resolves it instantly without making any network requests.
function preRegisterModule(
  name: string,
  module: { mount: () => void; unmount: () => void }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = window as any;
  g.__TUVIX_MODULES__ = g.__TUVIX_MODULES__ ?? {};
  g.__TUVIX_MODULES__[name] = module;
}

describe('fallback HTML', () => {
  it('renders fallback into container when mount fails', async () => {
    const orchestrator = new Orchestrator();
    setupDOM();

    preRegisterModule('broken-app', {
      mount: () => {
        throw new Error('mount failed');
      },
      unmount: () => {},
    });

    orchestrator.register({
      name: 'broken-app',
      entry: { scripts: [] }, // empty — loader resolves from global registry
      container: '#main',
      fallback: '<p>Service unavailable</p>',
    });

    await expect(orchestrator.mountApp('broken-app')).rejects.toThrow();

    const container = document.querySelector('#main') as HTMLElement;
    expect(container.innerHTML).toBe('<p>Service unavailable</p>');
  });

  it('leaves container unchanged when no fallback is provided', async () => {
    const orchestrator = new Orchestrator();
    setupDOM();
    document.querySelector('#main')!.innerHTML = '<p>original</p>';

    preRegisterModule('broken-no-fallback', {
      mount: () => {
        throw new Error('mount failed');
      },
      unmount: () => {},
    });

    orchestrator.register({
      name: 'broken-no-fallback',
      entry: { scripts: [] },
      container: '#main',
    });

    await expect(orchestrator.mountApp('broken-no-fallback')).rejects.toThrow();

    expect(document.querySelector('#main')!.innerHTML).toBe('<p>original</p>');
  });

  it('sets app status to error when mount fails', async () => {
    const orchestrator = new Orchestrator();
    setupDOM();

    preRegisterModule('err-app', {
      mount: () => {
        throw new Error('boom');
      },
      unmount: () => {},
    });

    orchestrator.register({
      name: 'err-app',
      entry: { scripts: [] },
      container: '#main',
      fallback: '<span>error</span>',
    });

    await expect(orchestrator.mountApp('err-app')).rejects.toThrow();
    expect(orchestrator.getAppStatus('err-app')).toBe('error');
  });
});

describe('mountWhenVisible (viewport mounting)', () => {
  it('does not mount viewport app during reconcileApps', async () => {
    const orchestrator = new Orchestrator({
      router: { mode: 'hash', routes: [] },
    });
    setupDOM();

    orchestrator.register({
      name: 'viewport-app',
      entry: 'https://example.com/app.js',
      container: '#main',
      mountWhenVisible: true,
    });

    await orchestrator.start();

    // Viewport apps are handled by IntersectionObserver, not reconciliation.
    expect(orchestrator.getAppStatus('viewport-app')).toBe('registered');

    await orchestrator.destroy();
  });

  it('viewport app is excluded from reconciliation even when activeWhen is set', () => {
    const orchestrator = new Orchestrator();
    setupDOM();

    orchestrator.register({
      name: 'lazy-app',
      entry: 'https://example.com/app.js',
      container: '#main',
      mountWhenVisible: true,
      activeWhen: '/',
    });

    // mountWhenVisible takes priority — app stays in 'registered' state.
    expect(orchestrator.getMountedApps()).not.toContain('lazy-app');
  });
});

describe('defineMicroApp', () => {
  it('should create a valid module', () => {
    const module = defineMicroApp({
      name: 'test',
      mount: vi.fn(),
      unmount: vi.fn(),
    });

    expect(typeof module.mount).toBe('function');
    expect(typeof module.unmount).toBe('function');
  });

  it('should throw without name', () => {
    expect(() => {
      defineMicroApp({
        name: '',
        mount: vi.fn(),
        unmount: vi.fn(),
      });
    }).toThrow(/name/);
  });

  it('should throw without mount', () => {
    expect(() => {
      defineMicroApp({
        name: 'test',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mount: null as any,
        unmount: vi.fn(),
      });
    }).toThrow(/mount/);
  });

  it('should throw without unmount', () => {
    expect(() => {
      defineMicroApp({
        name: 'test',
        mount: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        unmount: null as any,
      });
    }).toThrow(/unmount/);
  });

  it('should register in global module registry', () => {
    defineMicroApp({
      name: 'global-test',
      mount: vi.fn(),
      unmount: vi.fn(),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).__TUVIX_MODULES__['global-test']).toBeDefined();
  });

  it('should include optional lifecycle methods', () => {
    const bootstrap = vi.fn();
    const update = vi.fn();

    const module = defineMicroApp({
      name: 'full-test',
      bootstrap,
      mount: vi.fn(),
      unmount: vi.fn(),
      update,
    });

    expect(module.bootstrap).toBe(bootstrap);
    expect(module.update).toBe(update);
  });
});
