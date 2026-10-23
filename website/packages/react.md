---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="React Bindings"
  description="Turn a React component into a Tuvix.js micro app, and host any micro app (Vue, Svelte, Angular, React, vanilla) inside a React tree with server rendering and hydration."
  icon="⚛️"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

The package needs React 18 or newer (peer range `>=18.0.0` for `react` and `react-dom`). It depends on `@tuvix.js/loader` and `@tuvix.js/event-bus`.

## When to use it

The package covers two directions:

- **React as the micro app.** `createReactMicroApp` and `createSsrReactMicroApp` wrap a React component in the `{ bootstrap, mount, unmount, update }` module the orchestrator and loader expect. Use them when a React app is one of the micro apps a Tuvix shell loads.
- **React as the host.** `TuvixIsland` mounts any micro app module inside a React page and keeps its DOM intact across re-renders. `TuvixReactApp` renders a React micro app inline in the host tree. Use them when your shell is a React SSR framework such as TanStack Start, Next.js or Remix.

If your shell is plain HTML with no React, you need only the first pair plus [`@tuvix.js/core`](/packages/core). For a Vue, Svelte or Angular micro app, use [`@tuvix.js/vue`](/packages/vue), [`@tuvix.js/svelte`](/packages/svelte) or [`@tuvix.js/angular`](/packages/angular) to create the module; `TuvixIsland` can host any of them.

## Quick start

Create the micro app module:

```tsx
// src/dashboard.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Register it in the shell. The orchestrator calls `mount` when the route matches and `update` when you change props:

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { userId: 'u_42' },
});

await orchestrator.start();

// Re-renders <Dashboard userId="u_43" />; component state survives.
await orchestrator.updateAppProps('dashboard', { userId: 'u_43' });
```

## API

### `createReactMicroApp`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Name the module registers under through `registerModule` from `@tuvix.js/loader`. Lifecycle events carry it. |
| `App` | `ComponentType<P>` | required | Root component. It receives the mount props as its own props, so a component with required props such as `{ page: 'privacy' \| 'terms' }` type-checks. |
| `bootstrap` | `() => void \| Promise<void>` | none | One-time setup. The module's `bootstrap()` awaits it. |
| `ssr` | `boolean` | `false` | Hydrate server markup with `hydrateRoot` when the container holds elements or non-whitespace text. A container with only whitespace or comments gets a fresh `createRoot` render. |

The returned module has four methods:

- `mount({ container, props })` creates one React root for that container. It resolves after React commits the first render, then dispatches `tuvix:mounted` on the container with `hydrated: true` or `false`. If `App` suspends on the first render, `mount` waits until the content commits.
- `update({ props, container })` re-renders `App` with `props` in that container. Without `container` it re-renders every container the module has mounted. React keeps component state because the tree keeps its shape.
- `unmount({ container })` unmounts the root, empties the container with `replaceChildren()` and dispatches `tuvix:unmounted`.
- `bootstrap()` runs `config.bootstrap`.

Each container gets its own root, so one module can mount into several places at once:

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

const badge = createReactMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

The module imports `react-dom/client` lazily inside `mount`. A server bundle can import the module (for example to share `App` with `TuvixReactApp`) without pulling in the client renderer.

### `createSsrReactMicroApp`

```ts no-check
function createSsrReactMicroApp<P extends object = Record<string, unknown>>(
  config: Omit<ReactMicroAppConfig<P>, 'ssr'>
): MicroAppModule;
```

Same as `createReactMicroApp({ ...config, ssr: true })`. Options: `name`, `App`, `bootstrap`, as in the table above.

Use it on the client when the container already holds HTML that the server rendered for the same component. The tree it renders matches the one `TuvixReactApp` renders (error boundary plus `<Suspense>`), so it hydrates `TuvixReactApp` markup without a mismatch:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export default createSsrReactMicroApp({ name: 'legal-app', App: LegalPage });
```

### `TuvixIsland`

```ts no-check
function TuvixIsland(props: TuvixIslandProps): ReactElement;
```

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Micro app name. The island writes it to `data-tuvix-app` and passes it to `app.mount`. |
| `app` | `MicroAppModule` | required | The module to mount: the result of `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp`, `createReactMicroApp`, their `createSsr*` variants, or a hand-written `{ mount, unmount, update? }` object. |
| `props` | `Record<string, unknown>` | `{}` | Props for the module. The island compares them shallowly on each render. |
| `ssrHtml` | `string` | none | The island's server-rendered HTML, for example from `renderVueToString`. Pass it on the server only. |
| `fallback` | `ReactNode` | `null` | Rendered in place of the island when `mount` or `update` rejects. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Tag of the wrapper element. |
| `className` | `string` | none | Class name of the wrapper element. |

`TuvixIsland` hosts a non-React micro app (or a separately bundled React one) inside a React page. A hand-written bridge that renders <span v-pre>`<div dangerouslySetInnerHTML={{ __html: html }} />`</span> breaks on the first parent re-render: React sees a new `{ __html }` object, assigns `innerHTML` again, and destroys the DOM and listeners the micro app attached. `TuvixIsland` avoids that:

- **Server render.** It renders `<div data-tuvix-app={name} data-tuvix-island={id}>` with `ssrHtml` as inner HTML. `id` comes from React's `useId`, so the server and the client compute the same value.
- **Hydration.** On the first client render it finds its own element in the page through `data-tuvix-island` and reads the inner HTML back from the DOM. You do not send `ssrHtml` to the client a second time, and the client render matches the server render.
- **Stable DOM.** The island creates its `{ __html }` object once, in `useState`. Later renders reuse that object, so React never rewrites the island's children. Parent re-renders keep the micro app's nodes and listeners.
- **Mount.** After the first commit the island calls `app.mount({ container, props, name })`. A module created with `ssr: true` (`createSsrVueMicroApp` and friends) adopts the server DOM there. A module without SSR renders fresh into the container.
- **Props.** When `props` changes shallowly (different keys, or a value that fails `Object.is`), the island calls `app.update({ props, container })`. A module without `update` gets `unmount`, an emptied container, and a new `mount`. An inline object literal with the same values does not trigger an update.
- **Identity.** A new `name` or `app` unmounts the old module and mounts the new one.
- **Removal.** When the island leaves the tree it calls `app.unmount({ container })` and empties the container.
- **Ordering.** Mount, update and unmount calls run one after another. An unmount that arrives while `mount` is pending waits for it.
- **Errors.** If `mount` or `update` rejects, the island renders `fallback` in place of the wrapper. The adapters dispatch `tuvix:error` themselves; the island adds no event. A later change of `name` or `app` tries again.

A complete server and client setup with a Vue footer inside a React layout:

```tsx
// src/Layout.tsx (shared by server and client)
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <main>
      <h1>Home</h1>
      <TuvixIsland
        name="footer"
        app={footer}
        props={{ year }}
        ssrHtml={footerHtml}
        fallback={<footer>© {year}</footer>}
        as="section"
        className="site-footer"
      />
    </main>
  );
}
```

```tsx
// src/entry-server.tsx (runs on the server only)
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const year = 2026;
  const footerHtml = await renderVueToString(Footer, { year });
  const body = renderToString(<Layout year={year} footerHtml={footerHtml} />);
  return `<!doctype html><html><body><div id="root">${body}</div><script type="module" src="/src/entry-client.tsx"></script></body></html>`;
}
```

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

// No footerHtml here: the island reads the footer HTML from the page.
hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

The server HTML reaches the browser before any JavaScript, so the footer is visible and styled on first paint once you print its stylesheets in `<head>`. [`@tuvix.js/vite`](/packages/vite) gives you those `<link>` tags.

### `TuvixReactApp`

```ts no-check
function TuvixReactApp<P extends object>(props: TuvixReactAppProps<P>): ReactElement;
```

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Micro app name, written to `data-tuvix-app`. Match the `name` you pass to `createSsrReactMicroApp`. |
| `App` | `ComponentType<P>` | required | Component to render. |
| `fallback` | `ReactNode` | `null` | Shown while `App` suspends and after it throws. |
| other props | `P` | required by `P` | Passed to `App`. |

`TuvixReactApp` renders a React micro app inline, as part of the host's React tree, so your SSR framework renders its HTML. It outputs `<div data-tuvix-app={name}>` and wraps `App` in an error boundary and a `<Suspense fallback>`:

- **Server errors stay local.** A throw inside `App` during server rendering makes React render `fallback` for this app only. The rest of the page renders, and React retries `App` on the client.
- **Client errors stay local.** The error boundary catches render errors on the client, shows `fallback` and dispatches `tuvix:error` on the wrapper.
- **Lifecycle events.** After the first commit it dispatches `tuvix:mounted`. `hydrated` is `true` when the wrapper came from server HTML. When the component leaves the tree it dispatches `tuvix:unmounted` before React detaches the wrapper, so a listener on `document` receives it. If a shown `<Suspense>` boundary suspends again, the app reports `unmounted`, then `mounted` once the content is back.

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal-app"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

To host a Vue, Svelte, Angular or vanilla micro app, use `TuvixIsland`.

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): void;
```

Subscribes `handler` to `event` on `bus` in an effect and unsubscribes on unmount. The hook keeps the latest `handler` in a ref, so a handler that reads fresh state does not resubscribe on each render. A new `bus` or `event` resubscribes. The subscription exists on the client only; effects do not run during server rendering.

The adapters do not pass the orchestrator's bus into `App`. The orchestrator uses `getGlobalBus()` unless you gave it `eventBus` options, so read the bus from there:

```tsx
import { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function CartIcon() {
  const [count, setCount] = useState(0);

  useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
    setCount(items.length);
  });

  return <span>{count}</span>;
}
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): T;
```

| Argument | Type | Default | Meaning |
| --- | --- | --- | --- |
| `initialProps` | `T` | required | Starting value. The hook reads it on the first render and ignores later changes. |
| `bus` | `IEventBus` | none | Bus to listen on. Without it the hook returns `initialProps` unchanged. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Event whose payload the hook merges into the current props (`{ ...prev, ...payload }`). |

Neither the orchestrator nor the adapters emit `tuvix:props:update`. You emit it yourself. A module from `createReactMicroApp` does not need this hook for orchestrator props: `update({ props })` re-renders `App` with the new props.

```tsx
import { useTuvixProps } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function ThemeLabel() {
  const props = useTuvixProps({ theme: 'light' }, getGlobalBus());
  return <p>Theme: {props.theme}</p>;
}

// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
```

### Types

| Type | Meaning |
| --- | --- |
| `ReactMicroAppConfig<P>` | Config of `createReactMicroApp`: `name`, `App`, `bootstrap?`, `ssr?`. |
| `TuvixIslandProps` | Props of `TuvixIsland`: `name`, `app`, `props?`, `ssrHtml?`, `fallback?`, `as?`, `className?`. |
| `TuvixReactAppProps<P>` | Props of `TuvixReactApp`: `name`, `App`, `fallback?`, plus the props of `App`. |

## Edge cases

- **First render throws.** `mount` rejects with the error, unmounts the root, empties the container and dispatches `tuvix:error`. In 0.4 `mount` resolved and the error reached React's root error handler.
- **Later render throws.** The error boundary blanks the app and dispatches `tuvix:error`. The host page keeps running. The app stays blank until you unmount and mount it again; `update` does not bring it back.
- **Unmount during mount.** An `unmount` that arrives while `mount` is still loading `react-dom/client` or waiting for the first commit waits for it, leaves the container empty and dispatches no `mounted` event.
- **Mount twice into one container.** A second `mount` on a container the module already holds unmounts the old root, dispatches `tuvix:unmounted`, then renders fresh with the new props and dispatches `tuvix:mounted`. Component state resets. The Vue, Svelte and Angular adapters do the same. Call `update` to keep state.
- **Unknown container.** `unmount` and `update` on a container the module never mounted do nothing.
- **Props replace.** The module's `update` renders `App` with the props you pass and nothing else. `orchestrator.updateAppProps` merges new props over the registered ones before it calls `update`.
- **Whitespace-only container with `ssr: true`.** The module renders fresh, because `hasServerMarkup` ignores whitespace text and comments.
- **Island removed by React.** React detaches the island's element before the module reports `tuvix:unmounted`. `emitLifecycle` then dispatches the event on `document` instead of the detached element, so a `document` listener (or `onLifecycle` from `@tuvix.js/loader`) still receives it, with `detail.container` naming the removed element. A listener on the container itself or on an ancestor does not. `isMounted(name)` stays `true` while the app is mounted in any other container and turns `false` after the last one unmounts.
- **Island under `<StrictMode>` in development.** React runs the mount effect, its cleanup, and the effect again. The island queues module calls and skips the first run because its cleanup already ran, so the module mounts once and adopts the server DOM.
- **New app after a failed mount.** When `mount` rejects, the island drops its server HTML. If you then pass a different `app` or `name`, the new module mounts into an empty element instead of adopting the failed app's markup.
- **Changing `ssrHtml` on the island.** The island reads `ssrHtml` on its first render only. Pass new content through `props`.
- **Same name twice.** `registerModule` keeps the last module created under a name.

## What it does not do

- It does not load modules by URL. Import the module, or let [`@tuvix.js/core`](/packages/core) load it through an `entry`.
- It does not render a micro app to a string. On the server use `renderToString` from `react-dom/server` with `TuvixReactApp`, or the framework's own renderer (`renderVueToString` from [`@tuvix.js/vue/server`](/packages/vue), the Svelte and Angular equivalents) and pass the result to `TuvixIsland` as `ssrHtml`.
- It does not pass `MountContext.bus` or `MountContext.name` to `App`. Use `getGlobalBus()` from `@tuvix.js/event-bus`.
- It does not load the island's CSS. Use [`@tuvix.js/vite`](/packages/vite) to print stylesheet links for server-rendered islands.
- It does not support React 17 or older.

## Migrating from 0.4

**`TuvixReactApp` server HTML has Suspense markers.** The wrapper now contains `<!--$-->…<!--/$-->` around the app. Upgrade `@tuvix.js/react` on the server and the client together, or hydration fails with a mismatch.

**`mount` rejects when the first render throws.** If you awaited `mount` and expected it to resolve, catch the error:

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Broken(): never {
  throw new Error('boom');
}

const app = createReactMicroApp({ name: 'broken', App: Broken });
const container = document.createElement('div');

try {
  await app.mount({ container });
} catch (error) {
  // 0.4: never reached. 0.5: the render error; the container is empty.
  container.textContent = 'This section failed to load.';
}
```

**`unmount` on an unknown container does nothing.** In 0.4 it cleared the container. Call `container.replaceChildren()` yourself if you relied on that.

**Config object.** Earlier versions of this page showed `createReactMicroApp(App)`. The function takes a config object: `createReactMicroApp({ name: 'dashboard', App })`.

See the [React guide](/guide/react) for more walkthroughs.
