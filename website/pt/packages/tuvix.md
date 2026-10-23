---
title: 'tuvix.js'
---

<PackageHeader
  name="tuvix.js"
  title="tuvix.js (guarda-chuva)"
  description="Um pacote, um caminho de import. Reexporta o orquestrador de @tuvix.js/core e as APIs públicas de @tuvix.js/router, @tuvix.js/event-bus, @tuvix.js/loader e @tuvix.js/sandbox."
  icon="🎁"
  github="tuvix"
/>

## Instalação

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

Instalar `tuvix.js` instala `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` e `@tuvix.js/sandbox`. Os seis pacotes publicam builds em ES module e CommonJS e declaram `"sideEffects": false`.

## Quando usar

Instale `tuvix.js` em uma aplicação shell que usa o orquestrador junto com o roteador, o event bus ou o sandbox. Você tem uma única dependência para versionar e um único caminho de import, e o seu bundler descarta os exports que você nunca importa.

Instale os pacotes com escopo quando:

- Um micro app só conversa com o shell. O `@tuvix.js/event-bus` sozinho fornece `getGlobalBus()`, sem trazer o orquestrador para o `node_modules` dele.
- Você precisa de um export que o pacote guarda-chuva deixa de fora, como `registerModule` ou `emitLifecycle` de `@tuvix.js/loader`, ou `pathToRegex` de `@tuvix.js/router`. Veja [Não incluído](#nao-incluido).
- Você quer que o seu `package.json` declare de quais partes do Tuvix.js um pacote depende.

Misturar os dois é seguro. O pacote guarda-chuva reexporta os mesmos módulos, então `getGlobalBus` de `tuvix.js` e de `@tuvix.js/event-bus` retornam o mesmo bus, e os helpers de ciclo de vida compartilham um único registro em `window`.

## Início rápido

Um shell que monta `about` em `/about`, transforma cliques em links em navegações do roteador e registra erros dos apps no log:

```ts
import { createOrchestrator, getGlobalBus, interceptLinks, OrchestratorEvent, type AppErrorEvent } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

orchestrator.register({
  name: 'about',
  entry: 'https://cdn.example.com/about/main.js',
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

O app `about`, com build gerado em `https://cdn.example.com/about/main.js`:

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Clicar em `<a href="/about?ref=nav">` faz push de `/about?ref=nav`, e o orquestrador monta `about` em `#main` (a query string não afeta a correspondência).

## API

Todos os exports abaixo são reexports. A página do pacote indicada documenta a assinatura, as opções e os casos extremos de cada um.

### De `@tuvix.js/core`

Documentação: [`@tuvix.js/core`](/pt/packages/core).

| Export | Tipo | O que faz |
| --- | --- | --- |
| `createOrchestrator` | function | Cria um `Orchestrator`. |
| `Orchestrator` | class | Registra apps, reconcilia-os com a URL, segue um roteador (`connectRouter`), atualiza props e destrói. |
| `defineMicroApp` | function | Valida um objeto `{ name, bootstrap?, mount, unmount, update?, ssr? }`, registra-o para o loader e faz com que ele emita `tuvix:mounted` / `tuvix:unmounted` / `tuvix:error`. |
| `OrchestratorEvent` | enum | Nomes dos eventos que o orquestrador emite no seu bus (`tuvix:app:mount`, `tuvix:app:error`, ...). |
| `OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition` | type | Argumentos de `createOrchestrator`, `register` e `defineMicroApp`. |
| `AppStatus`, `AppSandboxOption`, `RouterSource`, `RegisteredApp` | type | Union de status do app, a opção `sandbox`, o argumento de `connectRouter` e o formato do registro do app. |
| `AppErrorEvent`, `AppErrorPhase` | type | Payload `{ name, error, phase }` de `APP_ERROR` e a union de fases (`'load'`, `'bootstrap'`, `'mount'`, `'update'`, `'unmount'`). |

### De `@tuvix.js/event-bus`

Documentação: [`@tuvix.js/event-bus`](/pt/packages/event-bus).

| Export | Tipo | O que faz |
| --- | --- | --- |
| `EventBus` | class | Bus pub/sub com `on`, `once`, `emit`, `off`, `onAny`. |
| `createEventBus` | function | Cria um novo `EventBus` separado. |
| `getGlobalBus` | function | Retorna o bus da página inteira armazenado em `window.__TUVIX_GLOBAL_BUS__`. O orquestrador o usa por padrão. |
| `resetGlobalBus` | function | Destrói o bus da página inteira; o próximo `getGlobalBus()` cria um novo. |
| `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` | type | Interface do bus, assinaturas dos handlers, função de cancelamento de inscrição e opções do construtor. |

### De `@tuvix.js/router`

Documentação: [`@tuvix.js/router`](/pt/packages/router).

| Export | Tipo | O que faz |
| --- | --- | --- |
| `Router` | class | Roteador em modo history ou hash que mapeia caminhos para nomes de apps. |
| `createRouter` | function | Cria um `Router`. |
| `matchPath` | function | Compara um caminho com um padrão (`:param`, `/*`, query e hash ignorados). Strings em `activeWhen` usam essa função. |
| `matchRoute` | function | Retorna a primeira rota de um `RouteConfig[]` que corresponde ao caminho por completo, com `params` e `query`. |
| `normalizePath` | function | Adiciona uma barra no início e remove a barra do final. |
| `interceptLinks` | function | Transforma cliques em links de mesma origem em uma chamada `navigate(path)`, com prefetch por intenção opcional. |
| `resolveLink` | function | Retorna `{ anchor, url, path }` para o link HTML em que um evento aconteceu, ou `null` quando o navegador deve tratá-lo. |
| `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute` | type | Interface do roteador, opções e formatos de rota. |
| `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler` | type | Payload de navegação e assinaturas de guard e listener. |
| `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` | type | Resultado e opções de `matchPath`, opções de `interceptLinks` e resultado e opções de `resolveLink`. |

### De `@tuvix.js/loader`

Documentação: [`@tuvix.js/loader`](/pt/packages/loader).

| Export | Tipo | O que faz |
| --- | --- | --- |
| `ModuleLoader` | class | Carrega uma entry (URL, configuração de script/style ou função loader) com timeout, novas tentativas e cache. |
| `createLoader` | function | Cria um `ModuleLoader`. |
| `whenMounted` | function | Resolve quando um app emite o seu evento de ciclo de vida `mounted`. |
| `onLifecycle` | function | Escuta os eventos DOM `tuvix:mounted`, `tuvix:unmounted` ou `tuvix:error`. |
| `isMounted` | function | `true` enquanto qualquer container do app estiver montado, de acordo com os eventos de ciclo de vida. |
| `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext` | type | Formatos de entry e o contrato de ciclo de vida que um micro app implementa. |
| `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy` | type | Opções e resultados do loader. |
| `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` | type | Nomes dos eventos de ciclo de vida, payload e tipo de evento DOM. |

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

const off = onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer', { signal: AbortSignal.timeout(5000) });
console.log(container.id, hydrated);
off();
```

### De `@tuvix.js/sandbox`

Documentação: [`@tuvix.js/sandbox`](/pt/packages/sandbox).

| Export | Tipo | O que faz |
| --- | --- | --- |
| `CssSandbox` | class | Move um container para dentro de um shadow root e carrega stylesheets dentro dele. O orquestrador o usa para `sandbox: true`. |
| `JsSandbox` | class | `window` via Proxy que mantém as globais escritas por um script longe do `window` real. |
| `Sandbox` | class | `CssSandbox` e `JsSandbox` por trás de um único par `activate` / `deactivate`. |
| `createSandbox` | function | Cria um `Sandbox`. |
| `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox` | type | Opções e interfaces dos sandboxes. |
| `AdoptStylesOptions`, `AdoptedStyles` | type | Argumento e valor de retorno de `CssSandbox.adoptStyles`. |

### Não incluído {#nao-incluido}

O pacote guarda-chuva deixa estes itens de fora. Instale o pacote que os fornece.

| Você precisa de | Instale |
| --- | --- |
| `registerModule`, `unregisterModule`, `getRegisteredModule`, `emitLifecycle`, `hasServerMarkup`, `normalizeEntry`, `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource` e os tipos `EntryLoader`, `EntryLoaderContext`, `MicroAppBus`, `ScriptType`, `CacheEntry`, `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions` | [`@tuvix.js/loader`](/pt/packages/loader) |
| `pathToRegex`, `parseQuery`, `isPathActive` | [`@tuvix.js/router`](/pt/packages/router) |
| Micro apps React, Vue, Svelte ou Angular | [`@tuvix.js/react`](/pt/packages/react), [`@tuvix.js/vue`](/pt/packages/vue), [`@tuvix.js/svelte`](/pt/packages/svelte), [`@tuvix.js/angular`](/pt/packages/angular) |
| Composição no servidor | [`@tuvix.js/server`](/pt/packages/server) |
| Remotes de Module Federation | [`@tuvix.js/module-federation`](/pt/packages/module-federation) |
| Assets de ilhas em builds do Vite | [`@tuvix.js/vite`](/pt/packages/vite) |
| O painel do DevTools | [`@tuvix.js/devtools`](/pt/packages/devtools) |
| Scaffolding de projetos | [`create-tuvix-app`](/pt/packages/create-tuvix-app) |

## Casos extremos

- `tuvix.js` tem um único entry point. Imports de subcaminho como `tuvix.js/core` ou `tuvix.js/router` não são resolvidos; importe de `tuvix.js` ou do pacote com escopo.
- O pacote guarda-chuva fixa as dependências na mesma versão. Instalar `tuvix.js` ao lado de uma versão diferente de um pacote com escopo gera duas cópias desse pacote. `getGlobalBus()` e o registro de ciclo de vida continuam compartilhando estado por meio de `window`, mas verificações `instanceof Orchestrator` ou `instanceof EventBus` falham entre as cópias.
- `whenMounted`, `onLifecycle` e `isMounted` reagem a eventos DOM `tuvix:*`. Os módulos criados com `defineMicroApp` e com os adaptadores de framework os emitem; um módulo escrito à mão não emite nenhum, a menos que chame `emitLifecycle` de `@tuvix.js/loader`. Os eventos de um container fora do documento são disparados em `document`.
- `resetGlobalBus()` destrói o bus que um orquestrador em execução mantém. O orquestrador continua com esse bus destruído, então os eventos dele não chegam mais aos inscritos do próximo `getGlobalBus()`. Chame essa função entre testes, depois de `orchestrator.destroy()`.
- Mudanças de comportamento e breaking changes em `@tuvix.js/core` e `@tuvix.js/router` se aplicam aqui sem alteração. Veja [Migração a partir da 0.4](/pt/packages/core#migracao-a-partir-da-0-4).

## O que ele não faz

- Ele não adiciona código próprio. Todo export vem de um dos cinco pacotes com escopo.
- Ele não inclui os adaptadores de framework, o pacote de servidor, Module Federation, Vite nem DevTools.
- Ele não oferece entries de subcaminho por pacote.
