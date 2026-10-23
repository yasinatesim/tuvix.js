# Memory: tuvix.js

One file, one line per durable fact. Edit or delete a stale line; never append a correction under it. Facts are background: check that a named file or API still exists before acting on it.

## Workflow

- Git authority is human: agents never commit or push; they hand over a commit message. Contributors use PRs (`CONTRIBUTING.md`), e2e runs in `.husky/pre-push` and CI.
- yasinates.com (`/Users/yasinatesim/Desktop/projects/yasinates.com-new`) is the real consumer and is read-only for tuvix work. Its workarounds define what tuvix must fix.

## yasinates.com lessons

- Island bridges: the site hand-wrote 6 React bridges (`dangerouslySetInnerHTML` + `useEffect` that calls `createSSRApp`, `new Svelte({ hydrate })` or `bootstrapApplication`) because tuvix had no island component. `TuvixIsland` in `@tuvix.js/react` replaces them.
- A bridge must create `{ __html }` once (`useState(() => ({ __html }))`). A new object per render makes React rewrite innerHTML and wipes the hydrated DOM and its listeners.
- Bridges ignored prop changes, so `routes/$postId.tsx` forced remounts with `key={postId}`. Adapters must implement `update`.
- `ssrHtml` passed as TanStack loader data ships twice (DOM + `__TSR_SSR__` JSON, 88 KB on /blog). Read the island HTML from the existing DOM on first client render instead.
- FOUC: TanStack Start's routes manifest preloads JS only and drops route-chunk CSS, so micro-app styles arrived after hydration. The site added `vite-plugins/routeCss.ts` (`virtual:route-css`) to emit `link[data-route-css]` in head.
- Vite plugins must not live in `plugins/` under Nitro (auto-loaded, "default is not exported"); detect the SSR build with `config.router.name === 'ssr'`, not `config.build.ssr`.
- Dev HMR adds `?t=` to client stylesheet hrefs but not server ones, which fails hydration of the whole document; strip `?t=` before comparing.
- zone.js breaks SSR: imported in the Node SSR process it replaces global `Promise`, undici `fetch` then throws `Promise.withResolvers is not a function`. Angular must boot zoneless; never import zone.js.
- Angular compiler ordering: `@angular/common` calls `getCompilerFacade` before `@angular/compiler` loads, and root `"sideEffects": false` tree-shakes a bare `import '@angular/compiler'`. Use a value import (`VERSION`) and keep it out of the shared client entry (+318 KB per page).
- `renderAngularToString` never worked under Nitro/Vinxi; the site serves `/iletisim` from a static string and re-renders on the client.
- Svelte 4 vs 5: Svelte 4 uses `new App({ target, hydrate })`, `$set`, `$destroy`, `App.render`; Svelte 5 uses `mount`, `hydrate`, `unmount` and `render` from `svelte/server`. `@tuvix.js/svelte` must handle both.
- In the Vinxi client build bare `svelte` resolved to the SSR runtime, so `onMount` never ran; Svelte actions (`use:`) still work.
- Hydration TZ mismatch (React #418): `Intl.DateTimeFormat('tr-TR')` without `timeZone` renders differently on a UTC server and a local browser. Always pass `timeZone` in SSR-rendered dates.
- A module-level `QueryClient` on the server shares cache across requests and breaks hydration; create one per request.
- A suspense error in one micro-app (GitHub 403) client-rendered the whole `TuvixReactApp`; error boundaries do not run in SSR, so each app needs its own fallback.
- `render*ToString` called from an isomorphic TanStack loader bundles the server renderer into the client and returns `''` on client navigation; call it from `createServerFn`. `.catch(() => '')` hides SSR failures.
- `createSsrReactMicroApp` typed App as `ComponentType<Record<string, unknown>>` and rejected components with required props.
- With no lifecycle event, the site sniffed `__vue_app__`/`__ngContext__`/`__reactFiber$` and waited 3000 ms; `tuvix:mounted` and `whenMounted` exist to end that.
- Plain `<a href>` inside Vue/Svelte/Angular islands did full reloads; the site routed clicks to TanStack `navigate` by hand (`header/runtime/spaLinks.ts`). `interceptLinks` in `@tuvix.js/router` covers this.
- `getGlobalBus()` and the orchestrator's bus were different objects, so an `emit` on one never reached listeners on the other. Both must resolve to the window-backed global bus.
- `TuvixVueApp`/`TuvixSvelteApp`/`TuvixAngularApp` were listed in the 0.4.0 CHANGELOG but never existed in src. Never document an export the code lacks.

## Stitch lessons (Google Stitch UI generator, yasinates.com redesign)

- Stitch output read as AI slop (mono uppercase labels, numbered sections, fake metadata, cream + serif template). Use it as a mood board only, never for production markup.
- Stitch swaps supplied image URLs for placeholders and invents copy despite explicit bans; real assets need patching by hand.
- `generate_screen_from_text` reports "service unavailable" near 300 s but still finishes; poll `list_screens` for the result.
- Five to seven parallel agents each driving headless Chromium crashed the harness (SIGTRAP). Take screenshots from one out-of-process Puppeteer script.
- Never put API keys on a command line or in chat; a pasted Stitch key had to be rotated.

## CI and enforcement gaps found (2026-10)

- Type-check ran in 5 of 14 packages because 9 scripts were named `typecheck`; every package now uses `check-types`. Do not add a `typecheck` script.
- `pnpm format --check || true` could never fail and `format` was a write command. CI now runs `pnpm format:check`.
- No CI job ran package ESLint; `pnpm lint` (root `eslint.config.mjs`) now runs in CI.
- `main`/`require` pointed at `dist/index.cjs` files tsup never emitted; `pnpm check-package-exports` now guards this.
- Adapter unit tests asserted `toBeDefined()` on exports and never mounted anything. A test must render and assert DOM, events or registry entries.
- `validate-code-examples.ts` only checks imported names exist; docs that call a nonexistent API in all 10 locales still pass. Read the real exports before writing docs.
- E2E: SSR and Module Federation specs were `test.skip(true)` against `:3000` with no webServer. A skipped spec is not a passing spec.
