export { Router } from './router';
export { createRouter } from './create-router';
export {
  pathToRegex,
  parseQuery,
  matchRoute,
  isPathActive,
  normalizePath,
} from './path-matcher';

export type {
  RouterMode,
  RouteConfig,
  MatchedRoute,
  NavigationEvent,
  NavigationGuard,
  RouteChangeHandler,
  RouterConfig,
  IRouter,
} from './types';
