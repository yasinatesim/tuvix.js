# create-tuvix-app

> Scaffold a Vite project for a Tuvix.js shell or a React, Vue, Svelte, Angular or vanilla micro app

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Usage

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app

# npm create forwards flags only after --
npm create tuvix-app@latest my-app -- --template react-app --typescript
```

The CLI prompts for every value you leave out (project name, template, TypeScript), writes the files into `./<project-name>`, then installs dependencies.

## Quick start

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

## Options

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `project-name` | positional | prompt | Folder and `package.json` name |
| `--template`, `-t` | `string` | prompt | `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app` or `vanilla-app` |
| `--typescript` / `--no-typescript` | flag | prompt (`Yes` preselected) | TypeScript files plus `tsconfig.json`, or JavaScript. `angular-app` is always TypeScript. |
| `--example`, `-e` | `string` | none | Download `examples/<name>` from the GitHub repo (`master`). Skips prompts and install. |
| `--help`, `-h` | flag | `false` | Print usage |
| `--version`, `-v` | flag | `false` | Print `create-tuvix-app v<version>`, read from the CLI's `package.json` |

## Templates

Each project gets `index.html`, `src/main.<ext>` and a `package.json` with `dev`/`build`/`preview` Vite scripts, `tuvix.js@^0.5.0` and `vite@^6.0.0` (plus `typescript@^5.7.0` in TS mode).

| Template | Generates | Extra dependencies |
| --- | --- | --- |
| `shell` | `createOrchestrator` with a history router (`/dashboard/*`, `/settings/*`) and one registered `dashboard` app pointing at a placeholder CDN URL | none |
| `react-app` | `createReactMicroApp({ name, App })`, `App.tsx` and a `vite.config.ts` with `@vitejs/plugin-react` | `react`, `react-dom` `^19`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3` |
| `vue-app` | `createVueMicroApp({ name, App })`, `App.vue` that reads props with `inject(TUVIX_PROPS_KEY)`, `vite.config.ts` with `@vitejs/plugin-vue`, and in TS mode `src/vite-env.d.ts` declaring `*.vue` modules | `vue@^3.5`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2` |
| `svelte-app` | `createSvelteMicroApp({ name, App, SvelteMap })` with `SvelteMap` from `svelte/reactivity`, so `update()` re-renders in place. Svelte 5 `App.svelte` reading `$props()`, `vite.config.ts`, `svelte.config.js` with `vitePreprocess()`, and in TS mode `src/vite-env.d.ts` plus a `check` script | `svelte@^5`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5`, `svelte-check@^4` (TS mode) |
| `angular-app` | `createSsrAngularMicroApp({ name, component })` with a standalone `AppComponent`, zoneless Angular 20. `src/main.ts` imports `@angular/compiler` first so JIT components compile. | `@angular/{common,compiler,core,platform-browser}@^20`, `rxjs`, `tslib`, `@tuvix.js/angular` |
| `vanilla-app` | `defineMicroApp` with `mount`/`unmount` writing `innerHTML` | none |

## Package manager and install

The CLI picks `bun` when it runs on Bun, then checks `npm_execpath` for `pnpm`/`yarn`, then `npm_config_user_agent` for `pnpm`/`yarn`/`bun/`, and falls back to `npm`. After a template run it runs `<pm> install` with hidden output. If that fails it prints `Install failed. Run manually:` with the commands and still exits 0.

## Edge cases

- An existing target folder fails with `Directory "<name>" already exists.` (exit 1).
- Names resolving outside the current directory, such as `../app`, fail.
- An unknown `--template` fails with the list of available templates.
- The project name is used as written; npm naming rules are not checked.
- Examples depend on `workspace:*`. Replace those with `^0.5.0` before installing.
- A missing example leaves an empty folder behind; delete it before retrying.

## What it does not do

- Micro app templates export a module and never mount it, so `pnpm run dev` shows an empty `#app` until a shell loads it.
- No library-mode build config, git init, linter, tests or monorepo setup.
- No `--no-install` or package manager flag, and no programmatic API.

Full documentation: [tuvix.js.org/packages/create-tuvix-app](https://tuvix.js.org/packages/create-tuvix-app)

## License

MIT
