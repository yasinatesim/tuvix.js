import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Router } from '../router';
import type { NavigationEvent } from '../types';

describe('Router', () => {
  let router: Router | null = null;

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    router?.destroy();
    router = null;
  });

  it('push writes the URL, updates currentPath and notifies listeners', async () => {
    router = new Router({ routes: [{ path: '/users/:id', app: 'users' }] });
    const events: NavigationEvent[] = [];
    router.onChange((event) => events.push(event));

    await router.push('/users/7');

    expect(window.location.pathname).toBe('/users/7');
    expect(router.currentPath).toBe('/users/7');
    expect(router.currentRoute?.params).toEqual({ id: '7' });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ from: '/', to: '/users/7' });
  });

  it('replace swaps the current history entry instead of adding one', async () => {
    router = new Router({ routes: [] });
    const lengthBefore = window.history.length;

    await router.replace('/replaced');

    expect(window.location.pathname).toBe('/replaced');
    expect(window.history.length).toBe(lengthBefore);

    await router.push('/pushed');
    expect(window.history.length).toBe(lengthBefore + 1);
  });

  it('push and replace prefix the base path', async () => {
    window.history.replaceState(null, '', '/app');
    router = new Router({ base: '/app', routes: [] });
    expect(router.currentPath).toBe('/');

    await router.push('/settings?tab=1');
    expect(window.location.pathname).toBe('/app/settings');
    expect(window.location.search).toBe('?tab=1');
    expect(router.currentPath).toBe('/settings?tab=1');

    await router.replace('/');
    expect(window.location.pathname).toBe('/app');
    expect(router.currentPath).toBe('/');
  });

  it('only strips the base on a segment boundary', () => {
    window.history.replaceState(null, '', '/application/x');
    router = new Router({ base: '/app', routes: [] });
    expect(router.currentPath).toBe('/application/x');
  });

  it('a guard returning false cancels push', async () => {
    router = new Router({ routes: [] });
    const onChange = vi.fn();
    router.onChange(onChange);
    router.beforeEach((event) => event.to !== '/blocked');

    await router.push('/blocked');
    expect(window.location.pathname).toBe('/');
    expect(router.currentPath).toBe('/');
    expect(onChange).not.toHaveBeenCalled();

    await router.push('/allowed');
    expect(window.location.pathname).toBe('/allowed');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('a throwing guard cancels navigation', async () => {
    router = new Router({ routes: [] });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    router.beforeEach(() => {
      throw new Error('nope');
    });

    await router.push('/x');

    expect(window.location.pathname).toBe('/');
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('popstate updates currentPath and notifies listeners', async () => {
    router = new Router({ routes: [] });
    const onChange = vi.fn();
    router.onChange(onChange);

    window.history.pushState(null, '', '/from-browser?q=1');
    window.dispatchEvent(new PopStateEvent('popstate'));

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(router.currentPath).toBe('/from-browser?q=1');
    expect(onChange.mock.calls[0]?.[0]).toMatchObject({
      from: '/',
      to: '/from-browser?q=1',
    });
  });

  it('a guard cancelling popstate restores the previous URL, base included', async () => {
    window.history.replaceState(null, '', '/app/a');
    router = new Router({ base: '/app', routes: [] });
    const onChange = vi.fn();
    router.onChange(onChange);
    const guard = vi.fn(() => false);
    router.beforeEach(guard);

    window.history.pushState(null, '', '/app/b');
    window.dispatchEvent(new PopStateEvent('popstate'));

    await vi.waitFor(() => expect(window.location.pathname).toBe('/app/a'));
    expect(guard).toHaveBeenCalledTimes(1);
    expect(router.currentPath).toBe('/a');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('hash mode writes #path', async () => {
    router = new Router({ mode: 'hash', routes: [] });
    await router.push('/inbox');
    expect(window.location.hash).toBe('#/inbox');
    expect(router.currentPath).toBe('/inbox');
  });

  it('stops listening to popstate after destroy', async () => {
    router = new Router({ routes: [] });
    const onChange = vi.fn();
    router.onChange(onChange);
    router.destroy();

    window.history.pushState(null, '', '/later');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await Promise.resolve();

    expect(onChange).not.toHaveBeenCalled();
    await expect(router.push('/x')).rejects.toThrow(/destroyed/);
  });

  it('getActiveApps ignores the query string', () => {
    router = new Router({
      routes: [
        { path: '/shop/*', app: 'shop' },
        { path: '/settings', app: 'settings' },
      ],
    });
    expect(router.getActiveApps('/shop/cart?coupon=1')).toEqual(['shop']);
    expect(router.getActiveApps('/settings?tab=2')).toEqual(['settings']);
    expect(router.getActiveApps('/settings/sub')).toEqual([]);
  });
});

describe('Router routes activation', () => {
  it("a '/' route activates only on the home page, the same as router.match", () => {
    window.history.replaceState(null, '', '/');
    const router = new Router({
      routes: [
        { path: '/', app: 'home' },
        { path: '/*', app: 'shell' },
        { path: '/blog/*', app: 'blog' },
      ],
    });

    expect(router.getActiveApps('/')).toEqual(['home', 'shell']);
    expect(router.getActiveApps('/blog/post?x=1')).toEqual(['shell', 'blog']);
    expect(router.match('/blog/post')?.route.app).toBe('shell');
    expect(router.match('/')?.route.app).toBe('home');
    router.destroy();
  });
});

describe('Router URL listeners', () => {
  it('hash mode follows hashchange events', async () => {
    window.history.replaceState(null, '', '/#/start');
    const router = new Router({ mode: 'hash', routes: [] });
    const onChange = vi.fn();
    router.onChange(onChange);
    expect(router.currentPath).toBe('/start');

    window.history.pushState(null, '', '#/inbox/3');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(router.currentPath).toBe('/inbox/3');
    expect(onChange.mock.calls[0]?.[0]).toMatchObject({
      from: '/start',
      to: '/inbox/3',
    });
    router.destroy();
  });

  it('strips the base from the URL on popstate', async () => {
    window.history.replaceState(null, '', '/app');
    const router = new Router({
      base: '/app',
      routes: [{ path: '/users/:id', app: 'users' }],
    });
    const onChange = vi.fn();
    router.onChange(onChange);

    window.history.pushState(null, '', '/app/users/5?tab=posts');
    window.dispatchEvent(new PopStateEvent('popstate'));

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(router.currentPath).toBe('/users/5?tab=posts');
    expect(router.currentRoute?.params).toEqual({ id: '5' });
    router.destroy();
  });
});
