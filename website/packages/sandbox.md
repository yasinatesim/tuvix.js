---
title: '@tuvix.js/sandbox'
---

<PackageHeader
  name="@tuvix.js/sandbox"
  title="Sandbox"
  description="CSS isolation in a reusable Shadow DOM root, stylesheet adoption into that root, and a Proxy window that keeps script globals off the real window."
  icon="🔒"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## When to use it

Use `CssSandbox` when a micro app's CSS and the page's CSS must not touch each other. It moves the app's DOM into an open shadow root on the container, so the app's selectors stay inside and page selectors stay outside. The orchestrator in `@tuvix.js/core` does this for you when you register an app with `sandbox: true`. Call this package yourself when you mount apps without the orchestrator.

Use `JsSandbox` when you run third-party script text and want its global writes kept off the real `window`. You run the code through `execScript`, which resolves `window`, `this` and free identifiers through a Proxy. The orchestrator does not apply it.

Pick something else when you need hard isolation for untrusted code. An `<iframe>` with the `sandbox` attribute gives the code its own global object and origin; this package does not.

## Quick start

Through the orchestrator (CSS only):

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'cart',
  entry: { scripts: ['/apps/cart/main.js'], styles: ['/apps/cart/style.css'] },
  container: '#cart',
  activeWhen: '/cart/*',
  sandbox: true,
});

await orchestrator.start();
```

The orchestrator wraps `#cart` in a shadow root, renders the app into a `<div data-tuvix-sandbox-root="cart">` inside it, and loads `style.css` into the shadow root instead of `<head>`. Mount waits for those stylesheets, up to the loader `timeout` (10000 ms by default). The orchestrator reuses the shadow root when the app mounts again.

By hand:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container);
const target = shadowRoot ?? container;

const adopted = sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });
await adopted.ready;
target.append(Object.assign(document.createElement('p'), { textContent: 'Cart' }));

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox`

```ts
import type { ISandbox, SandboxOptions } from '@tuvix.js/sandbox';

declare function createSandbox(options?: SandboxOptions): ISandbox;
```

Returns `new Sandbox(options)`.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` wraps the container in a shadow root. With `false`, `activate` returns `null` and attaches nothing. |
| `js` | `boolean` | `true` | `activate`/`deactivate` toggle `sandbox.js.active`. The proxy at `sandbox.js.proxyWindow` keeps writes off the real `window` either way. |
| `allowedGlobals` | `string[]` | `[]` | Extra global names strict mode lets sandboxed code assign. Writes to them still land on the proxy. |
| `strict` | `boolean` | `false` | Throw a `TypeError` when sandboxed code assigns or defines a global outside the built-in allowlist and `allowedGlobals`. |

### `Sandbox`

```ts
import { Sandbox } from '@tuvix.js/sandbox';

const sandbox = new Sandbox({ css: false, js: true });
console.log(sandbox.activate(document.body)); // null
```

The class behind `createSandbox`. It implements `ISandbox`:

| Member | Signature | Behaviour |
| --- | --- | --- |
| `css` | `readonly ICssSandbox` | The `CssSandbox` instance it uses. |
| `js` | `readonly IJsSandbox` | The `JsSandbox` instance it uses. |
| `activate` | `(container: HTMLElement) => ShadowRoot \| null` | `css.wrap(container)` when `css` is on, then `js.activate()` when `js` is on. Returns the shadow root or `null`. |
| `deactivate` | `(container: HTMLElement) => void` | `js.deactivate()`, then `css.unwrap(container)`. |
| `destroy` | `(container: HTMLElement) => void` | `deactivate(container)`, then `js.reset()`, which clears every stored global. |

### `CssSandbox`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const container = document.querySelector<HTMLElement>('#widget')!;

const shadowRoot = cssSandbox.wrap(container);
const style = cssSandbox.addStyle(shadowRoot, ':host { display: block; } p { color: teal; }');
cssSandbox.unwrap(container); // the <style> leaves the DOM and waits for the next wrap
cssSandbox.removeStyle(shadowRoot, style); // removed for good: the next wrap does not restore it
```

| Method | Signature | Behaviour |
| --- | --- | --- |
| `wrap` | `(container: HTMLElement) => ShadowRoot` | Moves the container's children into an open shadow root and returns it. |
| `unwrap` | `(container: HTMLElement) => void` | Moves the children back to the light DOM, sets the shadow root's stylesheets aside and leaves a `<slot>` in the shadow root. |
| `addStyle` | `(shadowRoot: ShadowRoot, css: string) => HTMLStyleElement` | Appends a `<style>` with `css` to the end of the shadow root. |
| `removeStyle` | `(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement) => void` | Removes `styleEl`. When the host is unwrapped, it also drops `styleEl` from the set-aside list, so the next `wrap` does not restore it. |
| `adoptStyles` | `(shadowRoot: ShadowRoot, styles: AdoptStylesOptions) => AdoptedStyles` | Inserts `<link>` and `<style>` elements at the start of the shadow root. |

#### `wrap` and remounts

A DOM element cannot lose its shadow root once attached. `wrap` handles that:

1. If this `CssSandbox` instance already wrapped the container and has not unwrapped it, `wrap` returns the same shadow root and moves nothing.
2. If the container has an open `shadowRoot` (from an earlier `wrap`, an `unwrap`, or another `CssSandbox` instance), `wrap` removes the `<slot>` that `unwrap` left, puts back the stylesheets `unwrap` set aside (at the start, in their original order) and reuses the root.
3. Otherwise it calls `container.attachShadow({ mode: 'open' })`.

It then moves every light DOM child into the shadow root. `wrap` throws only when `attachShadow` fails, for example on an element that cannot host a shadow root (`<img>`, `<input>`) or one that already has a closed root: `[Tuvix Sandbox] Cannot attach Shadow DOM to <img>: ...`.

#### `unwrap` and the slot

`unwrap` moves the shadow root's children back into the container. It takes the `<style>` and `<link rel="stylesheet">` nodes out of the DOM, whether they came from `addStyle`, `adoptStyles` or the app, so the app's CSS stops applying and never reaches the page. It keeps them with the shadow root. The shadow root stays and holds one `<slot data-tuvix-sandbox-slot>`, so the browser renders the restored children through it. `unwrap` does nothing for a container this instance did not wrap.

The next `wrap` of that host, by this or any other `CssSandbox` instance, removes the slot, puts the set-aside stylesheets back in order and moves the children back in. You do not need to adopt styles again after a remount. Calling `removeStyle(shadowRoot, el)` or `adopted.remove()` while the host is unwrapped removes those sheets for good.

#### `adoptStyles`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const shadowRoot = cssSandbox.wrap(document.querySelector<HTMLElement>('#cart')!);

const adopted = cssSandbox.adoptStyles(shadowRoot, {
  urls: ['/apps/cart/style.css', '/shared/tokens.css'],
  cssText: ':host { display: block; }',
});

await adopted.ready; // every <link> fired load or error
console.log(adopted.elements.length); // 3

adopted.remove();
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `urls` | `readonly string[]` | `[]` | Each URL becomes a `<link rel="stylesheet" data-tuvix-style>`, in order. |
| `cssText` | `string \| readonly string[]` | none | Each string becomes a `<style data-tuvix-style>`, placed after the links. |

Behaviour:

- The elements go at the start of the shadow root, after styles adopted earlier, so app content and `addStyle` styles come later in the cascade.
- A URL already adopted into this shadow root is skipped and does not appear in `elements`. That includes links `unwrap` set aside. `ready` still waits for that existing link when an earlier call created it.
- `ready` resolves once each link fires `load` or `error`. It never rejects, so a 404 stylesheet does not block you. jsdom fires neither event, so do not await `ready` in jsdom tests.
- `remove()` removes only the elements this call inserted, including set-aside ones, so the next `wrap` does not restore them.

### `JsSandbox`

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const jsSandbox = new JsSandbox(['analyticsQueue'], true);
jsSandbox.activate();

jsSandbox.execScript('window.analyticsQueue = []'); // allowed, stored on the proxy
console.log('analyticsQueue' in window); // false
console.log(Reflect.get(jsSandbox.proxyWindow, 'analyticsQueue')); // []

try {
  jsSandbox.execScript('window.tracker = {}');
} catch (error) {
  console.log(error instanceof TypeError); // true
}

jsSandbox.reset();
```

Constructor: `new JsSandbox(allowedGlobals: string[] = [], strict = false)`.

| Member | Signature | Behaviour |
| --- | --- | --- |
| `proxyWindow` | `readonly WindowProxy` | Proxy over the real `window`. |
| `active` | `readonly boolean` | Flag set by `activate` and cleared by `deactivate`/`reset`. |
| `activate` | `() => void` | Sets `active` to `true`. |
| `deactivate` | `() => void` | Sets `active` to `false`. Stored globals stay. |
| `execScript` | `(code: string) => unknown` | Runs `code` as a sloppy-mode script inside `with (scope)` through `new Function`. `window`, `self`, `globalThis` and top-level `this` are the proxy, and free identifiers resolve through it. `eval("...")` stays a direct eval inside that scope. Returns what the code returns. |
| `reset` | `() => void` | Clears every stored global and sets `active` to `false`. |

The proxy:

- Reads check the sandbox's own store first, then fall through to the real `window`. Real-window functions without a `prototype` (`fetch`, `setTimeout`) come back bound to the real `window`, once per function, so `proxyWindow.fetch === proxyWindow.fetch`.
- `proxyWindow.window`, `.self`, `.globalThis`, and `.top`/`.parent`/`.frames` when the page is not in an iframe, return the proxy itself. In an iframe, `top` and `parent` stay the real ones.
- Assignments and `Object.defineProperty` store the value on the proxy. The real `window` never changes. A descriptor without `value` (`{ enumerable: false }`) keeps the stored value. Accessor descriptors (`get`/`set`) and `configurable: false` make `Object.defineProperty` throw a `TypeError`.
- `delete proxyWindow.x` removes a stored value. For a real-window property it returns `false`, which throws a `TypeError` in strict-mode code.
- `in` checks the store and the real `window`.

Strict mode (`strict: true`): an assignment (`window.x = 1` or a bare `x = 1`), a top-level `var x = 1` or an `Object.defineProperty` call for a name outside the built-in allowlist and `allowedGlobals` throws `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "tracker". Add it to allowedGlobals to permit it.` and stores nothing. The check runs whether the sandbox is active or not. Symbol keys always count as blocked. The built-in allowlist covers standard globals such as `console`, timers, `Promise`, `Map`, `JSON`, `fetch`, `URL`, `navigator`, `document`, `location` and `history`. Allowed writes, including writes to those names, stay on the proxy.

### Types

| Type | Meaning |
| --- | --- |
| `SandboxOptions` | `{ css?, js?, allowedGlobals?, strict? }`, the `createSandbox` options. |
| `ISandbox` | Interface `Sandbox` implements: `css`, `js`, `activate`, `deactivate`, `destroy`. |
| `ICssSandbox` | Interface `CssSandbox` implements. |
| `IJsSandbox` | Interface `JsSandbox` implements. |
| `AdoptStylesOptions` | `{ urls?, cssText? }` for `adoptStyles`. |
| `AdoptedStyles` | `{ elements, ready, remove }` returned by `adoptStyles`. |

## Edge cases

- Inside `execScript`, `x = 1`, top-level `var x = 1`, `window.x = 1`, `window.window.x = 1`, `top.x = 1` and the same statements inside `eval("...")` all store `x` on the proxy, never on the real `window`. `let` and `const` stay local to the script.
- Reading an undeclared identifier inside `execScript` returns `undefined` instead of throwing a `ReferenceError`, and a `"use strict"` directive in `code` has no effect, since `with` needs sloppy mode.
- Inside a plain function call such as `f()`, `this` is the real global object, as sloppy-mode JavaScript defines it. `this.x = 1` in such a function writes to the real `window`. Write `window.x = 1` in code you run through `execScript`.
- `execScript` uses `new Function`, so a Content Security Policy without `'unsafe-eval'` blocks it.
- Constructing `JsSandbox`, `Sandbox` or `createSandbox()` reads `window`, so they throw a `ReferenceError` on the server. `CssSandbox` needs `document` only when you call its methods.
- Two `CssSandbox` instances can share a host. The second `wrap` reuses the first instance's shadow root.
- Light DOM children you add while the container is wrapped stay outside the shadow root and render through no slot, so they do not show. Append into the shadow root instead.
- `Sandbox({ css: false }).activate()` returns `null`. Render into the container.

## What it does not do

- It does not patch timers, event listeners, `document` or `<script>` tags. Code that does not go through `proxyWindow` affects the real page.
- It does not clean up intervals or listeners an app leaves behind. Clear them in the app's `unmount`.
- It does not give code a separate origin or global object. Use an `<iframe sandbox>` for untrusted code.
- It does not detach a shadow root. The DOM has no API for that; `unwrap` leaves a slot instead.
- It does not stop inheritance. `color`, `font-family` and CSS custom properties set on the host or its ancestors still flow into the shadow root.

## Migrating from 0.4

- `Sandbox({ css: false }).activate(container)` returns `null` and attaches no shadow root. In 0.4 it attached one and hid the container's children. `ISandbox.activate` now returns `ShadowRoot | null`:

  ```ts
  import { createSandbox } from '@tuvix.js/sandbox';

  const container = document.querySelector<HTMLElement>('#app')!;
  const sandbox = createSandbox({ css: false });

  // 0.4: const root: ShadowRoot = sandbox.activate(container);
  const root = sandbox.activate(container) ?? container;
  ```

- `strict: true` throws a `TypeError` on a blocked write. In 0.4 it logged a warning and stored the value. Add the names your scripts set to `allowedGlobals`.
- `execScript` runs code inside a `with` block. The code cannot be strict-mode code, reading an undeclared identifier returns `undefined` instead of throwing, and a bare `x = 1` now lands on the proxy instead of the real `window`.
- `unwrap` keeps the shadow root's stylesheets and the next `wrap` restores them. In 0.4 `unwrap` deleted them. Remove code that adds `cssText` or `addStyle` styles again after a remount, or you get duplicates.
- The 0.4 docs said `js: true` intercepts `addEventListener`, timers and `document.createElement`. It never did, and 0.5 does not either.
