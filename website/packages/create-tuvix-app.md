---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="CLI that scaffolds a Vite project for a Tuvix.js shell or a React, Vue, Svelte, Angular or vanilla micro app, then installs its dependencies."
  icon="🚀"
  npm="true"
  github="cli"
/>

## Usage

The package name starts with `create-`, so every package manager's `create` command finds it, and `npx` runs its `create-tuvix-app` binary:

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app
```

`npm create` forwards flags only after `--`. The other commands pass them through:

```bash
npm create tuvix-app@latest my-app -- --template react-app --typescript
pnpm create tuvix-app my-app --template react-app --typescript
```

The binary needs Node.js. It writes into a new folder under the current directory.

## When to use it

Use it to start one Tuvix.js piece from zero: a shell that registers micro apps, or one micro app in a given framework. Each run creates one Vite project with `tuvix.js` and the matching `@tuvix.js/*` adapter at `^0.5.0`.

Pick something else when you add Tuvix.js to an app that already exists. Install the adapter with your package manager and follow the [guide](/guide/getting-started) instead. For a working multi-app setup to read or copy, use `--example` (see [Examples](#examples)).

## Quick start

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

The CLI writes six files, runs `pnpm install` in `checkout/`, and prints the next steps:

```text
checkout/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    └── main.tsx
```

`src/main.tsx` exports the micro app module that a shell loads:

```tsx [src/main.tsx]
import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export default createReactMicroApp({
  name: 'my-react-app',
  App,
});
```

Rename `my-react-app` to the name your shell registers. The CLI does not insert your project name there.

## Options

```text
create-tuvix-app [project-name] [options]
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `project-name` | positional | prompt | Folder name and `package.json` name. The first argument that does not start with `-` sets it; a later one replaces it. |
| `--template`, `-t` | `string` | prompt | One of `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. |
| `--typescript` | flag | prompt (`Yes` preselected) | Generate TypeScript files and a `tsconfig.json`. |
| `--no-typescript` | flag | prompt | Generate JavaScript files. `angular-app` ignores it. |
| `--example`, `-e` | `string` | none | Download a folder from `examples/` in the GitHub repository instead of a template. Skips prompts and the install step. |
| `--help`, `-h` | flag | `false` | Print usage and exit. |
| `--version`, `-v` | flag | `false` | Print `create-tuvix-app v<version>` and exit. The CLI reads the version from its own `package.json`. |

For every value you leave out, the CLI asks with an interactive prompt, in this order: project name (`my-app` as placeholder, empty input rejected), template, then TypeScript. Pass all three to run without prompts:

```bash
npx create-tuvix-app admin --template angular-app --typescript
```

The CLI ignores flags it does not know.

## Templates

Every template writes `index.html`, `package.json` and `src/main.<ext>`. The generated `package.json` is `private`, has `"type": "module"`, version `0.1.0` and three scripts: `dev` (`vite`), `build` (`vite build`) and `preview` (`vite preview`). `svelte-app` in TypeScript mode adds a fourth, `check`. Every `package.json` lists `tuvix.js@^0.5.0` and `vite@^6.0.0`, plus `typescript@^5.7.0` in TypeScript mode.

| Template | Files besides `index.html` and `package.json` | Extra dependencies |
| --- | --- | --- |
| `shell` | `src/main.ts` | none |
| `react-app` | `src/main.tsx`, `src/App.tsx`, `vite.config.ts` | `react`, `react-dom` `^19.0.0`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3.0`; `@types/react`, `@types/react-dom` in TS mode |
| `vue-app` | `src/main.ts`, `src/App.vue`, `vite.config.ts`; `src/vite-env.d.ts` in TS mode | `vue@^3.5.0`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2.0` |
| `svelte-app` | `src/main.ts`, `src/App.svelte`, `vite.config.ts`, `svelte.config.js`; `src/vite-env.d.ts` in TS mode | `svelte@^5.0.0`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5.0.0`; `svelte-check@^4.0.0` in TS mode |
| `angular-app` | `src/main.ts`, `src/app/app.component.ts`, `vite.config.ts` | `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/platform-browser` `^20.0.0`, `rxjs@^7.8.0`, `tslib@^2.6.0`, `@tuvix.js/angular`, `typescript@~5.8.0` |
| `vanilla-app` | `src/main.ts` | none |

TypeScript mode adds `tsconfig.json` (`ES2020`, `ESNext` modules, `bundler` resolution, `strict`). For `react-app`, `vue-app` and `svelte-app` it includes `vite.config.ts` next to `src`. JavaScript mode uses `.js` and `.jsx` and writes no `tsconfig.json`; `vite.config.ts` stays TypeScript, which Vite loads either way. All `@tuvix.js/*` packages get `^0.5.0`.

### `shell`

An orchestrator with a history router. `index.html` has a `#header`, a `<nav>` with links to `/dashboard` and `/settings`, and a `<main id="main">`. `src/main.ts`:

```ts [src/main.ts]
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
  onError(error, appName) {
    console.error(`App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

orchestrator.start();
```

Replace the `entry` URL with the built entry of your dashboard app and register `settings` yourself. The template registers only `dashboard`.

### `react-app`

`createReactMicroApp({ name: 'my-react-app', App })` from `@tuvix.js/react`. `App` renders a heading and the props it receives as JSON. `vite.config.ts` adds `@vitejs/plugin-react`, which compiles JSX with the automatic runtime, so `App.jsx` needs no `React` import in JavaScript mode. The TS `tsconfig.json` sets `"jsx": "react-jsx"`.

### `vue-app`

`createVueMicroApp({ name: 'my-vue-app', App })` from `@tuvix.js/vue`, and `vite.config.ts` adds `@vitejs/plugin-vue`. `App.vue` is a `<script setup>` component that reads the shell's props with `inject`:

```vue [src/App.vue]
<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>Vue Micro App</h1>
    <p>This is a Tuvix.js micro frontend.</p>
    <pre>{{ JSON.stringify(props, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

// The props the shell passes to mount() and update(), kept reactive.
const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
</script>
```

In TS mode `src/vite-env.d.ts` references `vite/client` and declares `*.vue` modules, so `tsc` accepts the `App` import.

### `svelte-app`

A Svelte 5 micro app. `src/main.ts` passes `SvelteMap` from `svelte/reactivity`, so `update({ props })` re-renders in place instead of remounting:

```ts [src/main.ts]
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({
  name: 'my-svelte-app',
  App,
  SvelteMap,
});
```

`App.svelte` reads its `name` prop with `$props()`. `vite.config.ts` adds the Svelte plugin, and `svelte.config.js` sets `preprocess: vitePreprocess()` so `<script lang="ts">` compiles. In TS mode `src/vite-env.d.ts` references the `svelte` and `vite/client` types, and `package.json` gets a `check` script (`svelte-check --tsconfig ./tsconfig.json`).

### `angular-app`

Angular 20 without zone.js. The template always uses TypeScript, even with `--no-typescript`, and prints `Angular requires TypeScript. Switching to TypeScript automatically.` when you chose JavaScript in the prompt.

```ts [src/main.ts]
// Load the JIT compiler before any Angular package that ships partially
// compiled code (@angular/common, forms, router) is evaluated.
import '@angular/compiler';
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app/app.component';

export default createSsrAngularMicroApp({
  name: 'my-angular-app',
  component: AppComponent,
});
```

`AppComponent` is a standalone component with an inline template. `createSsrAngularMicroApp` renders it fresh into an empty container, and renders over the markup when the container holds HTML from `renderAngularToString`. The adapter runs zoneless. Vite does not AOT-compile Angular, so the components compile in the browser: keep `import '@angular/compiler'` as the first line of `src/main.ts`, and keep the compiler as a runtime dependency. `tsconfig.json` targets `ES2022` with `experimentalDecorators` on and `useDefineForClassFields` off, and `vite.config.ts` sets the esbuild target to `es2022`.

### `vanilla-app`

`defineMicroApp` from `tuvix.js` with a `mount` that writes a heading into `container.innerHTML` and an `unmount` that clears it.

## Examples

`--example <name>` downloads `https://codeload.github.com/yasinatesim/tuvix.js/tar.gz/master` and extracts `examples/<name>/` into your project folder. Prompts, `--template`, `--typescript` and the install step are skipped. The CLI prints `<pm> install` and `<pm> run dev` as next steps.

```bash
npx create-tuvix-app my-app --example with-multiple-frameworks
```

Without a project name the folder is `my-app`. The name must contain only letters, digits and hyphens. These folders exist in `examples/`:

| Example | Shows |
| --- | --- |
| `with-react` | React micro apps in a shell |
| `with-vue` | Vue micro apps in a shell |
| `with-svelte` | Svelte micro apps in a shell |
| `with-angular` | Angular micro apps in a shell |
| `with-vanilla` | Micro apps without a framework |
| `with-multiple-frameworks` | React and Vue micro apps on one page |
| `with-react-router` | `@tuvix.js/router` with React apps |
| `with-react-event-bus` | Apps talking over `@tuvix.js/event-bus` |
| `with-react-sandbox` | CSS isolation with `@tuvix.js/sandbox` |
| `with-react-devtools` | The [`@tuvix.js/devtools`](/packages/devtools) overlay |
| `with-module-federation-react` | `@tuvix.js/module-federation` with React remotes |
| `with-ssr-react` | `@tuvix.js/server` composing React fragments |
| `with-ssr-vanilla` | `@tuvix.js/server` composing plain HTML fragments |
| `with-ssr-islands` | Server-rendered islands in several frameworks with [`@tuvix.js/vite`](/packages/vite) |

The examples live inside the monorepo, so their `package.json` files depend on `workspace:*`. Replace each `workspace:*` and `workspace:^` with `^0.5.0` before you run the install command, or the package manager stops with an unsupported protocol error.

## Package manager detection

The CLI picks the package manager for the install step and the printed commands from how you started it. It checks, in order:

1. `process.versions.bun` is set: `bun`.
2. `npm_execpath` contains `pnpm` or `yarn`: that manager.
3. `npm_config_user_agent` starts with `pnpm`, `yarn` or `bun/`: that manager.
4. Otherwise: `npm`.

`pnpm create tuvix-app` and `pnpm dlx create-tuvix-app` install with pnpm, `yarn create` with yarn, `npx` and `npm create` with npm. No flag overrides the choice.

## Install step

After a template run, the CLI runs `<pm> install` in the new folder behind a spinner (`Installing dependencies with <pm>`). It hides the package manager's output.

- Exit code 0: the spinner ends with `Dependencies installed`, and the CLI prints `cd <name>` and `<pm> run dev`.
- Non-zero exit code, or the binary is missing: the spinner ends with `Install failed. Run manually:` followed by `cd <absolute path>` and `<pm> install`. The project files stay, and the CLI still exits with code 0.

`--example` runs never install.

## Edge cases

- An existing folder stops the run with `Directory "<name>" already exists.` and exit code 1. The CLI never writes into or merges with an existing folder.
- A name whose resolved path does not start with the current directory, such as `../app`, stops with `Project directory must be within the current working directory.`
- An unknown `--template` value fails after the prompts with `Unknown template "<value>". Available: shell, react-app, vue-app, vanilla-app, svelte-app, angular-app`.
- `--template` or `--example` as the last argument, with no value, counts as not given: you get the template prompt, or a normal template run.
- The CLI uses the project name as written for both the folder and the `package.json` `name`. It does not check npm naming rules, so `My App` gives an invalid package name.
- Cancelling a prompt (Ctrl+C) prints `Operation cancelled.` and exits with code 0.
- An example name that does not exist on `master` leaves an empty folder and fails with `Example "<name>" was not found or failed to extract.` Delete the folder before you retry.
- The CLI downloads the whole repository tarball for one example. A slow connection makes `--example` slow.

## What it does not do

- The micro app templates do not mount themselves. `src/main` exports the module, and nothing in `index.html` calls `mount`, so `pnpm run dev` shows an empty `#app` until a shell loads the entry.
- No library-mode Vite config. `vite build` produces a regular app build with hashed file names, and you choose the entry your shell loads.
- No monorepo, workspace or multi-app setup. Run the CLI once per app, or start from an `--example`.
- No git init, no linter, no test runner, no CSS setup.
- No `--no-install` flag and no package manager flag.
- No programmatic API. Importing the package runs the CLI.
