/**
 * Status of a loaded module
 */
export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Entry point configuration for a micro app
 */
export interface EntryConfig {
  /** URL to the JavaScript entry file */
  scripts: string[];

  /** Optional CSS URLs to load */
  styles?: string[];

  /** Optional HTML template URL */
  html?: string;
}

/**
 * Resolved entry - can be a string URL or full config
 */
export type Entry = string | EntryConfig;

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

export interface MountContext {
  container: HTMLElement;
  props?: Record<string, unknown>;
}

export interface UnmountContext {
  container: HTMLElement;
}

export interface UpdateContext {
  props: Record<string, unknown>;
}

/**
 * Loader options
 */
export interface LoaderOptions {
  /** Request timeout in ms */
  timeout?: number;

  /** Number of retry attempts */
  retries?: number;

  /** Delay between retries in ms */
  retryDelay?: number;

  /** Custom fetch function */
  fetch?: typeof globalThis.fetch;

  /** Global variables to inject before loading scripts */
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
