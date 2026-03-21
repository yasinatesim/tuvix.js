---
"@tuvix.js/react": minor
"@tuvix.js/svelte": minor
"@tuvix.js/vue": minor
"@tuvix.js/angular": minor
---

## SSR Multi-Framework Support + TuvixReactApp Rename

### `@tuvix.js/react`

- **Renamed** `TuvixApp` → `TuvixReactApp` for naming consistency with `TuvixSvelteApp`, `TuvixVueApp`, `TuvixAngularApp`
- `TuvixApp` kept as `@deprecated` alias — backward compatible, removed in next major

### `@tuvix.js/svelte` — SSR Support

- **New** `renderSvelteToString(App, props?)` — server-side render a Svelte component to HTML string. Supports Svelte 5 (`svelte/server`) and Svelte 3/4 (`App.render()`)
- **New** `createSsrSvelteMicroApp(config)` — orchestrator lifecycle module with hydration support. Uses `hydrate: true` when SSR content is already in the container
- **New** `TuvixSvelteApp` — React component for use in SSR route files (TanStack Start, Next.js, Remix). Accepts `ssrHtml` from the route loader for correct React hydration

### `@tuvix.js/vue` — SSR Support

- **New** `renderVueToString(App, props?, plugins?)` — server-side render a Vue 3 component using `@vue/server-renderer`
- **New** `createSsrVueMicroApp(config)` — orchestrator lifecycle using `createSSRApp` for automatic Vue hydration
- **New** `TuvixVueApp` — React component for SSR route files. Accepts `ssrHtml` from loader

### `@tuvix.js/angular` — SSR Support (Angular 17+ Standalone)

- **New** `renderAngularToString(component, options?)` — server-side render a standalone Angular component via `@angular/platform-server`
- **New** `createSsrAngularMicroApp(config)` — orchestrator lifecycle with `provideClientHydration()` support
- **New** `TuvixAngularApp` — React component for SSR route files. Accepts `ssrHtml` from loader
- `createAngularMicroApp` (NgModule) kept as legacy, not removed

### Usage Pattern (all frameworks)

```tsx
// routes/iletisim.tsx
export const Route = createFileRoute('/iletisim')({
  loader: async () => {
    const { renderVueToString } = await import('@tuvix.js/vue')
    const { default: App } = await import('~/micro-apps/contact/App.vue')
    return { ssrHtml: await renderVueToString(App) }
  },
  component: function () {
    const { ssrHtml } = Route.useLoaderData()
    return <TuvixVueApp name="contact-app" App={ContactApp} ssrHtml={ssrHtml} />
  },
})
```
