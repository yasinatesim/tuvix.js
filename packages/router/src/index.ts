export { Router } from './router';
export { createRouter } from './create-router';
export {
  matchPath,
  pathToRegex,
  parseQuery,
  matchRoute,
  isPathActive,
  normalizePath,
} from './path-matcher';
export type { PathMatch, MatchPathOptions } from './path-matcher';
export { interceptLinks, resolveLink } from './intercept-links';
export type {
  InterceptLinksOptions,
  ResolvedLink,
  ResolveLinkOptions,
} from './intercept-links';

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
