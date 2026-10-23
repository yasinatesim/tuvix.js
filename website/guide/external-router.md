# External Router

When TanStack Router, React Router or another router already owns navigation in your shell, let it keep that job. `orchestrator.connectRouter()` makes the orchestrator follow that router, and `interceptLinks()` sends plain `<a href>` clicks from micro apps into it.

## When to use it

- Your shell is a React app with its own router, and some routes host micro apps.
- Your micro apps render plain links (Vue, Svelte, Angular or HTML templates) that should navigate without a page load.

If the shell has no router of its own, use the built-in one instead; see [Routing](/guide/routing).

## connectRouter

```ts
import { createOrchestrator, type RouterSource } from 'tuvix.js';

const source: RouterSource = {
  // Call `callback` after every navigation; return an unsubscribe function.
  subscribe(callback) {
    window.addEventListener('popstate', callback);
    return () => window.removeEventListener('popstate', callback);
  },
  // The path activeWhen patterns are matched against.
  getPath: () => window.location.pathname,
};

const orchestrator = createOrchestrator(); // no `router` option
const disconnect = orchestrator.connectRouter(source);
await orchestrator.start();

// later
disconnect();
```

- `start()` reconciles against `getPath()`. After that, every `subscribe` callback queues a reconcile for the new `getPath()`.
- Connecting an orchestrator that already started reconciles right away.
- Reconciles run one at a time and only the newest queued path runs next, so a burst of router events costs one reconcile per settled path.
- `destroy()` disconnects every connected router.

## TanStack Router

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // your createRouter({ routeTree }) instance

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'blog',
  entry: () => import('./micro-apps/blog'),
  container: '#micro-app',
  activeWhen: '/blog/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

// Plain <a href> inside micro apps → TanStack history.
interceptLinks({ navigate: (path) => router.history.push(path) });

await orchestrator.start();
```

`onResolved` fires once the router has resolved the new location. Use it instead of `onLoad` plus a `setTimeout`.

## React Router

With a data router from `createBrowserRouter`:

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // createBrowserRouter(routes)

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'account',
  entry: () => import('./micro-apps/account'),
  container: '#micro-app',
  activeWhen: '/account/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe(() => callback()),
  getPath: () => router.state.location.pathname,
});

interceptLinks({ navigate: (path) => router.navigate(path) });

await orchestrator.start();
```

With `<BrowserRouter>` there is no router object to subscribe to. Bridge it from a component that reads `useLocation()`:

```tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { Orchestrator, RouterSource } from 'tuvix.js';

export function TuvixBridge({ orchestrator }: { orchestrator: Orchestrator }) {
  const location = useLocation();
  const listeners = useRef(new Set<() => void>());
  const path = useRef<string>(location.pathname);
  path.current = location.pathname;

  useEffect(() => {
    const source: RouterSource = {
      subscribe(callback) {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
      },
      getPath: () => path.current,
    };
    return orchestrator.connectRouter(source);
  }, [orchestrator]);

  useEffect(() => {
    for (const callback of listeners.current) callback();
  }, [location.pathname]);

  return null;
}
```

## Plain links inside micro apps

Your router's own `<Link>` components already navigate client-side. Links that micro apps render as plain `<a href>` do not; without `interceptLinks` they reload the page. `interceptLinks` skips modified clicks, other origins, `target="_blank"`, `download`, `rel="external"`, `data-tuvix-reload` and hash-only links on the current path, and calls your `navigate` for the rest. Add `prefetch` to warm the next route on hover or focus. With TanStack Router:

```ts
import { interceptLinks } from 'tuvix.js';
import { router } from './router';

const stop = interceptLinks({
  navigate: (path) => router.history.push(path),
  prefetch: (path) => void router.preloadRoute({ to: path }),
});
```

Call `stop()` when the shell unmounts.

## Base paths

With a router basename such as `/app`:

- `activeWhen` patterns match the exact string `getPath()` returns. If your router reports paths with `/app`, write `'/app/blog/*'`, or strip the base in `getPath`.
- `interceptLinks({ base: '/app', ... })` ignores links outside `/app` and strips `/app` before it calls `navigate`. Use it when your router's `navigate` expects basename-relative paths (React Router's `router.navigate`). Leave `base` off when `navigate` takes the full URL path (TanStack's `router.history.push`).

## Containers rendered by routes

The orchestrator looks up `container` when it mounts. If a route component renders the container element, it may not be in the DOM yet when the router callback fires, and the mount fails with `Container "#micro-app" not found in DOM`. Two ways out:

- Keep the container in a layout that every micro-app route shares, so it exists before navigation.
- Render the micro app from the route component itself with `TuvixIsland` (`@tuvix.js/react`), and skip the orchestrator for that app.

## What connectRouter does not do

- It does not navigate. Navigation stays with your router.
- It does not read route params. Pass them as props with `updateAppProps`, or read them inside the app.
- It does not handle link clicks. Call `interceptLinks` for that.
