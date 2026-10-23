# @tuvix.js/vite

> Vite plugin that puts island CSS and modulepreload links into the server-rendered `<head>`

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework. Full docs: [tuvix.js.org/packages/vite](https://tuvix.js.org/packages/vite).

When you server-render a micro-app island, its markup reaches the browser before its JavaScript. Vite ships the island's CSS (CSS Modules, Vue SFC `<style>`, Svelte styles) inside that JavaScript, so the first paint shows unstyled markup. This plugin tells your server which stylesheets each island needs, so you can link them in `<head>`.

Use it when you server-render islands with Vite. Skip it when your islands render only on the client.

## Installation

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Requires Vite 6 or 7. The test suite runs on Vite 6.

## Quick Start

Add the plugin to the Vite config you use for the client build and the SSR build:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

Add the virtual module types to `tsconfig.json`:

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

Build the client first, then the server:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?: TuvixViteOptions): Plugin[]`

Returns three plugins: `tuvix:assets` (provides `virtual:tuvix/assets`), `tuvix:client-build-info` (builds only; writes `.vite/tuvix-client.json` in the client build) and `tuvix:dev-css-handoff` (dev server only).

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | Client build output directory, relative to the Vite root or absolute. The SSR build reads `<clientOutDir>/.vite/manifest.json`, then `<clientOutDir>/manifest.json`. |
| `base` | `string` | Vite `base` | Public base the browser loads client assets from. Set it when the client is served from a different base than the server bundle. |

For TanStack Start or vinxi, point the plugin at the client router's output and base:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries: string[]): Promise<TuvixAssets>`

From `virtual:tuvix/assets`. Pass island entry modules as paths relative to the Vite root, such as `'src/islands/footer/index.ts'`. A leading `./` or `/` is ignored. With several entries, `getAssets` merges the lists in entry order and drops duplicates. Server only.

### `renderAssetTags(assets: TuvixAssets): string`

From `virtual:tuvix/assets`. Returns `<link rel="stylesheet">` tags for `css`, then `<link rel="modulepreload" crossorigin>` tags for `modulepreload`. It escapes attribute values and works on the server and in the browser.

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

| Type | Meaning |
| --- | --- |
| `TuvixViteOptions` | Options of `tuvix()`. |
| `TuvixAssets` | `{ css: string[]; modulepreload: string[] }`. `css` is in cascade order; `modulepreload` is empty in dev. |

## Production Builds

- The plugin turns on `build.manifest` in the client build, unless you set `build.manifest` yourself.
- In the SSR build it reads the client manifest and inlines a map from each entry and dynamic entry to its URLs.
- The client build also writes `.vite/tuvix-client.json` next to the manifest. It maps each entry and `import()` target to the chunk Rollup put it in. Rollup sometimes merges two dynamic entries into one chunk, for example a page and a framework runtime that an adapter loads with `import()`. Vite's manifest then keys that chunk `_Page-<hash>.js` and lists neither source, and the plugin uses `tuvix-client.json` to find it. Without that file (a client built without `tuvix()`), only modules with their own manifest key resolve.
- With `build.cssCodeSplit: false`, Vite writes all CSS to one `style-<hash>.css` that no manifest chunk lists. `getAssets` returns that file for every entry.
- For each entry it collects the entry chunk and every chunk it imports statically, with their CSS. Imported chunks' CSS comes before the entry's own CSS, the order Vite loads them in.
- It skips `import()` targets, because Vite loads those chunks and their CSS only when the import runs. If a lazy module renders on the server, pass its path to `getAssets` as well.
- URLs start with `base`. When the browser later loads the island chunk, Vite's preload helper finds the existing `<link>` and does not add a second one.

## Dev Server

- `getAssets` walks the dev server's client module graph from each entry along static imports and returns URLs such as `/src/islands/footer/footer.module.css?direct`. Vite answers `?direct` requests with plain CSS.
- CSS that an island reaches through a virtual module works too. A virtual stylesheet such as `\0virtual:theme.css` comes back as `/@id/__x00__virtual:theme.css?direct`, so the plugin that provides it must load ids that carry a query.
- When the island's JavaScript runs, Vite injects its own `<style>` for each CSS module. The plugin then disables the matching server-rendered `<link>` through `link.sheet.disabled`, so a stale copy of the rules cannot override your HMR edits. The `<link>` element stays in the DOM, and a hydrated React `<head>` sees no change.
- On a CSS edit, the plugin leaves the `?direct` stylesheet out of the HMR update. Vite then updates its `<style>` without reloading the page and without swapping the `<link>`. A CSS Modules edit changes the hashed class names, so the island's own HMR (React Fast Refresh, Vue) has to re-render it. An island whose JavaScript the page has not loaded yet keeps the server stylesheet until you reload.
- `modulepreload` is always empty in dev.

## Edge Cases

- `getAssets` rejects for a path that is neither a build input nor an `import()` target of the client build. Add the island to `build.rollupOptions.input`, or load it with `import()` from client code.
- The SSR build fails with `[tuvix] No client manifest in <dir>` when the client manifest is missing.
- In dev, `getAssets` needs the dev server in the same Node process (`ssrLoadModule` or Vite's default module runner). It rejects when the SSR code runs in another process or a worker runtime, or after the dev server closed. It keeps working across `server.restart()`.
- The browser build of `virtual:tuvix/assets` exports a `getAssets` that rejects, because the client bundle cannot know its own manifest.
- In dev the walker does not descend into modules under `/node_modules/`, so CSS that a package imports from its own JavaScript is not collected.
- A relative `base` such as `'./'` gives relative URLs, which break on nested routes. Use an absolute base.
- Svelte: keep `vite-plugin-svelte`'s default `emitCss: true`. With `compilerOptions.css: 'injected'` the styles live inside the JavaScript, and the plugin finds no stylesheet to link.

## What It Does Not Do

- It does not write tags into your HTML. You choose where they go.
- It does not follow `import()` chains.
- It does not support a custom manifest file name (`build.manifest: 'name.json'`). Use `true`.
- It does not render or hydrate islands. Use an adapter such as `@tuvix.js/react` (`TuvixIsland`), `@tuvix.js/vue` or `@tuvix.js/svelte`.

## License

MIT
