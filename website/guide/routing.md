# Routing

Tuvix.js decides which apps to mount from the current path. You describe that with `activeWhen` on each app, with `routes` on the built-in router, or both. One matcher, `matchPath` from `@tuvix.js/router`, interprets every pattern, so `activeWhen`, the router and `@tuvix.js/server` agree on what `/users/:id` means.

## Pattern rules

`activeWhen` strings use prefix matching:

| Pattern | Matches | Does not match | Params |
| --- | --- | --- | --- |
| `/dashboard` | `/dashboard`, `/dashboard/`, `/dashboard/stats` | `/dashboards` | none |
| `/dashboard/*` | the same paths as `/dashboard` | `/dashboards` | none |
| `/users/:id` | `/users/42`, `/users/42/posts` | `/users` | `{ id: '42' }` |
| `/v:version/docs` | `/v2/docs` | `/2/docs` | `{ version: '2' }` |
| `/` | every path | none | none |

- The matcher drops `?query` and `#hash` before matching, so `/dashboard?tab=1` still matches `/dashboard`.
- It decodes params: `/users/J%C3%BCrgen` gives `{ id: 'Jürgen' }`.
- Characters such as `.` and `(` match literally.
- A `*` in the middle of a pattern matches one segment.

Check a pattern yourself:

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/settings', '/settings/profile').matched; // true
matchPath('/settings', '/settings/profile', { end: true }).matched; // false
matchPath('/', '/about', { end: true }).matched; // false
```

## Activate apps with activeWhen

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  activeWhen: '/users/:id',
});

orchestrator.register({
  name: 'header',
  entry: () => import('./apps/header'),
  container: '#header',
  activeWhen: '/', // every page
});

await orchestrator.start();
```

A function receives the path and returns a boolean. Use it for exact matches, several prefixes, or feature flags.

## The built-in router

Pass `router` to `createOrchestrator` and the orchestrator reconciles after every navigation the router makes:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/settings', app: 'settings' },
      { path: '/billing/*', app: 'billing' },
    ],
  },
});

orchestrator.register({ name: 'settings', entry: () => import('./apps/settings'), container: '#app' });
orchestrator.register({ name: 'billing', entry: () => import('./apps/billing'), container: '#app' });

await orchestrator.start();
await orchestrator.navigateTo('/billing/invoices');
```

An app without `activeWhen` follows the routes that name it. Two differences from `activeWhen`:

- Route paths match in full. `/settings` matches `/settings` and `/settings/`, not `/settings/profile`. Add `/*` for sub-paths.
- A route with path `/` activates its app only on `/`. Use `/*` for a route that matches every path.

When an app has `activeWhen`, the orchestrator uses it and ignores `routes`.

The router listens to `popstate` (history mode) or `hashchange` (hash mode). It does not intercept link clicks; see the next section.

## Link clicks

`interceptLinks` turns same-origin `<a href>` clicks into calls to your `navigate` function and returns a cleanup function:

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

const stop = interceptLinks({
  navigate: (path) => orchestrator.navigateTo(path),
  prefetch: (path) => console.debug('user may open', path),
});

// later, when the shell leaves the page
stop();
```

It leaves these clicks to the browser:

- a modifier key (Ctrl, Meta, Shift, Alt) or a button other than the primary one;
- `event.defaultPrevented` already true;
- `target` other than `_self`, a `download` attribute, `rel="external"` or `data-tuvix-reload`;
- another origin, or a path outside `base`;
- a hash-only link on the current path, so the browser scrolls.

`prefetch(path)` runs on pointerenter or focus, once per path. `shouldIntercept(anchor, url, event)` adds your own filter; return `false` to let the browser handle the click. `root` limits listening to one element.

## Navigation and guards

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/users/:id', app: 'user' }] });

const offGuard = router.beforeEach(async ({ to }) => {
  if (!to.startsWith('/admin')) return true;
  const response = await fetch('/api/me');
  return response.ok;
});

const offChange = router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} → ${to}`, toRoute?.params);
});

await router.push('/users/42'); // pushState
await router.replace('/users/43'); // replaceState
router.back();

router.currentPath; // '/users/43'
router.currentRoute?.params; // { id: '43' }
router.currentRoute?.query; // parsed ?query
router.match('/users/7'); // MatchedRoute | null, no navigation
router.getActiveApps('/users/7'); // ['user']

offGuard();
offChange();
router.destroy();
```

- Guards run in order before `push`, `replace`, and back/forward. `false` cancels. A guard that throws cancels and logs the error.
- A cancelled back/forward navigation restores the previous URL with `replaceState`.
- `push` to the current path does nothing.
- `router.match` returns the first route that matches; `getActiveApps` returns every app whose route matches.

## Base path

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { base: '/app', routes: [{ path: '/reports/*', app: 'reports' }] },
});

interceptLinks({ base: '/app', navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.navigateTo('/reports'); // URL becomes /app/reports
```

With `base: '/app'`:

- the router strips `/app` before matching, so routes and `activeWhen` patterns leave it out;
- `push('/x')` and `replace('/x')` write `/app/x`;
- `/application` stays `/application`: the base only strips on a segment boundary;
- `interceptLinks` needs the same `base`, or it hands `/app/x` to `navigateTo`, which writes `/app/app/x`.

## Hash mode

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ mode: 'hash', routes: [{ path: '/about', app: 'about' }] });
await router.push('/about'); // URL: /#/about
```

Use it on static hosts that cannot rewrite every path to `index.html`. The router ignores `base` in hash mode.

## Read params in an app

The mount context has no params. Read them from the path, or push them as props:

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { routes: [{ path: '/users/:id', app: 'user' }] },
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  props: { id: matchPath('/users/:id', location.pathname).params.id },
});

orchestrator.getRouter()?.onChange(({ toRoute }) => {
  if (toRoute?.route.app === 'user') {
    void orchestrator.updateAppProps('user', { id: toRoute.params.id });
  }
});

await orchestrator.start();
```

## External routers

If TanStack Router, React Router or another router owns navigation, skip `config.router` and call `orchestrator.connectRouter({ subscribe, getPath })`. See [External Router](/guide/external-router).

## What routing does not do

- It does not render route components. Apps render themselves into containers.
- It does not load data. Use a guard, `onChange`, or the app's own `mount`.
- The router does not handle link clicks unless you call `interceptLinks`.
