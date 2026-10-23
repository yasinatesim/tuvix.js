/**
 * Options for {@link interceptLinks}.
 *
 * @example
 * ```ts
 * import { interceptLinks, type InterceptLinksOptions } from '@tuvix.js/router';
 *
 * const options: InterceptLinksOptions = {
 *   navigate: (path) => history.pushState(null, '', path),
 *   base: '/app',
 * };
 * const stop = interceptLinks(options);
 * ```
 */
export interface InterceptLinksOptions {
  /**
   * Called with the link's path (`pathname + search + hash`, with `base`
   * removed) after the default navigation was prevented. Errors and rejected
   * promises are logged to the console.
   */
  navigate: (path: string, event: MouseEvent) => void | Promise<void>;

  /** Element or document to listen on. Defaults to `document`. */
  root?: Document | HTMLElement;

  /**
   * Base path the app is served under, e.g. `'/app'`. Links outside it are
   * left to the browser, and the base is stripped before `navigate` and
   * `prefetch` see the path. Defaults to `'/'`.
   */
  base?: string;

  /**
   * Extra filter, run after the built-in checks. Return `false` to let the
   * browser handle the click.
   */
  shouldIntercept?: (
    anchor: HTMLAnchorElement,
    url: URL,
    event: MouseEvent
  ) => boolean;

  /**
   * Called when the pointer enters or focus lands on an eligible link, at
   * most once per path (`pathname + search`). Use it to warm up the next page.
   */
  prefetch?: (path: string, anchor: HTMLAnchorElement) => void;
}

/**
 * A link found by {@link resolveLink}.
 */
export interface ResolvedLink {
  /** The `<a>` element. */
  anchor: HTMLAnchorElement;
  /** Absolute URL of the link. */
  url: URL;
  /** `pathname + search + hash`, with `base` removed. */
  path: string;
}

/**
 * Options for {@link resolveLink}.
 */
export interface ResolveLinkOptions {
  /** Base path the app is served under. Links outside it resolve to `null`. */
  base?: string;
}

/**
 * Nearest HTML `<a href>` on the event path. Follows the composed path, so a
 * link inside an open shadow root is found from a listener on `document`.
 * SVG `<a>` elements end the search: their `href` is not a URL string.
 */
function findAnchor(event: Event): HTMLAnchorElement | null {
  const path = event.composedPath();
  if (path.length === 0) {
    // Not dispatched yet: no composed path, so walk up from the target.
    const target = event.target;
    const link = target instanceof Element ? target.closest('a') : null;
    return link instanceof HTMLAnchorElement && link.hasAttribute('href')
      ? link
      : null;
  }
  for (const node of path) {
    if (node instanceof HTMLAnchorElement) {
      return node.hasAttribute('href') ? node : null;
    }
    if (node instanceof Element && node.localName === 'a') return null;
  }
  return null;
}

function normalizeBase(base: string | undefined): string {
  if (!base || base === '/') return '';
  const withSlash = base.startsWith('/') ? base : '/' + base;
  return withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
}

/**
 * Find the same-origin `<a href>` an event happened on and return its
 * app-relative path. Returns `null` when the browser should handle the link:
 * no HTML anchor on the event path (SVG `<a>` included), a `target` other
 * than `_self`, `download`, a `rel` containing the word `external`,
 * `data-tuvix-reload`, another origin, or a path outside `base`.
 *
 * `interceptLinks` and the orchestrator's hover prefetch both use it.
 *
 * @example
 * ```ts
 * import { resolveLink } from '@tuvix.js/router';
 *
 * document.addEventListener('focusin', (event) => {
 *   const link = resolveLink(event, { base: '/app' });
 *   if (link) console.log('next page might be', link.path);
 * });
 * ```
 */
export function resolveLink(
  event: Event,
  options: ResolveLinkOptions = {}
): ResolvedLink | null {
  if (typeof window === 'undefined') return null;
  const anchor = findAnchor(event);
  if (!anchor) return null;

  const target = anchor.getAttribute('target');
  if (target && target !== '_self') return null;
  if (anchor.hasAttribute('download')) return null;
  if (anchor.hasAttribute('data-tuvix-reload')) return null;
  const rel = anchor.getAttribute('rel');
  if (rel && rel.split(/\s+/).includes('external')) return null;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;

  const base = normalizeBase(options.base);
  let pathname = url.pathname;
  if (base) {
    if (pathname !== base && !pathname.startsWith(base + '/')) return null;
    pathname = pathname.slice(base.length) || '/';
  }
  return { anchor, url, path: pathname + url.search + url.hash };
}

/**
 * Turn same-origin `<a href>` clicks into client-side navigations.
 *
 * A click is intercepted only when all of these hold:
 * - primary button, no Ctrl/Meta/Shift/Alt, and no earlier handler called
 *   `preventDefault()`
 * - the link has no `target` other than `_self`, no `download`, no
 *   `rel="external"` and no `data-tuvix-reload` attribute
 * - the URL has the page's origin and lies under `base`
 * - it is not a hash-only change on the current path (the browser scrolls)
 * - `shouldIntercept` does not return `false`
 *
 * Returns a function that removes every listener.
 *
 * @example
 * ```ts
 * import { createRouter, interceptLinks } from '@tuvix.js/router';
 *
 * const router = createRouter({ routes: [] });
 * const stop = interceptLinks({
 *   navigate: (path) => router.push(path),
 *   prefetch: (path) => console.log('warm up', path),
 * });
 * // later: stop();
 * ```
 */
export function interceptLinks(options: InterceptLinksOptions): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return () => {};
  }

  const root = options.root ?? document;
  const resolveOptions: ResolveLinkOptions = { base: options.base };
  const prefetched = new Set<string>();

  const onClick = (event: Event): void => {
    const mouse = event as MouseEvent;
    if (
      mouse.defaultPrevented ||
      mouse.button !== 0 ||
      mouse.metaKey ||
      mouse.ctrlKey ||
      mouse.shiftKey ||
      mouse.altKey
    ) {
      return;
    }

    const resolved = resolveLink(mouse, resolveOptions);
    if (!resolved) return;

    const { anchor, url, path } = resolved;
    const here = window.location;
    if (
      url.hash !== '' &&
      url.pathname === here.pathname &&
      url.search === here.search
    ) {
      return;
    }

    if (options.shouldIntercept?.(anchor, url, mouse) === false) return;

    mouse.preventDefault();
    try {
      const result = options.navigate(path, mouse);
      if (result && typeof result.then === 'function') {
        result.then(undefined, (error: unknown) => {
          console.error('[Tuvix Router] Link navigation failed:', error);
        });
      }
    } catch (error) {
      console.error('[Tuvix Router] Link navigation failed:', error);
    }
  };

  const onIntent = (event: Event): void => {
    const prefetch = options.prefetch;
    if (!prefetch) return;
    const resolved = resolveLink(event, resolveOptions);
    if (!resolved) return;

    const hashIndex = resolved.path.indexOf('#');
    const key =
      hashIndex === -1 ? resolved.path : resolved.path.slice(0, hashIndex);
    if (prefetched.has(key)) return;
    prefetched.add(key);
    try {
      prefetch(key, resolved.anchor);
    } catch (error) {
      console.error('[Tuvix Router] Link prefetch failed:', error);
    }
  };

  root.addEventListener('click', onClick);
  if (options.prefetch) {
    // pointerenter does not bubble; capture sees it for every element entered.
    root.addEventListener('pointerenter', onIntent, true);
    root.addEventListener('focusin', onIntent);
  }

  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('pointerenter', onIntent, true);
    root.removeEventListener('focusin', onIntent);
  };
}
