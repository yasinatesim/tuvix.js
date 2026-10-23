# tuvix.js

> Un seul paquet pour l'orchestrateur, le routeur, l'event bus, le loader et la sandbox de Tuvix.js.

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

Documentation complète : [tuvix.js.org/packages/tuvix](https://tuvix.js.org/packages/tuvix)

## Installation

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

Cela installe `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` et `@tuvix.js/sandbox`. Chaque paquet déclare `"sideEffects": false`, donc votre bundler élimine les exports que vous n'importez jamais.

## Quand l'utiliser

Utilisez `tuvix.js` dans un shell qui combine l'orchestrateur avec le routeur, le bus ou la sandbox. Installez plutôt un paquet scopé quand une micro app n'a besoin que d'une pièce (par exemple `@tuvix.js/event-bus` pour `getGlobalBus()`), ou quand vous avez besoin d'un export que le paquet tout-en-un n'inclut pas (voir ci-dessous). Les deux peuvent coexister dans un même projet : `getGlobalBus()` et le registre de cycle de vie partagent leur état via `window`.

## Démarrage rapide

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

Chaque export est une réexportation.

| Source | Exports runtime | Types |
| --- | --- | --- |
| [`@tuvix.js/core`](https://tuvix.js.org/packages/core) | `Orchestrator`, `createOrchestrator`, `defineMicroApp`, `OrchestratorEvent` | `AppStatus`, `AppErrorEvent`, `AppErrorPhase`, `AppSandboxOption`, `MicroAppConfig`, `RegisteredApp`, `RouterSource`, `OrchestratorConfig`, `MicroAppDefinition` |
| [`@tuvix.js/event-bus`](https://tuvix.js.org/packages/event-bus) | `EventBus`, `createEventBus`, `getGlobalBus`, `resetGlobalBus` | `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` |
| [`@tuvix.js/router`](https://tuvix.js.org/packages/router) | `Router`, `createRouter`, `matchPath`, `matchRoute`, `normalizePath`, `interceptLinks`, `resolveLink` | `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute`, `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` |
| [`@tuvix.js/loader`](https://tuvix.js.org/packages/loader) | `ModuleLoader`, `createLoader`, `whenMounted`, `onLifecycle`, `isMounted` | `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext`, `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` |
| [`@tuvix.js/sandbox`](https://tuvix.js.org/packages/sandbox) | `Sandbox`, `CssSandbox`, `JsSandbox`, `createSandbox` | `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles` |

Non inclus : `registerModule`, `emitLifecycle`, `hasServerMarkup`, les utilitaires de script et les types `EntryLoader` / `MicroAppBus` (installez `@tuvix.js/loader`) ; `pathToRegex`, `parseQuery`, `isPathActive` (installez `@tuvix.js/router`) ; les adaptateurs de frameworks, `@tuvix.js/server`, `@tuvix.js/module-federation`, `@tuvix.js/vite` et `@tuvix.js/devtools`.

## Cas particuliers

- Il n'y a qu'un seul point d'entrée. `tuvix.js/core` et les autres sous-chemins ne se résolvent pas.
- Un paquet scopé dans une version différente de celle du paquet tout-en-un vous donne deux copies. L'état partagé sur `window` fonctionne toujours ; les vérifications `instanceof` entre copies échouent.
- `whenMounted`, `onLifecycle` et `isMounted` voient les événements DOM `tuvix:*`, qu'émettent les modules `defineMicroApp` et les adaptateurs de frameworks. `isMounted(name)` reste `true` tant qu'un conteneur de l'app est monté.
- `resetGlobalBus()` détruit le bus que détient un orchestrateur en cours d'exécution. Appelez-le après `destroy()`.
- Les changements cassants de `@tuvix.js/core` et `@tuvix.js/router` 0.5.0 s'appliquent aussi ici.

## Ce qu'il ne fait pas

- Il n'ajoute aucun code propre.
- Il n'inclut pas les adaptateurs, le rendu côté serveur, Module Federation, Vite ni DevTools.

## Licence

MIT
