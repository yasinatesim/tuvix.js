/**
 * Sandbox configuration options
 */
export interface SandboxOptions {
  /** Isolate CSS in a Shadow DOM (default: true). With `false`, no shadow root is attached. */
  css?: boolean;

  /** Isolate global writes via a Proxy window (default: true) */
  js?: boolean;

  /**
   * Extra global names that strict mode lets sandboxed code assign.
   * Writes to them still land on the proxy, never on the real `window`.
   */
  allowedGlobals?: string[];

  /**
   * Throw a `TypeError` when sandboxed code assigns or defines a global that is
   * not in `allowedGlobals` or the built-in allowlist (default: false).
   * Without strict mode those writes are kept on the proxy.
   */
  strict?: boolean;
}

/**
 * Stylesheets to place inside a shadow root with `adoptStyles`.
 */
export interface AdoptStylesOptions {
  /** Stylesheet URLs, inserted as `<link rel="stylesheet">` in order. */
  urls?: readonly string[];

  /** CSS source, inserted as `<style>` elements after the links. */
  cssText?: string | readonly string[];
}

/**
 * Handle returned by `adoptStyles`.
 */
export interface AdoptedStyles {
  /** Elements this call inserted. URLs that were already adopted are not repeated. */
  readonly elements: readonly HTMLElement[];

  /** Resolves when every adopted `<link>` fires `load` or `error`. Never rejects. */
  readonly ready: Promise<void>;

  /** Remove the elements this call inserted. */
  remove(): void;
}

/**
 * CSS sandbox interface
 */
export interface ICssSandbox {
  /** Move the container's children into its (new or reused) open shadow root */
  wrap(container: HTMLElement): ShadowRoot;

  /** Inject a stylesheet into the shadow root */
  addStyle(shadowRoot: ShadowRoot, css: string): HTMLStyleElement;

  /** Remove a stylesheet from the shadow root */
  removeStyle(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement): void;

  /** Insert an app's stylesheet URLs and CSS text at the start of the shadow root */
  adoptStyles(
    shadowRoot: ShadowRoot,
    styles: AdoptStylesOptions
  ): AdoptedStyles;

  /** Move content back to the light DOM; the shadow root stays and renders it through a `<slot>` */
  unwrap(container: HTMLElement): void;
}

/**
 * JS sandbox interface
 */
export interface IJsSandbox {
  /** Mark the sandbox active */
  activate(): void;

  /** Mark the sandbox inactive. Faked globals stay stored. */
  deactivate(): void;

  /** Execute a script string with `window`, `self` and `globalThis` bound to the proxy */
  execScript(code: string): unknown;

  /** Reset the sandbox, clearing all faked properties */
  reset(): void;

  /** Check if sandbox is currently active */
  readonly active: boolean;

  /** Get the proxy window object */
  readonly proxyWindow: WindowProxy;
}

/**
 * Combined sandbox interface
 */
export interface ISandbox {
  /** CSS isolation controls */
  readonly css: ICssSandbox;

  /** JS isolation controls */
  readonly js: IJsSandbox;

  /** Activate all isolation layers. Returns the shadow root, or `null` when CSS isolation is off. */
  activate(container: HTMLElement): ShadowRoot | null;

  /** Deactivate all isolation layers */
  deactivate(container: HTMLElement): void;

  /** Destroy the sandbox and clean up all resources */
  destroy(container: HTMLElement): void;
}
