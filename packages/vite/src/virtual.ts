import type { TuvixAssets } from './types';

export const VIRTUAL_ASSETS_ID = 'virtual:tuvix/assets';
export const RESOLVED_VIRTUAL_ASSETS_ID = `\0${VIRTUAL_ASSETS_ID}`;
/** globalThis key of the Map from plugin instance id to its dev collector. */
export const DEV_REGISTRY_KEY = 'tuvix.vite.devAssets';

// Plain JS shared by every variant of the virtual module. String.raw keeps
// the regex backslashes intact.
const RUNTIME = String.raw`
function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function normalizeEntry(entry) {
  return String(entry).replace(/\\/g, "/").replace(/^\.?\//, "");
}
export function renderAssetTags(assets) {
  var tags = "";
  for (var i = 0; i < assets.css.length; i++) {
    tags += '<link rel="stylesheet" href="' + escapeAttr(assets.css[i]) + '">';
  }
  for (var j = 0; j < assets.modulepreload.length; j++) {
    tags += '<link rel="modulepreload" crossorigin href="' + escapeAttr(assets.modulepreload[j]) + '">';
  }
  return tags;
}
`;

/** Production SSR variant: the asset map is inlined at build time. */
export function buildModule(
  map: Record<string, TuvixAssets>,
  manifestPath: string
): string {
  return `${RUNTIME}
var assetMap = ${JSON.stringify(map)};
export async function getAssets(entries) {
  var css = [];
  var modulepreload = [];
  for (var i = 0; i < entries.length; i++) {
    var key = normalizeEntry(entries[i]);
    var assets = Object.prototype.hasOwnProperty.call(assetMap, key) ? assetMap[key] : undefined;
    if (!assets) {
      throw new Error("[tuvix] " + JSON.stringify(key) + " is not an entry or a dynamically imported module in " + ${JSON.stringify(manifestPath)} + ". Add it to build.rollupOptions.input of the client build or load it with import().");
    }
    for (var c = 0; c < assets.css.length; c++) if (css.indexOf(assets.css[c]) === -1) css.push(assets.css[c]);
    for (var m = 0; m < assets.modulepreload.length; m++) if (modulepreload.indexOf(assets.modulepreload[m]) === -1) modulepreload.push(assets.modulepreload[m]);
  }
  return { css: css, modulepreload: modulepreload };
}
`;
}

/** Dev SSR variant: asks the dev server in this process to walk its module graph. */
export function devModule(instanceId: string): string {
  return `${RUNTIME}
export function getAssets(entries) {
  var registry = globalThis[Symbol.for(${JSON.stringify(DEV_REGISTRY_KEY)})];
  var collect = registry && registry.get(${JSON.stringify(instanceId)});
  if (!collect) {
    return Promise.reject(new Error("[tuvix] getAssets() found no running Vite dev server with the tuvix() plugin in this process. It needs ssrLoadModule or the in-process module runner."));
  }
  return collect(entries.map(normalizeEntry));
}
`;
}

/** Browser variant: the client bundle cannot know its own manifest. */
export const CLIENT_MODULE = `${RUNTIME}
export function getAssets() {
  return Promise.reject(new Error("[tuvix] getAssets() runs during server rendering only. Call it from server code and pass the result to the page."));
}
`;
