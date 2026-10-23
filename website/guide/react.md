# With React

`@tuvix.js/react` does three jobs. `createReactMicroApp` turns a React component into a micro app any shell can mount. `TuvixReactApp` renders a React micro app inside a React host page, with server rendering. `TuvixIsland` hosts a Vue, Svelte, Angular, React or hand-written micro app inside a React page.

Requires React 18 or 19.

## Install

```bash
pnpm add @tuvix.js/react react react-dom
```

## Turn a component into a micro app

```tsx
// src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile ${theme}`}>User {userId}</div>;
}

export default createReactMicroApp({ name: 'profile', App: Profile });
```

The module:

- registers itself under `name`, so a URL entry finds it;
- creates one React root per container, so one module can mount in several places;
- resolves `mount` after React commits the first render, then dispatches `tuvix:mounted` on the container;
- passes the shell's props to `App` as its props. `App` may declare required props; the adapter does not check them at runtime.

| Option | Type | Description |
| --- | --- | --- |
| `name` | `string` | Required. Must match the registered app name. |
| `App` | `ComponentType<P>` | Required. Root component. |
| `bootstrap` | `() => void \| Promise<void>` | Runs once before the first mount. |
| `ssr` | `boolean` | Hydrate when the container holds server markup. `createSsrReactMicroApp` sets it. |

## Props and updates

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'light' });
```

`update({ props, container })` re-renders the root for that container with the merged props. Component state survives. Without `container`, it re-renders every root of the module. Calling `mount` on a container this module already rendered into re-renders it instead of creating a second root.

## Errors

The adapter wraps `App` in an error boundary:

- A throw during the first render rejects `mount`, empties the container and dispatches `tuvix:error`. The orchestrator then shows the app's `fallback` HTML.
- A throw after that blanks the app and dispatches `tuvix:error`. The rest of the page keeps running.

## Server-rendered React apps

When the host page is React and renders on the server (TanStack Start, Next.js, Remix, or your own `renderToString`), render the micro app inline with `TuvixReactApp`:

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

- It renders `<div data-tuvix-app="legal">` around `App`, so the HTML comes from the host's own server render.
- Every prop except `name`, `App` and `fallback` goes to `App`.
- `App` sits in its own `<Suspense fallback>`. If it throws on the server, React sends the fallback for this app only and retries the app on the client.
- On the client an error boundary shows `fallback` and dispatches `tuvix:error`.
- After the first commit it dispatches `tuvix:mounted` with `hydrated: true` when it hydrated server HTML, and `tuvix:unmounted` when it leaves the tree.

When a separate bundle must hydrate that markup (for example a page that `@tuvix.js/server` composed), export the same component with `createSsrReactMicroApp`. It renders the same Suspense tree, so hydration matches:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export default createSsrReactMicroApp({ name: 'legal', App: LegalPage });
```

With `ssr: true`, a container that holds only whitespace or comments gets a fresh render instead of a hydration.

## Host other micro apps with TuvixIsland

`TuvixIsland` mounts any micro app module inside a React tree:

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });

export function Footer({ newsletterHtml }: { newsletterHtml?: string }) {
  return (
    <TuvixIsland
      name="newsletter"
      app={newsletter}
      props={{ list: 'weekly' }}
      ssrHtml={newsletterHtml}
      fallback={<p>Subscribe at example.com/newsletter</p>}
    />
  );
}
```

| Prop | Description |
| --- | --- |
| `name` | Written to `data-tuvix-app` and passed to `mount`. |
| `app` | The module to mount. |
| `props` | Compared shallowly each render. A change calls `app.update`, or unmount + mount when the module has no `update`. |
| `ssrHtml` | Server HTML for the island. Needed on the server only. |
| `fallback` | Rendered instead of the island when `mount` or `update` rejects. |
| `as`, `className` | Wrapper tag (default `div`) and class. |

React never rewrites the island's inner HTML after the first render, so parent re-renders keep the DOM and listeners the module attached. A new `name` or `app` remounts; removing the island calls `app.unmount`. Mount, update and unmount run one after another, so an unmount that arrives during `mount` waits for it.

`TuvixIsland` does not load modules by URL. Import the module, or let the orchestrator manage URL entries. The full server setup is in [SSR Islands](/guide/ssr-islands).

## Hooks

### useTuvixBus

Subscribes on mount and unsubscribes on unmount. It reads the latest `handler` through a ref, so an inline handler does not resubscribe each render:

```tsx
import { useState } from 'react';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/react';

const bus = getGlobalBus();

export function CartBadge() {
  const [count, setCount] = useState(0);
  useTuvixBus<{ itemCount: number }>(bus, 'cart:updated', ({ itemCount }) => setCount(itemCount));
  return <span className="badge">{count}</span>;
}
```

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` returns state that merges in every payload emitted on `updateEvent`. Nothing in Tuvix.js emits that event; emit it yourself when you want to push props through the bus instead of `updateAppProps`.

```tsx
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixProps } from '@tuvix.js/react';

const bus = getGlobalBus();

export function Theme() {
  const props = useTuvixProps({ theme: 'light' }, bus);
  return <p>Theme: {props.theme}</p>;
}

bus.emit('tuvix:props:update', { theme: 'dark' });
```

## What the adapter does not do

- It does not share one React root between micro apps. Each app, and each container, gets its own.
- It does not dedupe React. Two separately bundled React micro apps ship two copies of React.
- It does not render the host page's `<head>`. Titles and meta tags belong to the host.

## API

| Export | Purpose |
| --- | --- |
| `createReactMicroApp({ name, App, bootstrap?, ssr? })` | React micro app module |
| `createSsrReactMicroApp({ name, App, bootstrap? })` | Same with `ssr: true` |
| `TuvixReactApp` | Inline React micro app in a React host, with SSR |
| `TuvixIsland` | Host any micro app module in a React tree, with SSR |
| `useTuvixBus(bus, event, handler)` | Event bus subscription tied to the component |
| `useTuvixProps(initial, bus?, event?)` | Props merged from bus events |
