import type { ScriptType } from './types';

/** Options shared by {@link loadScript} and {@link loadStyle}. */
export interface ResourceOptions {
  /** Subresource integrity hash, written to the tag's `integrity` attribute. */
  integrity?: string;
  /**
   * Stops waiting when aborted. The tag is removed once no other caller waits for the same URL.
   */
  signal?: AbortSignal;
}

/** Options for {@link loadScript}. */
export interface LoadScriptOptions extends ResourceOptions {
  /** Overrides the type inferred from the URL extension. */
  type?: ScriptType;
}

/** Options for {@link loadStyle}. */
export interface LoadStyleOptions extends ResourceOptions {
  /** Fails the load after this many ms. Default 10000. */
  timeout?: number;
}

/** Options for {@link prefetchResource}. */
export interface PrefetchOptions {
  /** Resource kind. Defaults to `style` for `.css` URLs and `script` otherwise. */
  as?: 'script' | 'style';
  /** Script type. Module scripts get `<link rel="modulepreload">`. */
  type?: ScriptType;
  integrity?: string;
}

interface Resource {
  element: HTMLElement;
  promise: Promise<void>;
  loaded: boolean;
  waiters: number;
  fail: (error: Error) => void;
  /** Window keys that first appeared when this script ran (scripts only). */
  globals: string[];
}

// One entry per URL while it loads and after it loaded. A failed, aborted or
// removed load deletes its entry and its tag, so the next call starts fresh.
const _scripts = new Map<string, Resource>();
const _styles = new Map<string, Resource>();
const _prefetched = new Set<string>();

// Window keys seen so far. A browser runs a script and fires its `load` event in
// one task, so keys that are new at a script's `load` event belong to that script,
// even when several scripts load at the same time.
let _knownGlobals: Set<string> | undefined;
// Globals of removed scripts that still exist, with the value they had then.
const _reassignable = new Map<string, unknown>();

function takeNewGlobals(): string[] {
  const win = window as unknown as Record<string, unknown>;
  const known = (_knownGlobals ??= new Set(Object.keys(win)));
  const added: string[] = [];
  for (const key of Object.keys(win)) {
    if (!known.has(key)) {
      known.add(key);
      added.push(key);
    }
  }
  for (const [key, value] of _reassignable) {
    if (win[key] !== value) {
      _reassignable.delete(key);
      added.push(key);
    }
  }
  return added;
}

/**
 * Window keys that first appeared when the script at `url` ran. Empty until it loads.
 * The module loader uses this to find UMD globals without guessing between parallel loads.
 */
export function getScriptGlobals(url: string): string[] {
  const resource = _scripts.get(url);
  return resource?.loaded ? resource.globals : [];
}

const MODULE_EXTENSION = /\.(tsx?|mts|mjs|jsx)(?:[?#].*)?$/;
const STYLE_EXTENSION = /\.css(?:[?#].*)?$/;

/**
 * The script type used when an entry does not set one.
 * `.mjs`, `.mts`, `.ts`, `.tsx` and `.jsx` URLs are modules; everything else is classic.
 */
export function inferScriptType(url: string, type?: ScriptType): ScriptType {
  if (type) return type;
  return MODULE_EXTENSION.test(url) ? 'module' : 'classic';
}

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new Error('[Tuvix Loader] Load aborted');
}

function create(
  registry: Map<string, Resource>,
  url: string,
  element: HTMLScriptElement | HTMLLinkElement,
  timeoutMs = 0
): Resource {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let settle!: (error?: Error) => void;

  const isScript = element instanceof HTMLScriptElement;
  // Keys that appeared before this script count as someone else's.
  if (isScript) takeNewGlobals();

  const resource: Resource = {
    element,
    loaded: false,
    waiters: 0,
    globals: [],
    promise: new Promise<void>((resolve, reject) => {
      settle = (error) => {
        clearTimeout(timer);
        element.onload = null;
        element.onerror = null;
        if (error) {
          element.remove();
          if (registry.get(url) === resource) registry.delete(url);
          reject(error);
        } else {
          if (isScript) resource.globals = takeNewGlobals();
          resource.loaded = true;
          resolve();
        }
      };
    }),
    fail: (error) => settle(error),
  };
  // Waiters attach their own handlers; this keeps an unobserved failure quiet.
  resource.promise.catch(() => undefined);

  const kind = isScript ? 'script' : 'style';
  element.onload = () => settle();
  element.onerror = () =>
    settle(new Error(`[Tuvix Loader] Failed to load ${kind}: ${url}`));
  if (timeoutMs > 0) {
    timer = setTimeout(
      () => settle(new Error(`[Tuvix Loader] Style load timed out: ${url}`)),
      timeoutMs
    );
  }

  registry.set(url, resource);
  document.head.appendChild(element);
  return resource;
}

function wait(
  registry: Map<string, Resource>,
  resource: Resource,
  url: string,
  signal?: AbortSignal
): Promise<void> {
  if (resource.loaded) return Promise.resolve();

  // Every caller counts, so one caller aborting never removes a tag that
  // another caller still waits for.
  resource.waiters++;
  return new Promise<void>((resolve, reject) => {
    const onAbort = (): void => {
      resource.waiters--;
      if (resource.waiters === 0 && registry.get(url) === resource) {
        resource.fail(new Error(`[Tuvix Loader] Load aborted: ${url}`));
      }
      reject(abortReason(signal as AbortSignal));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    resource.promise.then(
      () => {
        signal?.removeEventListener('abort', onAbort);
        resource.waiters--;
        resolve();
      },
      (error) => {
        signal?.removeEventListener('abort', onAbort);
        resource.waiters--;
        reject(error);
      }
    );
  });
}

function toOptions<T extends ResourceOptions>(
  value: T | string | undefined
): T {
  return (
    typeof value === 'string' ? { integrity: value } : (value ?? {})
  ) as T;
}

/**
 * Load a JavaScript file by appending a `<script>` tag.
 *
 * Concurrent calls for one URL share a single tag. A failed load removes its tag,
 * so calling again retries with a fresh one. Pass an integrity string as the
 * second argument, or an options object.
 *
 * @example
 * ```ts
 * import { loadScript } from '@tuvix.js/loader';
 *
 * await loadScript('https://cdn.example.com/app.js', { type: 'module' });
 * ```
 */
export function loadScript(
  url: string,
  options?: LoadScriptOptions | string
): Promise<void> {
  const { type, integrity, signal } = toOptions<LoadScriptOptions>(options);
  if (signal?.aborted) return Promise.reject(abortReason(signal));

  let resource = _scripts.get(url);
  if (!resource) {
    const script = document.createElement('script');
    script.type =
      inferScriptType(url, type) === 'module' ? 'module' : 'text/javascript';
    script.src = url;
    script.crossOrigin = 'anonymous';
    if (integrity) script.integrity = integrity;
    resource = create(_scripts, url, script);
  }
  return wait(_scripts, resource, url, signal);
}

/**
 * Load a CSS file by appending a `<link rel="stylesheet">` tag.
 * Concurrent calls for one URL share a single tag; a failed or timed-out load removes it.
 * Pass the timeout in ms as the second argument, or an options object.
 *
 * @example
 * ```ts
 * import { loadStyle } from '@tuvix.js/loader';
 *
 * await loadStyle('https://cdn.example.com/app.css', { timeout: 5000 });
 * ```
 */
export function loadStyle(
  url: string,
  options?: LoadStyleOptions | number
): Promise<void> {
  const {
    timeout = 10000,
    integrity,
    signal,
  } = typeof options === 'number'
    ? { timeout: options }
    : toOptions<LoadStyleOptions>(options);
  if (signal?.aborted) return Promise.reject(abortReason(signal));

  let resource = _styles.get(url);
  if (!resource) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    link.crossOrigin = 'anonymous';
    if (integrity) link.integrity = integrity;
    resource = create(_styles, url, link, timeout);
  }
  return wait(_styles, resource, url, signal);
}

function removeResource(
  registry: Map<string, Resource>,
  url: string,
  selector: string,
  attribute: string
): void {
  const resource = registry.get(url);
  if (resource) {
    registry.delete(url);
    resource.element.remove();
    // If the script runs again, the globals it defines count as its own again:
    // a global that still exists counts once its value changes.
    const win = window as unknown as Record<string, unknown>;
    for (const key of resource.globals) {
      if (key in win) _reassignable.set(key, win[key]);
      else _knownGlobals?.delete(key);
    }
    if (!resource.loaded) {
      resource.fail(new Error(`[Tuvix Loader] Removed before load: ${url}`));
    }
  }
  document.querySelectorAll(selector).forEach((el) => {
    if (el.getAttribute(attribute) === url) el.remove();
  });
}

/**
 * Remove a script tag added by {@link loadScript}, so the next call loads it again.
 */
export function removeScript(url: string): void {
  removeResource(_scripts, url, 'script[src]', 'src');
}

/**
 * Remove a stylesheet added by {@link loadStyle}, so the next call loads it again.
 */
export function removeStyle(url: string): void {
  removeResource(_styles, url, 'link[rel="stylesheet"][href]', 'href');
}

/**
 * Hint the browser to download a resource without running it.
 * Module scripts get `<link rel="modulepreload">`; classic scripts and styles get
 * `<link rel="prefetch">`. URLs already loaded or prefetched are skipped.
 *
 * @example
 * ```ts
 * import { prefetchResource } from '@tuvix.js/loader';
 *
 * prefetchResource('https://cdn.example.com/app.js', { type: 'module' });
 * ```
 */
export function prefetchResource(
  url: string,
  options: PrefetchOptions = {}
): void {
  if (_prefetched.has(url) || _scripts.has(url) || _styles.has(url)) return;
  _prefetched.add(url);

  const as = options.as ?? (STYLE_EXTENSION.test(url) ? 'style' : 'script');
  const link = document.createElement('link');
  if (as === 'script' && inferScriptType(url, options.type) === 'module') {
    link.rel = 'modulepreload';
  } else {
    link.rel = 'prefetch';
    link.as = as;
  }
  link.href = url;
  // Must match the CORS mode of the tag that later loads it, or the browser fetches twice.
  link.crossOrigin = 'anonymous';
  if (options.integrity) link.integrity = options.integrity;
  document.head.appendChild(link);
}
