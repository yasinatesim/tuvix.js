import { describe, it, expect } from 'vitest';
import {
  matchPath,
  pathToRegex,
  parseQuery,
  matchRoute,
  isPathActive,
  normalizePath,
} from '../path-matcher';

describe('normalizePath', () => {
  it('should add leading slash', () => {
    expect(normalizePath('dashboard')).toBe('/dashboard');
  });

  it('should remove trailing slash', () => {
    expect(normalizePath('/dashboard/')).toBe('/dashboard');
  });

  it('should keep root path', () => {
    expect(normalizePath('/')).toBe('/');
  });

  it('should handle empty string', () => {
    expect(normalizePath('')).toBe('/');
  });

  it('should handle already normalized paths', () => {
    expect(normalizePath('/users/42')).toBe('/users/42');
  });
});

describe('pathToRegex', () => {
  it('should match exact paths', () => {
    const { regex } = pathToRegex('/dashboard');
    expect(regex.test('/dashboard')).toBe(true);
    expect(regex.test('/dashboard/')).toBe(true);
    expect(regex.test('/other')).toBe(false);
  });

  it('should match wildcard paths', () => {
    const { regex } = pathToRegex('/app/*');
    expect(regex.test('/app')).toBe(true);
    expect(regex.test('/app/')).toBe(true);
    expect(regex.test('/app/page')).toBe(true);
    expect(regex.test('/app/page/sub')).toBe(true);
    expect(regex.test('/other')).toBe(false);
  });

  it('should match parameter paths', () => {
    const { regex, paramNames } = pathToRegex('/users/:id');
    expect(regex.test('/users/42')).toBe(true);
    expect(regex.test('/users/abc')).toBe(true);
    expect(regex.test('/users')).toBe(false);
    expect(paramNames).toEqual(['id']);
  });

  it('should match multiple parameters', () => {
    const { regex, paramNames } = pathToRegex('/users/:userId/posts/:postId');
    expect(regex.test('/users/1/posts/2')).toBe(true);
    expect(paramNames).toEqual(['userId', 'postId']);
  });

  it('should extract parameter values', () => {
    const { regex, paramNames } = pathToRegex('/users/:id');
    const match = '/users/42'.match(regex);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('42');
    expect(paramNames[0]).toBe('id');
  });
});

describe('parseQuery', () => {
  it('should parse query string', () => {
    expect(parseQuery('foo=bar&baz=qux')).toEqual({
      foo: 'bar',
      baz: 'qux',
    });
  });

  it('should handle leading ?', () => {
    expect(parseQuery('?foo=bar')).toEqual({ foo: 'bar' });
  });

  it('should handle empty value', () => {
    expect(parseQuery('foo=')).toEqual({ foo: '' });
    expect(parseQuery('foo')).toEqual({ foo: '' });
  });

  it('should handle empty string', () => {
    expect(parseQuery('')).toEqual({});
  });

  it('should decode URI components', () => {
    expect(parseQuery('name=hello%20world')).toEqual({
      name: 'hello world',
    });
  });
});

describe('matchRoute', () => {
  const routes = [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-detail' },
    { path: '/settings', app: 'settings' },
    { path: '/', app: 'home' },
  ];

  it('should match wildcard route', () => {
    const result = matchRoute('/dashboard/stats', routes);
    expect(result).not.toBeNull();
    expect(result!.route.app).toBe('dashboard');
  });

  it('should match parameterized route', () => {
    const result = matchRoute('/users/42', routes);
    expect(result).not.toBeNull();
    expect(result!.route.app).toBe('user-detail');
    expect(result!.params).toEqual({ id: '42' });
  });

  it('should match exact route', () => {
    const result = matchRoute('/settings', routes);
    expect(result).not.toBeNull();
    expect(result!.route.app).toBe('settings');
  });

  it('should return null for unmatched path', () => {
    const result = matchRoute('/unknown', routes);
    expect(result).toBeNull();
  });

  it('should parse query parameters', () => {
    const result = matchRoute('/dashboard/stats?tab=overview&page=1', routes);
    expect(result).not.toBeNull();
    expect(result!.query).toEqual({ tab: 'overview', page: '1' });
  });

  it('should return first match', () => {
    const overlappingRoutes = [
      { path: '/app/*', app: 'app-a' },
      { path: '/app/specific', app: 'app-b' },
    ];
    const result = matchRoute('/app/specific', overlappingRoutes);
    expect(result!.route.app).toBe('app-a');
  });
});

describe('isPathActive', () => {
  it("treats '/' as exact, like matchRoute, and '/*' as catch-all", () => {
    expect(isPathActive('/', '/')).toBe(true);
    expect(isPathActive('/?q=1', '/')).toBe(true);
    expect(isPathActive('/anything', '/')).toBe(false);
    expect(matchRoute('/anything', [{ path: '/', app: 'home' }])).toBeNull();
    expect(isPathActive('/anything/deep', '/*')).toBe(true);
  });

  it('should match wildcard pattern', () => {
    expect(isPathActive('/dashboard/page', '/dashboard/*')).toBe(true);
    expect(isPathActive('/dashboard', '/dashboard/*')).toBe(true);
    expect(isPathActive('/other', '/dashboard/*')).toBe(false);
  });

  it('should match exact pattern', () => {
    expect(isPathActive('/settings', '/settings')).toBe(true);
    expect(isPathActive('/settings/sub', '/settings')).toBe(false);
  });
});

describe('matchPath', () => {
  it('ignores the query string and hash', () => {
    expect(matchPath('/dashboard', '/dashboard?tab=1').matched).toBe(true);
    expect(matchPath('/dashboard', '/dashboard#top').matched).toBe(true);
    expect(matchPath('/dashboard', '/dashboard/?tab=1#top').matched).toBe(true);
  });

  it('captures and decodes :params', () => {
    expect(matchPath('/users/:id', '/users/42?x=1')).toEqual({
      matched: true,
      params: { id: '42' },
    });
    expect(matchPath('/files/:name', '/files/a%20b').params).toEqual({
      name: 'a b',
    });
    expect(matchPath('/users/:id', '/users').matched).toBe(false);
  });

  it('keeps malformed percent-encoding instead of throwing', () => {
    expect(matchPath('/files/:name', '/files/%E0%A4%A').params).toEqual({
      name: '%E0%A4%A',
    });
  });

  it('matches sub-paths on segment boundaries by default', () => {
    expect(matchPath('/docs', '/docs/intro').matched).toBe(true);
    expect(matchPath('/docs/*', '/docs').matched).toBe(true);
    expect(matchPath('/docs/*', '/docs/a/b').matched).toBe(true);
    expect(matchPath('/docs', '/docsify').matched).toBe(false);
    expect(matchPath('/docs/*', '/docsify').matched).toBe(false);
    expect(matchPath('/users/:id', '/users/42/posts').params).toEqual({
      id: '42',
    });
  });

  it('requires a full match with end: true, except for /*', () => {
    expect(matchPath('/docs', '/docs/intro', { end: true }).matched).toBe(
      false
    );
    expect(matchPath('/docs', '/docs/', { end: true }).matched).toBe(true);
    expect(matchPath('/docs/*', '/docs/intro', { end: true }).matched).toBe(
      true
    );
  });

  it("'/' matches every path by default and only '/' with end: true", () => {
    expect(matchPath('/', '/anything/deep?q=1').matched).toBe(true);
    expect(matchPath('/', '/', { end: true }).matched).toBe(true);
    expect(matchPath('/', '/x', { end: true }).matched).toBe(false);
  });

  it('treats regex characters in patterns literally', () => {
    expect(matchPath('/a.b', '/a.b').matched).toBe(true);
    expect(matchPath('/a.b', '/axb').matched).toBe(false);
    expect(matchPath('/v(1)', '/v(1)').matched).toBe(true);
  });

  it('reuses the compiled pattern', () => {
    // A matcher that rebuilds its RegExp per call hands out a new object each time.
    expect(pathToRegex('/cached/:id').regex).toBe(
      pathToRegex('/cached/:id').regex
    );
  });
});

describe('matchRoute with query and hash', () => {
  it('matches a param route when the path has a query and hash', () => {
    const result = matchRoute('/users/9?tab=a#h', [
      { path: '/users/:id', app: 'users' },
    ]);
    expect(result?.params).toEqual({ id: '9' });
    expect(result?.query).toEqual({ tab: 'a' });
    expect(result?.path).toBe('/users/9');
  });
});
