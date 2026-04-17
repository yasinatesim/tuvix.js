# @tuvix.js/router

> URL routing for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

## Quick Start

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',         // or 'hash'
  base: '/',               // optional base path
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'users' },
    { path: '/settings', app: 'settings', exact: true },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`navigated ${from} → ${to}`, toRoute?.params);
});
```

> Routes are evaluated **in order** — the first match wins. Listeners are
> attached automatically on construction; there is no `start()` call.

## Programmatic Navigation

```ts
await router.push('/dashboard/overview');     // pushState
await router.replace('/users/42');             // replaceState (no history entry)
router.back();
router.forward();

router.currentPath;                            // '/users/42'
router.currentRoute?.params;                   // { id: '42' }
router.currentRoute?.query;                    // parsed query object
```

## Navigation Guards

Guards run before every navigation (programmatic *and* browser-initiated
back/forward). Return `false` to cancel.

```ts
const off = router.beforeEach(async ({ from, to, toRoute }) => {
  if (to.startsWith('/admin') && !isAdmin()) {
    return false; // cancel — URL is restored automatically
  }
});

off(); // unsubscribe the guard
```

## Path Matching

Patterns supported by `pathToRegex` and route paths:

| Pattern | Matches |
| --- | --- |
| `/dashboard` | exactly `/dashboard` |
| `/dashboard/*` | `/dashboard` and any nested path |
| `/users/:id` | captures `id` param |
| `/users/:id/*` | captures `id`, then any rest |

Set `exact: true` on a route to disallow trailing segments.

```ts
import { matchRoute, pathToRegex, parseQuery, normalizePath } from '@tuvix.js/router';

matchRoute('/users/42?tab=info', [{ path: '/users/:id', app: 'users' }]);
// → { route, path: '/users/42', params: { id: '42' }, query: { tab: 'info' } }

const { regex, paramNames } = pathToRegex('/posts/:slug');
parseQuery('?token=abc.def=ghi'); // → { token: 'abc.def=ghi' }
normalizePath('users/42/');       // → '/users/42'
```

## Querying Active Apps

```ts
router.getActiveApps();                    // apps active at current path
router.getActiveApps('/dashboard/users');  // apps active at the given path
router.match('/users/42');                 // → MatchedRoute | null
```

## Cleanup

```ts
router.destroy(); // removes window listeners and clears subscribers
```

## API Surface

| Export | Purpose |
| --- | --- |
| `createRouter(config)` | Factory function |
| `Router` | Class implementation |
| `pathToRegex(path, exact?)` | Convert pattern → `{ regex, paramNames }` |
| `matchRoute(path, routes)` | Find the first matching route |
| `parseQuery(queryString)` | Parse `?a=1&b=2` → `{ a: '1', b: '2' }` |
| `isPathActive(path, pattern)` | Boolean check for `activeWhen`-style patterns |
| `normalizePath(path)` | Ensure leading slash, strip trailing slash |

## License

MIT
