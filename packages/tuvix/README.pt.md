# tuvix.js

> Um único pacote para o orquestrador, o roteador, o event bus, o loader e o sandbox do Tuvix.js.

Parte do framework de microfrontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

Documentação completa: [tuvix.js.org/packages/tuvix](https://tuvix.js.org/packages/tuvix)

## Instalação

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

Isso instala `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` e `@tuvix.js/sandbox`. Todos os pacotes declaram `"sideEffects": false`, então seu bundler descarta os exports que você nunca importa.

## Quando usar

Use `tuvix.js` em um shell que combina o orquestrador com o roteador, o bus ou o sandbox. Instale um pacote com escopo quando um micro app precisar de apenas uma parte (por exemplo, `@tuvix.js/event-bus` para `getGlobalBus()`), ou quando você precisar de um export que o pacote guarda-chuva deixa de fora (veja abaixo). Os dois podem conviver em um mesmo projeto: `getGlobalBus()` e o registro de ciclo de vida compartilham estado por meio de `window`.

## Início rápido

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

Todo export é uma reexportação.

| Origem | Exports de runtime | Tipos |
| --- | --- | --- |
| [`@tuvix.js/core`](https://tuvix.js.org/packages/core) | `Orchestrator`, `createOrchestrator`, `defineMicroApp`, `OrchestratorEvent` | `AppStatus`, `AppErrorEvent`, `AppErrorPhase`, `AppSandboxOption`, `MicroAppConfig`, `RegisteredApp`, `RouterSource`, `OrchestratorConfig`, `MicroAppDefinition` |
| [`@tuvix.js/event-bus`](https://tuvix.js.org/packages/event-bus) | `EventBus`, `createEventBus`, `getGlobalBus`, `resetGlobalBus` | `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` |
| [`@tuvix.js/router`](https://tuvix.js.org/packages/router) | `Router`, `createRouter`, `matchPath`, `matchRoute`, `normalizePath`, `interceptLinks`, `resolveLink` | `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute`, `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` |
| [`@tuvix.js/loader`](https://tuvix.js.org/packages/loader) | `ModuleLoader`, `createLoader`, `whenMounted`, `onLifecycle`, `isMounted` | `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext`, `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` |
| [`@tuvix.js/sandbox`](https://tuvix.js.org/packages/sandbox) | `Sandbox`, `CssSandbox`, `JsSandbox`, `createSandbox` | `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles` |

Não incluídos: `registerModule`, `emitLifecycle`, `hasServerMarkup`, os helpers de script e os tipos `EntryLoader` / `MicroAppBus` (instale `@tuvix.js/loader`); `pathToRegex`, `parseQuery`, `isPathActive` (instale `@tuvix.js/router`); os adaptadores de framework, `@tuvix.js/server`, `@tuvix.js/module-federation`, `@tuvix.js/vite` e `@tuvix.js/devtools`.

## Casos extremos

- Existe um único entry point. `tuvix.js/core` e outros subcaminhos não são resolvidos.
- Um pacote com escopo em uma versão diferente da do pacote guarda-chuva gera duas cópias. O estado compartilhado em `window` continua funcionando; verificações com `instanceof` entre cópias falham.
- `whenMounted`, `onLifecycle` e `isMounted` enxergam os eventos DOM `tuvix:*`, que os módulos de `defineMicroApp` e os adaptadores de framework emitem. `isMounted(name)` continua `true` enquanto qualquer container do app estiver montado.
- `resetGlobalBus()` destrói o bus que um orquestrador em execução mantém. Chame-o depois de `destroy()`.
- As breaking changes de `@tuvix.js/core` e `@tuvix.js/router` 0.5.0 também se aplicam aqui.

## O que ele não faz

- Ele não adiciona nenhum código próprio.
- Ele não inclui adaptadores, renderização no servidor, Module Federation, Vite nem DevTools.

## Licença

MIT
