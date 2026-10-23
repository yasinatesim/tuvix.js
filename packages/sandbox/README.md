# @tuvix.js/sandbox

> Shadow DOM CSS isolation that survives remounts, stylesheet adoption, and a Proxy window for script globals

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework. Full docs: [tuvix.js.org/packages/sandbox](https://tuvix.js.org/packages/sandbox).

`CssSandbox` moves a micro app's DOM into an open shadow root so its CSS and the page's CSS stay apart. The orchestrator in `@tuvix.js/core` uses it when you register an app with `sandbox: true`. `JsSandbox` keeps `window.x = ...` writes from code you run through it off the real `window`. It is a Proxy, not a security boundary; use an `<iframe sandbox>` for untrusted code.

## Installation

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Quick start

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container); // ShadowRoot, or null with css: false
sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox(options?)` and `Sandbox`

`createSandbox(options)` returns `new Sandbox(options)` typed as `ISandbox`.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` wraps the container in a shadow root. `false`: `activate` returns `null`, attaches nothing. |
| `js` | `boolean` | `true` | `activate`/`deactivate` toggle `js.active`. The proxy keeps writes off `window` either way. |
| `allowedGlobals` | `string[]` | `[]` | Names strict mode lets sandboxed code assign (still stored on the proxy). |
| `strict` | `boolean` | `false` | Throw a `TypeError` on writes or `defineProperty` of globals outside the allowlist and `allowedGlobals`. |

Members: `css` (`CssSandbox`), `js` (`JsSandbox`), `activate(container): ShadowRoot | null`, `deactivate(container)`, `destroy(container)` (deactivate, then clear stored globals).

### `CssSandbox`

| Method | Behaviour |
| --- | --- |
| `wrap(container)` | Moves children into an open shadow root. Reuses `container.shadowRoot` when one exists (earlier `wrap`, `unwrap`, another instance), removes the slot `unwrap` left and puts the set-aside stylesheets back in order. Throws only if `attachShadow` fails. |
| `unwrap(container)` | Moves children back to the light DOM, takes `<style>` and `<link rel="stylesheet">` (from `addStyle`, `adoptStyles` or the app) out of the DOM and keeps them for the next `wrap`, leaves a `<slot>` so the children render. No-op for containers this instance did not wrap. |
| `addStyle(shadowRoot, css)` | Appends a `<style>`, returns it. |
| `removeStyle(shadowRoot, styleEl)` | Removes `styleEl`. While unwrapped, the next `wrap` does not restore it. |
| `adoptStyles(shadowRoot, { urls?, cssText? })` | Inserts `<link>`s then `<style>`s at the start of the shadow root, after earlier adopted styles. Skips URLs already adopted, including set-aside links. Returns `{ elements, ready, remove }`. |

`ready` resolves once each link fires `load` or `error` and never rejects. jsdom fires neither, so do not await it in jsdom tests. `remove()` removes only that call's elements; while unwrapped, they do not come back on the next `wrap`.

### `JsSandbox`

`new JsSandbox(allowedGlobals = [], strict = false)`.

| Member | Behaviour |
| --- | --- |
| `proxyWindow` | Proxy over `window`. Reads check the sandbox store, then the real `window` (functions bound once). `window`, `self`, `globalThis`, and `top`/`parent`/`frames` outside an iframe return the proxy. Writes and `Object.defineProperty` go to the store; a descriptor without `value` keeps the stored value. Accessor and non-configurable descriptors throw a `TypeError`. |
| `execScript(code)` | Runs `code` as a sloppy-mode script inside `with (scope)`. `window`, `self`, `globalThis` and top-level `this` are the proxy, and free identifiers resolve through it. `eval("...")` stays a direct eval inside that scope. |
| `activate()`, `deactivate()`, `active` | A flag. It does not change how the proxy behaves. |
| `reset()` | Clears stored globals, sets `active` to `false`. |

Strict mode throws `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "x". Add it to allowedGlobals to permit it.` for an assignment, top-level `var x = 1` or `defineProperty` of a name outside the allowlist, and stores nothing, active or not.

### Types

`SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles`.

## Edge cases

- In `execScript`, `x = 1`, `var x = 1`, `window.x = 1`, `window.window.x = 1`, `top.x = 1` and the same statements inside `eval("...")` store `x` on the proxy, never on the real `window`. `let`/`const` stay local.
- Reading an undeclared identifier in `execScript` returns `undefined` instead of throwing, and `"use strict"` in `code` has no effect.
- Inside a plain function call such as `f()`, `this` is the real global object, as sloppy-mode JavaScript defines it. `this.x = 1` there writes to the real `window`; write `window.x = 1` instead.
- `execScript` uses `new Function`; your CSP needs `'unsafe-eval'`.
- `JsSandbox`, `Sandbox` and `createSandbox()` read `window` in the constructor and throw on the server.
- Light DOM children added while the container is wrapped do not render. Append into the shadow root.

## What it does not do

- It does not patch timers, event listeners, `document` or `<script>` tags, and it does not clean up what an app leaves behind.
- It does not give code its own origin or global object.
- It does not stop inherited styles (`color`, fonts, custom properties) from reaching the shadow root.

## Migrating from 0.4

- `Sandbox({ css: false }).activate()` returns `null` and attaches no shadow root. `ISandbox.activate` returns `ShadowRoot | null`.
- `strict: true` throws on blocked writes instead of warning.
- `execScript` runs code in a `with` block: no strict-mode code, undeclared reads return `undefined`, bare `x = 1` stays on the proxy.
- `unwrap` keeps stylesheets for the next `wrap` instead of deleting them.

## License

MIT
