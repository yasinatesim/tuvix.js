# @tuvix.js/react

> React 18+ bindings for the Tuvix.js microfrontend framework

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

## Quick Start

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Welcome, {user}!</h1>;
}

export default createReactMicroApp({
  name: 'dashboard',
  App: Dashboard,
});
```

The returned module is auto-registered on `window.__TUVIX_MODULES__['dashboard']`
so the orchestrator's loader picks it up without any extra plumbing.

## SSR / Hydration

Use `createSsrReactMicroApp` (or pass `ssr: true`) when the container will
contain server-rendered HTML — React calls `hydrateRoot` instead of
`createRoot`, preserving SEO content and avoiding a flash:

```tsx
import { createSsrReactMicroApp, TuvixReactApp } from '@tuvix.js/react';

// Server-side: render the same React tree inside a `data-tuvix-app` container.
export function GithubRoute() {
  return <TuvixReactApp name="github-app" App={GithubPage} />;
}

// Client bundle: hydrates into the SSR markup
export default createSsrReactMicroApp({ name: 'github-app', App: GithubPage });
```

## Hooks

### `useTuvixBus(bus, event, handler)`

Subscribe to an event bus event with automatic cleanup on unmount:

```tsx
import { useTuvixBus } from '@tuvix.js/react';

function CartIcon({ bus }) {
  const [count, setCount] = useState(0);
  useTuvixBus<{ items: unknown[] }>(bus, 'cart:update', ({ items }) => {
    setCount(items.length);
  });
  return <span>{count}</span>;
}
```

The handler is captured via a ref, so referencing fresh component state inside
it does not require re-subscribing on every render.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Reactively merge props pushed by the orchestrator (`updateAppProps`) into the
component's local state:

```tsx
import { useTuvixProps } from '@tuvix.js/react';

function Settings({ initialProps, bus }) {
  const props = useTuvixProps(initialProps, bus);
  return <p>Theme: {props.theme}</p>;
}
```

`updateEvent` defaults to `'tuvix:props:update'`. Wire the orchestrator to emit
that event after `updateAppProps` if you want truly live updates without a
remount.

## API Surface

| Export | Purpose |
| --- | --- |
| `createReactMicroApp({ name, App, bootstrap?, ssr? })` | Wrap a React component as a micro app |
| `createSsrReactMicroApp({ name, App, bootstrap? })` | Same, with `ssr: true` preset |
| `TuvixReactApp` | SSR-friendly host component for nesting micro apps |
| `useTuvixBus(bus, event, handler)` | Auto-cleaning event subscription |
| `useTuvixProps(initial, bus?, event?)` | Reactive props from the orchestrator |

## License

MIT
