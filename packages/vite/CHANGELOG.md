# @tuvix.js/vite

## 0.5.0

### Minor Changes

- 61a2c5e: New package `@tuvix.js/vite`: a Vite plugin that tells your server which stylesheets a server-rendered island needs, so you can link them in `<head>` and the island is styled on first paint.

  - `tuvix({ clientOutDir?, base? })` provides `virtual:tuvix/assets` with `getAssets(entries): Promise<{ css, modulepreload }>` and `renderAssetTags(assets)`. Pass island entry paths relative to the Vite root, such as `'src/islands/footer/index.ts'`. Types ship in `@tuvix.js/vite/client`.
  - Production: the plugin turns on `build.manifest` for the client build. The SSR build reads `<clientOutDir>/.vite/manifest.json` (default `dist/client`) and inlines each entry's CSS and JS chunks, following static imports and skipping `import()` targets. The client build writes `.vite/tuvix-client.json` beside the manifest, so a page still resolves when Rollup merges it with another dynamic entry into one chunk that the manifest keys `_Page-<hash>.js`. With `build.cssCodeSplit: false`, every entry gets the single `style-<hash>.css`. URLs start with Vite's `base` or the `base` option. An unknown entry rejects with an error; a missing manifest fails the SSR build.
  - Dev: `getAssets` walks the dev server's module graph and returns `?direct` stylesheet URLs for CSS Modules, plain CSS, Vue SFC `<style>` blocks and CSS behind virtual modules (`/@id/...`). Once Vite injects its own `<style>` for a CSS module, the plugin disables the matching server-rendered `<link>`. A CSS edit hot-updates Vite's `<style>`: the plugin keeps the `?direct` link out of the HMR update, so a `.module.css` edit no longer reloads the page and Vite no longer swaps the `<link>`. `getAssets` keeps working after `server.restart()`. `modulepreload` stays empty in dev.
  - The browser build's `getAssets` rejects. Call it from server code and pass the result to the page.
  - Requires Vite 6 or 7.
