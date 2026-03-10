/**
 * Sandbox configuration options
 */
export interface SandboxOptions {
  /** Enable CSS isolation via Shadow DOM (default: true) */
  css?: boolean;

  /** Enable JS isolation via Proxy (default: true) */
  js?: boolean;

  /** Allow specific globals to pass through JS sandbox */
  allowedGlobals?: string[];

  /** Enable strict mode — block all writes to real window (default: false) */
  strict?: boolean;
}

/**
 * CSS sandbox interface
 */
export interface ICssSandbox {
  /** Wrap a container element in Shadow DOM */
  wrap(container: HTMLElement): ShadowRoot;

  /** Inject a stylesheet into the shadow root */
  addStyle(shadowRoot: ShadowRoot, css: string): HTMLStyleElement;

  /** Remove a stylesheet from the shadow root */
  removeStyle(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement): void;

  /** Remove the Shadow DOM wrapper, restore original container */
  unwrap(container: HTMLElement): void;
}

/**
 * JS sandbox interface
 */
export interface IJsSandbox {
  /** Activate the sandbox — subsequent global accesses go through proxy */
  activate(): void;

  /** Deactivate the sandbox — restore original window */
  deactivate(): void;

  /** Execute a script string within the sandbox context */
  execScript(code: string): unknown;

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

  /** Activate all isolation layers */
  activate(container: HTMLElement): ShadowRoot;

  /** Deactivate all isolation layers */
  deactivate(container: HTMLElement): void;

  /** Destroy the sandbox and clean up all resources */
  destroy(container: HTMLElement): void;
}
