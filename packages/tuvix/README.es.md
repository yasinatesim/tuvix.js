# tuvix.js

> Un solo paquete para el orquestador, el router, el event bus, el loader y el sandbox de Tuvix.js.

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

Documentación completa: [tuvix.js.org/packages/tuvix](https://tuvix.js.org/packages/tuvix)

## Instalación

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

Esto instala `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` y `@tuvix.js/sandbox`. Cada paquete declara `"sideEffects": false`, así que tu bundler descarta los exports que nunca importas.

## Cuándo usarlo

Usa `tuvix.js` en una shell que combine el orquestador con el router, el bus o el sandbox. Instala en su lugar un paquete con scope cuando una micro app solo necesite una pieza (por ejemplo, `@tuvix.js/event-bus` para `getGlobalBus()`), o cuando necesites un export que el paquete paraguas no incluye (ver más abajo). Ambos pueden convivir en un mismo proyecto: `getGlobalBus()` y el registro de ciclo de vida comparten estado a través de `window`.

## Inicio rápido

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

Todos los exports son reexportaciones.

| Origen | Exports de runtime | Tipos |
| --- | --- | --- |
| [`@tuvix.js/core`](https://tuvix.js.org/packages/core) | `Orchestrator`, `createOrchestrator`, `defineMicroApp`, `OrchestratorEvent` | `AppStatus`, `AppErrorEvent`, `AppErrorPhase`, `AppSandboxOption`, `MicroAppConfig`, `RegisteredApp`, `RouterSource`, `OrchestratorConfig`, `MicroAppDefinition` |
| [`@tuvix.js/event-bus`](https://tuvix.js.org/packages/event-bus) | `EventBus`, `createEventBus`, `getGlobalBus`, `resetGlobalBus` | `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` |
| [`@tuvix.js/router`](https://tuvix.js.org/packages/router) | `Router`, `createRouter`, `matchPath`, `matchRoute`, `normalizePath`, `interceptLinks`, `resolveLink` | `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute`, `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` |
| [`@tuvix.js/loader`](https://tuvix.js.org/packages/loader) | `ModuleLoader`, `createLoader`, `whenMounted`, `onLifecycle`, `isMounted` | `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext`, `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` |
| [`@tuvix.js/sandbox`](https://tuvix.js.org/packages/sandbox) | `Sandbox`, `CssSandbox`, `JsSandbox`, `createSandbox` | `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles` |

No se incluyen: `registerModule`, `emitLifecycle`, `hasServerMarkup`, los helpers de scripts y los tipos `EntryLoader` / `MicroAppBus` (instala `@tuvix.js/loader`); `pathToRegex`, `parseQuery`, `isPathActive` (instala `@tuvix.js/router`); los adaptadores de framework, `@tuvix.js/server`, `@tuvix.js/module-federation`, `@tuvix.js/vite` y `@tuvix.js/devtools`.

## Casos límite

- Hay un único punto de entrada. `tuvix.js/core` y otros subpaths no se resuelven.
- Un paquete con scope en una versión distinta a la del paquete paraguas te deja con dos copias. El estado compartido en `window` sigue funcionando; las comprobaciones `instanceof` entre copias fallan.
- `whenMounted`, `onLifecycle` e `isMounted` ven los eventos DOM `tuvix:*`, que emiten los módulos de `defineMicroApp` y los adaptadores de framework. `isMounted(name)` sigue en `true` mientras cualquier contenedor de la app esté montado.
- `resetGlobalBus()` destruye el bus que tiene un orquestador en ejecución. Llámalo después de `destroy()`.
- Los cambios incompatibles de `@tuvix.js/core` y `@tuvix.js/router` 0.5.0 también se aplican aquí.

## Lo que no hace

- No añade código propio.
- No incluye adaptadores, renderizado en el servidor, Module Federation, Vite ni DevTools.

## Licencia

MIT
