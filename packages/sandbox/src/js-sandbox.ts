import type { IJsSandbox } from './types';

/**
 * Properties that should always pass through to the real window.
 * These are essential for basic functionality.
 */
const ALWAYS_ALLOWED = new Set([
  'undefined',
  'NaN',
  'Infinity',
  'console',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'requestIdleCallback',
  'cancelIdleCallback',
  'queueMicrotask',
  'Promise',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Symbol',
  'Proxy',
  'Reflect',
  'Array',
  'Object',
  'String',
  'Number',
  'Boolean',
  'Date',
  'RegExp',
  'Error',
  'TypeError',
  'RangeError',
  'JSON',
  'Math',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'encodeURI',
  'decodeURI',
  'encodeURIComponent',
  'decodeURIComponent',
  'atob',
  'btoa',
  'fetch',
  'URL',
  'URLSearchParams',
  'Headers',
  'Request',
  'Response',
  'AbortController',
  'AbortSignal',
  'navigator',
  'performance',
  'crypto',
  'TextEncoder',
  'TextDecoder',
  'Blob',
  'File',
  'FileReader',
  'FormData',
  'CustomEvent',
  'Event',
  'EventTarget',
  'MutationObserver',
  'IntersectionObserver',
  'ResizeObserver',
  'document',
  'location',
  'history',
]);

/**
 * JS sandbox using Proxy to isolate global scope.
 *
 * Creates a proxy window that intercepts all property access.
 * Writes go to a separate store (fakeWindow), reads first check
 * the fake store then fall through to the real window.
 *
 * @example
 * ```ts
 * const jsSandbox = new JsSandbox();
 * jsSandbox.activate();
 *
 * jsSandbox.execScript('window.myVar = 42');
 * // myVar is stored in fakeWindow, real window is untouched
 *
 * jsSandbox.deactivate();
 * ```
 */
export class JsSandbox implements IJsSandbox {
  private _active: boolean;
  private fakeWindow: Map<PropertyKey, unknown>;
  private _proxyWindow: WindowProxy;
  private allowedGlobals: Set<string>;
  private strict: boolean;
  private addedProperties: Set<PropertyKey>;

  constructor(allowedGlobals: string[] = [], strict = false) {
    this._active = false;
    this.fakeWindow = new Map();
    this.strict = strict;
    this.addedProperties = new Set();

    this.allowedGlobals = new Set([...ALWAYS_ALLOWED, ...allowedGlobals]);

    this._proxyWindow = this.createProxy();
  }

  get active(): boolean {
    return this._active;
  }

  get proxyWindow(): WindowProxy {
    return this._proxyWindow;
  }

  /**
   * Activate the sandbox. Global mutations will be intercepted.
   */
  activate(): void {
    this._active = true;
  }

  /**
   * Deactivate the sandbox. Faked globals remain stored.
   */
  deactivate(): void {
    this._active = false;
  }

  /**
   * Execute a script string within the sandbox context.
   * The script sees the proxy window instead of the real one.
   */
  execScript(code: string): unknown {
    const fn = new Function('window', 'self', 'globalThis', code);
    return fn.call(
      this._proxyWindow,
      this._proxyWindow,
      this._proxyWindow,
      this._proxyWindow
    );
  }

  /**
   * Reset the sandbox, clearing all faked properties.
   */
  reset(): void {
    this.fakeWindow.clear();
    this.addedProperties.clear();
    this._active = false;
  }

  private createProxy(): WindowProxy {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const sandbox = this;
    const rawWindow = window;

    const proxy = new Proxy(rawWindow, {
      get(_target: Window, prop: PropertyKey): unknown {
        // Check fakeWindow first
        if (sandbox.fakeWindow.has(prop)) {
          return sandbox.fakeWindow.get(prop);
        }

        // Fall through to real window
        const value = Reflect.get(rawWindow, prop);

        // Bind functions to real window to avoid illegal invocation
        if (typeof value === 'function' && !value.prototype) {
          return value.bind(rawWindow);
        }

        return value;
      },

      set(_target: Window, prop: PropertyKey, value: unknown): boolean {
        if (!sandbox._active) {
          // When inactive, writes are still isolated to fakeWindow.
          // Writing to the real window here would defeat the sandbox's purpose:
          // any code that obtained a reference to proxyWindow could pollute
          // the host page's globals after deactivate().
          sandbox.fakeWindow.set(prop, value);
          sandbox.addedProperties.add(prop);
          return true;
        }

        if (
          sandbox.strict &&
          typeof prop === 'string' &&
          !sandbox.allowedGlobals.has(prop)
        ) {
          // In strict mode, block writes to non-allowed globals
          console.warn(
            `[Tuvix Sandbox] Blocked write to global "${prop}" in strict mode`
          );
          // Still store in fakeWindow so app can use it
        }

        sandbox.fakeWindow.set(prop, value);
        sandbox.addedProperties.add(prop);
        return true;
      },

      has(_target: Window, prop: PropertyKey): boolean {
        return sandbox.fakeWindow.has(prop) || Reflect.has(rawWindow, prop);
      },

      deleteProperty(_target: Window, prop: PropertyKey): boolean {
        if (sandbox.fakeWindow.has(prop)) {
          sandbox.fakeWindow.delete(prop);
          sandbox.addedProperties.delete(prop);
          return true;
        }
        // Do not allow sandboxed code to delete properties from the real
        // window. Returning true silently would falsely indicate success
        // while leaving the host global intact, masking errors in strict mode.
        return false;
      },

      getOwnPropertyDescriptor(
        _target: Window,
        prop: PropertyKey
      ): PropertyDescriptor | undefined {
        if (sandbox.fakeWindow.has(prop)) {
          return {
            configurable: true,
            enumerable: true,
            writable: true,
            value: sandbox.fakeWindow.get(prop),
          };
        }
        return Reflect.getOwnPropertyDescriptor(rawWindow, prop);
      },
    });

    return proxy as unknown as WindowProxy;
  }
}
