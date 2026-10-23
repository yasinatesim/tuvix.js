---
title: '@tuvix.js/vite'
---

<PackageHeader
  name="@tuvix.js/vite"
  title="Vite Island Assets"
  description="Vite plugin that tells your server renderer which stylesheets and JS chunks an island needs, so the server-rendered head links them and the island is styled on first paint."
  icon="⚡"
  npm="true"
/>

## Installation

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

The plugin needs Vite 6 or 7 (peer range `^6.0.0 || ^7.0.0`). The test suite runs on Vite 6.

## When to use it

You server-render an island (React, Vue, Svelte, Angular or plain DOM) and its markup reaches the browser before its JavaScript. Vite ships CSS Modules, Vue SFC `<style>` blocks and Svelte styles through that JavaScript, so the browser paints the island unstyled until the bundle runs. With `@tuvix.js/vite` your server asks "which stylesheets does `src/islands/footer/index.ts` need?" and prints `<link>` tags for them into `<head>`.

Skip it when your islands render only on the client, or when you link one global stylesheet that already covers every island.

## Quick start

Add the plugin to the Vite config you use for the client build and the SSR build:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

Add the types of the virtual module to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@tuvix.js/vite/client"]
  }
}
```

Ask for the assets in your server entry and print them into `<head>`:

```ts
// src/entry-server.ts
/// <reference types="@tuvix.js/vite/client" />
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { renderFooter } from './islands/footer/render';

export async function render(): Promise<string> {
  const assets = await getAssets(['src/islands/footer/index.ts']);
  return `<!doctype html>
<html>
  <head>${renderAssetTags(assets)}</head>
  <body><footer data-tuvix-app="footer">${await renderFooter()}</footer></body>
</html>`;
}
```

Build the client first, then the server. The SSR build reads the client manifest:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?)`

```ts no-check
function tuvix(options?: TuvixViteOptions): Plugin[];
```

Returns three Vite plugins:

- `tuvix:assets` provides `virtual:tuvix/assets`.
- `tuvix:client-build-info` (builds only) writes `.vite/tuvix-client.json` next to the client manifest. See [Production builds](#production-builds).
- `tuvix:dev-css-handoff` (dev server only) hands styling over from the server-rendered `<link>` to Vite's own `<style>` tags.

Put the returned array in `plugins` as shown above; Vite flattens nested plugin arrays.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | Output directory of the client build, relative to the Vite root or absolute. The SSR build reads `<clientOutDir>/.vite/manifest.json`, then falls back to `<clientOutDir>/manifest.json`. |
| `base` | `string` | Vite `base` of the build or dev server that loads the virtual module | Public base the browser loads client assets from. Set it when the client is served from a different base than the server bundle, such as vinxi's `/_build`. |

TanStack Start and vinxi write the client router's build to a separate folder under `/_build`:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries)`

Exported by `virtual:tuvix/assets`.

```ts no-check
function getAssets(entries: string[]): Promise<TuvixAssets>;
```

Pass island entry modules as paths relative to the Vite root, such as `'src/islands/footer/index.ts'`. The function ignores a leading `./` or `/`. With several entries it merges the lists in entry order and drops duplicates.

`getAssets` returns a promise because the dev server has to transform each module before it can read its imports. Call it from server code only.

### `renderAssetTags(assets)`

Exported by `virtual:tuvix/assets`.

```ts no-check
function renderAssetTags(assets: TuvixAssets): string;
```

Returns one `<link rel="stylesheet">` tag per URL in `assets.css`, then one `<link rel="modulepreload" crossorigin>` tag per URL in `assets.modulepreload`. It HTML-escapes the `href` values. It works on the server and in the browser.

If your `<head>` is a React component, render the lists yourself:

```tsx
import type { TuvixAssets } from '@tuvix.js/vite';

export function IslandAssets({ assets }: { assets: TuvixAssets }) {
  return (
    <>
      {assets.css.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {assets.modulepreload.map((href) => (
        <link key={href} rel="modulepreload" crossOrigin="" href={href} />
      ))}
    </>
  );
}
```

### Types

| Type | Exported from | Meaning |
| --- | --- | --- |
| `TuvixViteOptions` | `@tuvix.js/vite` | Options of `tuvix()`: `clientOutDir?`, `base?`. |
| `TuvixAssets` | `@tuvix.js/vite`, `virtual:tuvix/assets` | `{ css: string[]; modulepreload: string[] }`. `css` is in cascade order. `modulepreload` is empty in dev. |
| `@tuvix.js/vite/client` | type entry | Declares the `virtual:tuvix/assets` module. Add it to `compilerOptions.types` or reference it with `/// <reference types="@tuvix.js/vite/client" />`. |

## Production builds

- In the client build the plugin turns on `build.manifest`, unless you set `build.manifest` yourself.
- The client build also writes `.vite/tuvix-client.json` next to the manifest, shaped `{ modules, sharedCss }`. `modules` maps each entry and `import()` target, relative to the Vite root, to the chunk Rollup put it in. `sharedCss` lists the single stylesheet of a `build.cssCodeSplit: false` build.
- In the SSR build it reads the client manifest and `tuvix-client.json`, and inlines a map from every manifest key that is an entry (`isEntry`) or a dynamic entry (`isDynamicEntry`) to its URLs.
- Rollup sometimes merges two dynamic entries into one chunk, for example a page and a framework runtime that an adapter loads with `import()`. Vite's manifest then keys that chunk `_Page-<hash>.js` and lists neither source. The plugin finds the chunk through `modules` in `tuvix-client.json`.
- With `build.cssCodeSplit: false`, Vite writes all CSS to one `style-<hash>.css` that no manifest chunk lists. `getAssets` returns that file for every entry, before the entry's own CSS.
- Without `tuvix-client.json` (a client built without `tuvix()`), only modules with their own manifest key resolve. A `style.css` manifest asset that no chunk lists still counts as the single `cssCodeSplit: false` stylesheet.
- For each entry it collects the entry chunk and every chunk it imports statically, transitively, plus their CSS. CSS of imported chunks comes before the entry's own CSS, the order Vite loads them in.
- `modulepreload` lists the entry chunk and its static imports. URLs are `base + file`.
- The map skips `import()` targets, because Vite loads those chunks and their CSS only when the import runs. If a lazy module renders on the server, pass its path to `getAssets` as a separate entry.
- When the browser later loads the island chunk, Vite's preload helper finds the `<link>` your server printed and does not add a second one.

## Dev server

- `getAssets` walks the dev server's client module graph from each entry along static imports, in import order. It returns URLs such as `/src/islands/footer/footer.module.css?direct`; Vite answers `?direct` requests with plain CSS. Vue blocks come back as `/src/App.vue?direct&vue&type=style&index=0&...&lang.css`.
- CSS that an island reaches through a virtual module is collected too. A virtual stylesheet such as `\0virtual:theme.css` comes back as `/@id/__x00__virtual:theme.css?direct`, so the plugin that provides it must load ids that carry a query.
- Once the island's JavaScript runs, Vite injects its own `<style>` for each CSS module. The `tuvix:dev-css-handoff` plugin then sets `link.sheet.disabled = true` on the server-rendered `<link>` with the same href, so a stale copy of the rules cannot override your HMR edits. The `<link>` element stays in the DOM, so a hydrated React `<head>` sees no change.
- On a CSS edit, `tuvix:dev-css-handoff` leaves the `?direct` stylesheet out of the HMR update. Vite then updates its `<style>` without reloading the page and without swapping the `<link>`. Two limits apply:
  - A CSS Modules edit changes the hashed class names, so the island's own HMR (React Fast Refresh, Vue) has to re-render it.
  - An island whose JavaScript the page has not loaded yet keeps the server stylesheet until you reload.
- `modulepreload` is always empty in dev.
- `getAssets` talks to the dev server in the same Node process. It works with `ssrLoadModule` and Vite's default module runner, and keeps working across `server.restart()`.

## Edge cases

- An entry that is neither a build input nor an `import()` target of the client build rejects with `[tuvix] "<key>" is not an entry or a dynamically imported module in <manifest>`. Add the island to `build.rollupOptions.input`, or load it with `import()` from client code.
- A missing client manifest fails the SSR build with `[tuvix] No client manifest in <dir>`. Build the client first, or fix `clientOutDir`.
- In dev, `getAssets` rejects with `found no running Vite dev server with the tuvix() plugin in this process` when your SSR code runs in another process or a worker runtime, or after the dev server closed.
- In the browser build of `virtual:tuvix/assets`, `getAssets` rejects with `runs during server rendering only`. The client bundle cannot know its own manifest.
- In dev the walker does not descend into modules under `/node_modules/`. A stylesheet that your own code imports from a package is collected; a stylesheet that a package imports from its own JavaScript is not.
- A relative `base` such as `'./'` gives relative URLs, which break on nested routes. Use an absolute base.
- Svelte: keep `vite-plugin-svelte`'s default `emitCss: true`. With `compilerOptions.css: 'injected'` the styles live inside the JavaScript, and the plugin finds no stylesheet to link.

## What it does not do

- It does not write tags into your HTML. You decide where `renderAssetTags` output goes.
- It does not follow `import()` chains. Pass lazy modules that render on the server as their own entries.
- It does not support a custom manifest file name (`build.manifest: 'name.json'`). Use `true`.
- It does not render islands or hydrate them. Pair it with an adapter such as [`@tuvix.js/react`](/packages/react) (`TuvixIsland`), [`@tuvix.js/vue`](/packages/vue) or [`@tuvix.js/svelte`](/packages/svelte).
