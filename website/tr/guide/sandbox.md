# Sandboxing

`@tuvix.js/sandbox` provides CSS and JavaScript isolation primitives so a
micro app can render without leaking styles or polluting the host page's
globals.

> The orchestrator does **not** auto-sandbox apps. You opt in by wrapping
> your `mount` / `unmount` hooks with `Sandbox`, `CssSandbox`, or `JsSandbox`
> directly. This keeps the core small and the cost explicit.

## CSS Isolation (Shadow DOM)

`CssSandbox` upgrades a container into a Shadow DOM host. Styles you inject
live inside the shadow root and cannot bleed out, and global page styles
cannot bleed in.

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const css = new CssSandbox();

// Wrap once per container (idempotent — repeats return the same root)
const shadow = css.wrap(container);

// Add scoped styles
const styleEl = css.addStyle(shadow, '.btn { color: red }');

// Render your UI inside `shadow` instead of `container`
shadow.appendChild(buildUi());

// On unmount: restore non-style children back to the container
css.removeStyle(shadow, styleEl); // optional — unwrap discards styles too
css.unwrap(container);
```

```
container (host)
└── ShadowRoot
    ├── <style>.btn { color: red }</style>
    └── <button class="btn">Click</button>     ← scoped, can't be themed from outside
```

Shadow DOM is supported in all modern browsers. Components that rely on
portals to `document.body` (popovers, modals) need explicit handling — they
escape the shadow root by design.

## JS Isolation (Proxy Scope)

`JsSandbox` produces a `proxyWindow` whose **writes** go to a per-instance
`fakeWindow` map. **Reads** pass through to the real window unless they were
shadowed by a write. This means sandboxed code cannot pollute global state
even after `deactivate()`.

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const js = new JsSandbox(
  ['gtag', 'dataLayer'], // additional allowed globals (in strict mode)
  /* strict */ true,      // warn when sandboxed code touches non-allowed globals
);

js.activate();

// Run a snippet inside the sandbox
js.execScript('window.myVar = 42; console.log(window.location.href)');

js.deactivate();
js.reset(); // clear fakeWindow
```

`execScript` calls `new Function(...)` and binds `window`, `self`, and
`globalThis` to the proxy.

## Combined Sandbox

`createSandbox` (or `new Sandbox(...)`) wires both isolations together:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  css: true,
  js: true,
  allowedGlobals: ['gtag'],
  strict: false,
});

// Returns the shadow root when css isolation is on
const shadow = sandbox.activate(container);

// Use sandbox.css / sandbox.js for fine-grained calls if needed
sandbox.css.addStyle(shadow, '/* ... */');

// Cleanup
sandbox.deactivate(container);
sandbox.destroy(container); // deactivate + reset js fakes
```

## Wiring into a Micro App

```ts
import { defineMicroApp } from '@tuvix.js/core';
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: false });

export default defineMicroApp({
  name: 'widget',

  mount({ container, props }) {
    const shadow = sandbox.activate(container);
    sandbox.css.addStyle(shadow, '.box { padding: 8px; }');
    shadow.appendChild(renderWidget(props));
  },

  unmount({ container }) {
    sandbox.deactivate(container);
  },
});
```

## When Not to Sandbox

Skip the sandbox when your micro app:

- Uses portals into `document.body` (popovers, toasts) and you don't need style isolation
- Loads design-system styles globally on purpose
- Already runs in a separate iframe or web component context

## API Surface

| Export | Purpose |
| --- | --- |
| `CssSandbox` | Shadow DOM wrap / unwrap, scoped style helpers |
| `JsSandbox` | Proxy window + `execScript` |
| `Sandbox` / `createSandbox` | Combined CSS + JS isolation |
| `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox` | Types |
