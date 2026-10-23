import type { Entry, LoaderOptions, MicroAppModule } from '@tuvix.js/loader';
import type { RouterConfig } from '@tuvix.js/router';
import type { EventBusOptions } from '@tuvix.js/event-bus';

/**
 * CSS isolation for one app. `true` and `{ css: true }` render the app inside
 * a shadow root on its container and load the entry's `styles` there instead
 * of in `document.head`. `{ css: false }` turns it off. The orchestrator does
 * not sandbox JavaScript; use `JsSandbox` from `@tuvix.js/sandbox` for that.
 *
 * @example
 * ```ts
 * import type { AppSandboxOption } from '@tuvix.js/core';
 *
 * const sandbox: AppSandboxOption = { css: true };
 * ```
 */
export type AppSandboxOption = boolean | { css?: boolean };

/**
 * An external router the orchestrator follows, for
 * `Orchestrator.connectRouter`.
 *
 * @example
 * ```ts
 * import type { RouterSource } from '@tuvix.js/core';
 *
 * const source: RouterSource = {
 *   subscribe(callback) {
 *     window.addEventListener('popstate', callback);
 *     return () => window.removeEventListener('popstate', callback);
 *   },
 *   getPath: () => window.location.pathname,
 * };
 * ```
 */
export interface RouterSource {
  /** Call `callback` after every navigation. Return an unsubscribe function. */
  subscribe(callback: () => void): () => void;
  /** Current path, e.g. `router.state.location.pathname`. */
  getPath(): string;
}

/**
 * Lifecycle status of a micro app
 */
export type AppStatus =
  | 'registered'
  | 'bootstrapping'
  | 'bootstrapped'
  | 'mounting'
  | 'mounted'
  | 'updating'
  | 'unmounting'
  | 'unmounted'
  | 'error';

/**
 * Configuration for registering a micro app
 */
export interface MicroAppConfig {
  /** Unique name for the micro app */
  name: string;

  /** Entry point URL(s) for the micro app */
  entry: Entry;

  /** CSS selector or HTMLElement for the container */
  container: string | HTMLElement;

  /**
   * When should this app be active?
   * - string: path pattern matched with `matchPath` from `@tuvix.js/router`.
   *   `'/dashboard'` and `'/dashboard/*'` both match `/dashboard` and every
   *   path below it; `':id'` matches one segment; `'/'` matches every path;
   *   query strings and hashes are ignored.
   * - function: custom activation logic, receives the current path
   * - undefined: the app follows the router `routes` that name it; with no
   *   such route, you mount and unmount it yourself
   */
  activeWhen?: string | ((path: string) => boolean);

  /** Props to pass to the micro app */
  props?: Record<string, unknown>;

  /** CSS isolation via Shadow DOM. See {@link AppSandboxOption}. */
  sandbox?: AppSandboxOption;

  /**
   * HTML string rendered into the container when the app fails to mount.
   * Shown immediately on any mount error (load failure, timeout, runtime error).
   */
  fallback?: string;

  /**
   * When true, the app is lazy-mounted via IntersectionObserver once its
   * container scrolls into the viewport (10 % visibility threshold).
   * Incompatible with `activeWhen` — use one or the other.
   */
  mountWhenVisible?: boolean;
}

/**
 * Internal representation of a registered micro app
 */
export interface RegisteredApp {
  /** App configuration */
  config: MicroAppConfig;

  /** Current lifecycle status */
  status: AppStatus;

  /** Loaded module (null until loaded) */
  module: MicroAppModule | null;

  /** Resolved container element */
  container: HTMLElement | null;

  /** Error if any */
  error: Error | null;

  /** Timestamp of last status change */
  lastUpdated: number;
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  /** Router configuration */
  router?: RouterConfig;

  /**
   * Options for a private event bus. Omit it to share `getGlobalBus()` with
   * every app on the page.
   */
  eventBus?: EventBusOptions;

  /** Options for the module loader: timeout, retries, retry delay, globals. */
  loader?: LoaderOptions;

  /**
   * Prefetch strategy for app entries:
   * - `immediate`: on `start()`
   * - `idle`: in the first idle period after `start()`
   * - `hover`: when the pointer enters (or focus lands on) a same-origin link
   *   whose path activates an app; each app is prefetched once
   * - `none` (default)
   */
  prefetch?: {
    strategy: 'immediate' | 'idle' | 'hover' | 'none';
  };

  /**
   * Called when an app fails to load, bootstrap, mount, update or unmount.
   * The orchestrator also emits `tuvix:app:error` on its bus for each failure.
   */
  onError?: (error: Error, appName: string) => void;

  /** Called when an app's status changes */
  onStatusChange?: (appName: string, status: AppStatus) => void;
}

/**
 * Lifecycle step that failed, reported in {@link AppErrorEvent}.
 * `load` covers resolving the container and loading the entry.
 */
export type AppErrorPhase =
  'load' | 'bootstrap' | 'mount' | 'update' | 'unmount';

/**
 * Payload of the `tuvix:app:error` bus event.
 *
 * @example
 * ```ts
 * import { createOrchestrator, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';
 *
 * const orchestrator = createOrchestrator();
 * orchestrator.getEventBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, (e) => {
 *   console.error(`${e.name} failed during ${e.phase}`, e.error);
 * });
 * ```
 */
export interface AppErrorEvent {
  name: string;
  error: Error;
  phase: AppErrorPhase;
}

/**
 * Orchestrator events (emitted on the event bus)
 */
export enum OrchestratorEvent {
  APP_REGISTERED = 'tuvix:app:registered',
  APP_BOOTSTRAP = 'tuvix:app:bootstrap',
  APP_MOUNT = 'tuvix:app:mount',
  APP_UNMOUNT = 'tuvix:app:unmount',
  APP_ERROR = 'tuvix:app:error',
  APP_STATUS_CHANGE = 'tuvix:app:status-change',
  ROUTE_CHANGE = 'tuvix:route:change',
  STARTED = 'tuvix:started',
  DESTROYED = 'tuvix:destroyed',
}
