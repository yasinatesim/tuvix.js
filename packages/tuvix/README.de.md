# tuvix.js

> Ein Paket für Orchestrator, Router, Event Bus, Loader und Sandbox von Tuvix.js.

Teil des [Tuvix.js](https://github.com/yasinatesim/tuvix.js) Microfrontend-Frameworks.

Vollständige Dokumentation: [tuvix.js.org/de/packages/tuvix](https://tuvix.js.org/de/packages/tuvix)

## Installation

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

Damit installierst du `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` und `@tuvix.js/sandbox`. Jedes Paket deklariert `"sideEffects": false`, sodass dein Bundler die Exports verwirft, die du nie importierst.

## Wann du es verwendest

Verwende `tuvix.js` in einer Shell, die den Orchestrator mit dem Router, dem Bus oder der Sandbox kombiniert. Installiere stattdessen ein Scoped Package, wenn eine Micro App nur ein Teil braucht (zum Beispiel `@tuvix.js/event-bus` für `getGlobalBus()`) oder wenn du einen Export brauchst, den das Gesamtpaket weglässt (siehe unten). Beides kann in einem Projekt nebeneinander existieren: `getGlobalBus()` und die Lifecycle-Registry teilen ihren Zustand über `window`.

## Schnellstart

```ts
import { createOrchestrator, defineMicroApp, interceptLinks } from 'tuvix.js';

// Normally this lives in the remote app's bundle.
defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});

const orchestrator = createOrchestrator({ router: { routes: [] } });
orchestrator.register({
  name: 'about',
  entry: { scripts: [] },
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

## API

Jeder Export ist ein Re-Export.

| Quelle | Runtime-Exports | Typen |
| --- | --- | --- |
| [`@tuvix.js/core`](https://tuvix.js.org/de/packages/core) | `Orchestrator`, `createOrchestrator`, `defineMicroApp`, `OrchestratorEvent` | `AppStatus`, `AppErrorEvent`, `AppErrorPhase`, `AppSandboxOption`, `MicroAppConfig`, `RegisteredApp`, `RouterSource`, `OrchestratorConfig`, `MicroAppDefinition` |
| [`@tuvix.js/event-bus`](https://tuvix.js.org/de/packages/event-bus) | `EventBus`, `createEventBus`, `getGlobalBus`, `resetGlobalBus` | `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` |
| [`@tuvix.js/router`](https://tuvix.js.org/de/packages/router) | `Router`, `createRouter`, `matchPath`, `matchRoute`, `normalizePath`, `interceptLinks`, `resolveLink` | `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute`, `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` |
| [`@tuvix.js/loader`](https://tuvix.js.org/de/packages/loader) | `ModuleLoader`, `createLoader`, `whenMounted`, `onLifecycle`, `isMounted` | `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext`, `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` |
| [`@tuvix.js/sandbox`](https://tuvix.js.org/de/packages/sandbox) | `Sandbox`, `CssSandbox`, `JsSandbox`, `createSandbox` | `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles` |

Nicht enthalten: `registerModule`, `emitLifecycle`, `hasServerMarkup`, die Skript-Helfer und die Typen `EntryLoader` / `MicroAppBus` (installiere `@tuvix.js/loader`); `pathToRegex`, `parseQuery`, `isPathActive` (installiere `@tuvix.js/router`); die Framework-Adapter, `@tuvix.js/server`, `@tuvix.js/module-federation`, `@tuvix.js/vite` und `@tuvix.js/devtools`.

## Sonderfälle

- Es gibt einen einzigen Entry Point. `tuvix.js/core` und andere Subpfade werden nicht aufgelöst.
- Ein Scoped Package in einer anderen Version als der des Gesamtpakets gibt dir zwei Kopien. Gemeinsamer Zustand auf `window` funktioniert weiterhin; `instanceof`-Prüfungen über Kopien hinweg schlagen fehl.
- `whenMounted`, `onLifecycle` und `isMounted` sehen `tuvix:*`-DOM-Events, die Module aus `defineMicroApp` und die Framework-Adapter senden. `isMounted(name)` bleibt `true`, solange irgendein Container der App gemountet ist.
- `resetGlobalBus()` zerstört den Bus, den ein laufender Orchestrator hält. Ruf es nach `destroy()` auf.
- Breaking Changes in `@tuvix.js/core` und `@tuvix.js/router` 0.5.0 gelten auch hier.

## Was es nicht tut

- Es bringt keinen eigenen Code mit.
- Es enthält keine Adapter, kein Server-Rendering, keine Module Federation, kein Vite und keine DevTools.

## Lizenz

MIT
