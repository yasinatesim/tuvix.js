import { describe, it, expect } from 'vitest';
import {
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
    { path: '/settings', app: 'settings', exact: true },
    { path: '/', app: 'home', exact: true },
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
  it('should return true for root pattern', () => {
    expect(isPathActive('/anything', '/')).toBe(true);
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
