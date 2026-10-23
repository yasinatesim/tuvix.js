# tuvix.js

> Un solo pacchetto per orchestratore, router, event bus, loader e sandbox di Tuvix.js.

Fa parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

Documentazione completa: [tuvix.js.org/it/packages/tuvix](https://tuvix.js.org/it/packages/tuvix)

## Installazione

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

Questo installa `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` e `@tuvix.js/sandbox`. Ogni pacchetto dichiara `"sideEffects": false`, quindi il tuo bundler scarta gli export che non importi mai.

## Quando usarlo

Usa `tuvix.js` in una shell che combina l'orchestratore con il router, il bus o la sandbox. Installa invece un pacchetto con scope quando una micro app ha bisogno di un solo pezzo (per esempio `@tuvix.js/event-bus` per `getGlobalBus()`), o quando ti serve un export che il pacchetto ombrello non include (vedi sotto). Entrambi possono convivere in un progetto: `getGlobalBus()` e il registro del ciclo di vita condividono lo stato tramite `window`.

## Avvio rapido

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

Ogni export è una riesportazione.

| Origine | Export runtime | Tipi |
| --- | --- | --- |
| [`@tuvix.js/core`](https://tuvix.js.org/it/packages/core) | `Orchestrator`, `createOrchestrator`, `defineMicroApp`, `OrchestratorEvent` | `AppStatus`, `AppErrorEvent`, `AppErrorPhase`, `AppSandboxOption`, `MicroAppConfig`, `RegisteredApp`, `RouterSource`, `OrchestratorConfig`, `MicroAppDefinition` |
| [`@tuvix.js/event-bus`](https://tuvix.js.org/it/packages/event-bus) | `EventBus`, `createEventBus`, `getGlobalBus`, `resetGlobalBus` | `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` |
| [`@tuvix.js/router`](https://tuvix.js.org/it/packages/router) | `Router`, `createRouter`, `matchPath`, `matchRoute`, `normalizePath`, `interceptLinks`, `resolveLink` | `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute`, `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` |
| [`@tuvix.js/loader`](https://tuvix.js.org/it/packages/loader) | `ModuleLoader`, `createLoader`, `whenMounted`, `onLifecycle`, `isMounted` | `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext`, `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` |
| [`@tuvix.js/sandbox`](https://tuvix.js.org/it/packages/sandbox) | `Sandbox`, `CssSandbox`, `JsSandbox`, `createSandbox` | `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles` |

Non inclusi: `registerModule`, `emitLifecycle`, `hasServerMarkup`, gli helper per gli script e i tipi `EntryLoader` / `MicroAppBus` (installa `@tuvix.js/loader`); `pathToRegex`, `parseQuery`, `isPathActive` (installa `@tuvix.js/router`); gli adapter per i framework, `@tuvix.js/server`, `@tuvix.js/module-federation`, `@tuvix.js/vite` e `@tuvix.js/devtools`.

## Casi limite

- C'è un solo entry point. `tuvix.js/core` e gli altri sottopercorsi non vengono risolti.
- Un pacchetto con scope a una versione diversa da quella del pacchetto ombrello ti dà due copie. Lo stato condiviso su `window` funziona comunque; i controlli `instanceof` tra copie diverse falliscono.
- `whenMounted`, `onLifecycle` e `isMounted` vedono gli eventi DOM `tuvix:*`, emessi dai moduli `defineMicroApp` e dagli adapter per i framework. `isMounted(name)` resta `true` finché un qualsiasi container dell'app è montato.
- `resetGlobalBus()` distrugge il bus che un orchestratore in esecuzione sta usando. Chiamalo dopo `destroy()`.
- Le breaking change di `@tuvix.js/core` e `@tuvix.js/router` 0.5.0 valgono anche qui.

## Cosa non fa

- Non aggiunge codice proprio.
- Non include adapter, rendering lato server, Module Federation, Vite o DevTools.

## Licenza

MIT
