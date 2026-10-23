---
"@tuvix.js/loader": minor
---

Loader-function entries, parallel loads, script types, and style cleanup on unmount.

- `Entry` accepts a function such as `() => import('./dashboard')`. The loader takes the module it resolves to, or its `default` export, or the module the import registered with `registerModule`. The function receives `{ signal }`, which aborts when the attempt times out.
- `ModuleLoader` loads different apps in parallel. In 0.4 a module-wide lock made every app wait for the previous one, and one hung script blocked every later app.
- Concurrent `loadScript`/`loadStyle` calls for one URL share one tag, so two entries that list the same vendor script fetch it once. A failed or timed-out load removes its tag; the retry appends a new one. In 0.4 a retry added a second `<script>` for the same URL.
- A timeout aborts the attempt: the loader stops waiting, removes the attempt's `<script>` and `<link>` tags, and starts the next retry.
- `EntryConfig.type: 'module' | 'classic'` sets the script type. Set `'module'` for Vite ES output, which ends in `.js` and loaded as a classic script before. Without it, `.mjs`, `.mts`, `.ts`, `.tsx` and `.jsx` load as modules and other URLs as classic.
- `EntryConfig.integrity` maps script and style URLs to SRI hashes. The loader writes them to the `<script>`, `<link>` and prefetch tags.
- `prefetch()` adds `<link rel="modulepreload">` for module scripts and `<link rel="prefetch">` for classic scripts and styles. It skips loader-function entries, because calling them would run the module.
- `LoaderOptions.globals` works: the loader writes those properties to `window` before an entry's scripts run.
- `removeStyles(name)` removes an app's stylesheets. Core can call it after unmount so an inactive app's CSS stops applying. A stylesheet another loaded app uses stays. The next `load(name)` adds the styles back and waits for them.
- `unload(name)` removes the module from the `registerModule` registry when it is the module this loader resolved, so the next load cannot pick up a stale copy.
- The loader reads the registry through `getRegisteredModule`. For UMD bundles it records which window globals each script defined, at that script's `load` event, and looks only at the globals of the entry's own scripts. Two apps that load at the same time no longer pick up each other's global. A global another app already resolved is skipped until a script assigns it a new value. When one entry's scripts define several globals with `mount`, the loader picks the one named after the app (ignoring case and punctuation) and otherwise fails with the candidate names.
- `MountContext` gains `name?: string` and `bus?: MicroAppBus`. `MicroAppBus` is a structural `{ on, once, emit, off }` type that `IEventBus` satisfies. `UpdateContext` gains `container?: HTMLElement`.
- New exports: `normalizeEntry`, and the types `EntryLoader`, `EntryLoaderContext`, `ScriptType`, `MicroAppBus`, `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions`.
- `loadScript(url, options)` and `loadStyle(url, options)` take an options object with `type`, `integrity`, `signal` and (for styles) `timeout`. The 0.4 forms `loadScript(url, integrity)` and `loadStyle(url, timeoutMs)` still work.

Breaking:

- `LoaderOptions.fetch` and `EntryConfig.html` are gone. The loader never read either field.
- After `unload(name)`, an app whose `type: 'module'` script registered itself does not load again from the same URL, because browsers run a module script once per URL. Use a loader-function entry or a new URL.
- `load()` for a cached module reports the real `duration` instead of `0`.
