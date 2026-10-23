# Sandboxing

`@tuvix.js/sandbox` has two tools. `CssSandbox` puts an app inside a shadow root so its CSS and the page's CSS stay apart. `JsSandbox` runs code against a proxy `window` so its global writes land on the proxy. The orchestrator uses `CssSandbox` for apps you register with `sandbox: true`; it never applies `JsSandbox`.

## CSS isolation per app

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'widget',
  entry: {
    scripts: ['https://cdn.example.com/widget/main.js'],
    styles: ['https://cdn.example.com/widget/main.css'],
    type: 'module',
  },
  container: '#widget',
  activeWhen: '/',
  sandbox: true, // same as { css: true }
});
```

For this app the orchestrator:

1. attaches an open shadow root to `#widget` (or reuses the one from an earlier mount);
2. creates a `<div data-tuvix-sandbox-root>` inside it and passes that element to `mount` as `container`;
3. adds the entry `styles` as `<link>` tags inside the shadow root, not in `document.head`, and waits up to `loader.timeout` for them to load before calling `mount`.

Page CSS no longer reaches the app, and the app's CSS no longer reaches the page. Inherited properties such as `color` and `font-family` still flow in from the host element; set them on `:host` in the app's CSS to stop that.

Use it when an app ships global selectors (`button { ... }`, a CSS reset) or when the page's CSS breaks the app.

### Edge cases

- Styles a framework injects at runtime go to `document.head`, outside the shadow root. Vite's CSS injection, CSS-in-JS libraries and Angular's component styles all do this. Ship a CSS file and list it in `entry.styles`, or add the CSS to the shadow root yourself.
- Portals, modals and toasts that render into `document.body` leave the shadow root and lose the app's styles.
- `document.querySelector` from inside the app does not find elements in the shadow root. Query from `container` instead.
- Loader-function entries list no `styles`, so your bundler injects their CSS into `document.head`, where the shadow root keeps it out. Register sandboxed apps with a `{ scripts, styles, type }` entry.

## CssSandbox by hand

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const css = new CssSandbox();
const shadow = css.wrap(container); // moves existing children into the shadow root

const adopted = css.adoptStyles(shadow, {
  urls: ['/widget/main.css'],
  cssText: ':host { display: block; font-family: system-ui; }',
});
await adopted.ready; // resolves once each <link> fired load or error

const button = document.createElement('button');
button.textContent = 'Buy';
shadow.append(button);

// Later
adopted.remove();
css.unwrap(container);
```

| Method | Effect |
| --- | --- |
| `wrap(container)` | Attaches an open shadow root, or reuses an existing open one, and moves the container's children into it. |
| `adoptStyles(shadow, { urls, cssText })` | Inserts `<link>` and `<style>` elements at the start of the shadow root. Skips a URL already adopted there. Returns `{ elements, ready, remove }`. |
| `addStyle(shadow, css)` / `removeStyle(shadow, el)` | Appends or removes one `<style>`. |
| `unwrap(container)` | Moves non-style nodes back to the light DOM and leaves a `<slot>` so they render. Takes `<style>` and stylesheet `<link>` nodes (including `addStyle` and `adoptStyles` ones) out of the DOM; the next `wrap` of that container puts them back in order. |

`wrap` throws when the element cannot host a shadow root (for example `<input>`) or already has a closed one. `ready` never rejects. jsdom never fires `load` on links, so do not await `ready` in jsdom tests. When you call `removeStyle` or `adopted.remove()` while the container is unwrapped, that stylesheet does not come back on the next `wrap`.

## JsSandbox

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const js = new JsSandbox(['dataLayer'], /* strict */ true);

js.execScript('window.dataLayer = []'); // allowed, stored on the proxy
console.log('dataLayer' in window); // false, unless the page defined it

try {
  js.execScript('counter = 1'); // bare assignment to a global that is not allowed
} catch (error) {
  console.log(error instanceof TypeError); // true: strict mode blocked the write
}

const loose = new JsSandbox(); // not strict
loose.execScript('var version = 2; build = 7;');
console.log(Reflect.get(loose.proxyWindow, 'version'), 'version' in window); // 2 false

js.reset(); // forget every stored global
```

- Writes and `Object.defineProperty` through the proxy go to a store on the sandbox. Reads check that store, then the real `window`.
- With `strict: true`, assigning, top-level `var`-declaring or `Object.defineProperty`-ing a global outside the built-in allowlist and `allowedGlobals` throws a `TypeError` and stores nothing.
- `execScript(code)` runs `code` inside `with (scope)`, with `window`, `self`, `globalThis` and `this` bound to the proxy. Bare assignments (`x = 1`), top-level `var x` and `window.x = 1` all land on the proxy; `let` and `const` stay local to the script.
- Inside `execScript`, reading an undeclared identifier returns `undefined` instead of throwing a `ReferenceError`, and a `"use strict"` directive has no effect, because `with` needs sloppy mode. It uses `new Function`, so your Content Security Policy needs `unsafe-eval`.
- `activate()` and `deactivate()` set the `active` flag. The proxy stores writes in both states.

`JsSandbox` covers only code that reaches globals through `proxyWindow`. A script loaded with a `<script>` tag, a bundled module, timers and event listeners all use the real `window`. Treat it as a guard against accidental global writes in snippets you run, not as a security boundary.

## Combined Sandbox

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });

const shadow = sandbox.activate(container); // ShadowRoot | null
if (shadow) sandbox.css.addStyle(shadow, '.box { padding: 8px; }');

sandbox.deactivate(container); // unwrap
sandbox.destroy(container); // deactivate + reset the JS store
```

`activate` returns `null` when `css` is `false`; it then attaches nothing.

## Use it inside a micro app

```ts
import { defineMicroApp } from '@tuvix.js/core';
import { CssSandbox } from '@tuvix.js/sandbox';

const css = new CssSandbox();

export default defineMicroApp({
  name: 'widget',
  mount({ container }) {
    const shadow = css.wrap(container);
    css.addStyle(shadow, 'p { color: rebeccapurple; }');
    const text = document.createElement('p');
    text.textContent = 'Isolated';
    shadow.append(text);
  },
  unmount({ container }) {
    container.shadowRoot?.replaceChildren();
    css.unwrap(container);
  },
});
```

Prefer `sandbox: true` on `register` when the orchestrator mounts the app; it does the same work and reuses the shadow root across remounts.

## When not to sandbox

- The app uses portals into `document.body` and needs its styles there.
- The page's design system should style the app.
- You need real JavaScript isolation. Use an `<iframe>`.
