# Configuration

## Orchestrator Options

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  /**
   * Root container selector or element.
   * Micro apps are mounted inside this element.
   * @default '#app'
   */
  container: '#app',

  /**
   * Called before any micro app is mounted.
   */
  onBeforeMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * Called after a micro app has mounted.
   */
  onAfterMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * Called when a micro app throws during mount/unmount.
   */
  onError?: (error: Error, app: RegisteredApp) => void;
});
```

## Registering Micro Apps

```ts
orchestrator.register('my-app', {
  /**
   * URL of the micro app's JavaScript bundle.
   * Can be a string or a lazy function that returns a string.
   */
  entry: 'https://cdn.example.com/my-app/main.js',

  /**
   * Optional: additional props to pass to the micro app on mount.
   */
  props: {
    apiUrl: 'https://api.example.com',
  },

  /**
   * Sandbox options for CSS and JS isolation.
   */
  sandbox: {
    css: true,   // Shadow DOM style isolation
    js: false,   // JS Proxy scope isolation
  },

  /**
   * Override the container selector for this specific app.
   * Falls back to the orchestrator-level container.
   */
  container: '#dashboard-container',
});
```

## Router Options

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  orchestrator,

  /**
   * 'history' uses the History API (default).
   * 'hash' uses URL hashes (#/path).
   */
  mode: 'history',

  /**
   * Route definitions.
   */
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    {
      path: '/admin',
      app: 'admin',
      /**
       * Guard function — return false to block navigation.
       */
      guard: () => checkAuth(),
    },
  ],
});
```

## Sandbox Options

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  /**
   * Enable Shadow DOM CSS isolation.
   */
  css: true,

  /**
   * Enable JS Proxy scope isolation.
   * Intercepts and cleans up window access on unmount.
   */
  js: true,
});
```

## Environment Variables

Tuvix.js has no required environment variables. All configuration is done in code.

For production, use your bundler's define/replace plugin to inject runtime values:

```ts
// vite.config.ts
export default {
  define: {
    __TUVIX_DEBUG__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
};
```
