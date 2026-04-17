# Configuration

## Orchestrator Options

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  /**
   * Inline router config — pass this to use the built-in @tuvix.js/router.
   * Omit when bridging to an external router via orchestrator.reconcile().
   */
  router: {
    mode: 'history', // or 'hash'
    base: '/',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
    ],
  },

  /**
   * Event bus options forwarded to the internal EventBus instance.
   */
  eventBus: {
    maxListeners: 50,    // 0 = unlimited (default 0)
    debug: false,
    logger: console.log, // custom logger sink
  },

  /**
   * Prefetch micro app bundles on a schedule.
   * 'immediate' = right after start(); 'idle' = next requestIdleCallback;
   * 'hover' = first mouseover anywhere on the page; 'none' = on demand only.
   */
  prefetch: { strategy: 'idle' },

  /**
   * Called when any app throws during mount/unmount/update.
   * Receives the error and the app's name.
   */
  onError: (error, name) => reportToSentry(error, { app: name }),

  /**
   * Called on every status transition.
   */
  onStatusChange: (name, status) => console.log(name, status),
});
```

## Registering Micro Apps

```ts
orchestrator.register({
  /**
   * Unique app name. Required.
   */
  name: 'dashboard',

  /**
   * Entry point — either a single script URL, or an object
   * { scripts: [...], styles: [...], html?: '...' }.
   */
  entry: 'https://cdn.example.com/dashboard/main.js',

  /**
   * Where to mount the app — a CSS selector or an HTMLElement.
   * Resolved at mount time, so the element only needs to exist by then.
   */
  container: '#main',

  /**
   * URL pattern for automatic activation. String pattern (supports ":param"
   * and trailing "/*"), or a (path) => boolean predicate for custom rules.
   */
  activeWhen: '/dashboard/*',

  /**
   * Initial props passed to the app's mount() context.
   * Merge-updated by orchestrator.updateAppProps(name, partial).
   */
  props: { theme: 'dark', apiUrl: 'https://api.example.com' },

  /**
   * HTML rendered into the container if the app fails to load or mount.
   */
  fallback: '<p>Dashboard temporarily unavailable.</p>',

  /**
   * Defer mounting until the container scrolls into view.
   * When true, activeWhen / route reconciliation is bypassed.
   */
  mountWhenVisible: false,
});
```

## Router Options

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  /**
   * 'history' uses the History API (default).
   * 'hash' uses URL hashes (#/path).
   */
  mode: 'history',

  /**
   * Optional base path stripped from the URL before matching.
   */
  base: '/',

  /**
   * Route definitions, evaluated in order. First match wins.
   */
  routes: [
    { path: '/', app: 'home', exact: true },
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

// Add navigation guards programmatically — not via the route config:
router.beforeEach(async ({ to }) => {
  if (to.startsWith('/admin') && !(await isAdmin())) return false;
});
```

## Loader Options

`@tuvix.js/loader` is normally used internally by the orchestrator, but you
can construct a `ModuleLoader` directly for advanced scenarios:

```ts
import { ModuleLoader } from '@tuvix.js/loader';

const loader = new ModuleLoader({
  timeout: 10000,    // ms before a load attempt aborts
  retries: 2,        // additional retry attempts after the first failure
  retryDelay: 1000,  // ms between retries
  fetch: globalThis.fetch.bind(globalThis), // custom fetch implementation
  globals: {},       // reserved
});
```

## Sandbox Options

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  css: true,                       // Shadow DOM CSS isolation
  js: true,                        // Proxy-based JS isolation
  allowedGlobals: ['gtag'],        // extra globals exempt from strict warnings
  strict: false,                   // warn when sandboxed code touches non-allowed globals
});
```

> The sandbox is **not** auto-applied per app. Wrap your `mount` / `unmount`
> hooks manually — see [Sandboxing](/guide/sandbox).

## EventBus Options

```ts
import { createEventBus } from '@tuvix.js/event-bus';

const bus = createEventBus({
  maxListeners: 0,            // 0 = unlimited (default)
  debug: false,
  logger: console.log,
});
```

## Environment Variables

Tuvix.js itself has no required environment variables. All configuration is
done in code.

For runtime values, use your bundler's define/replace plugin:

```ts
// vite.config.ts
export default {
  define: {
    __TUVIX_DEBUG__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
};
```
