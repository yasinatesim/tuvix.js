import type {
  Entry,
  EntryConfig,
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
  getScriptGlobals,
} from './script-loader';
import { getRegisteredModule, unregisterModule } from './runtime';

const DEFAULT_OPTIONS: Required<LoaderOptions> = {
  timeout: 10000,
  retries: 2,
  retryDelay: 1000,
  globals: {},
};

// Window globals already resolved as a module, with the value resolved, shared by
// every loader instance. A shared script cannot hand one app's global to another
// app; a script that runs again assigns a new object, which frees the key.
const claimedGlobals = new Map<string, unknown>();

type GlobalRecord = Record<string, unknown>;

function isModule(value: unknown): value is MicroAppModule {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as MicroAppModule).mount === 'function'
  );
}

function entryStyles(entry: Entry): string[] {
  return typeof entry === 'function'
    ? []
    : (normalizeEntry(entry).styles ?? []);
}

function loadEntryStyles(
  config: EntryConfig,
  signal?: AbortSignal
): Promise<void[]> {
  return Promise.all(
    (config.styles ?? []).map((url) =>
      loadStyle(url, { integrity: config.integrity?.[url], signal })
    )
  );
}

/**
 * ModuleLoader handles dynamic loading of micro frontend modules.
 * It supports caching, retries, timeouts, and prefetching.
 * Loads for different names run in parallel; a script URL shared by several
 * entries is fetched once.
 *
 * @example
 * ```ts
 * import { ModuleLoader } from '@tuvix.js/loader';
 *
 * const loader = new ModuleLoader();
 *
 * const result = await loader.load('dashboard', {
 *   scripts: ['https://cdn.example.com/dashboard/main.js'],
 *   styles: ['https://cdn.example.com/dashboard/style.css'],
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
  private detachedStyles: Set<string>;
  private options: Required<LoaderOptions>;

  constructor(options: LoaderOptions = {}) {
    this.cache = new Map();
    this.loading = new Map();
    this.detachedStyles = new Set();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Load a micro app module by name and entry.
   * Results are cached: later calls return the cached module and re-add any
   * styles {@link ModuleLoader.removeStyles} took out. Never throws; failures
   * come back as `status: 'error'`.
   */
  async load(name: string, entry: Entry): Promise<LoadResult> {
    const startTime = performance.now();

    const cached = this.cache.get(name);
    if (cached) {
      if (this.detachedStyles.has(name) && typeof cached.entry !== 'function') {
        try {
          await loadEntryStyles(normalizeEntry(cached.entry));
          this.detachedStyles.delete(name);
        } catch (error) {
          return this.failure(error, startTime);
        }
      }
      return {
        status: 'loaded',
        module: cached.module,
        error: null,
        duration: performance.now() - startTime,
      };
    }

    const inflight = this.loading.get(name);
    if (inflight) {
      return inflight;
    }

    const loadPromise = this.doLoad(name, entry, startTime);
    this.loading.set(name, loadPromise);

    try {
      return await loadPromise;
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
   * Download an entry's scripts and styles without running them.
   * Module scripts use `<link rel="modulepreload">`. Loader-function entries are skipped,
   * because calling the function would run the module.
   */
  prefetch(entry: Entry): void {
    if (typeof entry === 'function') return;
    const config = normalizeEntry(entry);

    for (const url of config.scripts) {
      prefetchResource(url, {
        as: 'script',
        type: config.type,
        integrity: config.integrity?.[url],
      });
    }
    for (const url of config.styles ?? []) {
      prefetchResource(url, {
        as: 'style',
        integrity: config.integrity?.[url],
      });
    }
  }

  /**
   * Remove the stylesheets of a loaded app, for example after it unmounts.
   * A stylesheet another loaded app still uses stays. The next {@link ModuleLoader.load}
   * for this name adds them back and waits for them before resolving.
   *
   * @example
   * ```ts
   * import { ModuleLoader } from '@tuvix.js/loader';
   *
   * const loader = new ModuleLoader();
   * const container = document.getElementById('app')!;
   * const { module } = await loader.load('cart', { scripts: ['/cart.js'], styles: ['/cart.css'] });
   * await module?.unmount({ container });
   * loader.removeStyles('cart');
   * ```
   */
  removeStyles(name: string): void {
    const cached = this.cache.get(name);
    if (!cached || this.detachedStyles.has(name)) return;
    this.detachedStyles.add(name);

    for (const url of entryStyles(cached.entry)) {
      if (!this.isStyleInUse(url)) removeStyle(url);
    }
  }

  /**
   * Forget a module: drop it from the cache, remove it from the shared registry
   * (when it is the module this loader resolved), and remove its script and style tags.
   * The next load fetches and runs the entry again. Browsers run a module script once
   * per URL, so reloading a `type: 'module'` entry needs a new URL or a loader function.
   */
  unload(name: string): void {
    const cached = this.cache.get(name);
    if (!cached) return;

    this.removeStyles(name);
    this.cache.delete(name);
    this.detachedStyles.delete(name);

    if (getRegisteredModule(name) === cached.module) {
      unregisterModule(name);
    }
    if (typeof cached.entry !== 'function') {
      for (const url of normalizeEntry(cached.entry).scripts) {
        removeScript(url);
      }
    }
  }

  /**
   * Clear all cached modules
   */
  clearCache(): void {
    for (const name of Array.from(this.cache.keys())) {
      this.unload(name);
    }
  }

  /**
   * Get all cached module names
   */
  getCachedNames(): string[] {
    return Array.from(this.cache.keys());
  }

  private isStyleInUse(url: string): boolean {
    for (const [name, cached] of this.cache) {
      if (
        !this.detachedStyles.has(name) &&
        entryStyles(cached.entry).includes(url)
      ) {
        return true;
      }
    }
    return false;
  }

  private failure(error: unknown, startTime: number): LoadResult {
    return {
      status: 'error',
      module: null,
      error: error instanceof Error ? error : new Error(String(error)),
      duration: performance.now() - startTime,
    };
  }

  private async doLoad(
    name: string,
    entry: Entry,
    startTime: number
  ): Promise<LoadResult> {
    try {
      const module = await withRetry(
        () =>
          withTimeout(
            (signal) => this.attempt(name, entry, signal),
            this.options.timeout,
            `[Tuvix Loader] Loading "${name}" timed out after ${this.options.timeout}ms`
          ),
        this.options.retries,
        this.options.retryDelay
      );

      if (!module) {
        throw new Error(
          typeof entry === 'function'
            ? `[Tuvix Loader] The loader function for "${name}" resolved to neither a module with mount/unmount nor { default: module }, and no module is registered as "${name}".`
            : `[Tuvix Loader] Module "${name}" loaded but no exports found. ` +
                `Call registerModule("${name}", module) in the app, or expose it as a UMD global.`
        );
      }

      this.validateModule(name, module);

      this.cache.set(name, {
        module,
        loadedAt: Date.now(),
        entry,
      });

      return {
        status: 'loaded',
        module,
        error: null,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return this.failure(error, startTime);
    }
  }

  /** One load attempt. `signal` aborts when the attempt times out. */
  private async attempt(
    name: string,
    entry: Entry,
    signal: AbortSignal
  ): Promise<MicroAppModule | null> {
    if (typeof entry === 'function') {
      const loaded: unknown = await entry({ signal });
      if (isModule(loaded)) return loaded;
      if (
        typeof loaded === 'object' &&
        loaded !== null &&
        'default' in loaded &&
        isModule(loaded.default)
      ) {
        return loaded.default;
      }
      return getRegisteredModule(name) ?? null;
    }

    const config = normalizeEntry(entry);
    Object.assign(window, this.options.globals);

    const scripts = (async () => {
      for (const url of config.scripts) {
        await loadScript(url, {
          type: config.type,
          integrity: config.integrity?.[url],
          signal,
        });
      }
    })();
    await Promise.all([loadEntryStyles(config, signal), scripts]);

    return (
      getRegisteredModule(name) ?? this.resolveGlobal(name, config.scripts)
    );
  }

  /**
   * Find the module a classic (UMD/IIFE) script exposed as a window global.
   * Candidates are globals with a `mount` function that this entry's scripts
   * defined (see {@link getScriptGlobals}) and that no other load claimed.
   * Several candidates are resolved by matching the app name (ignoring case and
   * punctuation); otherwise the load fails.
   */
  private resolveGlobal(
    name: string,
    scripts: string[]
  ): MicroAppModule | null {
    const win = window as unknown as GlobalRecord;
    const candidates: string[] = [];

    for (const url of scripts) {
      for (const key of getScriptGlobals(url)) {
        const value = win[key];
        if (isModule(value) && claimedGlobals.get(key) !== value) {
          candidates.push(key);
        }
      }
    }

    let key: string | undefined = candidates[0];
    if (candidates.length > 1) {
      const wanted = name.replace(/[^a-z0-9]/gi, '').toLowerCase();
      key = candidates.find(
        (candidate) =>
          candidate.replace(/[^a-z0-9]/gi, '').toLowerCase() === wanted
      );
      if (!key) {
        throw new Error(
          `[Tuvix Loader] Module "${name}": its scripts defined several globals with mount() (${candidates.join(', ')}). ` +
            `Call registerModule("${name}", module) in the app, or name the global after the app.`
        );
      }
    }
    if (!key) return null;

    claimedGlobals.set(key, win[key]);
    return win[key] as MicroAppModule;
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
