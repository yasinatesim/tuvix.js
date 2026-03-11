import type {
  Entry,
  MicroAppModule,
  LoaderOptions,
  LoadResult,
  LoadStatus,
  CacheEntry,
} from './types';
import { normalizeEntry, withTimeout, withRetry } from './utils';
import {
  loadScript,
  loadStyle,
  removeScript,
  removeStyle,
  prefetchResource,
} from './script-loader';

// Module-level lock that serializes the (snapshot → load scripts → resolve globals)
// critical section. Prevents concurrent loads from cross-contaminating their
// window property snapshots when both fall back to UMD global detection.
// Apps that self-register via window.__TUVIX_MODULES__ are unaffected in practice
// since resolveModule checks that registry first, but we still serialize to be safe.
let _globalDetectionLock: Promise<void> = Promise.resolve();

const DEFAULT_OPTIONS: Required<LoaderOptions> = {
  timeout: 10000,
  retries: 2,
  retryDelay: 1000,
  fetch: globalThis.fetch?.bind(globalThis),
  globals: {},
};

/**
 * ModuleLoader handles dynamic loading of micro frontend modules.
 * It supports caching, retries, timeouts, and prefetching.
 *
 * @example
 * ```ts
 * const loader = new ModuleLoader();
 *
 * const result = await loader.load('dashboard', {
 *   scripts: ['https://cdn.example.com/dashboard/main.js'],
 *   styles: ['https://cdn.example.com/dashboard/style.css']
 * });
 *
 * if (result.module) {
 *   await result.module.mount({ container: document.getElementById('app')! });
 * }
 * ```
 */
export class ModuleLoader {
  private cache: Map<string, CacheEntry>;
  private loading: Map<string, Promise<LoadResult>>;
  private options: Required<LoaderOptions>;

  constructor(options: LoaderOptions = {}) {
    this.cache = new Map();
    this.loading = new Map();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Load a micro app module by name and entry config.
   * Results are cached — subsequent calls return the cached module.
   */
  async load(name: string, entry: Entry): Promise<LoadResult> {
    const startTime = performance.now();

    const cached = this.cache.get(name);
    if (cached) {
      return {
        status: 'loaded',
        module: cached.module,
        error: null,
        duration: 0,
      };
    }

    const inflight = this.loading.get(name);
    if (inflight) {
      return inflight;
    }

    const loadPromise = this.doLoad(name, entry, startTime);
    this.loading.set(name, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loading.delete(name);
    }
  }

  /**
   * Check if a module is loaded and cached
   */
  isLoaded(name: string): boolean {
    return this.cache.has(name);
  }

  /**
   * Get a cached module
   */
  getModule(name: string): MicroAppModule | null {
    return this.cache.get(name)?.module ?? null;
  }

  /**
   * Get current load status for a module
   */
  getStatus(name: string): LoadStatus {
    if (this.cache.has(name)) return 'loaded';
    if (this.loading.has(name)) return 'loading';
    return 'idle';
  }

  /**
   * Prefetch a module's resources without executing them
   */
  prefetch(entry: Entry): void {
    const config = normalizeEntry(entry);

    for (const script of config.scripts) {
      prefetchResource(script);
    }

    if (config.styles) {
      for (const style of config.styles) {
        prefetchResource(style);
      }
    }
  }

  /**
   * Unload a module, removing it from cache and cleaning up resources
   */
  unload(name: string): void {
    const cached = this.cache.get(name);
    if (cached) {
      const config = normalizeEntry(cached.entry);

      for (const script of config.scripts) {
        removeScript(script);
      }
      if (config.styles) {
        for (const style of config.styles) {
          removeStyle(style);
        }
      }

      this.cache.delete(name);
    }
  }

  /**
   * Clear all cached modules
   */
  clearCache(): void {
    const names = Array.from(this.cache.keys());
    for (const name of names) {
      this.unload(name);
    }
  }

  /**
   * Get all cached module names
   */
  getCachedNames(): string[] {
    return Array.from(this.cache.keys());
  }

  private async doLoad(
    name: string,
    entry: Entry,
    startTime: number
  ): Promise<LoadResult> {
    const config = normalizeEntry(entry);

    try {
      const loadFn = async () => {
        if (config.styles && config.styles.length > 0) {
          await Promise.all(config.styles.map(loadStyle));
        }

        // Serialize the global-key snapshot + script load + resolve sequence so that
        // two concurrently-loading apps cannot cross-contaminate their UMD global detection.
        let release!: () => void;
        const prevLock = _globalDetectionLock;
        _globalDetectionLock = new Promise<void>((r) => {
          release = r;
        });

        try {
          await prevLock;

          const globalKeys = Object.keys(window);

          for (const scriptUrl of config.scripts) {
            await loadScript(scriptUrl);
          }

          return this.resolveModule(name, globalKeys);
        } finally {
          release();
        }
      };

      const module = await withRetry(
        () =>
          withTimeout(
            loadFn,
            this.options.timeout,
            `Loading "${name}" timed out after ${this.options.timeout}ms`
          ),
        this.options.retries,
        this.options.retryDelay
      );

      if (!module) {
        throw new Error(
          `[Tuvix Loader] Module "${name}" loaded but no exports found. ` +
            `Make sure the module exposes mount/unmount via window.__TUVIX_MODULES__["${name}"] or UMD globals.`
        );
      }

      this.validateModule(name, module);

      this.cache.set(name, {
        module,
        loadedAt: Date.now(),
        entry,
      });

      const duration = performance.now() - startTime;

      return {
        status: 'loaded',
        module,
        error: null,
        duration,
      };
    } catch (error) {
      const duration = performance.now() - startTime;

      return {
        status: 'error',
        module: null,
        error: error instanceof Error ? error : new Error(String(error)),
        duration,
      };
    }
  }

  /**
   * Try to resolve the loaded module's exports.
   *
   * Supports multiple patterns:
   * 1. window.__TUVIX_MODULES__[name] (recommended)
   * 2. New global variables added after script load
   */
  private resolveModule(
    name: string,
    previousGlobalKeys: string[]
  ): MicroAppModule | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tuvixModules = (window as any).__TUVIX_MODULES__;
    if (tuvixModules && tuvixModules[name]) {
      const mod = tuvixModules[name];
      return mod.default ?? mod;
    }

    const currentKeys = Object.keys(window);
    const newKeys = currentKeys.filter(
      (key) => !previousGlobalKeys.includes(key)
    );

    for (const key of newKeys) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const candidate = (window as any)[key];
      if (
        candidate &&
        typeof candidate === 'object' &&
        typeof candidate.mount === 'function'
      ) {
        return candidate as MicroAppModule;
      }
    }

    return null;
  }

  /**
   * Validate that a module has the required lifecycle methods
   */
  private validateModule(name: string, module: MicroAppModule): void {
    if (typeof module.mount !== 'function') {
      throw new Error(
        `[Tuvix Loader] Module "${name}" is missing required "mount" function.`
      );
    }

    if (typeof module.unmount !== 'function') {
      throw new Error(
        `[Tuvix Loader] Module "${name}" is missing required "unmount" function.`
      );
    }
  }
}
