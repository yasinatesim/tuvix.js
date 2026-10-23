# @tuvix.js/react

> Turn React components into Tuvix.js micro apps, and host any micro app inside a React tree with SSR hydration.

Part of the [Tuvix.js](https://github.com/yasinatesim/tuvix.js) microfrontend framework.

## Installation

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

Requires React 18 or newer.

## Quick start

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

The module registers itself under `'dashboard'` through `registerModule` from `@tuvix.js/loader`, so the orchestrator finds it after the script loads. Give the orchestrator an `entry` such as `() => import('./dashboard')`, a `container` and `props`.

## API

### `createReactMicroApp(config)`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Registry name; lifecycle events carry it. |
| `App` | `ComponentType<P>` | required | Root component. Receives the mount props; required props type-check. |
| `bootstrap` | `() => void \| Promise<void>` | none | One-time setup. |
| `ssr` | `boolean` | `false` | Hydrate with `hydrateRoot` when the container holds server markup (elements or non-whitespace text). |

- Each container gets its own React root, so one module can mount in several places.
- `mount({ container, props })` resolves after the first commit and dispatches `tuvix:mounted` with `hydrated`.
- `update({ props, container })` re-renders one container, or all of them without `container`. Component state survives.
- `unmount({ container })` unmounts the root, empties the container and dispatches `tuvix:unmounted`.
- `react-dom/client` loads lazily inside `mount`, so server bundles can import the module.

### `createSsrReactMicroApp(config)`

`createReactMicroApp({ ...config, ssr: true })`. Options: `name`, `App`, `bootstrap`. It renders the same tree as `TuvixReactApp`, so it hydrates `TuvixReactApp` markup without a mismatch.

### `TuvixIsland`

Hosts any micro app module (Vue, Svelte, Angular, React or a hand-written `{ mount, unmount, update? }`) inside a React tree.

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Written to `data-tuvix-app`, passed to `mount`. |
| `app` | `MicroAppModule` | required | The module to mount. |
| `props` | `Record<string, unknown>` | `{}` | Compared shallowly; a change calls `app.update({ props, container })`, or remounts when the module has no `update`. |
| `ssrHtml` | `string` | none | Server-rendered HTML of the island. Pass it on the server only. |
| `fallback` | `ReactNode` | `null` | Rendered when `mount` or `update` rejects. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Wrapper tag. |
| `className` | `string` | none | Wrapper class. |

A hand-written `<div dangerouslySetInnerHTML={{ __html }} />` bridge loses the micro app's DOM and listeners on the next parent re-render, because React assigns `innerHTML` again for each new `{ __html }` object. `TuvixIsland` creates that object once. During hydration it finds its element through a `data-tuvix-island` attribute (from `useId`) and reads the HTML back from the page, so the client does not need `ssrHtml`. A new `name` or `app` remounts; removal calls `app.unmount`. Calls run in order, so an unmount waits for a pending mount.

```tsx
// Layout.tsx, rendered on the server with footerHtml and on the client without it
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <TuvixIsland name="footer" app={footer} props={{ year }} ssrHtml={footerHtml} fallback={<footer>© {year}</footer>} />
  );
}
```

```tsx
// entry-server.tsx
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const footerHtml = await renderVueToString(Footer, { year: 2026 });
  return renderToString(<Layout year={2026} footerHtml={footerHtml} />);
}
```

```tsx
// entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

### `TuvixReactApp`

Renders a React micro app inline in the host tree inside `<div data-tuvix-app={name}>`.

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | required | Must match the module's `name`. |
| `App` | `ComponentType<P>` | required | Component to render. |
| `fallback` | `ReactNode` | `null` | Shown while `App` suspends or after it throws. |
| other props | `P` | required by `P` | Passed to `App`. |

`App` sits in an error boundary and a `<Suspense fallback>`. A server render error replaces only this app with `fallback` and React retries it on the client. A client render error shows `fallback` and dispatches `tuvix:error`. It dispatches `tuvix:mounted` (with `hydrated`) and `tuvix:unmounted`.

### `useTuvixBus(bus, event, handler)`

Subscribes in an effect and unsubscribes on unmount. The latest `handler` is kept in a ref, so it does not resubscribe each render. Pass `getGlobalBus()` from `@tuvix.js/event-bus`; the adapter does not hand the orchestrator bus to `App`.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Returns props that merge each payload of `updateEvent` (default `'tuvix:props:update'`) on `bus`. Nothing in Tuvix emits that event; you emit it. Modules from `createReactMicroApp` receive new props through `update` without this hook.

### Types

`ReactMicroAppConfig<P>`, `TuvixIslandProps`, `TuvixReactAppProps<P>`.

## Edge cases

- A throw in the first render rejects `mount`, empties the container and dispatches `tuvix:error`. A later throw blanks the app until you remount it.
- `unmount` during a pending `mount` waits for it and leaves the container empty.
- `mount` on a container the module already holds unmounts the old root (dispatching `tuvix:unmounted`) and renders fresh with the new props, like the Vue, Svelte and Angular adapters.
- `unmount` and `update` on an unknown container do nothing.
- When React removes a `TuvixIsland`, the module reports `tuvix:unmounted` after the element is detached. The event goes to `document` (with `detail.container` set), so `document` listeners and `onLifecycle` receive it; listeners on the container or its ancestors do not. `isMounted(name)` turns `false` once no container of the app is mounted.
- Under `<StrictMode>` in development React runs the island's mount effect twice, but the island skips the discarded first run: the module mounts once and adopts the server markup.
- After a failed mount, a new `app` or `name` mounts into an empty element. It never receives the failed app's server HTML.

## What it does not do

- Load modules by URL. Use `@tuvix.js/core` or `@tuvix.js/loader`.
- Render to a string. Use `react-dom/server`, or `renderVueToString` and friends for `ssrHtml`.
- Load island CSS. Use `@tuvix.js/vite`.

## Breaking changes in 0.5

- `TuvixReactApp` server HTML now has Suspense comment markers; upgrade server and client together.
- `mount` rejects when the first render throws.
- `unmount` on a container the module never mounted does nothing.

Full documentation: [tuvix.js.org/packages/react](https://tuvix.js.org/packages/react)

## License

MIT
