import { describe, it, expect } from 'vitest';
import {
  // Core
  Orchestrator,
  createOrchestrator,
  defineMicroApp,
  OrchestratorEvent,
  // Event Bus
  EventBus,
  createEventBus,
  getGlobalBus,
  resetGlobalBus,
  // Router
  Router,
  createRouter,
  matchRoute,
  normalizePath,
  // Loader
  ModuleLoader,
  createLoader,
  // Sandbox
  Sandbox,
  CssSandbox,
  JsSandbox,
  createSandbox,
} from '../index';

describe('tuvix.js umbrella package', () => {
  describe('core exports', () => {
    it('should export Orchestrator class', () => {
      expect(Orchestrator).toBeDefined();
      expect(typeof Orchestrator).toBe('function');
    });

    it('should export createOrchestrator factory', () => {
      expect(createOrchestrator).toBeDefined();
      expect(typeof createOrchestrator).toBe('function');
    });

    it('should export defineMicroApp helper', () => {
      expect(defineMicroApp).toBeDefined();
      expect(typeof defineMicroApp).toBe('function');
    });

    it('should export OrchestratorEvent enum', () => {
      expect(OrchestratorEvent).toBeDefined();
    });
  });

  describe('event-bus exports', () => {
    it('should export EventBus class', () => {
      expect(EventBus).toBeDefined();
      expect(typeof EventBus).toBe('function');
    });

    it('should export createEventBus factory', () => {
      expect(createEventBus).toBeDefined();
      expect(typeof createEventBus).toBe('function');
    });

    it('should export getGlobalBus function', () => {
      expect(getGlobalBus).toBeDefined();
      expect(typeof getGlobalBus).toBe('function');
    });

    it('should export resetGlobalBus function', () => {
      expect(resetGlobalBus).toBeDefined();
      expect(typeof resetGlobalBus).toBe('function');
    });
  });

  describe('router exports', () => {
    it('should export Router class', () => {
      expect(Router).toBeDefined();
      expect(typeof Router).toBe('function');
    });

    it('should export createRouter factory', () => {
      expect(createRouter).toBeDefined();
      expect(typeof createRouter).toBe('function');
    });

    it('should export matchRoute utility', () => {
      expect(matchRoute).toBeDefined();
      expect(typeof matchRoute).toBe('function');
    });

    it('should export normalizePath utility', () => {
      expect(normalizePath).toBeDefined();
      expect(typeof normalizePath).toBe('function');
    });
  });

  describe('loader exports', () => {
    it('should export ModuleLoader class', () => {
      expect(ModuleLoader).toBeDefined();
      expect(typeof ModuleLoader).toBe('function');
    });

    it('should export createLoader factory', () => {
      expect(createLoader).toBeDefined();
      expect(typeof createLoader).toBe('function');
    });
  });

  describe('sandbox exports', () => {
    it('should export Sandbox class', () => {
      expect(Sandbox).toBeDefined();
      expect(typeof Sandbox).toBe('function');
    });

    it('should export CssSandbox class', () => {
      expect(CssSandbox).toBeDefined();
      expect(typeof CssSandbox).toBe('function');
    });

    it('should export JsSandbox class', () => {
      expect(JsSandbox).toBeDefined();
      expect(typeof JsSandbox).toBe('function');
    });

    it('should export createSandbox factory', () => {
      expect(createSandbox).toBeDefined();
      expect(typeof createSandbox).toBe('function');
    });
  });

  describe('functional smoke tests', () => {
    it('createOrchestrator should create an Orchestrator instance', () => {
      const orchestrator = createOrchestrator();
      expect(orchestrator).toBeInstanceOf(Orchestrator);
    });

    it('createRouter should create a Router instance', () => {
      const router = createRouter({ routes: [] });
      expect(router).toBeInstanceOf(Router);
    });

    it('createEventBus should create a working EventBus instance', () => {
      const bus = createEventBus();
      expect(bus).toBeInstanceOf(EventBus);
    });

    it('createLoader should create a working ModuleLoader instance', () => {
      const loader = createLoader();
      expect(loader).toBeInstanceOf(ModuleLoader);
    });

    it('normalizePath should normalize paths correctly', () => {
      expect(normalizePath('/foo/')).toBe('/foo');
      expect(normalizePath('foo')).toBe('/foo');
    });

    it('createSandbox should create a Sandbox instance', () => {
      const sandbox = createSandbox({ css: true, js: true });
      expect(sandbox).toBeInstanceOf(Sandbox);
    });
  });
});
