import type { RouteConfig, MatchedRoute } from './types';

/**
 * Result of {@link matchPath}.
 *
 * @example
 * ```ts
 * import { matchPath, type PathMatch } from '@tuvix.js/router';
 *
 * const result: PathMatch = matchPath('/users/:id', '/users/7');
 * if (result.matched) console.log(result.params.id);
 * ```
 */
export interface PathMatch {
  /** True when the path satisfies the pattern. */
  matched: boolean;
  /** Decoded `:param` values. Empty when nothing matched. */
  params: Record<string, string>;
}

/**
 * Options for {@link matchPath}.
 *
 * @example
 * ```ts
 * import { matchPath, type MatchPathOptions } from '@tuvix.js/router';
 *
 * const exact: MatchPathOptions = { end: true };
 * matchPath('/settings', '/settings/profile', exact).matched; // false
 * ```
 */
export interface MatchPathOptions {
  /**
   * When true, a pattern without a trailing `/*` must match the whole path.
   * When false (the default), it also matches every sub-path, so `/docs`
   * matches `/docs/intro`. `'/'` then matches every path.
   */
  end?: boolean;
}

interface CompiledPattern {
  regex: RegExp;
  paramNames: string[];
}

const compiledCache = new Map<string, CompiledPattern>();

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Compile a pattern once and reuse the result for every later match.
 * `end: true` anchors patterns without a trailing `/*` at the end of the path.
 */
function compile(pattern: string, end: boolean): CompiledPattern {
  const key = (end ? 'e:' : 'p:') + pattern;
  const cached = compiledCache.get(key);
  if (cached) return cached;

  const paramNames: string[] = [];
  const segments = normalizePath(pattern).split('/').slice(1);
  let wildcard = false;
  let body = '';

  segments.forEach((segment, index) => {
    if (segment === '') return;
    if (segment === '*') {
      if (index === segments.length - 1) {
        wildcard = true;
        return;
      }
      body += '/[^/]+';
      return;
    }
    body += '/';
    // A segment may mix literal text and params, e.g. `/v:version`.
    let lastIndex = 0;
    const paramRe = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let m: RegExpExecArray | null;
    while ((m = paramRe.exec(segment)) !== null) {
      body += escapeRegex(segment.slice(lastIndex, m.index)) + '([^/]+)';
      paramNames.push(m[1] as string);
      lastIndex = m.index + m[0].length;
    }
    body += escapeRegex(segment.slice(lastIndex));
  });

  const tail = wildcard || !end ? '(?:/(.*))?/?$' : '/?$';
  const compiled: CompiledPattern = {
    regex: new RegExp('^' + body + tail),
    paramNames,
  };
  compiledCache.set(key, compiled);
  return compiled;
}

/** Drop `?query` and `#hash`, then normalize slashes. */
function cleanPathname(path: string): string {
  let end = path.length;
  const q = path.indexOf('?');
  if (q !== -1) end = q;
  const h = path.indexOf('#');
  if (h !== -1 && h < end) end = h;
  return normalizePath(path.slice(0, end));
}

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function execPattern(
  pattern: string,
  pathname: string,
  end: boolean
): PathMatch {
  const { regex, paramNames } = compile(pattern, end);
  const match = regex.exec(pathname);
  if (!match) return { matched: false, params: {} };
  if (paramNames.length === 0) return { matched: true, params: {} };

  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    const value = match[index + 1];
    if (value !== undefined) params[name] = decodeParam(value);
  });
  return { matched: true, params };
}

/**
 * Match a URL path against a route pattern. This is the matcher behind the
 * router's routes, the orchestrator's `activeWhen` strings and server-side
 * app selection.
 *
 * - `?query` and `#hash` are ignored, and so is a trailing slash.
 * - `:name` captures one path segment into `params.name` (URI-decoded).
 * - A trailing `/*` matches the base path and everything below it.
 * - By default a plain pattern also matches its sub-paths (`/docs` matches
 *   `/docs/intro`, not `/docsify`) and `'/'` matches every path. Pass
 *   `{ end: true }` to require a full match.
 *
 * Compiled patterns are cached, so calling this on every navigation is cheap.
 *
 * @example
 * ```ts
 * import { matchPath } from '@tuvix.js/router';
 *
 * matchPath('/users/:id', '/users/42?tab=posts');
 * // { matched: true, params: { id: '42' } }
 *
 * matchPath('/settings', '/settings/profile', { end: true }).matched; // false
 * ```
 */
export function matchPath(
  pattern: string,
  path: string,
  options: MatchPathOptions = {}
): PathMatch {
  return execPattern(pattern, cleanPathname(path), options.end === true);
}

/**
 * Convert a route path pattern to a regular expression that matches the
 * full path. Results are cached; do not mutate the returned `RegExp`.
 *
 * Supports:
 * - Exact paths: /dashboard
 * - Wildcards: /dashboard/*
 * - Parameters: /users/:id
 * - Parameter + wildcard: /users/:id/*
 *
 * Patterns without a trailing `/*` match the whole path only.
 */
export function pathToRegex(pattern: string): {
  regex: RegExp;
  paramNames: string[];
} {
  const { regex, paramNames } = compile(pattern, true);
  return { regex, paramNames: paramNames.slice() };
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
 * Returns the first matching route. Plain route paths must match in full;
 * use a trailing `/*` to match sub-paths.
 */
export function matchRoute(
  path: string,
  routes: RouteConfig[]
): MatchedRoute | null {
  const hashIndex = path.indexOf('#');
  const withoutHash = hashIndex === -1 ? path : path.slice(0, hashIndex);
  const queryIndex = withoutHash.indexOf('?');
  const cleanPath = cleanPathname(withoutHash);
  const query = parseQuery(
    queryIndex === -1 ? '' : withoutHash.slice(queryIndex + 1)
  );

  for (const route of routes) {
    const result = execPattern(route.path, cleanPath, true);
    if (result.matched) {
      return {
        route,
        path: cleanPath,
        params: result.params,
        query,
      };
    }
  }

  return null;
}

/**
 * Check if a path matches a route pattern in full, with the same rules as
 * {@link matchRoute}: `'/'` matches only `/`; use `'/*'` to match every path.
 * Use {@link matchPath} for the prefix matching `activeWhen` uses.
 */
export function isPathActive(path: string, pattern: string): boolean {
  return matchPath(pattern, path, { end: true }).matched;
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
