import type { RouteConfig, MatchedRoute } from './types';

/**
 * Convert a route path pattern to a regular expression.
 *
 * Supports:
 * - Exact paths: /dashboard
 * - Wildcards: /dashboard/*
 * - Parameters: /users/:id
 * - Parameter + wildcard: /users/:id/*
 */
export function pathToRegex(
  pattern: string,
  exact = false
): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];

  let regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, paramName: string) => {
      paramNames.push(paramName);
      return '([^/]+)';
    })
    .replace(/\/\*$/, '(?:/(.*))?');

  regexStr = '^' + regexStr;

  if (exact || !pattern.endsWith('*')) {
    regexStr += '/?$';
  } else {
    regexStr += '$';
  }

  return {
    regex: new RegExp(regexStr),
    paramNames,
  };
}

/**
 * Parse query string into key-value pairs
 */
export function parseQuery(queryString: string): Record<string, string> {
  const query: Record<string, string> = {};

  if (!queryString || queryString.length === 0) {
    return query;
  }

  const cleaned = queryString.startsWith('?')
    ? queryString.slice(1)
    : queryString;

  if (cleaned.length === 0) {
    return query;
  }

  const pairs = cleaned.split('&');
  for (const pair of pairs) {
    // Split on the first '=' only so values containing '=' (e.g. base64
    // payloads, JWTs) survive intact instead of being truncated.
    const eqIndex = pair.indexOf('=');
    const key = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
    const value = eqIndex === -1 ? '' : pair.slice(eqIndex + 1);
    if (key) {
      try {
        query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      } catch {
        // Malformed percent-encoding — keep raw value rather than throwing.
        query[key] = value;
      }
    }
  }

  return query;
}

/**
 * Match a path against a list of route configs.
 * Returns the first matching route.
 */
export function matchRoute(
  path: string,
  routes: RouteConfig[]
): MatchedRoute | null {
  const [pathname, queryString] = path.split('?');
  const cleanPath = normalizePath(pathname ?? '');
  const query = parseQuery(queryString ?? '');

  for (const route of routes) {
    const { regex, paramNames } = pathToRegex(route.path, route.exact);
    const match = cleanPath.match(regex);

    if (match) {
      const params: Record<string, string> = {};

      paramNames.forEach((name, index) => {
        const value = match[index + 1];
        if (value !== undefined) {
          params[name] = decodeURIComponent(value);
        }
      });

      return {
        route,
        path: cleanPath,
        params,
        query,
      };
    }
  }

  return null;
}

/**
 * Check if a path matches a route pattern.
 * Simplified version for activeWhen checks.
 */
export function isPathActive(path: string, pattern: string): boolean {
  const cleanPath = normalizePath(path.split('?')[0] ?? '');

  if (pattern === '/') {
    return true;
  }

  const { regex } = pathToRegex(pattern);
  return regex.test(cleanPath);
}

/**
 * Normalize a path: ensure leading slash, remove trailing slash
 */
export function normalizePath(path: string): string {
  let normalized = path;

  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}
