# Getting Started

This page builds a shell with two micro apps: a home page and a dashboard. You will register the apps, let the router mount them, and push new props into a mounted app.

## Install

Install the umbrella package. It contains the orchestrator, router, loader, event bus and sandbox:

```bash
pnpm add tuvix.js
```

Add an adapter for each framework your micro apps use:

```bash
pnpm add @tuvix.js/react react react-dom
pnpm add @tuvix.js/vue vue
pnpm add @tuvix.js/svelte svelte
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
```

## Scaffold a project

`create-tuvix-app` writes a shell or a micro app project that depends on the 0.5 packages:

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-dashboard --template react-app
```

Templates: `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. Pass `--example <name>` to copy one of the repository examples instead.

## Build a shell

The shell owns the page layout and decides which app goes where. Give it a container element:

```html
<nav>
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
</nav>
<main id="app"></main>
<script type="module" src="/src/main.ts"></script>
```

Then create the orchestrator, register the apps and start it:

```ts
// src/main.ts
import { createOrchestrator, interceptLinks, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  // '/' alone would match every path; `end: true` makes it exact.
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
});

// Turn <a href> clicks into router navigations instead of page loads.
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

What happens:

1. `start()` reads the current path and mounts every app whose `activeWhen` matches.
2. A click on `<a href="/dashboard">` calls `navigateTo('/dashboard')`. The router pushes the URL, the orchestrator unmounts `home` and then mounts `dashboard`.
3. The first mount of `dashboard` loads its script and stylesheet. Later mounts reuse the loaded module.

The router never intercepts clicks on its own. Without `interceptLinks`, a link click reloads the page, and the orchestrator mounts the right app on the new page load.

## Write a micro app

A micro app is an object with `mount` and `unmount`. `defineMicroApp` checks the shape and registers the module under its name, so the loader can find it after the script runs:

```ts
// apps/home.ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'home',

  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Welcome, ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },

  update({ props, container }) {
    const title = container?.querySelector('h1');
    if (title) title.textContent = `Welcome, ${String(props.user ?? 'Guest')}`;
  },

  unmount({ container }) {
    container.replaceChildren();
  },
});
```

The `name` you pass to `defineMicroApp` must equal the name you register in the shell. The loader looks the module up by that name.

## Use a framework adapter

Adapters create the same module from a root component. They register it, keep one framework instance per container and dispatch lifecycle events.

```tsx
// dashboard/src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Dashboard for {user}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

```ts
// settings/src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Settings from './Settings.vue';

export default createVueMicroApp({ name: 'settings', App: Settings });
```

Framework pages: [React](/guide/react), [Vue](/guide/vue), [Svelte](/guide/svelte), [Angular](/guide/angular).

Build each micro app as an ES module bundle and upload it. A Vite library build works:

```ts
// dashboard/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.tsx', formats: ['es'], fileName: 'main' },
  },
});
```

Vite's ES output ends in `.js`, which the loader treats as a classic script unless the entry says `type: 'module'`. Keep `type: 'module'` in the shell's entry, as above.

## Update props at runtime

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

`updateAppProps` merges the new props into the registered ones. If the app is mounted and has `update`, the orchestrator calls it with the merged props and the app re-renders in place. If the app is not mounted, the orchestrator stores the props for the next mount.

## What the shell does not do

- It does not render your layout. The shell's own HTML holds the containers.
- It does not share framework instances between apps. Two React apps get two React roots.
- It does not sandbox JavaScript. Every app runs in the page's `window`.

## Next steps

- [Architecture](/guide/architecture): the path from navigation to `mount`.
- [Routing](/guide/routing): `activeWhen` patterns, the built-in router, guards.
- [External Router](/guide/external-router): follow TanStack Router or React Router.
- [SSR Islands](/guide/ssr-islands): server-render micro apps inside a React page.
