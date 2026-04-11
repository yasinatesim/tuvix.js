import type {
  RouterConfig,
  RouterMode,
  RouteConfig,
  MatchedRoute,
  NavigationEvent,
  NavigationGuard,
  RouteChangeHandler,
  IRouter,
} from './types';
import { matchRoute, isPathActive, normalizePath } from './path-matcher';

/**
 * Router for managing URL-based micro app activation.
 *
 * @example
 * ```ts
 * const router = new Router({
 *   mode: 'history',
 *   routes: [
 *     { path: '/dashboard/*', app: 'dashboard' },
 *     { path: '/settings/*', app: 'settings' },
 *   ],
 * });
 *
 * router.onChange(({ toRoute }) => {
 *   if (toRoute) {
 *     console.log(`Activate app: ${toRoute.route.app}`);
 *   }
 * });
 *
 * router.push('/dashboard');
 * ```
 */
export class Router implements IRouter {
  private mode: RouterMode;
  private base: string;
  private routes: RouteConfig[];
  private changeHandlers: Set<RouteChangeHandler>;
  private guards: Set<NavigationGuard>;
  private popstateHandler: (() => void) | null;
  private hashchangeHandler: (() => void) | null;
  private _currentPath: string;
  private _currentRoute: MatchedRoute | null;
  private destroyed: boolean;

  constructor(config: RouterConfig) {
    this.mode = config.mode ?? 'history';
    this.base = normalizePath(config.base ?? '/');
    this.routes = config.routes;
    this.changeHandlers = new Set();
    this.guards = new Set();
    this.popstateHandler = null;
    this.hashchangeHandler = null;
    this.destroyed = false;

    this._currentPath = this.getCurrentUrlPath();
    this._currentRoute = matchRoute(this._currentPath, this.routes);

    this.setupListeners();
  }

  get currentPath(): string {
    return this._currentPath;
  }

  get currentRoute(): MatchedRoute | null {
    return this._currentRoute;
  }

  async push(path: string): Promise<void> {
    this.ensureAlive();
    await this.navigate(normalizePath(path), false);
  }

  async replace(path: string): Promise<void> {
    this.ensureAlive();
    await this.navigate(normalizePath(path), true);
  }

  back(): void {
    this.ensureAlive();
    window.history.back();
  }

  forward(): void {
    this.ensureAlive();
    window.history.forward();
  }

  onChange(handler: RouteChangeHandler): () => void {
    this.ensureAlive();
    this.changeHandlers.add(handler);

    return () => {
      this.changeHandlers.delete(handler);
    };
  }

  beforeEach(guard: NavigationGuard): () => void {
    this.ensureAlive();
    this.guards.add(guard);

    return () => {
      this.guards.delete(guard);
    };
  }

  match(path: string): MatchedRoute | null {
    return matchRoute(normalizePath(path), this.routes);
  }

  getActiveApps(path?: string): string[] {
    const targetPath = path ?? this._currentPath;
    const seen = new Set<string>();
    const activeApps: string[] = [];

    for (const route of this.routes) {
      if (isPathActive(targetPath, route.path) && !seen.has(route.app)) {
        seen.add(route.app);
        activeApps.push(route.app);
      }
    }

    return activeApps;
  }

  destroy(): void {
    this.teardownListeners();
    this.changeHandlers.clear();
    this.guards.clear();
    this.destroyed = true;
  }

  private async navigate(path: string, replace: boolean): Promise<void> {
    const from = this._currentPath;
    const to = path;

    if (from === to) return;

    const fromRoute = this._currentRoute;
    const toRoute = matchRoute(to, this.routes);

    const event: NavigationEvent = {
      from,
      to,
      fromRoute,
      toRoute,
    };

    const canNavigate = await this.runGuards(event);
    if (!canNavigate) return;

    if (this.mode === 'history') {
      if (replace) {
        window.history.replaceState(null, '', to);
      } else {
        window.history.pushState(null, '', to);
      }
    } else {
      const hashPath = '#' + to;
      if (replace) {
        window.history.replaceState(null, '', hashPath);
      } else {
        window.history.pushState(null, '', hashPath);
      }
    }

    this._currentPath = to;
    this._currentRoute = toRoute;

    this.notifyChange(event);
  }

  private async runGuards(event: NavigationEvent): Promise<boolean> {
    for (const guard of this.guards) {
      try {
        const result = await guard(event);
        if (result === false) {
          return false;
        }
      } catch (error) {
        console.error('[Tuvix Router] Navigation guard error:', error);
        return false;
      }
    }
    return true;
  }

  private notifyChange(event: NavigationEvent): void {
    for (const handler of this.changeHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('[Tuvix Router] Route change handler error:', error);
      }
    }
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    if (this.mode === 'history') {
      this.popstateHandler = () => this.handleUrlChange();
      window.addEventListener('popstate', this.popstateHandler);
    } else {
      this.hashchangeHandler = () => this.handleUrlChange();
      window.addEventListener('hashchange', this.hashchangeHandler);
    }
  }

  private handleUrlChange(): void {
    const newPath = this.getCurrentUrlPath();
    if (newPath === this._currentPath) return;

    const from = this._currentPath;
    const fromRoute = this._currentRoute;
    const toRoute = matchRoute(newPath, this.routes);

    const event: NavigationEvent = { from, to: newPath, fromRoute, toRoute };

    // Run guards for browser-initiated navigation (back/forward buttons).
    // If a guard cancels, restore the previous URL without firing popstate.
    this.runGuards(event)
      .then((canNavigate) => {
        if (!canNavigate) {
          // replaceState does not trigger popstate, so this won't recurse.
          if (this.mode === 'history') {
            window.history.replaceState(null, '', from);
          } else {
            window.history.replaceState(null, '', '#' + from);
          }
          return;
        }

        this._currentPath = newPath;
        this._currentRoute = toRoute;
        this.notifyChange(event);
      })
      .catch((error) => {
        console.error(
          '[Tuvix Router] Guard error during browser navigation:',
          error
        );
      });
  }

  private teardownListeners(): void {
    if (typeof window === 'undefined') return;

    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
    }

    if (this.hashchangeHandler) {
      window.removeEventListener('hashchange', this.hashchangeHandler);
      this.hashchangeHandler = null;
    }
  }

  private getCurrentUrlPath(): string {
    if (typeof window === 'undefined') return '/';

    if (this.mode === 'hash') {
      const hash = window.location.hash.slice(1);
      return normalizePath(hash || '/');
    }

    const path = window.location.pathname + window.location.search;
    return normalizePath(this.stripBase(path));
  }

  private stripBase(path: string): string {
    if (this.base === '/') return path;

    if (path.startsWith(this.base)) {
      return path.slice(this.base.length) || '/';
    }

    return path;
  }

  private ensureAlive(): void {
    if (this.destroyed) {
      throw new Error(
        '[Tuvix Router] Cannot use a destroyed Router. Create a new one.'
      );
    }
  }
}
