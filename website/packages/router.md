---
title: '@tuvix.js/router'
---

<PackageHeader
  name="@tuvix.js/router"
  title="Router"
  description="History and hash routing for micro apps, one path matcher shared with core and the server, and link interception for client-side navigation."
  icon="🔀"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

`@tuvix.js/core` depends on this package and re-exports `createRouter`, `matchPath` and `interceptLinks`, so you can import those three from core too.

## When to use it

The router maps URL paths to micro app names and tells you when the path changes. Use it when the shell owns navigation and decides which micro app is active for a URL. The orchestrator creates one for you when you pass `router` to `createOrchestrator`, so most shells never construct it by hand.

`matchPath` is the one pattern matcher in Tuvix.js. Core uses it for `activeWhen` strings and `@tuvix.js/server` uses it for app `routes`, so a pattern means the same thing in all three places. You can call it on its own, without a router.

If your shell already runs React Router, TanStack Router or another framework router, keep it. Connect it to the orchestrator with `orchestrator.connectRouter({ subscribe, getPath })` from `@tuvix.js/core` and skip this router. You can still use `matchPath` and `interceptLinks` alongside it.

## Quick start

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
    { path: '/settings', app: 'settings' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

router.beforeEach(({ from }) => !from.startsWith('/settings') || confirm('Discard unsaved settings?'));

// <a href="/app/users/42"> now calls router.push('/users/42') instead of reloading.
const stopLinks = interceptLinks({
  navigate: (path) => router.push(path),
  base: '/app',
});

await router.push('/users/42?tab=posts');
console.log(router.currentPath); // '/users/42?tab=posts'
console.log(router.currentRoute?.params); // { id: '42' }
console.log(window.location.pathname); // '/app/users/42'

// On teardown:
stopLinks();
router.destroy();
```

The router attaches its `popstate` (history mode) or `hashchange` (hash mode) listener in the constructor. There is no `start()` call.

With the orchestrator, pass the same config as `router` and navigate through the orchestrator:

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { interceptLinks } from '@tuvix.js/router';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

An app without `activeWhen` follows the `routes` that name it. `orchestrator.getRouter()` returns the `IRouter` instance.

## API

### `createRouter`

```ts
import type { IRouter, RouterConfig } from '@tuvix.js/router';

declare function createRouter(config: RouterConfig): IRouter;
```

Returns `new Router(config)` typed as `IRouter`.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | required | Route table. The router checks routes in array order and the first match wins. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` reads `location.pathname + location.search` and writes with `pushState`. `hash` reads and writes `#/path`. |
| `base` | `string` | `'/'` | Path prefix the app is served under, history mode only. The router strips it when it reads the URL and adds it when it writes. Hash mode ignores it. |

Each `RouteConfig`:

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `path` | `string` | required | Pattern in `matchPath` syntax, matched against the whole path. `'/'` matches the home page only, `'/*'` matches every path, `'/blog/*'` matches `/blog` and everything below it. |
| `app` | `string` | required | Micro app name to activate. |
| `meta` | `Record<string, unknown>` | none | Your data. The router passes it through on `MatchedRoute.route.meta`. |

### `Router`

```ts
import { Router } from '@tuvix.js/router';

const router = new Router({ routes: [{ path: '/cart', app: 'cart' }] });
```

The class behind `createRouter`. It implements `IRouter`:

| Member | Signature | Behaviour |
| --- | --- | --- |
| `currentPath` | `readonly string` | App-relative path without `base`. In history mode it includes the query string. |
| `currentRoute` | `readonly MatchedRoute \| null` | Result of `match(currentPath)`. |
| `push` | `(path: string) => Promise<void>` | Runs the guards, writes the URL with `history.pushState` (`base + path` in history mode, `#path` in hash mode), then runs the `onChange` handlers. |
| `replace` | `(path: string) => Promise<void>` | Same as `push` with `history.replaceState`. |
| `back` | `() => void` | Calls `window.history.back()`. |
| `forward` | `() => void` | Calls `window.history.forward()`. |
| `onChange` | `(handler: RouteChangeHandler) => () => void` | Runs `handler` after each completed navigation. Returns an unsubscribe function. |
| `beforeEach` | `(guard: NavigationGuard) => () => void` | Adds a guard. Returns a function that removes it. |
| `match` | `(path: string) => MatchedRoute \| null` | First route that matches `path`, or `null`. |
| `getActiveApps` | `(path?: string) => string[]` | App names of every route that matches the whole `path` (default: `currentPath`), in route order, without duplicates. |
| `destroy` | `() => void` | Removes the window listener and clears handlers and guards. |

Pass `push` and `replace` a path relative to `base`. With `base: '/app'`, `router.push('/x')` writes `/app/x` and `currentPath` becomes `/x`.

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  base: '/app',
  routes: [
    { path: '/*', app: 'header' },
    { path: '/docs/*', app: 'docs' },
    { path: '/docs/:page', app: 'doc-sidebar' },
  ],
});

router.match('/docs/intro')?.route.app; // 'header' (first match wins)
router.getActiveApps('/docs/intro'); // ['header', 'docs', 'doc-sidebar']
router.getActiveApps('/'); // ['header']
await router.replace('/docs/intro'); // URL: /app/docs/intro, no new history entry
router.back();
```

`match`, `getActiveApps` and `isPathActive` apply the same whole-path rules. A route `'/'` is active on `/` only; use `'/*'` for an app that shows on every page.

#### Guards

Guards run in the order you added them, one at a time, before the URL changes. Resolving to `false` cancels the navigation and skips the remaining guards. Any other value lets it continue. A guard that throws or rejects cancels the navigation, and the router logs the error with `console.error`.

```ts
import { createRouter } from '@tuvix.js/router';

declare function isAdmin(): Promise<boolean>;

const router = createRouter({
  routes: [{ path: '/admin/*', app: 'admin' }],
});

const removeGuard = router.beforeEach(async ({ to }) => {
  if (to.startsWith('/admin')) return isAdmin();
  return true;
});

removeGuard();
```

Guards also run for back and forward buttons. The browser has already moved by then, so when a guard cancels, the router calls `history.replaceState` to put the previous URL (with `base`) back in the address bar. The history entry stays where the browser moved it.

### `matchPath`

```ts
import type { MatchPathOptions, PathMatch } from '@tuvix.js/router';

declare function matchPath(
  pattern: string,
  path: string,
  options?: MatchPathOptions
): PathMatch;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | `true` requires a pattern without `/*` to match the whole path. `false` also matches every sub-path. |

Returns `{ matched, params }`. Rules:

- The matcher drops `?query` and `#hash` from `path` and ignores a trailing slash on both sides.
- `:name` captures one non-empty segment into `params.name`, URI-decoded. A value with malformed percent-encoding stays as written. A segment can mix text and params: `/v:version` matches `/v2`.
- A trailing `/*` matches the base path and everything below it: `/docs/*` matches `/docs` and `/docs/a/b`. The rest is not captured in `params`.
- A `*` in the middle of a pattern matches one segment.
- By default a plain pattern matches its sub-paths on a segment boundary: `/docs` matches `/docs/intro` and does not match `/docsify`.
- `'/'` matches every path by default. With `{ end: true }` it matches `/` only. Router routes always use the `end: true` rules; core `activeWhen` strings and `@tuvix.js/server` app `routes` use the default prefix rules.
- Other regex characters in a pattern match literally. Matching is case-sensitive.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts#bio'); // { matched: true, params: { id: '42' } }
matchPath('/files/:name', '/files/a%20b.txt').params.name; // 'a b.txt'
matchPath('/docs', '/docs/intro').matched; // true
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
matchPath('/docs', '/docsify').matched; // false
matchPath('/', '/anything').matched; // true
matchPath('/a/*/c', '/a/b/c').matched; // true
```

The matcher compiles each pattern once and caches the `RegExp`, so you can call it on every navigation.

### `matchRoute`

```ts
import type { MatchedRoute, RouteConfig } from '@tuvix.js/router';

declare function matchRoute(path: string, routes: RouteConfig[]): MatchedRoute | null;
```

Returns the first route whose `path` matches `path` in full (`end: true` rules), with the cleaned path, decoded params and the parsed query. It ignores the `#hash`. `Router.match` calls it.

```ts
import { matchRoute } from '@tuvix.js/router';

matchRoute('/users/42?tab=info', [{ path: '/users/:id', app: 'users' }]);
// { route: { path: '/users/:id', app: 'users' }, path: '/users/42', params: { id: '42' }, query: { tab: 'info' } }
```

### `isPathActive`

```ts
declare function isPathActive(path: string, pattern: string): boolean;
```

`matchPath(pattern, path, { end: true }).matched`: the whole-path rules routes use, so `'/'` is active on `/` only. `Router.getActiveApps` uses it.

```ts
import { isPathActive } from '@tuvix.js/router';

isPathActive('/settings/profile', '/settings'); // false
isPathActive('/settings/profile', '/settings/*'); // true
isPathActive('/settings/profile', '/'); // false
isPathActive('/settings/profile', '/*'); // true
```

### `pathToRegex`

```ts
declare function pathToRegex(pattern: string): { regex: RegExp; paramNames: string[] };
```

Returns the compiled full-match `RegExp` for a pattern and its param names in order. The `regex` object comes from the shared cache: do not change its `lastIndex` or other state. The regex runs against a normalized path with no query or hash; use `matchPath` when the path may contain them.

```ts
import { pathToRegex } from '@tuvix.js/router';

const { regex, paramNames } = pathToRegex('/posts/:slug');
regex.test('/posts/hello'); // true
paramNames; // ['slug']
```

### `parseQuery`

```ts
declare function parseQuery(queryString: string): Record<string, string>;
```

Parses `a=1&b=2`, with or without the leading `?`. It splits each pair on the first `=` so values such as JWTs keep their `=` characters, decodes keys and values, and keeps the raw text when decoding fails. A key without `=` maps to `''`. A repeated key keeps the last value.

```ts
import { parseQuery } from '@tuvix.js/router';

parseQuery('?token=abc.def=ghi&debug'); // { token: 'abc.def=ghi', debug: '' }
```

### `normalizePath`

```ts
declare function normalizePath(path: string): string;
```

Adds a leading slash and removes one trailing slash. It does not touch the query or hash.

```ts
import { normalizePath } from '@tuvix.js/router';

normalizePath('users/42/'); // '/users/42'
```

### `interceptLinks`

```ts
import type { InterceptLinksOptions } from '@tuvix.js/router';

declare function interceptLinks(options: InterceptLinksOptions): () => void;
```

Listens for clicks on `<a href>` elements under `root`, calls `preventDefault()` on the ones it handles and passes their path to `navigate`. Returns a function that removes every listener it added.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | required | Receives `pathname + search + hash` with `base` removed. The function logs a thrown error or a rejected promise with `console.error`. |
| `root` | `Document \| HTMLElement` | `document` | Element the click listener sits on. |
| `base` | `string` | `'/'` | Path prefix the app is served under. Links outside it go to the browser. The function strips it before calling `navigate` and `prefetch`. |
| `shouldIntercept` | `(anchor: HTMLAnchorElement, url: URL, event: MouseEvent) => boolean` | none | Runs after the built-in checks. Return `false` to let the browser handle the click. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | none | Runs on `pointerenter` or `focusin` over an eligible link, once per `pathname + search`. The path has no hash. |

`interceptLinks` leaves a click to the browser when any of these hold:

- Another handler already called `preventDefault()`.
- The button is not the primary button, or Ctrl, Meta, Shift or Alt is pressed.
- The anchor has a `target` other than `_self`, a `download` attribute, `rel` containing `external`, or a `data-tuvix-reload` attribute.
- The resolved URL has a different origin than the page.
- The URL path is outside `base` (`/app` covers `/app` and `/app/...`, not `/application`).
- The link has a hash and the same path and query as the current page. The browser scrolls to the anchor.
- `shouldIntercept` returns `false`.

`prefetch` applies the attribute, origin and `base` checks. It ignores modifier keys and the hash-only rule, and it does fire for a link to the current page.

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/shop/*', app: 'shop' }] });
const nav = document.querySelector('nav') ?? document;

const stop = interceptLinks({
  navigate: (path) => router.push(path),
  root: nav,
  shouldIntercept: (anchor) => !anchor.closest('[data-legacy]'),
  prefetch: (path) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.append(link);
  },
});

stop();
```

`interceptLinks` finds the anchor with [`resolveLink`](#resolvelink), so links inside open shadow roots work and SVG `<a>` elements are left to the browser. In an environment without `document` or `window` it returns a no-op cleanup function.

### `resolveLink`

```ts
import type { ResolvedLink, ResolveLinkOptions } from '@tuvix.js/router';

declare function resolveLink(
  event: Event,
  options?: ResolveLinkOptions
): ResolvedLink | null;
```

Finds the `<a href>` an event happened on and returns it with its absolute URL and app-relative path. It returns `null` when the browser should handle the link. `interceptLinks` and the orchestrator's `prefetch: { strategy: 'hover' }` use it. Call it from your own listeners when you need the same link rules, for example to warm up data on hover or to log in-app navigation.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `base` | `string` | `'/'` | Path prefix the app is served under. A link outside it returns `null`. The function strips it from `path`. |

| Field | Type | Meaning |
| --- | --- | --- |
| `anchor` | `HTMLAnchorElement` | The `<a>` element. |
| `url` | `URL` | Absolute URL of the link. |
| `path` | `string` | `pathname + search + hash`, with `base` removed. |

```ts
import { resolveLink } from '@tuvix.js/router';

const warmed = new Set<string>();

function warmUp(event: Event): void {
  const link = resolveLink(event, { base: '/app' });
  if (!link || warmed.has(link.url.pathname)) return;
  warmed.add(link.url.pathname);
  void fetch(`/api/page-data?path=${encodeURIComponent(link.path)}`);
}

// pointerenter does not bubble, so listen in the capture phase.
document.addEventListener('pointerenter', warmUp, true);
document.addEventListener('focusin', warmUp);
```

`resolveLink` returns `null` when any of these hold:

- The nearest `<a>` on the event path is an SVG `<a>`, or an HTML `<a>` without `href`, or there is no `<a>` at all. The search stops at the first `<a>` it meets.
- The anchor has a `target` other than `_self`, a `download` attribute, `rel` containing `external`, or a `data-tuvix-reload` attribute.
- The URL has a different origin than the page.
- The URL path is outside `base` (`/app` covers `/app` and `/app/...`, not `/application`).
- There is no `window`, as on the server.

It reads `event.composedPath()`, so a listener on `document` finds links inside open shadow roots. Links inside closed shadow roots stay hidden from it. Call it while the event is dispatching: once dispatch ends, the composed path is empty and the function falls back to `event.target.closest('a')`, which cannot look inside a shadow root.

It does not check the mouse button, modifier keys, `defaultPrevented` or the hash-only rule. `interceptLinks` applies those on top for clicks.

### Types

| Type | Meaning |
| --- | --- |
| `RouterMode` | `'history' \| 'hash'`. |
| `RouterConfig` | `{ mode?, base?, routes }`, the `createRouter` options. |
| `RouteConfig` | `{ path, app, meta? }`, one route. |
| `MatchedRoute` | `{ route, path, params, query }`. `path` is the cleaned pathname, `params` the decoded `:param` values, `query` the parsed query string. |
| `NavigationEvent` | `{ from, to, fromRoute, toRoute }`. `from` and `to` are app-relative paths without `base`. |
| `NavigationGuard` | `(event: NavigationEvent) => boolean \| Promise<boolean>`. |
| `RouteChangeHandler` | `(event: NavigationEvent) => void`. |
| `IRouter` | Interface `Router` implements and `createRouter` returns. |
| `PathMatch` | `{ matched: boolean; params: Record<string, string> }`, the `matchPath` result. `params` is `{}` when nothing matched. |
| `MatchPathOptions` | `{ end?: boolean }`. |
| `InterceptLinksOptions` | Options for `interceptLinks`. |
| `ResolveLinkOptions` | `{ base?: string }`, the `resolveLink` options. |
| `ResolvedLink` | `{ anchor: HTMLAnchorElement; url: URL; path: string }`, the `resolveLink` result. |

## Edge cases

- `push` and `replace` to the path you are on (same string, query included) return without running guards or handlers.
- The router does not cancel a pending navigation when you start another one. Each `push` awaits its own guards, then writes the URL, so the last guard chain to finish wins.
- The router learns about URL changes from its own `push`/`replace` and from `popstate`/`hashchange`. If other code calls `history.pushState`, `currentPath` stays stale until the next event or router navigation.
- After `destroy()`, `push`, `replace`, `back`, `forward`, `onChange` and `beforeEach` throw `[Tuvix Router] Cannot use a destroyed Router. Create a new one.` `match` and `getActiveApps` keep working.
- The router logs an `onChange` handler that throws with `console.error` and still calls the other handlers.
- With `base: '/app'`, the router reads `/application` as `/application`: it strips the base only on a segment boundary. In history mode it drops the `#hash` when it reads the URL.
- On the server (no `window`), the constructor sets `currentPath` to `'/'` and attaches no listener. `push`, `replace`, `back` and `forward` need `window`.
- `matchPath` with a `/*` pattern matches the base path itself: `/dashboard/*` matches `/dashboard`.
- An event on an `<a>` inside an `<svg>` resolves to `null`, even when an HTML `<a>` wraps the SVG. `interceptLinks` and the orchestrator's hover prefetch leave that link to the browser, which loads the full page.

## What it does not do

- It does not mount or unmount micro apps. It reports matches and changes; the orchestrator in `@tuvix.js/core` acts on them.
- It does not intercept link clicks unless you call `interceptLinks`.
- It has no nested routes, named routes, redirects or per-route guards. Use `beforeEach` and check `to` or `toRoute`.
- It does not capture the `/*` rest of a path in `params`.
- It does not restore scroll position.

## Migrating from 0.4

`push()` and `replace()` now prefix `base`. Pass paths relative to `base`:

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ base: '/app', routes: [] });

// 0.4: router.push('/app/x') wrote /app/x, router.push('/x') wrote /x
// 0.5: router.push('/x') writes /app/x
await router.push('/x');
```

Other breaking changes:

- `base` strips only on a segment boundary: `/application` no longer reads as `/lication`.
- Routes match the whole path in `match`, `getActiveApps` and `isPathActive`. In 0.4, `getActiveApps` and `isPathActive` treated a `'/'` route as active on every path. Change a catch-all `{ path: '/', app }` to `{ path: '/*', app }`.
- `RouteConfig.exact` is removed. It was accepted and ignored; delete it from your route objects.
- `pathToRegex(pattern)` lost its second `exact` argument and returns a cached `RegExp`.
- Regex characters in patterns match literally, and a `*` in the middle of a pattern matches one segment.
- `matchRoute()` and `isPathActive()` ignore a `#hash` in the path.
- The 0.4 docs listed `navigate`, `go` and `onRouteChange`, a router `orchestrator` option and a per-route `guard`. None of these exist. Use `push`, `back`/`forward`, `onChange`, the orchestrator's `router` config and `beforeEach`.
