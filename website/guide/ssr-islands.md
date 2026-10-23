# SSR Islands

An island is a micro app that the server renders to HTML inside a React page, and that the browser hydrates with its own framework. With `TuvixIsland` from `@tuvix.js/react`, one React host can carry Vue, Svelte, Angular and React islands. The user sees styled content before any JavaScript runs, and each island becomes interactive once its framework loads.

## What you need

| Piece | Package | Runs on |
| --- | --- | --- |
| React host page with server rendering | your app (`react-dom/server`, TanStack Start, ...) | server + client |
| `TuvixIsland`, `TuvixReactApp` | `@tuvix.js/react` | server + client |
| Island modules: `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`, `createSsrReactMicroApp` | adapters | client |
| `renderVueToString`, `renderSvelteToString`, `renderAngularToString` | `@tuvix.js/<adapter>/server` | server only |
| `getAssets`, `renderAssetTags` | `@tuvix.js/vite` | server only |

No orchestrator is involved. `TuvixIsland` calls the island module's `mount`, `update` and `unmount` itself.

## How a request flows

```text
server                                         browser
──────                                         ───────
renderVueToString(Card, props) ─┐
                                ▼
<TuvixIsland ssrHtml={html}> renders           HTML arrives, CSS links in <head>
<div data-tuvix-app="card">…html…</div>   ──►  apply → styled first paint
getAssets([...]) → <link rel=stylesheet>
                                               hydrateRoot(host)
                                               TuvixIsland reads its innerHTML from the DOM
                                               React leaves the island's children alone
                                               useEffect → card.mount({ container, props })
                                               Vue adapter: createSSRApp → hydrates in place
                                               tuvix:mounted { hydrated: true }
```

## 1. Configure Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [react(), vue(), svelte(), tuvix()],
});
```

Add `"@tuvix.js/vite/client"` to `compilerOptions.types` so TypeScript knows `virtual:tuvix/assets`.

## 2. Create the island modules

Each island exports a module built with the `Ssr` variant of its adapter. These files run in the browser and must not import server renderers.

```ts
// src/islands/vue-card/index.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import VueCard from './VueCard.vue';

export const vueCard = createSsrVueMicroApp({ name: 'vue-card', App: VueCard });
```

```ts
// src/islands/svelte-counter/index.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Counter from './Counter.svelte';

// SvelteMap makes TuvixIsland prop changes update in place instead of remounting.
export const svelteCounter = createSsrSvelteMicroApp({ name: 'svelte-counter', App: Counter, SvelteMap });
```

```ts
// src/islands/angular-contact/index.ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { ContactComponent } from './contact.component';

export const angularContact = createSsrAngularMicroApp({ name: 'angular-contact', component: ContactComponent });
```

## 3. Render island HTML on the server

Keep the server renderers in a module that only server code imports:

```ts
// src/server/render-islands.ts (server only)
import { renderVueToString } from '@tuvix.js/vue/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import { renderAngularToString } from '@tuvix.js/angular/server';
import { render } from 'svelte/server';
import VueCard from '../islands/vue-card/VueCard.vue';
import Counter from '../islands/svelte-counter/Counter.svelte';
import { ContactComponent } from '../islands/angular-contact/contact.component';

export async function renderIslands(): Promise<Record<string, string>> {
  const [card, counter, contact] = await Promise.all([
    renderVueToString(VueCard, { title: 'Hello' }),
    renderSvelteToString(Counter, { start: 3 }, { render }),
    renderAngularToString(ContactComponent, { appId: 'contact', props: { heading: 'Write to us' } }),
  ]);
  return { 'vue-card': card, 'svelte-counter': counter, 'angular-contact': contact };
}
```

The `render*ToString` functions are server-only. In the browser they return `''`. Call them from code that never runs in the browser: your server entry, an API route, or a framework server function such as TanStack Start's `createServerFn`. Do not call them from an isomorphic route loader. That loader also runs in the browser on client navigation, where it gets `''`, and your bundler ships the Vue, Svelte or Angular server renderer to the client because the loader imports it.

## 4. Put the islands in the page

```tsx
// src/pages/Home.tsx
import { createContext, useContext } from 'react';
import { TuvixIsland } from '@tuvix.js/react';
import { vueCard } from '../islands/vue-card';
import { svelteCounter } from '../islands/svelte-counter';

// Filled by the server entry; empty on the client.
export const IslandHtml = createContext<Record<string, string>>({});

export function Home() {
  const html = useContext(IslandHtml);
  return (
    <main>
      <TuvixIsland
        name="vue-card"
        app={vueCard}
        props={{ title: 'Hello' }}
        ssrHtml={html['vue-card']}
        fallback={<p>The card failed to load.</p>}
      />
      <TuvixIsland name="svelte-counter" app={svelteCounter} props={{ start: 3 }} ssrHtml={html['svelte-counter']} />
    </main>
  );
}
```

Pass the same props on the server and the client. If the server rendered `{ start: 3 }` and the client mounts with `{ start: 4 }`, the framework sees a hydration mismatch.

## 5. Link island CSS in the head

Vite injects CSS Modules, Vue `<style>` blocks and Svelte styles from JavaScript. Without help, server HTML reaches the browser before that JavaScript, and the first paint is unstyled (FOUC). `getAssets` returns the stylesheet URLs an entry needs, so the server can link them in `<head>`:

```tsx
// src/entry-server.tsx
import { renderToString } from 'react-dom/server';
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { Home, IslandHtml } from './pages/Home';
import { renderIslands } from './server/render-islands';

export async function render(): Promise<string> {
  const [islandHtml, assets] = await Promise.all([
    renderIslands(),
    getAssets(['src/entry-client.tsx', 'src/pages/Home.tsx']),
  ]);

  const body = renderToString(
    <IslandHtml.Provider value={islandHtml}>
      <Home />
    </IslandHtml.Provider>,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <title>Home</title>
    ${renderAssetTags(assets)}
  </head>
  <body>
    <div id="app">${body}</div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>`;
}
```

- Pass module paths relative to the Vite root. In a production build each path must be a build input or the target of an `import()` in the client build; anything else rejects.
- If Rollup merges two `import()` targets into one chunk, the manifest lists that chunk under its hashed name instead of your module path, and `getAssets` rejects for that path. The example hits this when `@angular/core` lands in a page chunk, and fixes it with `manualChunks` that give `@angular/core` its own chunk.
- `getAssets` follows static imports and skips `import()` targets. A lazily imported page or island that renders on the server needs its own entry in the list.
- In dev it returns `?direct` CSS URLs, and once Vite injects its own `<style>` it disables the matching `<link>`, so HMR edits apply.
- Angular islands carry their styles inline: `renderAngularToString` puts the component `<style>` tags in front of the markup.
- Svelte: either compile with `css: 'injected'` (styles inline in the island HTML) or keep `emitCss` and link them with `getAssets`. Not both.

## 6. Hydrate on the client

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Home } from './pages/Home';

hydrateRoot(document.getElementById('app')!, <Home />);
```

The client renders without island HTML. Each `TuvixIsland` reads its markup from the page during hydration, React keeps those nodes, and the island module hydrates them.

## Why the HTML is not sent twice

A naive island passes the server HTML as a prop on both sides. React then needs the string on the client to hydrate `dangerouslySetInnerHTML`, so the HTML travels once in the document and again in the hydration data. Every parent re-render with a new `{ __html }` object also makes React assign `innerHTML` again, which wipes the DOM and listeners the island's framework attached.

`TuvixIsland` avoids both:

- On the server it writes `ssrHtml` into `<div data-tuvix-app={name} data-tuvix-island={id}>`.
- During hydration it finds that element by its `useId`-based `data-tuvix-island` attribute and reads `innerHTML` once. The client never needs `ssrHtml`.
- It keeps the `{ __html }` object in state, so later renders hand React the same object and React never rewrites the island's children.

What your framework does with loader data is a separate matter. If you return island HTML from a TanStack Start or Remix loader, the framework serializes that loader result into the page as well. Hand the HTML to the island through something the framework does not serialize, such as a React context your server entry fills, as in step 4.

## Per-request state

Server code handles many requests in one process. Anything you create at module scope lives across all of them.

- Create a data cache such as TanStack Query's `QueryClient` per request, not at module scope. A module-level client on the server mixes data between requests and users, and its stale entries cause hydration mismatches.
- Pass the data an island needs as props, from the request's own cache. The island module creates its own client-side state on mount.
- Format dates and numbers with an explicit `timeZone` and locale. The server usually runs in UTC and the browser in the user's zone; `Intl.DateTimeFormat` without `timeZone` renders a different day near midnight and breaks hydration.

```tsx
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

declare function createRequestCache(): { dehydrate(): unknown };
declare function Page(props: { data: unknown }): ReactElement;

export function renderRequest(): string {
  const cache = createRequestCache(); // one per request
  return renderToString(<Page data={cache.dehydrate()} />);
}
```

## Head and meta tags belong to the host

Islands render into a `<div>` in the body. They must not emit `<title>`, `<meta>` or `<link rel=canonical>`. Set those in the host (your framework's head API, or the HTML template). For Svelte components that use `<svelte:head>`, call `renderSvelte` instead of `renderSvelteToString` and place its `head` output in the document head yourself.

## Errors

- If the island's `mount` or `update` rejects, `TuvixIsland` renders `fallback` instead. The adapter has already dispatched `tuvix:error`.
- If a server renderer throws, your server code decides: catch it and pass no `ssrHtml`, and the island starts empty and renders on the client.
- `TuvixReactApp` wraps its component in `<Suspense>`, so a server render error replaces only that app with its `fallback`, and React retries it on the client.

Watch islands from page code with `onLifecycle('mounted', ...)` and `onLifecycle('error', ...)`; see [Lifecycle Events](/guide/lifecycle-events).

## Example project

`examples/with-ssr-islands` in the repository puts all of this together: an Express + Vite server with a React 19 host, a Vue 3 card, a Svelte 5 counter, a zoneless Angular 20 contact form (JIT; the compiler loads as a lazy chunk), a `TuvixReactApp` newsletter, and one island that fails on purpose to show its fallback. `src/server/render-islands.ts` holds the server renderers, `src/entry-server.tsx` links assets with `getAssets`, and `src/runtime/islands.ts` reacts to lifecycle events. The Angular island gets its `heading` input from the `props` option on the server and the same object on the client. From the repository root, run `pnpm --filter with-ssr-islands dev` (port 5186), or `build` then `start` (port 5185; `PORT` overrides). The example's README explains each piece and the checks its Playwright spec runs.

## What islands do not do

- `TuvixIsland` does not load modules by URL. Import the island module into the host bundle.
- It does not share state between islands. Use props, the event bus, or your own store.
- Angular islands re-render over the server DOM instead of hydrating it non-destructively; see [Angular](/guide/angular).
- Nothing here runs without a server render step. For client-only islands, omit `ssrHtml` and use the non-`Ssr` adapters.
