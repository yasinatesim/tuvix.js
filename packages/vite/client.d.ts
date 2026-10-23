// Types for the virtual module provided by the tuvix() Vite plugin.
// Add "@tuvix.js/vite/client" to compilerOptions.types, or reference it:
// /// <reference types="@tuvix.js/vite/client" />

declare module 'virtual:tuvix/assets' {
  import type { TuvixAssets } from '@tuvix.js/vite';

  export type { TuvixAssets };

  /**
   * Resolves the stylesheets and JS chunks the given island entry modules need
   * on first paint. Pass paths relative to the Vite root, such as
   * `'src/islands/footer/index.ts'`. Server only: the browser build rejects.
   *
   * In a production SSR build the map comes from the client manifest; an
   * entry missing from it rejects with an error. In dev, `modulepreload` is
   * always empty.
   */
  export function getAssets(entries: string[]): Promise<TuvixAssets>;

  /**
   * Renders `<link rel="stylesheet">` tags for `assets.css`, then
   * `<link rel="modulepreload" crossorigin>` tags for `assets.modulepreload`.
   * Attribute values are HTML-escaped.
   */
  export function renderAssetTags(assets: TuvixAssets): string;
}
