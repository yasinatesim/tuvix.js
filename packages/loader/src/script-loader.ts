/**
 * Load a JavaScript file by appending a <script> tag.
 */
export function loadScript(url: string, integrity?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const scripts = document.querySelectorAll('script[src]');
    for (const s of Array.from(scripts)) {
      if (s.getAttribute('src') === url) {
        resolve();
        return;
      }
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.crossOrigin = 'anonymous';
    if (integrity) {
      script.integrity = integrity;
    }

    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error(`[Tuvix Loader] Failed to load script: ${url}`));

    document.head.appendChild(script);
  });
}

/**
 * Load a CSS file by appending a <link> tag.
 */
export function loadStyle(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const links = document.querySelectorAll('link[href]');
    for (const l of Array.from(links)) {
      if (l.getAttribute('href') === url) {
        resolve();
        return;
      }
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    link.crossOrigin = 'anonymous';

    link.onload = () => resolve();
    link.onerror = () =>
      reject(new Error(`[Tuvix Loader] Failed to load style: ${url}`));

    document.head.appendChild(link);
  });
}

/**
 * Remove a loaded script tag
 */
export function removeScript(url: string): void {
  const scripts = document.querySelectorAll('script[src]');
  for (const script of Array.from(scripts)) {
    if (script.getAttribute('src') === url) {
      script.remove();
      return;
    }
  }
}

/**
 * Remove a loaded style tag
 */
export function removeStyle(url: string): void {
  const links = document.querySelectorAll('link[href]');
  for (const link of Array.from(links)) {
    if (link.getAttribute('href') === url) {
      link.remove();
      return;
    }
  }
}

/**
 * Prefetch a resource using <link rel="prefetch">
 */
export function prefetchResource(url: string): void {
  const links = document.querySelectorAll('link[rel="prefetch"][href]');
  for (const link of Array.from(links)) {
    if (link.getAttribute('href') === url) return;
  }

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = url.endsWith('.css') ? 'style' : 'script';
  document.head.appendChild(link);
}
