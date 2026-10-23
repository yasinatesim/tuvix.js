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
 * Creates a proxy window that intercepts property access.
 * Writes and `Object.defineProperty` calls go to a separate store
 * (fakeWindow); reads check that store first, then fall through to the
 * real window. Sandboxed code never writes to or deletes from the real
 * `window` through the proxy.
 *
 * With `strict`, writing a global that is not in the built-in allowlist or
 * `allowedGlobals` throws a `TypeError` and stores nothing.
 *
 * The proxy only covers code that reaches globals through it, such as
 * `execScript`. It does not patch timers, event listeners, or scripts loaded
 * with `<script>` tags.
 *
 * @example
 * ```ts
 * const jsSandbox = new JsSandbox();
 * jsSandbox.activate();
 *
 * jsSandbox.execScript('window.myVar = 42');
 * // myVar is stored in fakeWindow, real window is untouched
 *
 * const strict = new JsSandbox(['myVar'], true);
 * strict.execScript('window.myVar = 1'); // allowed, stays on the proxy
 * strict.execScript('window.other = 1'); // throws TypeError
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
  /** Real-window functions bound once, so repeated reads return the same function. */
  private boundFunctions: WeakMap<object, unknown>;
  /** `with` target for `execScript`: claims every identifier, forwards to the proxy. */
  private scope: object;

  constructor(allowedGlobals: string[] = [], strict = false) {
    this._active = false;
    this.fakeWindow = new Map();
    this.strict = strict;
    this.addedProperties = new Set();
    this.boundFunctions = new WeakMap();

    this.allowedGlobals = new Set([...ALWAYS_ALLOWED, ...allowedGlobals]);

    this._proxyWindow = this.createProxy();
    const proxyWindow = this._proxyWindow;
    this.scope = new Proxy(Object.create(null) as object, {
      // Claim every identifier so sloppy-mode writes to undeclared names
      // reach the proxy instead of the real global object. Two exceptions:
      // `arguments` must stay the function's own, and `eval` must resolve to
      // the real %eval% so `eval(...)` stays a direct eval that sees this
      // scope. A bound eval from the proxy would run as global code.
      has: (_target, prop) => prop !== 'arguments' && prop !== 'eval',
      get: (_target, prop) =>
        prop === Symbol.unscopables
          ? undefined
          : Reflect.get(proxyWindow, prop),
      set: (_target, prop, value) => Reflect.set(proxyWindow, prop, value),
      deleteProperty: (_target, prop) =>
        Reflect.deleteProperty(proxyWindow, prop),
    });
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
   * Execute a classic (sloppy-mode) script string inside the sandbox.
   *
   * `window`, `self`, `globalThis` and top-level `this` resolve to the proxy,
   * and the code runs inside `with (scope)`, so free identifiers resolve
   * through the proxy too. `x = 1`, `var x = 1`, `window.x = 1` and the same
   * statements inside `eval("...")` store `x` on the proxy (and throw in
   * strict mode unless `x` is allowed). `let`/`const` stay local to the
   * script.
   *
   * Differences from a real global scope: reading an undeclared identifier
   * returns `undefined` instead of throwing a `ReferenceError`, and a
   * `"use strict"` directive in `code` has no effect (`with` needs sloppy
   * mode).
   *
   * Limit: inside a plain sloppy-mode function call such as `f()`, `this` is
   * the real global object, as JavaScript defines it. `this.x = 1` in such a
   * function writes to the real `window`. Use `window.x` instead.
   *
   * Uses `new Function`, so your CSP needs `unsafe-eval`.
   */
  execScript(code: string): unknown {
    const fn = new Function(
      'window',
      'self',
      'globalThis',
      '__tuvixScope__',
      `with (__tuvixScope__) {\n${code}\n}`
    );
    return fn.call(
      this._proxyWindow,
      this._proxyWindow,
      this._proxyWindow,
      this._proxyWindow,
      this.scope
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

    const assertWritable = (prop: PropertyKey): void => {
      if (
        sandbox.strict &&
        !(typeof prop === 'string' && sandbox.allowedGlobals.has(prop))
      ) {
        throw new TypeError(
          `[Tuvix Sandbox] Strict mode blocked write to global "${String(prop)}". Add it to allowedGlobals to permit it.`
        );
      }
    };

    const proxy = new Proxy(rawWindow, {
      get(_target: Window, prop: PropertyKey): unknown {
        // Check fakeWindow first
        if (sandbox.fakeWindow.has(prop)) {
          return sandbox.fakeWindow.get(prop);
        }

        // Fall through to real window
        const value: unknown = Reflect.get(rawWindow, prop);

        // `window.window.x = 1`, `top.x = 1` and friends must not escape to
        // the real window. In an iframe, `top`/`parent` stay the real ones.
        if (
          value === rawWindow ||
          prop === 'window' ||
          prop === 'self' ||
          prop === 'globalThis'
        ) {
          return proxy;
        }

        // Bind non-constructor functions (fetch, setTimeout, ...) to the real
        // window to avoid "Illegal invocation". Bind once per function.
        if (typeof value === 'function' && !value.prototype) {
          let bound = sandbox.boundFunctions.get(value);
          if (!bound) {
            bound = value.bind(rawWindow) as unknown;
            sandbox.boundFunctions.set(value, bound);
          }
          return bound;
        }

        return value;
      },

      // Writes always stay on the proxy, active or not: writing to the real
      // window would let any holder of proxyWindow pollute host globals.
      set(_target: Window, prop: PropertyKey, value: unknown): boolean {
        assertWritable(prop);
        sandbox.fakeWindow.set(prop, value);
        sandbox.addedProperties.add(prop);
        return true;
      },

      // Without this trap Object.defineProperty(proxyWindow, ...) would
      // define the property on the real window. The proxy stores plain
      // values only, so it rejects accessors and non-configurable properties
      // (the Proxy invariants forbid reporting those for a property the real
      // window lacks).
      defineProperty(
        _target: Window,
        prop: PropertyKey,
        descriptor: PropertyDescriptor
      ): boolean {
        assertWritable(prop);
        if (descriptor.get || descriptor.set) {
          throw new TypeError(
            `[Tuvix Sandbox] Cannot define accessor global "${String(prop)}" in the sandbox.`
          );
        }
        if (descriptor.configurable === false) {
          throw new TypeError(
            `[Tuvix Sandbox] Cannot define non-configurable global "${String(prop)}" in the sandbox.`
          );
        }
        // A partial descriptor ({ enumerable: false }) keeps the current value.
        if ('value' in descriptor || !sandbox.fakeWindow.has(prop)) {
          sandbox.fakeWindow.set(prop, descriptor.value);
        }
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
