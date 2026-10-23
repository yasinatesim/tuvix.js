# @tuvix.js/core

> Orquestrador que carrega micro apps e os monta ou desmonta conforme a URL muda.

Parte do framework de microfrontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

Documentação completa: [tuvix.js.org/packages/core](https://tuvix.js.org/packages/core)

## Instalação

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

Depende de `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` e `@tuvix.js/sandbox`.

## Início rápido

Shell:

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/settings/*', app: 'settings' }] },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

orchestrator.register({
  name: 'settings',
  entry: { scripts: ['/settings/main.js'], styles: ['/settings/main.css'] },
  container: '#main',
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

App remoto (`dashboard/main.js`):

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## Como os apps ficam ativos

- `activeWhen: '/path'`: comparado com `matchPath` de `@tuvix.js/router`. Query e hash são ignorados, `'/dashboard'` e `'/dashboard/*'` correspondem a `/dashboard` e a todo subcaminho (não a `/dashboards`), `:id` corresponde a um segmento, `'/'` corresponde a todo caminho.
- `activeWhen: (path) => boolean`: sua função decide.
- Sem `activeWhen`, com nome em `router.routes`: ativo enquanto uma rota com `app: name` corresponder por completo. Uma rota `'/'` significa apenas a página inicial; `'/*'` significa todo caminho.
- Nenhum dos dois: você chama `mountApp` / `unmountApp`; as reconciliações não mexem no app.
- `mountWhenVisible: true`: monta quando o container fica 10 % visível; `activeWhen` é ignorado.

O caminho atual vem do `getPath()` de `connectRouter`, senão do roteador embutido, senão de `window.location.pathname`. As reconciliações rodam uma de cada vez: os apps inativos são desmontados primeiro, depois os apps ativos são montados. Navegações enfileiradas se reduzem ao caminho mais recente. Um app que fica inativo durante o carregamento pula a montagem; um que fica inativo no meio da montagem é desmontado assim que a montagem termina.

## API

### `createOrchestrator(config?)` / `new Orchestrator(config?)`

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | nenhum | Roteador embutido: `mode` (`'history'` por padrão ou `'hash'`), `base`, `routes` (obrigatório). |
| `eventBus` | `EventBusOptions` | nenhum | Opções de um bus privado. Se omitido, o orquestrador usa `getGlobalBus()`. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Repassado ao loader de módulos, junto com `globals`. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | `immediate` no `start()`, `idle` no primeiro período ocioso, `hover` quando um link de mesma origem que ativa um app recebe ponteiro ou foco. |
| `onError` | `(error: Error, appName: string) => void` | nenhum | Falhas de carregamento, bootstrap, montagem, atualização e desmontagem. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | nenhum | Toda mudança de status. |

### Métodos de `Orchestrator`

| Método | Comportamento |
| --- | --- |
| `register(appConfig: MicroAppConfig): void` | Armazena a configuração. Não carrega, não monta nem reconcilia. |
| `unregister(name): Promise<void>` | Desmonta, remove as tags e o módulo em cache da entry e esquece o app. |
| `start(): Promise<void>` | Passa a seguir o roteador, reconcilia, inicia o prefetch e a observação da viewport. Emite `STARTED`. |
| `mountApp(name): Promise<void>` | Aguarda uma desmontagem em andamento e monta. Rejeita com o erro depois de renderizar o `fallback`. |
| `unmountApp(name): Promise<void>` | Aguarda um carregamento ou montagem em andamento e desmonta. |
| `updateAppProps(name, props): Promise<void>` | Mescla as props de forma rasa. Chama `update({ props, container })` em um app montado; caso contrário, guarda as props para a próxima montagem. |
| `reconcile(path?): Promise<void>` | Enfileira uma reconciliação para `path` ou para o caminho atual. |
| `connectRouter({ subscribe, getPath }): () => void` | Segue um roteador externo. Retorna `disconnect`. |
| `navigateTo(path): Promise<void>` | `push(path)` no roteador embutido. Lança `[Tuvix] No router configured.` se não houver um. |
| `getAppStatus(name): AppStatus \| null` | Status, ou `null` para nomes desconhecidos. |
| `getRegisteredApps(): string[]` | Nomes registrados. |
| `getMountedApps(): string[]` | Nomes com status `'mounted'`. |
| `getEventBus(): IEventBus` | `getGlobalBus()` ou o bus privado. |
| `getRouter(): IRouter \| null` | Roteador embutido ou `null`. |
| `destroy(): Promise<void>` | Aguarda uma reconciliação em andamento, desmonta todos os apps, para de escutar e emite `DESTROYED`. Mantém o bus global ativo. |

Opções de `register`:

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Único; o app remoto se registra com o mesmo nome. |
| `entry` | `Entry` | obrigatório | URL, `{ scripts, styles?, type?, integrity? }` ou `() => import('./app')`. |
| `container` | `string \| HTMLElement` | obrigatório | Seletor (resolvido a cada montagem) ou elemento. |
| `activeWhen` | `string \| ((path: string) => boolean)` | nenhum | Regra de ativação. |
| `props` | `Record<string, unknown>` | nenhum | Repassadas a `mount()`. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | Renderiza dentro de um shadow root com os `styles` da entry carregados lá. |
| `fallback` | `string` | nenhum | HTML definido com `innerHTML` em falha de carregamento, bootstrap ou montagem. |
| `mountWhenVisible` | `boolean` | `false` | Monta quando 10 % fica visível na viewport. |

`connectRouter` com TanStack Router:

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
// later: disconnect();
```

### `defineMicroApp(definition): MicroAppModule`

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Deve ser igual ao nome registrado. |
| `bootstrap` | `() => void \| Promise<void>` | nenhum | Roda antes da primeira montagem. Um bootstrap que falha roda de novo na próxima montagem; um que dá certo roda uma única vez. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | obrigatório | Recebe `container`, `props`, `name` e `bus`. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | obrigatório | Recebe `container`. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | nenhum | Recebe `props` e `container`. |
| `ssr` | `boolean` | `false` | `mount` adota o markup do servidor; o evento `mounted` informa `hydrated: true` quando o container tinha markup. |

Publica o módulo com `registerModule` de `@tuvix.js/loader` e o retorna. O módulo dispara os eventos DOM `tuvix:mounted`, `tuvix:unmounted` e `tuvix:error` (que sobem até `document`), então `whenMounted`, `isMounted` e `onLifecycle` funcionam com ele. Um `unmount` durante um `mount` em andamento no mesmo container aguarda esse `mount`. Lança um erro quando `name`, `mount` ou `unmount` está ausente.

### `OrchestratorEvent`

Eventos no bus do orquestrador: `APP_REGISTERED` (`tuvix:app:registered`), `APP_BOOTSTRAP`, `APP_MOUNT`, `APP_UNMOUNT`, `APP_ERROR` (`AppErrorEvent`: `{ name, error, phase }` para falhas em `'load'`, `'bootstrap'`, `'mount'`, `'update'` ou `'unmount'`), `APP_STATUS_CHANGE` (`{ name, status }`), `ROUTE_CHANGE` (apenas roteador embutido), `STARTED`, `DESTROYED`.

```ts
import { getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

### Isolamento de CSS

`sandbox: true` ou `{ css: true }` anexa um shadow root aberto ao container (reutilizado ao remontar), monta o app em um `<div data-tuvix-sandbox-root>` dentro dele e carrega ali os `styles` da entry. A montagem aguarda as folhas de estilo por até `loader.timeout`. O JavaScript não fica em sandbox; `JsSandbox` de `@tuvix.js/sandbox` é um utilitário independente.

### Tipos

`OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition`, `AppSandboxOption`, `RouterSource`, `AppErrorEvent`, `AppErrorPhase`, `AppStatus` (`registered`, `bootstrapping`, `bootstrapped`, `mounting`, `mounted`, `updating`, `unmounting`, `unmounted`, `error`), `RegisteredApp` (formato do registro; nenhum método o retorna).

### Reexportações

- De `@tuvix.js/event-bus`: `createEventBus`, `getGlobalBus`, tipos `IEventBus`, `EventHandler`, `Unsubscribe`.
- De `@tuvix.js/router`: `createRouter`, `matchPath`, `interceptLinks`, tipos `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions`.
- De `@tuvix.js/loader`: `createLoader`, tipos `Entry`, `MicroAppModule`.

## Casos extremos

- `register()` depois de `start()` reconcilia um app gerenciado por rota com o caminho atual, então ele é montado na hora quando está ativo. Um app `mountWhenVisible` registrado depois de `start()` passa a ser observado na hora; um container que não estiver no DOM nesse momento nunca é observado.
- Falhas de reconciliação não rejeitam `start()` nem `reconcile()`; elas vão para `onError` e para o console. `mountApp` rejeita.
- Um app em `error` tenta de novo na próxima reconciliação que o quiser ativo. O `fallback` só é renderizado em falhas de carregamento, bootstrap e montagem.
- A desmontagem remove as folhas de estilo da entry de `document.head`; a próxima montagem as adiciona de novo.
- Dois orquestradores compartilham `getGlobalBus()`. Passe `eventBus: {}` para ter um bus privado.
- Depois de `destroy()`, os métodos que alteram estado lançam `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`.

## O que ele não faz

- Isolar JavaScript em sandbox.
- Interceptar cliques em links (use `interceptLinks`).
- Renderizar no servidor (use `@tuvix.js/server`).
- Compartilhar dependências entre apps (use `@tuvix.js/module-federation` ou import maps).
- Emitir eventos DOM `tuvix:mounted` para módulos escritos à mão; `defineMicroApp` e os adaptadores de framework fazem isso.

## Migração a partir da 0.4

- O orquestrador usa `getGlobalBus()`, a menos que você passe `eventBus`; `destroy()` mantém o bus global ativo.
- As reconciliações não desmontam mais apps montados manualmente nem apps `mountWhenVisible`.
- `sandbox: true` renderiza dentro de um shadow root.
- `prefetch: 'hover'` faz prefetch apenas dos apps que um link sob o ponteiro ou com foco ativa.
- `activeWhen` usa `matchPath`: query e hash são ignorados, `:param` funciona, `.` e `(` correspondem literalmente.
- `OrchestratorConfig.shared` foi removido (nunca era lido). Use `@tuvix.js/module-federation` ou import maps.
- As `routes` do roteador correspondem por completo: uma rota `'/'` é apenas a página inicial; use `'/*'` para todo caminho. `RouteConfig.exact` foi removido.
- `APP_ERROR` traz `phase` e também dispara em falhas de atualização e desmontagem.
- `connectRouter({ subscribe, getPath })` substitui a ponte `setTimeout` + `reconcile()` para roteadores externos.

## Licença

MIT
