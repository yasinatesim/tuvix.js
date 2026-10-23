# with-ssr-islands

A React 19 page shell, server-rendered by Express and Vite, that hosts islands built with Vue 3, Svelte 5 and Angular 20. Each island renders to HTML on the server, arrives styled before any JavaScript runs, and hydrates in the browser with its own framework.

The example copies the architecture of [yasinates.com](https://yasinates.com). That site had to hand-roll most of this glue. Here the tuvix packages do it, and the Playwright spec in `e2e/app.spec.ts` checks each piece in a real browser.

## Run it

From the monorepo root, build the packages once, then start the example:

```bash
pnpm install
pnpm build
pnpm --filter with-ssr-islands dev     # Vite dev server on http://localhost:5186
pnpm --filter with-ssr-islands build   # client bundle, then server bundle
pnpm --filter with-ssr-islands start   # production server on http://localhost:5185
```

Set `PORT` to use another port. The end-to-end tests run against the production build:

```bash
pnpm exec playwright test --project=with-ssr-islands
```

## Pages and islands

| Page | Islands |
| --- | --- |
| `/` | Vue card, Svelte counter, React newsletter (`TuvixReactApp`), a ticker that always fails |
| `/lab` | Angular contact form, Svelte counter |
| `/about` | The Vue card with different props |

The header has a "Re-render host" button. Each click re-renders the whole React tree, so you can watch the islands survive parent renders.

## Layout

```text
with-ssr-islands/
├── server.mjs                 Express: Vite middleware in dev, dist/ in production
├── vite.config.ts             React, Vue and Svelte plugins plus tuvix()
└── src/
    ├── entry-server.tsx       render(url): page HTML, island HTML, <head> asset tags
    ├── entry-client.tsx       starts the island runtime, then hydrateRoot()
    ├── App.tsx                header, client navigation with interceptLinks()
    ├── routes.ts              path → page module, matched with matchPath()
    ├── content.ts             island props shared by server and client
    ├── pages/                 Home, Lab, About (React)
    ├── islands/
    │   ├── vue-card/          VueCard.vue + createSsrVueMicroApp
    │   ├── svelte-counter/    Counter.svelte + createSsrSvelteMicroApp
    │   ├── angular-contact/   standalone component + createSsrAngularMicroApp
    │   └── ticker/            hand-written module whose mount rejects
    ├── react-app/             Newsletter.tsx + Newsletter.module.css
    ├── runtime/islands.ts     page effects driven by onLifecycle() and whenMounted()
    └── server/render-islands.ts  server-only island rendering
```

## What each piece demonstrates

### Islands keep their DOM across parent re-renders

**yasinates.com problem:** the site's React bridge passed the island HTML through `dangerouslySetInnerHTML`. When the root re-rendered on navigation, React saw a new `{ __html }` object, assigned `innerHTML` again, and threw away the DOM the island's framework had hydrated, listeners included. The bridge also needed the HTML string on the client, so every page shipped it twice.

`TuvixIsland` from `@tuvix.js/react` creates the `{ __html }` object once. During hydration it reads the island's HTML back from the page, so the client bundle never carries the server HTML a second time. New props go to the adapter's `update()`: the Vue card's "Host renders seen" number follows the header button, while its button node and like counter stay the same.

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, h } from 'vue';

const Card = defineComponent({
  props: { hostRenders: Number },
  setup: (props) => () => h('p', `Host renders seen: ${props.hostRenders ?? 0}`),
});
const vueCard = createSsrVueMicroApp({ name: 'vue-card', App: Card });

export function Page({ hostRenders, html }: { hostRenders: number; html?: string }) {
  return (
    <TuvixIsland
      name="vue-card"
      app={vueCard}
      props={{ hostRenders }}
      ssrHtml={html}
      fallback={<p>The Vue card failed to load.</p>}
    />
  );
}
```

### Server HTML comes from server-only functions

**yasinates.com problem:** the site called the island renderers from isomorphic route loaders. On client navigation the browser downloaded `@tuvix.js/vue/server` and `@tuvix.js/svelte/server`, the production client build contained Vue's server renderer, and the renderers returned `''` in the browser. The Angular contact page gave up on server rendering and shipped a static snapshot.

`src/server/render-islands.ts` calls `renderVueToString`, `renderSvelteToString` and `renderAngularToString`. Only `entry-server.tsx` imports that file, so none of the three renderers reach the client bundle. The HTML travels to `TuvixIsland` through a React context (`src/island-html.ts`) on the server; the client passes an empty object.

- Svelte: the call passes `render` from `svelte/server`, so the adapter uses the same Svelte copy as the compiled component.
- Angular: the render runs without zone.js and returns the component's `<style>` tags with the markup. The `props` option sets the contact component's `heading` input before the first change detection; the client island passes the same object.

### No flash of unstyled content

**yasinates.com problem:** the framework's route manifest dropped the CSS of route chunks, so the live home page rendered unstyled with JavaScript disabled. The site fixed it with its own Vite plugin that collected route stylesheets.

The `tuvix()` plugin from `@tuvix.js/vite` provides `virtual:tuvix/assets`. `entry-server.tsx` asks it for the client entry and the current page module:

```ts
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';

export async function headTags(pageEntry: string): Promise<string> {
  return renderAssetTags(await getAssets(['src/entry-client.tsx', pageEntry]));
}
```

In production the plugin reads the client manifest and follows static imports, so the page's tags include the CSS of every island the page imports: the Vue scoped styles, the Svelte component CSS, and the React CSS Module. In dev it walks Vite's module graph and turns off its own `<link>` once Vite injects the same stylesheet. The spec loads each page with JavaScript disabled and checks computed colours on the scoped and module classes.

### Svelte `onMount` runs in the browser

**yasinates.com problem:** Vite's dependency optimizer resolved the bare `svelte` import to Svelte's server runtime in the dev client, so `onMount` did nothing. The footer switched to a Svelte action to work around it.

With Vite 6 and `@sveltejs/vite-plugin-svelte` 5 the example needs no `resolve.conditions` setting: the client build gets Svelte's browser runtime and the SSR build gets its server runtime. `createSsrSvelteMicroApp` hydrates the server markup. The counter renders `data-onmount="pending"` on the server; its `onMount` switches that to `ran` and plays the entrance transition, and the spec checks both states.

### Angular without zone.js

**yasinates.com problem:** zone.js on the server broke every data fetch, and the client had to import `@angular/compiler` at the top of the entry to fix load order.

`createSsrAngularMicroApp` runs zoneless. The contact component keeps its state in a signal, so Angular 20 schedules change detection after the click without zone.js. The adapter loads `@angular/compiler` before the other Angular packages when the component is not AOT-compiled, so no file in this example imports the compiler. The compiler still ships to the browser: it loads as its own chunk when the first Angular island mounts. An AOT build would remove it; this example does not set one up.

### Client navigation from inside any island

**yasinates.com problem:** plain `<a href>` links inside the Vue, Svelte and Angular markup did full page loads until the site wrote its own global click listener (`spaLinks.ts`).

`App.tsx` calls `interceptLinks` from `@tuvix.js/router` once. It handles same-origin clicks anywhere in the document, including inside the Vue, Svelte and Angular islands, loads the target page module, and pushes the URL. Islands on the new page mount fresh (`hydrated: false`).

### A page runtime that waits for islands

**yasinates.com problem:** the header runtime attaches scroll and pointer effects to DOM that the other frameworks render. To avoid binding before hydration, it polled for private fields such as `__vue_app__` and `__ngContext__`, with a 3 second timeout.

Every adapter dispatches `tuvix:mounted` on the island container. `src/runtime/islands.ts` listens with `onLifecycle('mounted', ...)`, adds a "live" badge and binds a tilt effect to `[data-tilt]` elements. It also uses `whenMounted('vue-card')`, which resolves even when the island mounted before the call.

```ts
import { onLifecycle } from '@tuvix.js/loader';

const stop = onLifecycle('mounted', ({ container }) => {
  container.classList.add('is-live');
});
```

### One broken island stays contained

`src/islands/ticker` is a hand-written module whose `mount` rejects. `TuvixIsland` renders its `fallback` in place of the ticker, and the other islands keep working. A module you write by hand has to call `emitLifecycle('error', ...)` itself; the framework adapters do it for you.

`TuvixReactApp` gives the same protection to the inline React micro app: it wraps the app in an error boundary and a `<Suspense>` with the `fallback` you pass.

## Monorepo notes

- `vite.config.ts` sets `resolve.dedupe` for React, Vue, Svelte and Angular. The workspace links `@tuvix.js/*` from `packages/`, and those packages carry their own dev copies of the frameworks (Angular 16 for `@tuvix.js/angular`). An app that installs `@tuvix.js` from npm does not need this.
- `vite.config.ts` puts `@angular/core` in its own chunk. Without it, Rollup merges `@angular/core` into the lab page chunk, the manifest lists that chunk under its hash instead of `src/pages/Lab.tsx`, and `getAssets` rejects.

## What the spec checks

`e2e/app.spec.ts` runs against the production server, plus one smoke test against the dev server:

1. With JavaScript disabled, each island's text is in the page and styled from the `<head>` stylesheets.
2. After hydration every island dispatched `tuvix:mounted` with `hydrated: true`, and the ticker dispatched `tuvix:error`.
3. No test logs a console error or warning, or throws a page error. Vue, Svelte and React report hydration mismatches there.
4. Three host re-renders keep the Vue button node and its click listener.
5. Links inside the Vue, Svelte and Angular islands navigate without a full page load, and the next page's islands mount.
6. The Svelte `onMount` effect ran.
7. The Angular button updates its text with no zone.js on the page.
8. The ticker shows its fallback while the other islands respond to clicks.
