# @tuvix.js/router

> History and hash routing for micro apps, the shared `matchPath` matcher, and link interception

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework. Full docs: [tuvix.js.org/packages/router](https://tuvix.js.org/packages/router).

The router maps URL paths to micro app names and tells you when the path changes. `matchPath` is the pattern matcher that core `activeWhen` and `@tuvix.js/server` also use. If your shell already runs React Router or TanStack Router, connect it with `orchestrator.connectRouter()` from `@tuvix.js/core` instead.

## Installation

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

## Quick start

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

const stopLinks = interceptLinks({ navigate: (path) => router.push(path), base: '/app' });

await router.push('/users/42'); // URL: /app/users/42, currentPath: '/users/42'

stopLinks();
router.destroy();
```

The constructor attaches the `popstate` or `hashchange` listener. There is no `start()` call.

## API

### `createRouter(config)` and `Router`

`createRouter(config)` returns `new Router(config)` typed as `IRouter`.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | required | `{ path, app, meta? }`. Checked in order, first match wins. Paths match the whole path: `'/'` is the home page only, `'/*'` every path, `'/blog/*'` `/blog` and below. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` uses `pushState` and `location.pathname + search`. `hash` uses `#/path`. |
| `base` | `string` | `'/'` | History mode prefix. Stripped on read (segment boundary only), added on write. |

| Member | Behaviour |
| --- | --- |
| `currentPath`, `currentRoute` | App-relative path (query included in history mode) and its `MatchedRoute \| null`. |
| `push(path)`, `replace(path)` | `Promise<void>`. Run guards, write `base + path` (or `#path`), run `onChange` handlers. Same path: no-op. |
| `back()`, `forward()` | `window.history.back()` / `forward()`. |
| `onChange(handler)` | Runs after each completed navigation. Returns an unsubscribe function. |
| `beforeEach(guard)` | Guards run in order. `false`, a throw or a rejection cancels. On back/forward the router restores the previous URL with `replaceState`. Returns a remove function. |
| `match(path)` | First matching route or `null`. |
| `getActiveApps(path?)` | Apps of every route that matches the whole path, deduplicated. A `'/'` route is active on `/` only; use `'/*'` for every page. |
| `destroy()` | Removes listeners. Later `push`, `replace`, `back`, `forward`, `onChange`, `beforeEach` throw. |

### `matchPath(pattern, path, options?)`

Returns `{ matched, params }`.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | Require a pattern without `/*` to match the whole path. |

- Drops `?query` and `#hash`, ignores a trailing slash.
- `:name` captures one segment, URI-decoded. A trailing `/*` matches the base path and everything below; the rest is not captured. A middle `*` matches one segment.
- By default `/docs` matches `/docs/intro` but not `/docsify`, and `'/'` matches every path. With `{ end: true }`, `'/'` matches `/` only. Router routes use the `end: true` rules; core `activeWhen` and `@tuvix.js/server` routes use the prefix default.
- Compiled patterns are cached. Matching is case-sensitive.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
```

### Helpers

| Export | Behaviour |
| --- | --- |
| `matchRoute(path, routes)` | First full match as `{ route, path, params, query }`, or `null`. Ignores `#hash`. |
| `isPathActive(path, pattern)` | `matchPath(pattern, path, { end: true }).matched`, the whole-path rules routes use. |
| `pathToRegex(pattern)` | Cached full-match `{ regex, paramNames }`. Do not mutate `regex`. |
| `parseQuery(query)` | `'?a=1&b'` to `{ a: '1', b: '' }`. Splits on the first `=`, decodes, keeps raw text on bad encoding. |
| `normalizePath(path)` | Adds a leading slash, removes one trailing slash. |

### `interceptLinks(options)`

Turns same-origin `<a href>` clicks into `navigate(path)` calls. Returns a cleanup function.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | required | Gets `pathname + search + hash` without `base`. Errors are logged. |
| `root` | `Document \| HTMLElement` | `document` | Where the click listener sits. |
| `base` | `string` | `'/'` | Links outside it go to the browser; stripped before `navigate`/`prefetch`. |
| `shouldIntercept` | `(anchor, url, event) => boolean` | none | Return `false` to let the browser handle the click. Runs after the built-in checks. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | none | On `pointerenter` or `focusin`, once per `pathname + search`. |

The browser keeps the click when: another handler called `preventDefault()`; a non-primary button or Ctrl/Meta/Shift/Alt; `target` other than `_self`; `download`; `rel` containing `external`; `data-tuvix-reload`; another origin; a path outside `base`; a hash link to the current path and query; or `shouldIntercept` returns `false`. Links inside open shadow roots are handled; SVG `<a>` elements are left to the browser.

### `resolveLink(event, options?)`

Returns `{ anchor, url, path }` for the HTML `<a href>` an event happened on, or `null` when the browser should handle the link. `path` is `pathname + search + hash` without `base`. `interceptLinks` and the orchestrator's hover prefetch use it; call it from your own listeners to apply the same rules.

```ts
import { resolveLink } from '@tuvix.js/router';

document.addEventListener('focusin', (event) => {
  const link = resolveLink(event, { base: '/app' });
  if (link) console.log('next page might be', link.path);
});
```

It returns `null` for: an SVG `<a>`, an `<a>` without `href` or no `<a>` (the nearest `<a>` on the event path decides); `target` other than `_self`; `download`; `rel` containing `external`; `data-tuvix-reload`; another origin; a path outside `base`; no `window`. It reads `event.composedPath()`, so it finds links in open shadow roots, not closed ones. Call it during dispatch. It does not check buttons, modifier keys or hash-only links.

### Types

`RouterMode`, `RouterConfig`, `RouteConfig`, `MatchedRoute`, `NavigationEvent` (`{ from, to, fromRoute, toRoute }`, paths without `base`), `NavigationGuard`, `RouteChangeHandler`, `IRouter`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolveLinkOptions` (`{ base? }`), `ResolvedLink` (`{ anchor, url, path }`).

## Edge cases

- The router does not cancel a pending navigation when another starts; the last guard chain to finish writes the URL.
- If other code calls `history.pushState`, `currentPath` stays stale until the next `popstate`, `hashchange` or router navigation.
- On the server the constructor sets `currentPath` to `'/'` and attaches nothing. Navigation methods need `window`.
- A guard that cancels a back/forward navigation fixes the address bar; the history position stays where the browser moved it.

## What it does not do

- It does not mount apps. The orchestrator in `@tuvix.js/core` does, using `router` config or `connectRouter`.
- It does not intercept links unless you call `interceptLinks`.
- No nested routes, redirects, per-route guards or scroll restoration.

## Migrating from 0.4

- `push()`/`replace()` prefix `base`: with `base: '/app'`, `push('/x')` writes `/app/x`. Pass paths relative to `base`.
- `base` strips only on a segment boundary.
- Routes match the whole path in `match`, `getActiveApps` and `isPathActive`; a `'/'` route is active on `/` only. Use `'/*'` for a catch-all.
- `RouteConfig.exact` is removed (it was ignored).
- `pathToRegex(pattern)` lost its `exact` argument and returns a cached `RegExp`.
- Regex characters in patterns match literally; a middle `*` matches one segment.
- `matchRoute()` and `isPathActive()` ignore `#hash`.

## License

MIT
