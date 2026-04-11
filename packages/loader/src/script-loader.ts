// In-memory caches for loaded resources — O(1) deduplication vs O(n) DOM scan.
// These stay in sync with the DOM via removeScript / removeStyle.
const _loadedScripts = new Set<string>();
const _loadedStyles = new Set<string>();
const _prefetchedResources = new Set<string>();

/**
 * Load a JavaScript file by appending a <script> tag.
 */
export function loadScript(url: string, integrity?: string): Promise<void> {
  if (_loadedScripts.has(url)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // Unambiguous ES module extensions must be loaded as type="module".
    // Plain .js is intentionally excluded — it is assumed to be a UMD/IIFE bundle
    // that relies on the window global-key detection fallback in resolveModule.
    // NOTE: type="module" scripts run in strict module scope, so the UMD var-based
    // global fallback will NOT work for them. Consumers must register via
    // window.__TUVIX_MODULES__[name] when loading ES module format files.
    const isEsModule = /\.(tsx?|mts|mjs|jsx)(\?.*)?$/.test(url);
    script.type = isEsModule ? 'module' : 'text/javascript';
    script.src = url;
    script.crossOrigin = 'anonymous';
    if (integrity) {
      script.integrity = integrity;
    }

    script.onload = () => {
      _loadedScripts.add(url);
      resolve();
    };
    script.onerror = () =>
      reject(new Error(`[Tuvix Loader] Failed to load script: ${url}`));

    document.head.appendChild(script);
  });
}

/**
 * Load a CSS file by appending a <link> tag.
 */
export function loadStyle(url: string, timeoutMs = 10000): Promise<void> {
  if (_loadedStyles.has(url)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    link.crossOrigin = 'anonymous';

    const timer = setTimeout(() => {
      link.remove();
      reject(new Error(`[Tuvix Loader] Style load timed out: ${url}`));
    }, timeoutMs);

    link.onload = () => {
      clearTimeout(timer);
      _loadedStyles.add(url);
      resolve();
    };
    link.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`[Tuvix Loader] Failed to load style: ${url}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Remove a loaded script tag
 */
export function removeScript(url: string): void {
  _loadedScripts.delete(url);
  const scripts = document.querySelectorAll(`script[src="${CSS.escape(url)}"]`);
  scripts.forEach((s) => s.remove());
}

/**
 * Remove a loaded style tag
 */
export function removeStyle(url: string): void {
  _loadedStyles.delete(url);
  const links = document.querySelectorAll(`link[href="${CSS.escape(url)}"]`);
  links.forEach((l) => l.remove());
}

/**
 * Prefetch a resource using <link rel="prefetch">
 */
export function prefetchResource(url: string): void {
  if (_prefetchedResources.has(url)) return;
  _prefetchedResources.add(url);

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = url.endsWith('.css') ? 'style' : 'script';
  document.head.appendChild(link);
}
