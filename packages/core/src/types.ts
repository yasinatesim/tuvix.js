import type { Entry, MicroAppModule } from '@tuvix.js/loader';
import type { RouterConfig } from '@tuvix.js/router';
import type { EventBusOptions } from '@tuvix.js/event-bus';

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
   * - string: URL path pattern (e.g., '/dashboard', '/app/*')
   * - function: Custom activation logic
   * - undefined: Always active (manual mount/unmount)
   */
  activeWhen?: string | ((path: string) => boolean);

  /** Props to pass to the micro app */
  props?: Record<string, unknown>;

  /** Custom sandbox options for this app */
  sandbox?: boolean;

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

  /** Event bus configuration */
  eventBus?: EventBusOptions;

  /** Shared dependencies configuration */
  shared?: Record<string, string>;

  /** Prefetch strategy */
  prefetch?: {
    strategy: 'immediate' | 'idle' | 'hover' | 'none';
  };

  /** Error handler */
  onError?: (error: Error, appName: string) => void;

  /** Called when an app's status changes */
  onStatusChange?: (appName: string, status: AppStatus) => void;
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
