# Configuration

All configuration happens in code. Tuvix.js reads no environment variables and no config files.

## Orchestrator options

```ts
import { createOrchestrator } from 'tuvix.js';

declare function reportError(error: Error, app: string): void;

const orchestrator = createOrchestrator({
  // Built-in router. Omit it when you follow an external router with connectRouter().
  router: {
    mode: 'history', // or 'hash'
    base: '/',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },

  // Passing eventBus options gives this orchestrator a private bus.
  // Omit it to share getGlobalBus() with every app on the page.
  eventBus: { maxListeners: 50, debug: false },

  // Forwarded to the module loader.
  loader: { timeout: 10000, retries: 2, retryDelay: 1000, globals: {} },

  // 'immediate' | 'idle' | 'hover' | 'none' (default)
  prefetch: { strategy: 'hover' },

  onError: (error, appName) => reportError(error, appName),
  onStatusChange: (appName, status) => console.debug(appName, status),
});
```

| Option | Default | Effect |
| --- | --- | --- |
| `router` | none | Creates the built-in router. See [Routing](/guide/routing). |
| `eventBus` | none (global bus) | Private bus with these options. `destroy()` destroys a private bus and leaves the global one alive. |
| `loader.timeout` | `10000` | Milliseconds before one load attempt aborts. Also caps the wait for sandboxed stylesheets. |
| `loader.retries` | `2` | Extra attempts after the first failure. |
| `loader.retryDelay` | `1000` | Milliseconds between attempts. |
| `loader.globals` | `{}` | Properties written to `window` before an entry's scripts run. |
| `prefetch.strategy` | `'none'` | When to fetch entries before they mount. See the table below. |
| `onError` | none | Called with `(error, appName)` when load, bootstrap, mount, update or unmount fails. |
| `onStatusChange` | none | Called with `(appName, status)` on every status change. |

To share dependencies such as React between apps, use `@tuvix.js/module-federation` or import maps. The orchestrator has no option for it.

### Prefetch strategies

| Strategy | When entries are fetched |
| --- | --- |
| `none` | Only when an app mounts. |
| `immediate` | Every registered entry, right after `start()`. |
| `idle` | Every registered entry, in the first `requestIdleCallback` after `start()` (200 ms timeout where the API is missing). |
| `hover` | When the pointer enters, or focus lands on, a same-origin link whose path would activate an app. Each app is fetched once. |

Prefetching adds `<link rel="modulepreload">` for module scripts and `<link rel="prefetch">` for classic scripts and styles. It skips loader-function entries, because calling the function would run the module.

## Registering a micro app

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main',
  activeWhen: '/dashboard/*',
  props: { theme: 'dark' },
  fallback: '<p>Dashboard is unavailable.</p>',
  sandbox: false,
  mountWhenVisible: false,
});
```

| Field | Type | Effect |
| --- | --- | --- |
| `name` | `string` | Unique. Must match the name the module registers under. |
| `entry` | `string \| EntryConfig \| EntryLoader` | Where the code comes from. See below. |
| `container` | `string \| HTMLElement` | Selector or element. Resolved at mount time, so the element only needs to exist by then. |
| `activeWhen` | `string \| (path) => boolean` | Route pattern or predicate. Without it, the app follows router `routes` that name it, or you mount it yourself. |
| `props` | `Record<string, unknown>` | Initial props. `updateAppProps` merges into them. |
| `fallback` | `string` | HTML written into the container when load, bootstrap or mount fails. |
| `sandbox` | `boolean \| { css?: boolean }` | `true` renders the app in a shadow root. See [Sandboxing](/guide/sandbox). |
| `mountWhenVisible` | `boolean` | Mount once the container is 10% visible. Route changes then leave the app alone. |

### Entry forms

```ts
import type { Entry } from 'tuvix.js';

// One classic script (UMD or IIFE bundle).
const classic: Entry = 'https://cdn.example.com/legacy/app.js';

// Scripts and styles. `type: 'module'` for ES module bundles such as Vite's `.js` output.
const esm: Entry = {
  scripts: ['https://cdn.example.com/cart/main.js'],
  styles: ['https://cdn.example.com/cart/main.css'],
  type: 'module',
  integrity: { 'https://cdn.example.com/cart/main.js': 'sha384-...' },
};

// A loader function. Your bundler code-splits it; the loader passes an AbortSignal.
const lazy: Entry = () => import('./apps/profile');
```

Without `type`, URLs ending in `.mjs`, `.mts`, `.ts`, `.tsx` or `.jsx` load as modules and everything else loads as a classic script. A browser runs a module script once per URL, so a `type: 'module'` app that you unload cannot load again from the same URL. Use a loader function when you need to unload and reload.

### Things to know about registration

- `register` throws for a duplicate name, a missing `entry` or a missing `container`.
- `register` after `start()` takes effect right away: a route-managed app mounts if the current path activates it, and a `mountWhenVisible` app is observed. Before `start()`, `register` only stores the config.
- A viewport app stays mounted after it scrolls out of view. Unmount it with `unmountApp(name)`.
- An app with neither `activeWhen` nor a router route stays as you leave it. Call `mountApp(name)` and `unmountApp(name)` yourself.
- `fallback` is raw HTML. Do not build it from user input.

## Router options

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // 'hash' reads the path from location.hash
  base: '/app', // stripped before matching, added by push() and replace()
  routes: [
    { path: '/users/:id', app: 'users', meta: { title: 'User' } },
    { path: '/settings/*', app: 'settings' },
  ],
});

router.beforeEach(async ({ to }) => !to.startsWith('/admin'));
```

Route paths match the whole path, so `/settings` matches `/settings` and `/settings/` only, and `'/'` matches only `/`. End a path with `/*` to match sub-paths; `'/*'` matches every path.

## Sandbox options

```ts
import { createSandbox } from 'tuvix.js';

const sandbox = createSandbox({
  css: true, // shadow root on activate()
  js: true, // proxy window for execScript()
  allowedGlobals: ['gtag'], // extra globals strict mode lets you write
  strict: false, // true: writing any other global throws a TypeError
});
```

The orchestrator applies CSS isolation for apps registered with `sandbox: true`. It never applies `JsSandbox`. See [Sandboxing](/guide/sandbox).

## Event bus options

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus({
  maxListeners: 0, // 0 = unlimited; past the limit, `on` still adds the listener and warns once per event
  debug: false, // log every emit and subscription
  logger: console.log,
});
```
