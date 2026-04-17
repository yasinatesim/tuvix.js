# Micro Apps

A **micro app** is an independently built and deployed frontend application
that integrates with the Tuvix.js shell via a standard lifecycle interface.

## The MicroAppModule Interface

Every micro app's bundle must expose an object of this shape (the framework
adapters do this for you):

```ts
interface MicroAppModule {
  bootstrap?: () => void | Promise<void>;
  mount: ({ container, props }: { container: HTMLElement; props?: Record<string, unknown> })
    => void | Promise<void>;
  unmount: ({ container }: { container: HTMLElement }) => void | Promise<void>;
  update?: ({ props }: { props: Record<string, unknown> }) => void | Promise<void>;
}
```

The hook receives a single context object — never positional arguments.

## How the Loader Finds Your Module

After fetching and executing the bundle, the loader looks for the module in
this priority order:

1. `window.__TUVIX_MODULES__[name]` — the recommended pattern.
2. New global properties added to `window` after the script ran (UMD / IIFE
   fallback for legacy bundles).

ES module bundles are loaded with `<script type="module">` and **cannot** rely
on the UMD fallback, so they must self-register.

## Vanilla JS Example

```ts
// dashboard/main.ts
import { defineMicroApp } from '@tuvix.js/core';

let titleEl: HTMLHeadingElement | null = null;

const module = defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    // One-time setup before first mount
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Hello, ${props?.user ?? 'Guest'}!</h1>`;
    titleEl = container.querySelector('h1');
  },

  unmount({ container }) {
    titleEl = null;
    container.innerHTML = '';
  },

  // Triggered by orchestrator.updateAppProps('dashboard', { user: 'Yasin' }).
  update({ props }) {
    if (titleEl) titleEl.textContent = `Hello, ${props?.user ?? 'Guest'}!`;
  },
});

// Self-register so the loader can find us
declare global {
  interface Window { __TUVIX_MODULES__?: Record<string, unknown>; }
}
window.__TUVIX_MODULES__ = window.__TUVIX_MODULES__ ?? {};
window.__TUVIX_MODULES__['dashboard'] = module;

export default module;
```

> The framework adapters (`createReactMicroApp`, `createVueMicroApp`,
> `createSvelteMicroApp`, `createAngularMicroApp`) handle the
> self-registration automatically.

## Passing Props

The shell can supply props at registration time and update them at runtime:

```ts
// Shell — initial props
orchestrator.register({
  name: 'profile',
  entry: '/profile.js',
  container: '#app',
  activeWhen: '/profile/*',
  props: { userId: getCurrentUserId(), theme: 'dark' },
});

// Shell — push new props later
await orchestrator.updateAppProps('profile', { theme: 'light' });
```

The micro app receives them inside `mount()`:

```ts
mount({ container, props }) {
  const { userId, theme } = (props ?? {}) as { userId: string; theme: string };
  render(container, userId, theme);
}
```

If the app implements `update()`, it receives the merged props in place — no
remount, no flash. If it doesn't, the new props are stored and used on the
next mount.

## Registration Options

```ts
orchestrator.register({
  name: 'reports',
  entry: '/reports.js',          // string or { scripts: [...], styles: [...] }
  container: '#main',             // CSS selector or HTMLElement
  activeWhen: '/reports/*',       // string pattern or (path) => boolean
  props: { user: 'Yasin' },
  fallback: '<p>Reports unavailable.</p>',
  mountWhenVisible: false,        // true = lazy mount via IntersectionObserver
});
```

`activeWhen` can also be a function for fully custom matching:

```ts
activeWhen: (path) => path.startsWith('/reports') || path === '/dashboard',
```

## Building for Production

Each micro app is a standalone JavaScript bundle. Use any bundler — here are
the most common configurations.

### Vite (recommended)

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/main.ts',
      name: 'Dashboard',
      formats: ['iife'],          // self-contained, sets window globals
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom'], // share with the shell
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
      },
    },
  },
});
```

### Webpack 5

```js
module.exports = {
  entry: './src/main.ts',
  output: {
    library: { type: 'module' },
    filename: 'main.mjs',
  },
  experiments: { outputModule: true },
};
```

> When you ship ES modules (`.mjs` / `.mts` / `.tsx` / `.jsx` extensions),
> the loader uses `<script type="module">` — make sure your bundle calls
> `window.__TUVIX_MODULES__[name] = module` before the export executes.
