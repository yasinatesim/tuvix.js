# Troubleshooting

Each entry starts with what you see, then the cause and the fix.

## Svelte: onMount never runs, or mount() throws lifecycle_function_unavailable

**Symptom.** A Svelte island renders but `onMount` callbacks never fire, or Svelte 5 `mount()` throws `lifecycle_function_unavailable`.

**Cause.** `svelte` ships a browser runtime and a server runtime under the same import. Your client bundle picked the server one. Some SSR setups (Vinxi, custom Vite environments, Vitest in jsdom) resolve the client without the `browser` export condition, and Vite's dependency optimizer then pre-bundles the server runtime. In the browser devtools you see `svelte/src/index-server.js` (Svelte 5) or `svelte/src/runtime/ssr.js` (Svelte 4) instead of the client file.

**Fix.** Put `browser` back into the client's resolve conditions, then restart Vite with `--force` so it rebuilds the optimized deps:

```ts
// vite.config.ts (the client build or client environment)
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  resolve: { conditions: ['browser', ...defaultClientConditions] },
});
```

For Vitest with jsdom, add the condition and inline Svelte so Vite resolves it:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['browser'] },
  test: { environment: 'jsdom', server: { deps: { inline: [/svelte/] } } },
});
```

Do not exclude `svelte` from `optimizeDeps`; esbuild then fails with "The entry point "svelte" cannot be marked as external".

## Vue: the ~ alias fails in .vue files

**Symptom.** The production build fails with `Rollup failed to resolve import "~/utils/x" from ".../Card.vue?vue&type=script..."`, while the same import works in `.ts` files and `import type` from `~/` works in `.vue` files.

**Cause.** `vite-tsconfig-paths` applies aliases only to files its tsconfig `include`s. A tsconfig that includes `**/*.ts` and `**/*.tsx` leaves `.vue` files out. Type-only imports are erased before resolution, so they never fail.

**Fix.** Include `.vue` files in that tsconfig:

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

or declare the alias in Vite itself:

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
});
```

Use the Vue - Official (Volar) editor extension. Vetur does not understand `<script setup>` macros or `moduleResolution: "Bundler"`.

## Angular 15-17: clicks do not update the view

**Symptom.** An Angular island renders, but a button handler changes a field and the template does not update.

**Cause.** The adapter runs Angular without zone.js. Angular 18+ schedules change detection on its own in zoneless mode; on 15-17 the adapter replaces `NgZone` with a no-op zone, and nothing runs change detection after DOM events.

**Fix.** Call `detectChanges()` after the change:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-like',
  standalone: true,
  template: `<button (click)="like()">{{ likes }}</button>`,
})
export class LikeComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  likes = 0;

  like(): void {
    this.likes += 1;
    this.cdr.detectChanges();
  }
}
```

Or import `zone.js` at the top of your client entry and pass `zone: true` to `createAngularMicroApp`. Keep zone.js out of the server: it patches the global `Promise` and breaks server-side `fetch`.

## Hydration mismatch from dates

**Symptom.** React reports error #418 (or Vue and Svelte log a hydration mismatch) only for some users or only near midnight. The diff shows a date one day apart, such as `21 Mart 2026` against `22 Mart 2026`.

**Cause.** The server formats dates in its time zone (usually UTC) and the browser formats them in the user's zone. `new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })` without `timeZone` gives different text on each side.

**Fix.** Pass an explicit `timeZone` everywhere you format dates that the server renders:

```ts
const format = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Istanbul',
});

console.log(format.format(new Date('2026-03-21T22:30:00Z'))); // 22 Mart 2026 on server and client
```

The same applies to `toLocaleString`, relative times ("3 hours ago") and anything using `Date.now()` during render.

## Data from one request shows up in another

**Symptom.** A server-rendered island shows stale data, or data from another user's request, and the client then re-renders with different content.

**Cause.** A module-level cache, for example `export const queryClient = new QueryClient()` imported by several micro apps, lives for the lifetime of the server process. Every request reads and writes the same instance.

**Fix.** Create the cache per request on the server and pass what the island needs as props. Keep one module-level client only in browser code.

```ts
import { QueryClient } from '@tanstack/query-core';

export function createRequestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}
```

See [Per-request state](/guide/ssr-islands#per-request-state).

## A module-script app does not load after unload

**Symptom.** After `orchestrator.unregister(name)` or `loader.unload(name)`, registering and mounting the same app again fails with `Module "<name>" loaded but no exports found`.

**Cause.** Browsers run a module script once per URL. The second `<script type="module" src="...">` for the same URL does nothing, so the app never calls `registerModule` again.

**Fix.** Use a loader-function entry, which keeps the module in the bundler's module cache, or change the URL (for example a version query string):

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

## "loaded but no exports found"

**Symptom.** `[Tuvix Loader] Module "dashboard" loaded but no exports found.`

**Cause and fix**, in the order to check:

1. The name the bundle registers differs from the registered name. `createReactMicroApp({ name: 'Dashboard' })` and `register({ name: 'dashboard' })` do not match. Use one string.
2. An ES module bundle loaded as a classic script. Vite's ES output ends in `.js`; add `type: 'module'` to the entry.
3. The bundle exports the module but never registers it. Use an adapter or `defineMicroApp`, or call `registerModule(name, module)` yourself.

## Container not found

**Symptom.** `[Tuvix] Container "#app" not found in DOM.`

**Cause.** The orchestrator looks the container up when it mounts the app. A route component of an external router may not have rendered it yet.

**Fix.** Keep containers in a layout that exists before navigation, or host that app with `TuvixIsland` inside the route component. See [External Router](/guide/external-router#containers-rendered-by-routes).

## Unstyled first paint

**Symptom.** With JavaScript disabled, or for a moment on slow connections, server-rendered islands show without their CSS.

**Cause.** Vite injects CSS Modules, Vue `<style>` and Svelte styles from JavaScript. The server HTML links none of them.

**Fix.** Add `tuvix()` from `@tuvix.js/vite` to your Vite config and print `renderAssetTags(await getAssets([...]))` into `<head>`. See [SSR Islands](/guide/ssr-islands).
