# Routing

`@tuvix.js/router` provides URL-based micro app activation. When the URL
matches an `activeWhen` pattern (or a route's `path`), the orchestrator
mounts the corresponding app. When it stops matching, the orchestrator
unmounts it.

There are two ways to use the router:

1. **Through the orchestrator** — pass `router` config to
   `createOrchestrator` and the orchestrator wires everything up.
2. **Standalone** — call `createRouter` directly when you need URL matching
   without the orchestrator (e.g. embedded scenarios or tests).

## Setup via the Orchestrator

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',  // or 'hash'
    base: '/',         // optional base path
    routes: [
      { path: '/', app: 'home', exact: true },
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/users/:id', app: 'user-profile' },
    ],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard.js',
  container: '#app',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();
```

## Standalone Router

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/users/:id', app: 'users' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`navigated ${from} → ${to}`, toRoute?.params);
});
```

> Listeners are attached automatically on construction; there is no
> `start()` to call.

## Route Matching

Routes are evaluated **in order** — the first match wins.

| Pattern | Matches | Params |
| --- | --- | --- |
| `/` | exactly `/` | – |
| `/dashboard` | `/dashboard` (and `/dashboard/`) | – |
| `/dashboard/*` | `/dashboard` and any nested path | – |
| `/users/:id` | `/users/42` | `{ id: '42' }` |
| `/users/:id/*` | `/users/42/posts/3` | `{ id: '42' }` |

Use `exact: true` to disallow trailing segments:

```ts
{ path: '/settings', app: 'settings', exact: true }
```

### Reading Params Inside an App

The params live on the `MatchedRoute` exposed by the router, not in the
mount context. Read them through `router.currentRoute`:

```ts
const router = orchestrator.getRouter();

orchestrator.register({
  name: 'user-profile',
  entry: '/user.js',
  container: '#app',
  activeWhen: '/users/:id',
});

// Inside the app's mount(), look up the latest match
mount({ container, props }) {
  const id = router?.currentRoute?.params.id;
  fetchUser(id).then(/* ... */);
}
```

For a more decoupled pattern, push the params into props via
`updateAppProps()` from a `router.onChange` handler in the shell.

## Programmatic Navigation

```ts
await router.push('/dashboard/overview');     // pushState
await router.replace('/users/42');             // replaceState — no history entry
router.back();
router.forward();

router.currentPath;            // '/users/42'
router.currentRoute?.params;   // { id: '42' }
router.currentRoute?.query;    // parsed query object

router.match('/some/path');    // → MatchedRoute | null without navigating
router.getActiveApps();        // app names matching the current path
```

## Navigation Guards

Guards run before every navigation — programmatic and browser-initiated
back/forward. Return `false` to cancel; the URL is restored automatically.

```ts
const off = router.beforeEach(async ({ from, to, toRoute }) => {
  if (to.startsWith('/admin') && !(await isAdmin())) {
    return false;
  }
});

off(); // unsubscribe a single guard
```

A throwing guard is treated as `false` and logged.

## Listening for Changes

```ts
router.onChange(({ from, to, fromRoute, toRoute }) => {
  analytics.page(to);
});
```

Pair the orchestrator with a guard to do per-route data prefetching:

```ts
router.beforeEach(async ({ toRoute }) => {
  if (toRoute?.route.app === 'dashboard') {
    await preloadDashboardData();
  }
});
```

## Hash Mode

Use hash mode for static hosting without SPA fallback:

```ts
createRouter({
  mode: 'hash',
  routes: [
    { path: '/', app: 'home' },
    { path: '/about', app: 'about' },
  ],
});
// URLs: /#/, /#/about
```

## Bridging an External Router

If your shell already uses TanStack Router, Next.js App Router, or React
Router, skip `config.router` entirely and let your existing router drive
Tuvix.js:

```ts
const orchestrator = createOrchestrator(); // no router config

await orchestrator.start();

externalRouter.subscribe('onLoad', () => {
  orchestrator.reconcile(window.location.pathname);
});
```

`reconcile(path?)` mounts/unmounts apps based on the supplied path (or
`window.location.pathname` when omitted).

## Cleanup

```ts
router.destroy(); // remove window listeners and clear all subscribers
```
