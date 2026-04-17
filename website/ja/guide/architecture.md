# Architecture

## Overview

Tuvix.js is structured as a monorepo of small, composable packages. You only
import what you use.

```
@tuvix.js/core          ← Orchestrator, lifecycle, registration
@tuvix.js/router        ← URL-based routing
@tuvix.js/event-bus     ← Inter-app pub/sub
@tuvix.js/loader        ← Dynamic bundle loading
@tuvix.js/sandbox       ← CSS (Shadow DOM) + JS (Proxy) isolation
@tuvix.js/react         ← React bindings
@tuvix.js/vue           ← Vue bindings
@tuvix.js/svelte        ← Svelte bindings
@tuvix.js/angular       ← Angular bindings
@tuvix.js/devtools      ← Debug panel
@tuvix.js/server        ← SSR composition
@tuvix.js/module-federation  ← Webpack 5 integration
create-tuvix-app        ← CLI scaffolding
tuvix.js                ← Umbrella (all-in-one)
```

## Request Flow

```
URL change (or orchestrator.reconcile)
    │
    ▼
@tuvix.js/router         ← Matches the path against route patterns
    │
    ▼
@tuvix.js/core           ← Orchestrator decides what to mount / unmount
    │
    ▼
@tuvix.js/loader         ← Fetches and executes the micro app bundle (cached)
    │
    ▼
window.__TUVIX_MODULES__[name]   ← Bundle self-registers here
    │
    ▼
module.bootstrap()  →  module.mount({ container, props })
```

## The MicroAppModule Interface

Every micro app must expose this shape (the framework adapters do it for you):

```ts
interface MicroAppModule {
  bootstrap?: () => void | Promise<void>;
  mount: ({ container, props }: { container: HTMLElement; props?: Record<string, unknown> })
    => void | Promise<void>;
  unmount: ({ container }: { container: HTMLElement }) => void | Promise<void>;
  update?: ({ props }: { props: Record<string, unknown> }) => void | Promise<void>;
}
```

The orchestrator calls each hook at the right time:

1. **`bootstrap`** — once, before the first mount
2. **`mount`** — when the route activates (or on `mountApp(name)`)
3. **`update`** — when the shell calls `updateAppProps(name, props)`
4. **`unmount`** — when the route deactivates (or on `unmountApp(name)`)

## How Apps Register Themselves

When the loader finishes executing a bundle, it looks for the module in this
priority order:

1. `window.__TUVIX_MODULES__[name]` — recommended pattern, used by all
   framework adapters.
2. New keys appended to `window` after the bundle runs (UMD / IIFE fallback,
   for legacy bundles).

ES module bundles (`.mjs`, `.mts`, `.tsx`, `.jsx`) are loaded with
`type="module"` — they cannot rely on the UMD fallback because module scope
does not pollute `window`. **Always self-register via `window.__TUVIX_MODULES__`
when shipping ESM.**

## Isolation Model

### CSS Isolation (Shadow DOM)

`@tuvix.js/sandbox`'s `CssSandbox` wraps a container in a Shadow DOM root, so
styles written inside cannot bleed out and global styles cannot bleed in:

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const css = new CssSandbox();
const shadow = css.wrap(container);
css.addStyle(shadow, '.btn { color: red }');
// later
css.unwrap(container);
```

### JS Isolation (Proxy Scope)

`JsSandbox` produces a proxy `window` whose writes go to a per-instance
`fakeWindow` map instead of the real global. Reads pass through to the real
window unless they were shadowed by a write.

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const js = new JsSandbox(['gtag'], /* strict */ true);
js.activate();
js.execScript('window.myVar = 42'); // stored in fakeWindow, not real window
js.deactivate();
js.reset();
```

## Event Bus

The bus is a decoupled pub/sub channel. Use the orchestrator's bus when you
have one — it is automatically shared with every registered app:

```ts
const bus = orchestrator.getEventBus();

const off = bus.on('user:login', ({ userId }) => {
  console.log('User logged in:', userId);
});

bus.emit('user:login', { userId: '42' });
off();
```

For standalone or multi-orchestrator pages, `getGlobalBus()` from
`@tuvix.js/event-bus` returns a lazy singleton.

## Where to Look Next

- [Getting Started](/guide/getting-started) — the 60-second tour
- [Lifecycle Hooks](/guide/lifecycle) — the contract every app implements
- [Routing](/guide/routing) — patterns, params, guards
- [Event Bus](/guide/event-bus) — pub/sub patterns and pitfalls
- [Sandbox](/guide/sandbox) — when (and when not) to isolate
