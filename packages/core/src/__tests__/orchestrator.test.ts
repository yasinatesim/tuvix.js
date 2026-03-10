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
