import { init, parse } from 'es-module-lexer';
import type { DevEnvironment, EnvironmentModuleNode } from 'vite';
import { joinBase } from './manifest';

/** Same languages Vite treats as CSS requests. */
export const CSS_RE =
  /\.(?:css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
/** CSS imports that Vite does not inject as a stylesheet. */
const NOT_INJECTED_RE = /[?&](?:url|inline|raw|direct)\b/;
const TIMESTAMP_RE = /\bt=\d{13}&?\b/;
const TRAILING_SEPARATOR_RE = /[?&]$/;

export function isInjectedCss(url: string): boolean {
  return CSS_RE.test(url) && !NOT_INJECTED_RE.test(url);
}

/** Strips a leading `./` or `/` so `src/a.ts`, `./src/a.ts` and `/src/a.ts` match. */
export function normalizeEntry(entry: string): string {
  return entry.replace(/\\/g, '/').replace(/^\.?\//, '');
}

/**
 * URL a `<link>` uses to fetch a dev CSS module as plain CSS. Vite answers
 * `?direct` requests with the compiled stylesheet instead of the JS wrapper.
 * The query goes first, like Vite's own `injectQuery`, so `?vue&...&lang.css`
 * still ends in its CSS extension. Graph URLs of virtual modules
 * (`\0virtual:x.css`) get the `/@id/` prefix the browser requests them by.
 */
export function devStylesheetHref(url: string, base: string): string {
  const served = url.startsWith('/')
    ? url
    : `/@id/${url.replace('\0', '__x00__')}`;
  const queryAt = served.indexOf('?');
  const direct =
    queryAt === -1
      ? `${served}?direct`
      : `${served.slice(0, queryAt)}?direct&${served.slice(queryAt + 1)}`;
  return joinBase(base, direct);
}

/**
 * Turns an import specifier from transformed dev code back into a module
 * graph URL: drops the HMR timestamp and the server base, and unwraps the
 * `/@id/` prefix of virtual modules the way Vite's `unwrapId` does.
 */
function toGraphUrl(specifier: string, serverBase: string): string {
  let url = specifier
    .replace(TIMESTAMP_RE, '')
    .replace(TRAILING_SEPARATOR_RE, '');
  if (serverBase !== '/' && url.startsWith(serverBase))
    url = `/${url.slice(serverBase.length)}`;
  if (url.startsWith('/@id/'))
    url = url.slice('/@id/'.length).replace('__x00__', '\0');
  return url;
}

/**
 * Walks the client module graph from each entry along static imports and
 * returns the `?direct` stylesheet URLs of every injected CSS module, in
 * import order. `import()` targets are skipped, matching what the production
 * manifest lists for an entry.
 */
export async function collectDevCss(
  env: DevEnvironment,
  entries: string[],
  publicBase: string
): Promise<string[]> {
  await init;
  const serverBase = env.config.base;
  const seen = new Set<string>();
  const css: string[] = [];

  const visit = async (url: string): Promise<void> => {
    if (seen.has(url)) return;
    seen.add(url);
    if (CSS_RE.test(url)) {
      if (isInjectedCss(url)) css.push(devStylesheetHref(url, publicBase));
      return;
    }
    if (url.includes('/node_modules/') || url.startsWith('/@vite/')) return;

    const result = await env.transformRequest(url);
    const mod = await env.moduleGraph.getModuleByUrl(url);
    if (!result || !mod) return;

    const imported = new Map<string, EnvironmentModuleNode>();
    for (const dep of mod.importedModules) imported.set(dep.url, dep);
    const [imports] = parse(result.code);
    for (const entry of imports) {
      // d === -1 marks a static `import`; dynamic `import()` and `import.meta` differ.
      if (entry.d !== -1 || !entry.n) continue;
      const dep = imported.get(toGraphUrl(entry.n, serverBase));
      if (dep) await visit(dep.url);
    }
  };

  for (const entry of entries) await visit(`/${normalizeEntry(entry)}`);
  return css;
}

/**
 * Code appended to a CSS module's dev JS. Once Vite's client has injected the
 * module's `<style>`, it disables the matching server-rendered `<link>` so the
 * page does not keep a stale copy of the rules after HMR edits. It disables
 * the sheet through CSSOM and leaves the element in place, so frameworks that
 * hydrated the `<head>` see no DOM change.
 */
export function devStylesheetHandoff(href: string): string {
  return `
;(function () {
  if (typeof document === "undefined") return;
  var href = new URL(${JSON.stringify(href)}, document.baseURI).href;
  document.querySelectorAll('link[rel~="stylesheet"]').forEach(function (link) {
    if (link.href !== href) return;
    var disable = function () { if (link.sheet) link.sheet.disabled = true; };
    if (link.sheet) disable();
    else link.addEventListener("load", disable, { once: true });
  });
})();
`;
}
