# @tuvix.js/svelte

> Svelte 3/4/5 bindings for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

## Quick Start

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({
  name: 'profile',
  App,
});
```

The returned module is auto-registered on `window.__TUVIX_MODULES__['profile']`.

The bindings auto-detect the Svelte version:

- **Svelte 3 / 4** — uses `new App({ target, props })` and `instance.$destroy()`
- **Svelte 5** — uses `mount()` / `unmount()` from the `svelte` package

## SSR / Hydration

`createSsrSvelteMicroApp` hydrates pre-rendered HTML rather than replacing it.
On mount, if the container already has child nodes, the component is created
with `hydrate: true`:

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App });
```

Pair with `renderSvelteToString` from `@tuvix.js/svelte/server`.

## Updating Props

```ts
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

- **Svelte 3 / 4** — props are forwarded via `instance.$set(props)`.
- **Svelte 5** — `$set` was removed. Pass props through a shared store or
  rune-based state inside the component; the binding logs a warning if it
  cannot deliver the update.

## API Surface

| Export | Purpose |
| --- | --- |
| `createSvelteMicroApp({ name, App, bootstrap? })` | Client-only micro app |
| `createSsrSvelteMicroApp({ name, App, bootstrap? })` | SSR / hydration variant |
| `renderSvelteToString(...)` (from `/server`) | SSR render to HTML string |

## License

MIT
