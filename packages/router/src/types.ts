/**
 * Router mode
 */
export type RouterMode = 'history' | 'hash';

/**
 * Route definition for mapping URLs to micro apps
 */
export interface RouteConfig {
  /** URL path pattern (supports wildcards: /app/*) */
  path: string;

  /** Name of the micro app to activate */
  app: string;

  /** Whether this route is exact match only */
  exact?: boolean;

  /** Additional metadata for the route */
  meta?: Record<string, unknown>;
}

/**
 * Matched route result
 */
export interface MatchedRoute {
  /** The route config that matched */
  route: RouteConfig;

  /** The matched path */
  path: string;

  /** Extracted path parameters */
  params: Record<string, string>;

  /** Query string parameters */
  query: Record<string, string>;
}

/**
 * Navigation event data
 */
export interface NavigationEvent {
  /** Previous URL */
  from: string;

  /** New URL */
  to: string;

  /** Previous matched route (if any) */
  fromRoute: MatchedRoute | null;

  /** New matched route (if any) */
  toRoute: MatchedRoute | null;
}

/**
 * Navigation guard function.
 * Return false to cancel navigation.
 */
export type NavigationGuard = (
  event: NavigationEvent
) => boolean | Promise<boolean>;

/**
 * Route change handler
 */
export type RouteChangeHandler = (event: NavigationEvent) => void;

/**
 * Router configuration
 */
export interface RouterConfig {
  /** Router mode: 'history' or 'hash' */
  mode?: RouterMode;

  /** Base path prefix for all routes */
  base?: string;

  /** Route definitions */
  routes: RouteConfig[];
}

/**
 * Router interface
 */
export interface IRouter {
  /** Current path */
  readonly currentPath: string;

  /** Current matched route */
  readonly currentRoute: MatchedRoute | null;

  /** Navigate to a new path */
  push(path: string): Promise<void>;

  /** Replace current path (no history entry) */
  replace(path: string): Promise<void>;

  /** Go back in history */
  back(): void;

  /** Go forward in history */
  forward(): void;

  /** Register a route change listener */
  onChange(handler: RouteChangeHandler): () => void;

  /** Register a navigation guard (before navigation) */
  beforeEach(guard: NavigationGuard): () => void;

  /** Match a path against registered routes */
  match(path: string): MatchedRoute | null;

  /** Get active apps for a given path */
  getActiveApps(path?: string): string[];

  /** Destroy the router, clean up listeners */
  destroy(): void;
}
