---
"@tuvix.js/sandbox": minor
---

Sandbox: CSS isolation survives remounts, `adoptStyles`, and a strict mode that blocks writes.

- `CssSandbox.wrap(container)` reuses `container.shadowRoot` when the element already has an open shadow root, whether it came from an earlier `wrap`, another `CssSandbox` instance, or an `unwrap`. Before, the second mount called `attachShadow` again and threw.
- `CssSandbox.unwrap(container)` moves the app's nodes back to the light DOM and leaves a `<slot>` in the shadow root, so you see them again. Before, the restored nodes stayed invisible behind a shadow root without a slot. `unwrap` takes `<style>` and `<link rel="stylesheet">` nodes (including ones from `addStyle` and `adoptStyles`) out of the DOM so the app's CSS stops applying, and the next `wrap` of that container puts them back in order. Before, `unwrap` deleted them, and a remounted app rendered unstyled. `removeStyle` or `adopted.remove()` while unwrapped keeps that stylesheet from coming back.
- New `CssSandbox.adoptStyles(shadowRoot, { urls, cssText })` inserts `<link rel="stylesheet">` and `<style>` elements at the start of the shadow root, skips URLs already adopted there, and returns `{ elements, ready, remove }`. `ready` resolves once each link fires `load` or `error`. jsdom fires neither, so do not await `ready` in jsdom tests. New exported types: `AdoptStylesOptions`, `AdoptedStyles`.
- `JsSandbox.execScript` runs the code inside `with (scope)`, so sloppy-mode `x = 1`, top-level `var x` and `window.window.x` store `x` on the proxy. Before, a bare assignment created a property on the real `window`. Reading an undeclared identifier now returns `undefined` instead of throwing `ReferenceError`, and a `"use strict"` directive in the script has no effect.
- `JsSandbox` with `strict: true` throws a `TypeError` when sandboxed code assigns, `var`-declares at the top level, or `Object.defineProperty`s a global outside the built-in allowlist and `allowedGlobals`, and stores nothing. Before, it logged a warning and stored the value anyway. The proxy still leaves timers, event listeners and `<script>`-loaded code alone; it isolates code that reads globals through `proxyWindow`, such as `execScript`.
- `Object.defineProperty(proxyWindow, ...)` now stores the value on the proxy. Before, the proxy had no `defineProperty` trap and the property landed on the real `window`. A descriptor without `value` (`{ enumerable: false }`) keeps the stored value. Accessor descriptors (`get`/`set`) and `configurable: false` throw a `TypeError`.
- `eval("...")` inside `execScript` stays a direct eval in the sandbox scope, so `eval("window.x = 1; var y = 2")` stores on the proxy (and throws in strict mode).
- `proxyWindow.window`, `.self`, `.globalThis`, and `.top`/`.parent`/`.frames` outside an iframe return the proxy, so `top.x = 1` stays in the sandbox.
- Known limit: inside a plain sloppy-mode function call such as `f()`, `this` is the real global object, as JavaScript defines it, so `this.x = 1` there writes to the real `window`. Top-level `this` in `execScript` is the proxy.
- Reading a real-window function such as `proxyWindow.fetch` twice returns the same bound function. The proxy binds each function once instead of on every read.

Breaking:

- `Sandbox({ css: false }).activate(container)` returns `null` and attaches no shadow root. Before, it attached one, which hid the container's children. `ISandbox.activate` now returns `ShadowRoot | null`.
- `JsSandbox` strict mode throws on blocked writes instead of warning.
- `execScript` code runs in a `with` block: it cannot be strict-mode code, and reading an undeclared identifier returns `undefined` instead of throwing.
