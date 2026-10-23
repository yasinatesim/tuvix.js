import type { TuvixAssets } from './types';

/** One chunk record from Vite's `.vite/manifest.json`. */
export interface ManifestChunk {
  file: string;
  name?: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
}

export type Manifest = Record<string, ManifestChunk>;

/** Joins a Vite `base` ('/', '/app/', 'https://cdn.example.com/') with a root-relative path. */
export function joinBase(base: string, path: string): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return prefix + path.replace(/^\//, '');
}

function collect(manifest: Manifest, key: string, base: string): TuvixAssets {
  const css: string[] = [];
  const modulepreload: string[] = [];
  const seen = new Set<string>();

  const visit = (chunkKey: string): void => {
    if (seen.has(chunkKey)) return;
    seen.add(chunkKey);
    const chunk = manifest[chunkKey];
    if (!chunk) return;
    if (chunk.file.endsWith('.css')) {
      css.push(chunk.file);
      return;
    }
    modulepreload.push(chunk.file);
    // Imported chunks load first at runtime, so their CSS comes first in the cascade.
    for (const imported of chunk.imports ?? []) visit(imported);
    for (const file of chunk.css ?? []) css.push(file);
  };
  visit(key);

  return {
    css: [...new Set(css)].map((file) => joinBase(base, file)),
    modulepreload: [...new Set(modulepreload)].map((file) =>
      joinBase(base, file)
    ),
  };
}

/**
 * Written by the client build next to the manifest, as {@link ClientBuildInfo}.
 */
export const CLIENT_BUILD_INFO_FILE = 'tuvix-client.json';

/** What the client build knows that Vite's manifest leaves out. */
export interface ClientBuildInfo {
  /**
   * Maps every entry and `import()` target, relative to the Vite root, to the
   * file name of the chunk Rollup put it in. Vite's manifest only keys a chunk
   * by a module when that module is the chunk's facade. When Rollup merges two
   * dynamic entries into one chunk, the manifest keys it `_name-<hash>.js` and
   * drops both sources.
   */
  modules: Record<string, string>;
  /**
   * With `build.cssCodeSplit: false`, Vite writes all CSS to one file that no
   * manifest chunk lists. Every entry needs it.
   */
  sharedCss: string[];
}

/** Name Vite gives the single CSS file of an app built with `cssCodeSplit: false`. */
export const VITE_CSS_BUNDLE_NAME = 'style.css';

/**
 * Best guess when the client build wrote no {@link CLIENT_BUILD_INFO_FILE}
 * (it ran without the tuvix() plugin): merged chunks stay unresolved, and a
 * `style.css` manifest asset that no chunk lists counts as the
 * `cssCodeSplit: false` bundle.
 */
export function clientBuildInfoFromManifest(
  manifest: Manifest
): ClientBuildInfo {
  const bundle = manifest[VITE_CSS_BUNDLE_NAME];
  const chunksListCss = Object.values(manifest).some(
    (chunk) => (chunk.css ?? []).length > 0
  );
  return {
    modules: {},
    sharedCss: bundle && !chunksListCss ? [bundle.file] : [],
  };
}

/**
 * Maps every entry and dynamically imported module of a client manifest to the
 * stylesheets and JS chunks it needs on first paint. Static `imports` are
 * followed transitively; `dynamicImports` are not, because Vite loads those
 * chunks (and their CSS) only when the `import()` runs. `info.modules` adds
 * modules that have no manifest key of their own.
 */
export function buildAssetMap(
  manifest: Manifest,
  base: string,
  info: ClientBuildInfo = { modules: {}, sharedCss: [] }
): Record<string, TuvixAssets> {
  const sharedCss = info.sharedCss.map((file) => joinBase(base, file));
  const assetsOf = (key: string): TuvixAssets => {
    const assets = collect(manifest, key, base);
    return {
      css: [...new Set([...sharedCss, ...assets.css])],
      modulepreload: assets.modulepreload,
    };
  };
  const map: Record<string, TuvixAssets> = {};
  const keyByFile = new Map<string, string>();
  for (const [key, chunk] of Object.entries(manifest)) {
    keyByFile.set(chunk.file, key);
    if (chunk.isEntry || chunk.isDynamicEntry) map[key] = assetsOf(key);
  }
  for (const [moduleKey, file] of Object.entries(info.modules)) {
    const key = keyByFile.get(file);
    if (key !== undefined && !map[moduleKey]) map[moduleKey] = assetsOf(key);
  }
  return map;
}
