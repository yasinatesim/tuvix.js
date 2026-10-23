/**
 * Asset URLs an island needs in the server-rendered `<head>`.
 *
 * @example
 * const assets: TuvixAssets = { css: ['/assets/footer-3f2a.css'], modulepreload: [] };
 */
export interface TuvixAssets {
  /** Stylesheet URLs, in cascade order. Render them as `<link rel="stylesheet">`. */
  css: string[];
  /** JS chunk URLs for `<link rel="modulepreload">`. Always empty in dev. */
  modulepreload: string[];
}

/**
 * Options for the {@link tuvix} Vite plugin.
 *
 * @example
 * tuvix({ clientOutDir: 'dist/client', base: '/' });
 */
export interface TuvixViteOptions {
  /**
   * Output directory of the client build, relative to the Vite root or
   * absolute. The SSR build reads `<clientOutDir>/.vite/manifest.json`.
   * @default 'dist/client'
   */
  clientOutDir?: string;
  /**
   * Public base the browser loads client assets from. Defaults to Vite's
   * `base` of the build or dev server that loads `virtual:tuvix/assets`. Set
   * it when the client is served from a different base than the server
   * bundle (for example vinxi's `/_build`).
   */
  base?: string;
}
