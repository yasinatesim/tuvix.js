---
"@tuvix.js/core": minor
---

Serialized reconciles, external router bridge, CSS sandbox, and a shared event bus.

- Route changes reconcile one at a time. When several arrive during a reconcile, only the newest path runs next. Apps that turn inactive unmount before newly active apps mount, so apps that share a container never overlap. An app that turns inactive while it loads skips its mount; one that turns inactive while it mounts unmounts as soon as the mount settles. Navigating A → B → A quickly leaves only A mounted.
- `unmountApp()` waits for an in-flight mount and then unmounts. `mountApp()` waits for an in-flight unmount. `updateAppProps()` waits for a pending mount, and unmount waits for a pending update.
- `activeWhen` strings use `matchPath` from `@tuvix.js/router`: the query string and hash no longer unmount an app, and `:param` patterns work as the docs describe.
- Router `routes` activate the app they name when that app has no `activeWhen`.
- `orchestrator.connectRouter({ subscribe, getPath })` follows an external router such as TanStack Router or React Router. It replaces the `setTimeout` + `reconcile()` bridge.
- `mount()` receives `name` and `bus` (the orchestrator's event bus) in its context. `update()` receives the `container`.
- `config.loader` passes `timeout`, `retries`, `retryDelay` and `globals` to the module loader.
- `sandbox: true` or `{ css: true }` renders the app inside a shadow root on its container and loads the entry's `styles` there instead of in `document.head`. The orchestrator reuses the shadow root on remount and waits for the stylesheets (up to the loader timeout) before mounting. It does not sandbox JavaScript; use `JsSandbox` from `@tuvix.js/sandbox` for that.
- Unmount removes the app's entry stylesheets from `document.head`; the next mount adds them back.
- After a CSS-isolated app unmounts, its container's shadow root holds only a `<slot>`, so an app without `sandbox` that mounts next in the same container renders visibly. The isolated app's stylesheets stay parked in the shadow root for its next mount. The orchestrator wraps the container only when the mount goes ahead, not when the app turned inactive during load.
- `unregister()` flags the app before unmounting it. A navigation that arrives during the unmount no longer mounts it again; `mountApp(name)` rejects with "not registered" from that point.
- `prefetch: { strategy: 'hover' }` prefetches an app when the pointer enters, or focus lands on, a same-origin link whose path activates that app. It resolves links with `resolveLink` from `@tuvix.js/router`, so the router `base`, hash mode and shadow-root links work and SVG links are ignored. `destroy()` cancels pending idle and hover prefetching.
- `defineMicroApp` publishes the module with `registerModule` from `@tuvix.js/loader` and dispatches the adapter lifecycle events: `tuvix:mounted` after `mount`, `tuvix:unmounted` after `unmount`, and `tuvix:error` (then rethrows) when either throws. `whenMounted(name)` and `isMounted(name)` now work for vanilla apps. An `unmount` for a container whose `mount` is still running waits for it. The new `ssr: true` option makes the `mounted` event report `hydrated: true` when the container held server markup before `mount`.
- `register()` after `start()` mounts the app right away when the current path activates it. A `mountWhenVisible` app registered after `start()` gets observed even when no viewport app existed at start; 0.4 never observed it.
- A `bootstrap()` that throws runs again on the next mount. 0.4 kept the module and skipped `bootstrap` from then on.
- Every lifecycle failure (load, bootstrap, mount, update, unmount) sets status `error`, calls `onError` and emits `tuvix:app:error` with `{ name, error, phase }`. 0.4 emitted the bus event only for load and mount failures.
- New exports: the types `RouterSource`, `AppSandboxOption`, `AppErrorEvent` and `AppErrorPhase`, and re-exports of `matchPath`, `interceptLinks`, `PathMatch` and `InterceptLinksOptions`.

Breaking:

- The orchestrator's event bus is `getGlobalBus()` unless you pass `eventBus` options. `destroy()` leaves the global bus alive and destroys only a private one. In 0.4 every orchestrator created its own bus, separate from `getGlobalBus()`.
- Reconciles no longer unmount apps that have neither `activeWhen` nor a router route, nor `mountWhenVisible` apps. 0.4 unmounted a manually mounted app on the next route change.
- Apps registered with `sandbox: true` now render inside a shadow root. Page-level CSS no longer reaches them, and their entry `styles` no longer reach the page.
- `prefetch: 'hover'` no longer prefetches every app on the first mouse movement anywhere on the page.
- `activeWhen` pattern characters such as `.` and `(` match literally.
- `OrchestratorConfig.shared` is gone. The orchestrator never read it; share dependencies with `@tuvix.js/module-federation` or import maps.
