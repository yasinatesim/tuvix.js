# With React

`@tuvix.js/react` provides React 18+ bindings for Tuvix.js.

## Installation

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

## createReactMicroApp

The simplest way to expose a React component as a micro app:

```tsx
// src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';
import App from './App';

export default createReactMicroApp({
  name: 'dashboard',
  App,
});
```

`createReactMicroApp` handles the full `bootstrap → mount → update → unmount`
lifecycle automatically — it creates a React root, renders your component
with `props`, calls `root.render(...)` for prop updates, and tears it down
on unmount. The returned module is auto-registered on
`window.__TUVIX_MODULES__['dashboard']` so the loader picks it up without any
extra plumbing.

### Options

| Option | Type | Description |
| --- | --- | --- |
| `name` | `string` | **Required.** Unique micro app name |
| `App` | `ComponentType<any>` | **Required.** React component to render |
| `bootstrap?` | `() => void \| Promise<void>` | One-time setup before first mount |
| `ssr?` | `boolean` | Use `hydrateRoot` instead of `createRoot` |

## Props

Props passed from the shell are forwarded to your component as-is:

```tsx
// Shell
orchestrator.register({
  name: 'profile',
  entry: '/profile.js',
  container: '#app',
  activeWhen: '/profile/*',
  props: { userId: '42', theme: 'dark' },
});

// React component
interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile theme-${theme}`}>User: {userId}</div>;
}

export default createReactMicroApp({ name: 'profile', App: Profile });
```

When the shell calls `orchestrator.updateAppProps('profile', { theme: 'light' })`,
the binding re-renders the root with the merged props — no remount, no flash.

## SSR / Hydration

Use `createSsrReactMicroApp` (or pass `ssr: true`) when the container will
contain server-rendered HTML — React calls `hydrateRoot` instead of
`createRoot`, preserving SEO content and avoiding a flash of empty UI:

```tsx
import { createSsrReactMicroApp, TuvixReactApp } from '@tuvix.js/react';
import { GithubPage } from './GithubPage';

// Server-side route — renders into a `data-tuvix-app` container
export function GithubRoute() {
  return <TuvixReactApp name="github-app" App={GithubPage} />;
}

// Client bundle — hydrates into the SSR markup
export default createSsrReactMicroApp({ name: 'github-app', App: GithubPage });
```

## Hooks

### `useTuvixBus(bus, event, handler)`

Subscribe to event-bus events with automatic cleanup on unmount. The handler
is captured via a ref, so referencing fresh state inside it does not require
re-subscribing on every render.

```tsx
import { useTuvixBus } from '@tuvix.js/react';

function CartBadge({ bus }: { bus: import('@tuvix.js/event-bus').IEventBus }) {
  const [count, setCount] = useState(0);

  useTuvixBus<{ itemCount: number }>(bus, 'cart:updated', ({ itemCount }) => {
    setCount(itemCount);
  });

  return <span className="badge">{count}</span>;
}
```

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Reactively merge props pushed by the orchestrator (`updateAppProps`) into the
component's local state. Useful when your micro app cannot rely on the
adapter's automatic re-render — for example, when you implement your own
mount lifecycle.

```tsx
import { useTuvixProps } from '@tuvix.js/react';

function Settings({
  initialProps,
  bus,
}: {
  initialProps: { theme: string };
  bus: import('@tuvix.js/event-bus').IEventBus;
}) {
  const props = useTuvixProps(initialProps, bus);
  return <p>Theme: {props.theme}</p>;
}
```

`updateEvent` defaults to `'tuvix:props:update'`. Wire the orchestrator to
emit that event after `updateAppProps()` if you want truly live updates
without going through the adapter's `update()` hook.

## Manual Lifecycle

For full control, implement the lifecycle yourself:

```tsx
import { defineMicroApp } from '@tuvix.js/core';
import { createRoot, type Root } from 'react-dom/client';
import App from './App';

let root: Root | null = null;

export default defineMicroApp({
  name: 'dashboard',

  mount({ container, props }) {
    root = createRoot(container);
    root.render(<App {...(props as any)} />);
  },

  unmount({ container }) {
    root?.unmount();
    root = null;
    container.innerHTML = '';
  },

  update({ props }) {
    root?.render(<App {...(props as any)} />);
  },
});
```

## API Surface

| Export | Purpose |
| --- | --- |
| `createReactMicroApp({ name, App, bootstrap?, ssr? })` | React micro app |
| `createSsrReactMicroApp({ name, App, bootstrap? })` | SSR / hydration variant |
| `TuvixReactApp` | SSR-friendly host component |
| `useTuvixBus(bus, event, handler)` | Auto-cleaning subscription hook |
| `useTuvixProps(initial, bus?, event?)` | Reactive props from the orchestrator |
