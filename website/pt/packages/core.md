---
title: '@tuvix.js/core'
---

<PackageHeader
  name="@tuvix.js/core"
  title="Orquestrador principal"
  description="Registra micro apps, carrega suas entries e os monta ou desmonta conforme a URL muda. Segue o roteador embutido ou um externo, isola o CSS do app em uma shadow root quando solicitado e reporta eventos de ciclo de vida em um event bus compartilhado."
  icon="⚙️"
  npm="true"
/>

## Instalação

```bash
npm install @tuvix.js/core
# or pnpm add @tuvix.js/core
```

`@tuvix.js/core` depende de `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` e `@tuvix.js/sandbox`. Seu gerenciador de pacotes os instala junto.

## Quando usar

Use o orquestrador na página host (o shell) quando vários apps construídos de forma independente compartilham uma página e a URL decide qual deles fica visível. Você registra cada app uma vez com a URL da entry, o container e os caminhos que ele controla. O orquestrador carrega a entry no primeiro uso, chama `bootstrap`, `mount` e `unmount` do app e mantém a página sincronizada a cada navegação.

Escolha outra opção nestes casos:

- Você renderiza uma ilha de framework por página e o servidor já decide o que mostrar. Os adaptadores (`@tuvix.js/react`, `@tuvix.js/vue`, `@tuvix.js/svelte`, `@tuvix.js/angular`) e o [`@tuvix.js/vite`](/pt/packages/vite) montam ilhas sem orquestrador.
- Você só precisa carregar um script remoto e chamar o ciclo de vida dele por conta própria. Use [`@tuvix.js/loader`](/pt/packages/loader).
- Você quer tudo a partir de um único import. Instale o pacote guarda-chuva [`tuvix.js`](/pt/packages/tuvix), que reexporta este pacote.

## Início rápido

O shell registra dois apps que compartilham `#main`, segue a URL do navegador com o roteador embutido e transforma cliques em links da mesma origem em navegações do roteador:

```ts
import { createOrchestrator, interceptLinks } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/settings/*', app: 'settings' }],
  },
  loader: { timeout: 8000, retries: 1 },
  onError: (error, appName) => console.error(`[${appName}]`, error),
});

// Active on /dashboard and every path below it.
orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard',
  props: { theme: 'dark' },
});

// No activeWhen: the router route above activates it on /settings/*.
orchestrator.register({
  name: 'settings',
  entry: {
    scripts: ['https://cdn.example.com/settings/main.js'],
    styles: ['https://cdn.example.com/settings/main.css'],
  },
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Cada remoto publica seu ciclo de vida sob o nome que o shell registrou. `defineMicroApp` faz isso para código DOM puro; os adaptadores de framework fazem isso para componentes React, Vue, Svelte e Angular.

```ts
// dashboard/main.ts, built to https://cdn.example.com/dashboard/main.js
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'dashboard',
  mount({ container, props, bus }) {
    container.innerHTML = `<h1>Dashboard (${String(props?.theme ?? 'light')})</h1>`;
    bus?.emit('dashboard:ready', { at: Date.now() });
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

## Como os apps ficam ativos

Todo app registrado segue uma de cinco regras de ativação. O orquestrador escolhe a regra a partir da config do app.

| Config | O app fica ativo quando | Quem o desmonta |
| --- | --- | --- |
| `activeWhen: '/path'` | `matchPath('/path', currentPath).matched` é `true` | a próxima reconciliação em que o caminho deixa de corresponder |
| `activeWhen: (path) => boolean` | sua função retorna `true` | a próxima reconciliação em que ela retorna `false` |
| sem `activeWhen`, nomeado em `router.routes` | uma rota com `app: name` corresponde ao caminho inteiro | a próxima reconciliação em que nenhuma rota assim corresponde |
| sem `activeWhen`, sem rota | nunca por conta própria | você, com `mountApp` / `unmountApp` |
| `mountWhenVisible: true` | seu container está pelo menos 10 % dentro da viewport | você; as reconciliações o ignoram e `activeWhen` é ignorado |

Strings de `activeWhen` passam por [`matchPath`](/pt/packages/router) de `@tuvix.js/router`, o mesmo matcher que o roteador e o `@tuvix.js/server` usam:

- `?query` e `#hash` são ignorados, então `/dashboard?tab=2` mantém o dashboard montado.
- Um padrão simples corresponde aos seus subcaminhos em limites de segmento: `'/dashboard'` corresponde a `/dashboard` e `/dashboard/stats`, e não corresponde a `/dashboards`.
- `'/dashboard/*'` corresponde aos mesmos caminhos que `'/dashboard'`.
- `:name` corresponde a um segmento: `'/users/:id'` corresponde a `/users/42`.
- `'/'` corresponde a todo caminho.
- Outros caracteres, como `.` e `(`, correspondem literalmente.

As `routes` do roteador usam correspondência completa. `{ path: '/settings' }` corresponde apenas a `/settings`; escreva `'/settings/*'` para incluir subcaminhos. Uma rota `'/'` ativa apenas na página inicial, e `'/*'` ativa em todo caminho. Query strings e hashes também são ignorados aqui.

### De onde vem o caminho atual

O orquestrador lê o caminho da primeira fonte que existir:

1. O roteador que você passou para `connectRouter` (o `getPath()` dele).
2. O roteador embutido de `config.router` (o `currentPath` dele).
3. `window.location.pathname`.

Com `config.router` ou `connectRouter`, toda navegação dispara uma reconciliação. Sem nenhum dos dois, `start()` reconcilia uma vez com `window.location.pathname` e nada reage a navegações posteriores até você chamar `reconcile()`.

### Reconciliações rodam uma de cada vez {#reconciliacoes-rodam-uma-de-cada-vez}

Uma reconciliação compara cada app gerenciado por rota com o caminho e faz o DOM corresponder:

1. Apps que devem ficar inativos são desmontados primeiro, todos em paralelo, para que dois apps que compartilham um container nunca se sobreponham.
2. Apps que devem ficar ativos então são carregados (só na primeira vez), passam pelo bootstrap (até uma chamada de `bootstrap` ter sucesso) e são montados, em paralelo.

Quando uma navegação chega durante uma reconciliação, o orquestrador a coloca na fila. Se três navegações entrarem na fila, apenas o caminho mais recente roda em seguida, e a promise de cada chamador resolve quando a fila esvazia. Um app que fica inativo enquanto sua entry carrega pula a montagem. Um app que fica inativo no meio de `mount()` é desmontado assim que essa montagem termina. Navegar rapidamente `/a` → `/b` → `/a` deixa apenas `a` montado.

## API

### `createOrchestrator`

```ts no-check
function createOrchestrator(config?: OrchestratorConfig): Orchestrator;
```

Cria um `Orchestrator`. O mesmo que `new Orchestrator(config)`.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `router` | `RouterConfig` | nenhum | Cria o roteador embutido de `@tuvix.js/router` com `mode` (`'history'` ou `'hash'`, padrão `'history'`), `base` e `routes` (obrigatório, pode ser `[]`). Necessário para `navigateTo` e eventos `ROUTE_CHANGE`. |
| `eventBus` | `EventBusOptions` | nenhum | Opções (`maxListeners`, `debug`, `logger`) para um bus privado. Omita e o orquestrador usa `getGlobalBus()`, o bus que todos os apps da página compartilham. |
| `loader` | `LoaderOptions` | `{ timeout: 10000, retries: 2, retryDelay: 1000 }` | Repassado ao `ModuleLoader` interno. `timeout` vale por tentativa, em ms (`0` o desativa); `globals` são gravados em `window` antes de os scripts de uma entry rodarem. |
| `prefetch` | `{ strategy: 'immediate' \| 'idle' \| 'hover' \| 'none' }` | `{ strategy: 'none' }` | Quando baixar entries antes de serem necessárias. Veja abaixo. |
| `onError` | `(error: Error, appName: string) => void` | nenhum | Chamado quando um app falha ao carregar, no bootstrap, ao montar, atualizar ou desmontar. `OrchestratorEvent.APP_ERROR` reporta as mesmas falhas com a fase. |
| `onStatusChange` | `(appName: string, status: AppStatus) => void` | nenhum | Chamado a cada mudança de status de cada app. |

As estratégias de prefetch baixam URLs de scripts e estilos com `<link rel="prefetch">` ou `<link rel="modulepreload">` sem executá-los. Entries do tipo função loader são ignoradas, porque chamar a função executaria o módulo.

- `'immediate'`: todo app registrado, durante `start()`.
- `'idle'`: todo app registrado, no primeiro `requestIdleCallback` após `start()` (`setTimeout` de 200 ms onde essa API não existe).
- `'hover'`: quando o ponteiro entra em um link da mesma origem, ou o foco cai nele, o orquestrador faz prefetch dos apps que o caminho desse link ativaria. Cada app recebe prefetch uma única vez. O modo hash e `router.base` são respeitados.

`destroy()` cancela o prefetch pendente de idle e hover.

### `Orchestrator`

```ts no-check
class Orchestrator {
  constructor(config?: OrchestratorConfig);
  register(appConfig: MicroAppConfig): void;
  unregister(name: string): Promise<void>;
  start(): Promise<void>;
  mountApp(name: string): Promise<void>;
  unmountApp(name: string): Promise<void>;
  updateAppProps(name: string, props: Record<string, unknown>): Promise<void>;
  reconcile(path?: string): Promise<void>;
  connectRouter(source: RouterSource): () => void;
  navigateTo(path: string): Promise<void>;
  getAppStatus(name: string): AppStatus | null;
  getRegisteredApps(): string[];
  getMountedApps(): string[];
  getEventBus(): IEventBus;
  getRouter(): IRouter | null;
  destroy(): Promise<void>;
}
```

#### `register(appConfig)`

Armazena a config de um app. Não carrega, não monta e não reconcilia nada; `start()` e as navegações posteriores fazem isso.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome único do app. O módulo remoto precisa se registrar com o mesmo nome (`defineMicroApp({ name })` ou o `name` de um adaptador), ou expor um novo global em `window` com uma função `mount`. |
| `entry` | `Entry` | obrigatório | Uma URL de script, um `EntryConfig` (`{ scripts, styles?, type?, integrity? }`) ou uma função loader como `() => import('./dashboard')`. Veja [`@tuvix.js/loader`](/pt/packages/loader). |
| `container` | `string \| HTMLElement` | obrigatório | Seletor CSS ou elemento. Um seletor é resolvido com `document.querySelector` a cada montagem. |
| `activeWhen` | `string \| ((path: string) => boolean)` | nenhum | Regra de ativação. Veja [Como os apps ficam ativos](#como-os-apps-ficam-ativos). |
| `props` | `Record<string, unknown>` | nenhum | Passadas para `mount()`. `updateAppProps` faz merge nelas. |
| `sandbox` | `boolean \| { css?: boolean }` | `false` | `true` ou `{ css: true }` renderiza o app dentro de uma shadow root no container. Veja [Isolamento de CSS](#isolamento-de-css). |
| `fallback` | `string` | nenhum | HTML gravado no container com `innerHTML` quando o carregamento, o bootstrap ou a montagem falha. Falhas de atualização e desmontagem não mexem no container. |
| `mountWhenVisible` | `boolean` | `false` | Monta quando o container fica 10 % visível, usando `IntersectionObserver`. As reconciliações ignoram o app e seu `activeWhen`. |

Lança `[Tuvix] App name is required.`, `[Tuvix] App "<name>" is already registered.`, `[Tuvix] App "<name>" requires an entry.` ou `[Tuvix] App "<name>" requires a container.`.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile'),
  container: '#main',
  activeWhen: '/users/:id',
  fallback: '<p>The profile is unavailable.</p>',
});

orchestrator.register({
  name: 'comments',
  entry: 'https://cdn.example.com/comments/main.js',
  container: '#comments',
  mountWhenVisible: true,
});

await orchestrator.start();
```

#### `start()`

Assina o roteador embutido (se houver), reconcilia com o caminho atual, configura o prefetch e começa a observar os containers de `mountWhenVisible`. Emite `OrchestratorEvent.STARTED`. Resolve após a primeira reconciliação, inclusive quando um app nela falhou; as falhas vão para `onError`, `APP_ERROR` e o console. Uma segunda chamada registra `[Tuvix] Orchestrator is already started.` no log e retorna.

#### `mountApp(name)` / `unmountApp(name)`

Montam ou desmontam um app manualmente. Use-os para apps sem `activeWhen` nem rota; para apps gerenciados por rota, a próxima reconciliação sobrescreve sua escolha.

`mountApp` espera uma desmontagem em andamento e então carrega e monta. Rejeita com o erro de carregamento ou montagem depois de renderizar o `fallback`. `unmountApp` espera um carregamento ou montagem em andamento e então desmonta; chamado durante o carregamento, pula a montagem por completo.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'chat', entry: '/chat/main.js', container: '#chat' });
await orchestrator.start();

document.querySelector('#open-chat')?.addEventListener('click', () => {
  orchestrator.mountApp('chat').catch(() => {
    // fallback HTML is already in #chat
  });
});
```

#### `updateAppProps(name, props)`

Faz um merge raso de `props` nas props atuais do app. Um app montado com função `update` recebe o objeto resultante como `update({ props, container })`. Caso contrário, o orquestrador armazena as props resultantes e as passa para o próximo `mount()`. Ele espera primeiro uma montagem pendente, para que a atualização chegue à nova instância. Quando `update` lança um erro, o status vira `error`, `onError` roda, a promise rejeita e as props armazenadas não mudam.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'cart', entry: '/cart/main.js', container: '#cart', activeWhen: '/' });
await orchestrator.start();

await orchestrator.updateAppProps('cart', { currency: 'EUR' });
```

#### `reconcile(path?)`

Coloca na fila uma reconciliação com `path`, ou com o caminho atual quando você o omite. Use quando nenhum roteador informa o orquestrador sobre navegações. Valem as regras de fila de [Reconciliações rodam uma de cada vez](#reconciliacoes-rodam-uma-de-cada-vez).

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.reconcile('/dashboard?tab=stats');
```

#### `connectRouter(source)`

Segue um roteador externo (TanStack Router, React Router, o seu próprio) em vez do embutido. `source.subscribe(callback)` precisa chamar `callback` após cada navegação e retornar uma função de cancelamento da assinatura; `source.getPath()` retorna o caminho atual. Após `start()`, cada callback reconcilia com `getPath()`. `start()` também lê `getPath()`. Conectar um orquestrador que já iniciou reconcilia na hora. Retorna `disconnect()`.

```ts
import { createOrchestrator } from '@tuvix.js/core';

// TanStack Router instance created elsewhere in your shell.
declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'billing', entry: '/billing/main.js', container: '#main', activeWhen: '/billing' });

const disconnect = orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();

// Later, when the shell tears down:
disconnect();
```

Um data router do React Router (`createBrowserRouter`) se encaixa no mesmo formato: `subscribe: (callback) => router.subscribe(() => callback())` e `getPath: () => router.state.location.pathname`.

#### `navigateTo(path)`

Chama `push(path)` no roteador embutido. A promise resolve depois que a URL muda; a reconciliação que isso dispara roda em segundo plano. Lança `[Tuvix] No router configured.` sem `config.router`.

#### `getAppStatus(name)`, `getRegisteredApps()`, `getMountedApps()`

`getAppStatus` retorna o `AppStatus` do app, ou `null` para um nome desconhecido. `getRegisteredApps` retorna todos os nomes registrados. `getMountedApps` retorna os nomes cujo status é `'mounted'` (um app em `'updating'` fica de fora).

#### `getEventBus()`, `getRouter()`

`getEventBus` retorna o bus em que o orquestrador emite os `OrchestratorEvent`s e que ele passa para `mount()`: `getGlobalBus()`, ou o bus privado quando você define `eventBus`. `getRouter` retorna o roteador embutido, ou `null`.

#### `unregister(name)`

Desmonta o app (esperando uma montagem em andamento), para de observar seu container, remove as tags de script e estilo da entry, descarta o módulo em cache e esquece o app. Rejeita para nomes desconhecidos. Navegadores executam um script de módulo uma vez por URL, então registrar de novo uma entry de URL com `type: 'module'` exige uma nova URL ou uma função loader.

#### `destroy()`

Para o prefetch, cancela a assinatura do roteador embutido e de todo roteador conectado, espera uma reconciliação em execução, desmonta todos os apps, limpa o cache do loader e emite `OrchestratorEvent.DESTROYED`. Destrói um bus privado e mantém o bus global vivo. Chamadas repetidas retornam a mesma promise. Depois disso, `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` e `connectRouter` lançam `[Tuvix] Cannot use a destroyed Orchestrator. Create a new one.`.

### `defineMicroApp`

```ts no-check
function defineMicroApp(definition: MicroAppDefinition): MicroAppModule;
```

Valida um objeto de ciclo de vida, publica-o com `registerModule(definition.name, module)` de `@tuvix.js/loader` e o retorna. Chame-o na entry do app remoto. O orquestrador encontra o módulo pelo nome depois que os scripts da entry rodam, seja a entry uma URL ou uma função loader.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Precisa ser igual ao `name` que o shell registrou. |
| `bootstrap` | `() => void \| Promise<void>` | nenhum | Roda após o primeiro carregamento, antes da primeira montagem. Quando lança um erro, a montagem falha e a próxima montagem o chama de novo; após um sucesso, nunca mais roda para aquele orquestrador. |
| `mount` | `(context: MountContext) => void \| Promise<void>` | obrigatório | Renderiza em `context.container`. |
| `unmount` | `(context: UnmountContext) => void \| Promise<void>` | obrigatório | Desfaz tudo e esvazia `context.container`. |
| `update` | `(context: UpdateContext) => void \| Promise<void>` | nenhum | Aplica `context.props` sem remontar. Sem ele, novas props esperam a próxima montagem. |
| `ssr` | `boolean` | `false` | Defina quando `mount` adota markup renderizado no servidor. O evento `tuvix:mounted` então reporta `hydrated: true` se o container tinha markup antes de `mount` rodar. |

`MountContext` contém:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `container` | `HTMLElement` | Elemento em que renderizar. Para apps com CSS isolado, é um `<div data-tuvix-sandbox-root>` dentro da shadow root. |
| `props` | `Record<string, unknown> \| undefined` | Props atuais. |
| `name` | `string \| undefined` | O nome registrado do app. |
| `bus` | `MicroAppBus \| undefined` | O event bus do orquestrador (`on`, `once`, `emit`, `off`). |

O módulo retornado envolve seus `mount` e `unmount` e dispara os mesmos eventos DOM de ciclo de vida que os adaptadores de framework, então `whenMounted(name)`, `isMounted(name)` e `onLifecycle` de `@tuvix.js/loader` funcionam para esses apps:

- `tuvix:mounted` depois que `mount` resolve, com `{ name, container, hydrated }`.
- `tuvix:unmounted` depois que `unmount` resolve.
- `tuvix:error` quando qualquer um deles lança um erro. O wrapper então relança o erro.

Os eventos sobem (bubble) do container até `document`. Em um container que não está anexado ao documento, o runtime os dispara diretamente em `document`. Um `unmount` que chega enquanto `mount` ainda roda para o mesmo container espera essa montagem primeiro.

Lança `[Tuvix] defineMicroApp requires a "name" property.`, `[Tuvix] defineMicroApp "<name>" requires a "mount" function.` ou `[Tuvix] defineMicroApp "<name>" requires an "unmount" function.`.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let offCart: (() => void) | undefined;

export default defineMicroApp({
  name: 'header',
  bootstrap() {
    console.log('header loaded');
  },
  mount({ container, props, bus }) {
    container.innerHTML = `<header>Hello, ${String(props?.user ?? 'guest')} <span id="count">0</span></header>`;
    offCart = bus?.on<{ count: number }>('cart:changed', ({ count }) => {
      const badge = container.querySelector('#count');
      if (badge) badge.textContent = String(count);
    });
  },
  update({ props, container }) {
    const header = container?.querySelector('header');
    if (header?.firstChild) header.firstChild.textContent = `Hello, ${String(props.user ?? 'guest')} `;
  },
  unmount({ container }) {
    offCart?.();
    container.replaceChildren();
  },
});
```

### `OrchestratorEvent`

Enum de strings com os eventos que o orquestrador emite no seu bus. Como o bus padrão é `getGlobalBus()`, qualquer app da página pode escutá-los.

| Membro | Nome do evento | Payload |
| --- | --- | --- |
| `APP_REGISTERED` | `'tuvix:app:registered'` | `{ name }` |
| `APP_BOOTSTRAP` | `'tuvix:app:bootstrap'` | `{ name }` |
| `APP_MOUNT` | `'tuvix:app:mount'` | `{ name }` |
| `APP_UNMOUNT` | `'tuvix:app:unmount'` | `{ name }` |
| `APP_ERROR` | `'tuvix:app:error'` | `AppErrorEvent`: `{ name, error, phase }`, em que `phase` é `'load'`, `'bootstrap'`, `'mount'`, `'update'` ou `'unmount'` |
| `APP_STATUS_CHANGE` | `'tuvix:app:status-change'` | `{ name, status }` |
| `ROUTE_CHANGE` | `'tuvix:route:change'` | o `NavigationEvent` do roteador embutido (`from`, `to`, `fromRoute`, `toRoute`) |
| `STARTED` | `'tuvix:started'` | `{}` |
| `DESTROYED` | `'tuvix:destroyed'` | `{}` |

`phase: 'load'` cobre tanto a resolução do container quanto o carregamento da entry.

```ts
import { createOrchestrator, getGlobalBus, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
```

### Isolamento de CSS

`sandbox: true` ou `sandbox: { css: true }` isola o CSS de um app:

1. Na primeira montagem, o orquestrador anexa uma shadow root aberta ao container com o `CssSandbox` de [`@tuvix.js/sandbox`](/pt/packages/sandbox) e move os filhos existentes (markup renderizado no servidor) para um `<div data-tuvix-sandbox-root="<name>">` dentro dela. O app é montado nesse div.
2. Os `styles` da entry são carregados como elementos `<link>` dentro da shadow root em vez de `document.head`. A montagem espera até que eles carreguem ou falhem, por no máximo `loader.timeout` ms (10000 por padrão; com `0` espera sem limite).
3. A desmontagem mantém a shadow root. A próxima montagem a reutiliza.

As folhas de estilo da página deixam de atingir elementos dentro do app, e as folhas de estilo do app deixam de chegar à página. Propriedades herdadas como `color` e `font-family` ainda atravessam o limite da shadow root. `{ css: false }` e `false` renderizam no light DOM.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'checkout',
  entry: { scripts: ['/checkout/main.js'], styles: ['/checkout/main.css'] },
  container: '#checkout',
  activeWhen: '/checkout',
  sandbox: { css: true },
});

await orchestrator.start();
```

O orquestrador não isola JavaScript. `JsSandbox` em [`@tuvix.js/sandbox`](/pt/packages/sandbox) é um utilitário independente que você mesmo chama.

### Tipos

| Tipo | Significado |
| --- | --- |
| `OrchestratorConfig` | Argumento de `createOrchestrator` e `new Orchestrator`. Veja a tabela em `createOrchestrator`. |
| `MicroAppConfig` | Argumento de `register`. Veja a tabela em `register`. |
| `MicroAppDefinition` | Argumento de `defineMicroApp`: `name`, `bootstrap?`, `mount`, `unmount`, `update?`. |
| `AppSandboxOption` | `boolean \| { css?: boolean }`, o campo `sandbox`. |
| `RouterSource` | `{ subscribe(callback: () => void): () => void; getPath(): string }`, o argumento de `connectRouter`. |
| `AppErrorEvent` | `{ name: string; error: Error; phase: AppErrorPhase }`, o payload de `APP_ERROR`. |
| `AppErrorPhase` | `'load' \| 'bootstrap' \| 'mount' \| 'update' \| 'unmount'`. |
| `AppStatus` | `'registered' \| 'bootstrapping' \| 'bootstrapped' \| 'mounting' \| 'mounted' \| 'updating' \| 'unmounting' \| 'unmounted' \| 'error'`. A primeira montagem percorre `registered → bootstrapping → bootstrapped → mounting → mounted`; uma remontagem vai de `unmounted → mounting → mounted`. |
| `RegisteredApp` | Formato do registro que o orquestrador mantém para um app: `config`, `status`, `module`, `container`, `error`, `lastUpdated`. Nenhum método de `Orchestrator` o retorna na 0.5.0. |

### Reexportações

`@tuvix.js/core` reexporta estes itens das suas dependências, para que um shell possa importar tudo de um único pacote. Cada link documenta a API completa.

| Export | Tipo | Origem |
| --- | --- | --- |
| `createEventBus`, `getGlobalBus` | função | [`@tuvix.js/event-bus`](/pt/packages/event-bus) |
| `IEventBus`, `EventHandler`, `Unsubscribe` | tipo | [`@tuvix.js/event-bus`](/pt/packages/event-bus) |
| `createRouter`, `matchPath`, `interceptLinks` | função | [`@tuvix.js/router`](/pt/packages/router) |
| `RouterConfig`, `IRouter`, `RouteConfig`, `PathMatch`, `InterceptLinksOptions` | tipo | [`@tuvix.js/router`](/pt/packages/router) |
| `createLoader` | função | [`@tuvix.js/loader`](/pt/packages/loader) |
| `Entry`, `MicroAppModule` | tipo | [`@tuvix.js/loader`](/pt/packages/loader) |

`getGlobalBus()` guarda sua instância em `window.__TUVIX_GLOBAL_BUS__`, então um micro app que empacota a própria cópia de `@tuvix.js/event-bus` recebe o mesmo bus que o shell.

## Casos extremos

- `register()` antes de `start()` apenas armazena a config. Após `start()`, registrar um app gerenciado por rota (ele tem `activeWhen`, ou uma rota do roteador o nomeia) reconcilia com o caminho atual, então o app é montado na hora quando o caminho o ativa.
- Um app `mountWhenVisible` registrado após `start()` passa a ser observado na hora. Um container ausente do DOM nesse momento (ou em `start()`) é ignorado e nunca observado. Sem `IntersectionObserver` (servidor, navegadores antigos), apps de viewport nunca são montados.
- Um app de viewport que falhou ao montar fica em `error`; o observer não tenta de novo.
- Um app gerenciado por rota em `error` tenta de novo na próxima reconciliação que o queira ativo. Um carregamento que falhou carrega de novo. Um `bootstrap` que falhou roda `bootstrap` de novo na nova tentativa; um bem-sucedido não se repete, então um `mount` que falhou tenta de novo apenas o `mount`.
- Um container ausente faz a montagem falhar com `[Tuvix] Container "#main" not found in DOM.`. Em uma primeira montagem, o `fallback` não tem onde ser renderizado.
- Falhas de reconciliação não rejeitam `start()`, `reconcile()` nem navegações. O orquestrador registra `[Tuvix] Failed to mount "<name>":` (ou `unmount`) no console e chama `onError`. `mountApp` e `unmountApp` rejeitam.
- `APP_ERROR` dispara para falhas em todas as fases, com `phase` indicando qual. O `fallback` é renderizado apenas para falhas de `load`, `bootstrap` e `mount`.
- Um app cujo unmount lança um erro termina em `error` e conta como desmontado.
- O `fallback` passa por `innerHTML`. Passe apenas markup confiável.
- A desmontagem remove de `document.head` as folhas de estilo da entry do app, a menos que outro app carregado use a mesma URL. A próxima montagem as adiciona de volta e espera por elas.
- Dois orquestradores na mesma página compartilham `getGlobalBus()` e veem os `OrchestratorEvent`s um do outro. Passe `eventBus: {}` para dar a um deles um bus privado.
- `resetGlobalBus()` de `@tuvix.js/event-bus` destrói o bus que um orquestrador em execução mantém. O orquestrador continua com o bus destruído; chame `resetGlobalBus()` apenas após `destroy()`, por exemplo entre testes.
- Callbacks de `connectRouter` disparados antes de `start()` são ignorados. Chamar `connectRouter` duas vezes mantém as duas assinaturas; a fonte mais recente fornece o caminho para `start()` e `reconcile()`.
- Com `config.router` e `connectRouter` ao mesmo tempo, cada fonte reconcilia com o próprio caminho. Use apenas um deles.
- Funções `activeWhen` recebem o caminho bruto da fonte. Com o roteador embutido ou `connectRouter`, esse caminho pode conter uma query string; `matchPath` a remove para padrões em string.
- `updateAppProps` substitui objetos aninhados: `{ user: { id: 2 } }` sobrescreve a prop `user` inteira.

## O que ele não faz

- Não isola JavaScript. Globais, timers e listeners que um app cria ficam em `window`. Use `JsSandbox` de [`@tuvix.js/sandbox`](/pt/packages/sandbox).
- Não intercepta cliques em links. Chame `interceptLinks` (reexportado aqui) ou deixe o roteador do seu framework navegar.
- Não renderiza no servidor. Use [`@tuvix.js/server`](/pt/packages/server) e as entries `./server` dos adaptadores.
- Não compartilha dependências entre apps. Use [`@tuvix.js/module-federation`](/pt/packages/module-federation) ou import maps.
- Não emite por conta própria os eventos DOM de ciclo de vida (`tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`). Módulos de `defineMicroApp` e os adaptadores de framework os emitem; um `MicroAppModule` escrito à mão não emite nenhum, a menos que chame `emitLifecycle` de `@tuvix.js/loader`.
- Não mantém um app vivo quando ele é desmontado. O state dentro do app se perde, a menos que o app o guarde em outro lugar.

## Migração a partir da 0.4

Breaking changes na 0.5.0:

- **Event bus compartilhado.** O bus do orquestrador é `getGlobalBus()`, a menos que você passe `eventBus`. Na 0.4, cada orquestrador criava o próprio bus. `destroy()` agora mantém o bus global vivo.

  ```ts
  import { createOrchestrator } from '@tuvix.js/core';

  // 0.5: keep a private bus as in 0.4
  const orchestrator = createOrchestrator({ eventBus: {} });
  ```

- **Apps manuais continuam montados.** As reconciliações não desmontam mais apps que não têm nem `activeWhen` nem rota do roteador, nem apps `mountWhenVisible`. Na 0.4, a próxima mudança de rota desmontava um app montado manualmente. Chame `unmountApp(name)` onde você dependia disso.
- **`sandbox: true` usa uma shadow root.** O CSS da página não chega mais ao app, e os `styles` da entry não chegam mais à página. Remova `sandbox` ou defina `{ css: false }` para manter a renderização da 0.4.
- **`prefetch: { strategy: 'hover' }`** faz prefetch apenas dos apps que um link sob o ponteiro ou com foco ativa. Na 0.4, o primeiro movimento do mouse em qualquer lugar fazia prefetch de todos os apps.
- **`activeWhen` usa `matchPath`.** Uma query string ou hash não desmonta mais um app, segmentos `:param` funcionam e caracteres como `.` e `(` correspondem literalmente.
- **`shared` foi removido.** `OrchestratorConfig.shared` nunca foi lido e saiu do tipo. Apague-o; compartilhe dependências com [`@tuvix.js/module-federation`](/pt/packages/module-federation) ou import maps.
- **As `routes` do roteador correspondem ao caminho inteiro.** Uma rota `{ path: '/', app: 'home' }` ativa apenas em `/`. Use `'/*'` para um app que aparece em todo caminho, ou `activeWhen: '/'`, que mantém a correspondência por prefixo. `RouteConfig.exact` foi removido; retire-o.
- **Payload de `APP_ERROR`.** Agora ele traz `phase` e também dispara para falhas de atualização e desmontagem. Handlers que supunham uma falha de montagem devem verificar `phase`.

O contorno da 0.4 para roteadores externos pode sair:

```ts
import { createOrchestrator } from '@tuvix.js/core';

declare const router: {
  subscribe(event: 'onResolved', callback: () => void): () => void;
  state: { location: { pathname: string } };
};

const orchestrator = createOrchestrator();

// 0.4:
// router.subscribe('onResolved', () => setTimeout(() => orchestrator.reconcile(location.pathname)));

// 0.5:
orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});
await orchestrator.start();
```

Versões anteriores desta página descreviam métodos e opções que `Orchestrator` não tem. Use os nomes reais:

| Página antiga | API real |
| --- | --- |
| `createOrchestrator({ container })` | `container` pertence a cada app em `register()` |
| `register(name, options)` | `register({ name, entry, container, ... })` |
| `mount(name, props)` | `updateAppProps(name, props)` e depois `mountApp(name)` |
| `unmount(name)` | `unmountApp(name)` |
| `update(name, props)` | `updateAppProps(name, props)` |
| `stop()` | `destroy()` |
| `onBeforeMount`, `onAfterMount` | `onStatusChange(name, status)` ou `OrchestratorEvent.APP_MOUNT` |
| `sandbox: { js: true }` | `JsSandbox` de `@tuvix.js/sandbox` |
