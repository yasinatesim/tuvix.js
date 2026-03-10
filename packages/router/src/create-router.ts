import { Router } from './router';
import type { RouterConfig, IRouter } from './types';

/**
 * Create a new Router instance.
 *
 * @example
 * ```ts
 * import { createRouter } from '@tuvix.js/router';
 *
 * const router = createRouter({
 *   mode: 'history',
 *   routes: [
 *     { path: '/dashboard/*', app: 'dashboard' },
 *     { path: '/settings/*', app: 'settings' },
 *   ],
 * });
 * ```
 */
export function createRouter(config: RouterConfig): IRouter {
  return new Router(config);
}
