/**
 * Status of a loaded module
 */
export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * How a `<script>` tag runs: `module` sets `type="module"`, `classic` sets `type="text/javascript"`.
 */
export type ScriptType = 'module' | 'classic';

/**
 * Entry point configuration for a micro app
 */
export interface EntryConfig {
  /** JavaScript URLs, loaded one after another in this order */
  scripts: string[];

  /** Optional CSS URLs, loaded in parallel with the scripts */
  styles?: string[];

  /**
   * Script type for every URL in `scripts`.
   * When omitted, `.mjs`, `.mts`, `.ts`, `.tsx` and `.jsx` URLs load as modules
   * and everything else (including Vite's `.js` ES output) loads as classic.
   * Set `'module'` for ES module bundles that end in `.js`.
   */
  type?: ScriptType;

  /** Subresource integrity hashes, keyed by script or style URL */
  integrity?: Record<string, string>;
}

/**
 * Passed to an {@link EntryLoader}. `signal` aborts when the attempt times out.
 */
export interface EntryLoaderContext {
  signal: AbortSignal;
}

/**
 * A function that returns the micro app module, for example a dynamic import.
 * The loader accepts the module itself or an ES module namespace whose
 * `default` export is the module.
 *
 * @example
 * ```ts
 * import type { EntryLoader } from '@tuvix.js/loader';
 *
 * const entry: EntryLoader = () => import('./dashboard');
 * ```
 */
export type EntryLoader = (
  context: EntryLoaderContext
) => Promise<MicroAppModule | { default: MicroAppModule }>;

/**
 * Where a micro app comes from: one script URL, a script/style config, or a loader function.
 */
export type Entry = string | EntryConfig | EntryLoader;

/**
 * The exports expected from a loaded micro app module
 */
export interface MicroAppModule {
  bootstrap?: () => void | Promise<void>;
  mount: (context: MountContext) => void | Promise<void>;
  unmount: (context: UnmountContext) => void | Promise<void>;
  update?: (context: UpdateContext) => void | Promise<void>;
  [key: string]: unknown;
}

/**
 * The event bus shape a micro app receives in {@link MountContext}.
 * `IEventBus` from `@tuvix.js/event-bus` satisfies it.
 *
 * @example
 * ```ts
 * import type { MicroAppBus } from '@tuvix.js/loader';
 *
 * function listen(bus: MicroAppBus): () => void {
 *   return bus.on<{ id: number }>('cart:add', (item) => console.log(item.id));
 * }
 * ```
 */
export interface MicroAppBus {
  on<T = unknown>(event: string, handler: (data: T) => void): () => void;
  once<T = unknown>(event: string, handler: (data: T) => void): () => void;
  emit<T = unknown>(event: string, data?: T): void;
  off<T = unknown>(event: string, handler: (data: T) => void): void;
}

export interface MountContext {
  container: HTMLElement;
  props?: Record<string, unknown>;
  /** App name the orchestrator registered this module under */
  name?: string;
  /** The orchestrator's event bus */
  bus?: MicroAppBus;
}

export interface UnmountContext {
  container: HTMLElement;
}

export interface UpdateContext {
  props: Record<string, unknown>;
  /**
   * Container to update. Adapters that mount one module into several containers
   * update only this one; when omitted they update every mounted instance.
   */
  container?: HTMLElement;
}

/**
 * Loader options
 */
export interface LoaderOptions {
  /** Time limit for one load attempt in ms. 0 disables it. Default 10000. */
  timeout?: number;

  /** Extra attempts after the first one fails. Default 2. */
  retries?: number;

  /** Delay between attempts in ms. Default 1000. */
  retryDelay?: number;

  /** Properties written to `window` before an entry's scripts load */
  globals?: Record<string, unknown>;
}

/**
 * Load result
 */
export interface LoadResult {
  status: LoadStatus;
  module: MicroAppModule | null;
  error: Error | null;
  duration: number;
}

/**
 * Prefetch strategy
 */
export type PrefetchStrategy = 'immediate' | 'idle' | 'hover' | 'none';

/**
 * Cache entry for loaded modules
 */
export interface CacheEntry {
  module: MicroAppModule;
  loadedAt: number;
  entry: Entry;
}
