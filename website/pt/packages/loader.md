---
title: '@tuvix.js/loader'
---

<PackageHeader
  name="@tuvix.js/loader"
  title="Loader"
  description="Carrega bundles de micro apps por nome a partir de URLs de script ou funções loader, com novas tentativas, timeouts, um registro de módulos compartilhado e eventos de ciclo de vida."
  icon="📦"
  npm="true"
/>

## Instalação

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

## Quando usar

`@tuvix.js/loader` transforma uma entry (uma URL de script, uma lista de scripts e estilos, ou `() => import('./app')`) em um módulo de micro app com `mount` e `unmount`. Ele adiciona as tags `<script>` e `<link>`, tenta de novo quando uma tentativa falha, desiste após um timeout e guarda o resultado em cache pelo nome do app.

`@tuvix.js/core` cria um `ModuleLoader` para você e repassa a ele a opção `loader` de `createOrchestrator`, então a maioria dos shells nunca importa este pacote. Importe-o quando você:

- escreve um micro app ou adaptador que se publica com `registerModule`, ou reporta `tuvix:mounted` com `emitLifecycle`
- precisa saber quando outro app foi montado (`whenMounted`, `onLifecycle`)
- carrega micro apps sem o orquestrador, por exemplo a partir do seu próprio roteador
- carrega um único script ou folha de estilo com deduplicação (`loadScript`, `loadStyle`)

Se o seu bundler consegue importar o app em tempo de build e você nunca carrega código de outra origem, um `import()` simples basta.

## Início rápido

O micro app publica seu módulo sob um nome. Este arquivo é compilado para `https://cdn.example.com/dashboard/main.js`:

```ts
// dashboard/src/main.ts
import { registerModule } from '@tuvix.js/loader';

registerModule('dashboard', {
  mount({ container, props }) {
    container.innerHTML = `<h2>Dashboard for user ${String(props?.userId)}</h2>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

O shell o carrega pelo nome e o monta:

```ts
// shell/src/main.ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 15000, retries: 1 });
const container = document.getElementById('dashboard')!;

const result = await loader.load('dashboard', {
  scripts: ['https://cdn.example.com/dashboard/main.js'],
  styles: ['https://cdn.example.com/dashboard/main.css'],
  type: 'module',
});

if (result.module) {
  await result.module.mount({ container, props: { userId: 42 } });
} else {
  container.textContent = 'The dashboard is unavailable.';
  console.error(result.error);
}
```

`load()` nunca lança erros. Um carregamento que falhou volta com `status: 'error'`, `module: null` e o último erro.

## Formas de entry

Uma `Entry` diz ao loader onde está o código de um app. Ela tem três formas.

**Uma string de URL.** O loader trata `'https://cdn.example.com/app.js'` como `{ scripts: ['https://cdn.example.com/app.js'] }`.

**Um objeto `EntryConfig`:**

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `scripts` | `string[]` | obrigatório | URLs de script. O loader os executa um após o outro, nesta ordem. Um array vazio não carrega nada e resolve o módulo a partir do registro. |
| `styles` | `string[]` | `[]` | URLs de folhas de estilo, carregadas em paralelo com os scripts. O carregamento espera ambos. |
| `type` | `'module' \| 'classic'` | inferido por URL | Tipo de script para toda URL em `scripts`. Sem ele, URLs terminadas em `.mjs`, `.mts`, `.ts`, `.tsx` ou `.jsx` carregam como `type="module"` e todas as outras carregam como script clássico. Defina `'module'` para a saída ES do Vite ou Rollup, que termina em `.js`. |
| `integrity` | `Record<string, string>` | nenhum | Hashes de Subresource Integrity indexados por URL. O loader os grava nas tags `<script>`, `<link>` e de prefetch. |

**Uma função loader (`EntryLoader`).** O loader a chama com `{ signal }` e aceita três resultados, verificados nesta ordem:

1. um módulo com uma função `mount`
2. um objeto cujo export `default` é um módulo assim (um namespace de módulo ES)
3. nada utilizável; nesse caso o loader procura o módulo que o import registrou com `registerModule(name, ...)`

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();
```

Seu bundler separa `./dashboard` em um chunk próprio e o busca na primeira montagem. Funções loader também são a forma como o [`@tuvix.js/module-federation`](/pt/packages/module-federation) conecta um remoto federado ao orquestrador.

`signal` é abortado quando a tentativa estoura o timeout. Repasse-o a tudo o que você buscar com `fetch` no caminho:

```ts
import type { EntryLoader } from '@tuvix.js/loader';

const entry: EntryLoader = async ({ signal }) => {
  const response = await fetch('/api/manifest/dashboard.json', { signal });
  const { url } = (await response.json()) as { url: string };
  return import(/* @vite-ignore */ url);
};
```

## API

### `ModuleLoader`

```ts no-check
class ModuleLoader {
  constructor(options?: LoaderOptions);
  load(name: string, entry: Entry): Promise<LoadResult>;
  prefetch(entry: Entry): void;
  removeStyles(name: string): void;
  unload(name: string): void;
  clearCache(): void;
  isLoaded(name: string): boolean;
  getModule(name: string): MicroAppModule | null;
  getStatus(name: string): LoadStatus;
  getCachedNames(): string[];
}
```

Cada `ModuleLoader` mantém seu próprio cache de módulos resolvidos por nome de app. As tags `<script>` e `<link>` valem para a página inteira: dois loaders que carregam a mesma URL compartilham uma tag.

`LoaderOptions`:

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Limite de tempo em ms para uma tentativa, cobrindo todos os scripts e folhas de estilo da entry. `0` o desativa. |
| `retries` | `number` | `2` | Tentativas extras depois que a primeira falha. `2` significa até 3 tentativas. |
| `retryDelay` | `number` | `1000` | Espera em ms entre tentativas. |
| `globals` | `Record<string, unknown>` | `{}` | Propriedades que o loader atribui a `window` antes de cada tentativa de uma entry de URL, para bundles UMD que esperam `window.React` ou um objeto de configuração. Entries do tipo função loader o ignoram. |

#### `load(name, entry)`

Resolve para um `LoadResult`:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `status` | `'loaded' \| 'error'` | Resultado do carregamento. |
| `module` | `MicroAppModule \| null` | O módulo resolvido, `null` em caso de erro. |
| `error` | `Error \| null` | O erro da última tentativa. |
| `duration` | `number` | Milissegundos da chamada até o resultado, medidos com `performance.now()`. |

Para uma entry de URL, uma tentativa:

1. atribui `options.globals` a `window`
2. adiciona os scripts em ordem, cada um esperando o anterior, e as folhas de estilo em paralelo
3. lê o módulo do registro (`getRegisteredModule(name)`)
4. recorre a um global UMD: uma propriedade de `window` com uma função `mount` que apareceu durante este carregamento

Em seguida, o loader verifica se o módulo tem as funções `mount` e `unmount` e o guarda em cache sob `name`. Chamadas posteriores com o mesmo nome retornam o módulo em cache e ignoram `entry`. Uma segunda chamada enquanto a primeira ainda carrega retorna a mesma promise. Carregamentos de nomes diferentes rodam em paralelo.

#### `prefetch(entry)`

Pede ao navegador que baixe os arquivos de uma entry sem executá-los. Scripts de módulo recebem `<link rel="modulepreload">`; scripts clássicos e folhas de estilo recebem `<link rel="prefetch">`. Entries do tipo função loader são ignoradas, porque chamar a função executaria o módulo. O orquestrador chama isso de acordo com sua configuração de `prefetch`.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
loader.prefetch({ scripts: ['/apps/settings/main.js'], type: 'module' });
```

#### `removeStyles(name)`

Remove as folhas de estilo de um app carregado para que o CSS dele deixe de valer enquanto está desmontado. Uma folha de estilo permanece quando outro app em cache, cujos estilos você não removeu, lista a mesma URL. O próximo `load(name)` adiciona as folhas de estilo de volta e espera por elas antes de resolver. O orquestrador chama `removeStyles` após cada desmontagem.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader();
const container = document.getElementById('cart')!;
const { module } = await loader.load('cart', { scripts: ['/cart.js'], styles: ['/cart.css'] });

await module?.mount({ container });
await module?.unmount({ container });
loader.removeStyles('cart');
```

#### `unload(name)`

Esquece um app: remove suas folhas de estilo e tags de script, tira-o do cache e o desregistra do registro compartilhado quando o módulo registrado é o que este loader resolveu. O próximo `load(name)` busca e executa a entry de novo. O orquestrador o chama a partir de `unregister(name)`.

#### `clearCache()`

Chama `unload` para cada app em cache. O orquestrador o chama a partir de `destroy()`.

#### `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()`

Leem o cache. `getStatus` retorna `'loading'` enquanto um carregamento roda, `'loaded'` quando o módulo está em cache e `'idle'` nos outros casos. Um carregamento que falhou deixa o status em `'idle'`.

### `createLoader`

```ts no-check
function createLoader(options?: LoaderOptions): ModuleLoader;
```

O mesmo que `new ModuleLoader(options)`. Recebe as `LoaderOptions` da tabela acima.

```ts
import { createLoader } from '@tuvix.js/loader';

const loader = createLoader({ timeout: 8000, retries: 0, globals: { APP_ENV: 'production' } });
```

Para definir essas opções no orquestrador, passe-as como `loader`:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({ loader: { timeout: 15000, retries: 1, retryDelay: 500 } });
```

### `normalizeEntry`

```ts no-check
function normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

Transforma uma URL em `{ scripts: [url] }` e retorna um `EntryConfig` sem alterações. Não aceita funções loader; verifique `typeof entry === 'function'` antes.

```ts
import { normalizeEntry } from '@tuvix.js/loader';

normalizeEntry('https://cdn.example.com/app.js'); // { scripts: ['https://cdn.example.com/app.js'] }
```

### `loadScript`

```ts no-check
function loadScript(url: string, options?: LoadScriptOptions | string): Promise<void>;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `type` | `'module' \| 'classic'` | inferido pela extensão | Tipo de script, com as mesmas regras de `EntryConfig.type`. |
| `integrity` | `string` | nenhum | Hash SRI para o atributo `integrity`. |
| `signal` | `AbortSignal` | nenhum | Para de esperar quando abortado. A promise rejeita com o motivo do signal. |

Adiciona `<script crossorigin="anonymous">` a `document.head` e resolve no evento `load` dele. Chamadas concorrentes para uma URL compartilham uma tag, e uma chamada para uma URL que já carregou resolve na hora. Um carregamento que falhou remove sua tag e rejeita com `[Tuvix Loader] Failed to load script: <url>`, então a próxima chamada começa com uma tag nova. Uma chamada abortada remove a tag apenas quando nenhum outro chamador ainda espera por ela. `loadScript` não tem timeout próprio; passe um `signal`.

Uma string como segundo argumento é lida como o hash de integridade, como na 0.4.

```ts
import { loadScript } from '@tuvix.js/loader';

await loadScript('https://cdn.example.com/charts.js', { type: 'classic', signal: AbortSignal.timeout(5000) });
```

### `loadStyle`

```ts no-check
function loadStyle(url: string, options?: LoadStyleOptions | number): Promise<void>;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | Faz o carregamento falhar após esta quantidade de ms com `[Tuvix Loader] Style load timed out: <url>`. `0` o desativa. |
| `integrity` | `string` | nenhum | Hash SRI para o atributo `integrity`. |
| `signal` | `AbortSignal` | nenhum | Para de esperar quando abortado. |

Adiciona `<link rel="stylesheet" crossorigin="anonymous">` a `document.head` com as mesmas regras de compartilhamento, falha e abort de `loadScript`. Um número como segundo argumento é lido como o timeout, como na 0.4.

```ts
import { loadStyle } from '@tuvix.js/loader';

await loadStyle('https://cdn.example.com/app.css', { timeout: 5000 });
```

### `removeScript`

```ts no-check
function removeScript(url: string): void;
```

Remove a tag que `loadScript` adicionou para `url`, além de qualquer `<script>` cujo atributo `src` seja igual a `url`. Um carregamento ainda em andamento para essa URL rejeita com `[Tuvix Loader] Removed before load: <url>`. O próximo `loadScript(url)` adiciona uma tag nova. O código que o script já executou permanece na memória.

### `removeStyle`

```ts no-check
function removeStyle(url: string): void;
```

O mesmo que `removeScript` para tags `<link rel="stylesheet">`.

### `prefetchResource`

```ts no-check
function prefetchResource(url: string, options?: PrefetchOptions): void;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `as` | `'script' \| 'style'` | `'style'` para URLs `.css`, senão `'script'` | Tipo de recurso. |
| `type` | `'module' \| 'classic'` | inferido pela extensão | Scripts de módulo recebem `rel="modulepreload"`. |
| `integrity` | `string` | nenhum | Hash SRI para o link. |

Adiciona um `<link>` por URL e página. Uma URL que `loadScript` ou `loadStyle` já trata, ou que já recebeu prefetch antes, é ignorada.

```ts
import { prefetchResource } from '@tuvix.js/loader';

prefetchResource('https://cdn.example.com/app.js', { type: 'module' });
```

### `registerModule`

```ts no-check
function registerModule(name: string, module: MicroAppModule): void;
```

Publica um módulo sob um nome para que um loader possa encontrá-lo depois que o script do app roda. Uma segunda chamada com o mesmo nome substitui o primeiro módulo. Os adaptadores de React, Vue, Svelte e Angular e o `defineMicroApp` do core o chamam para você; chame-o você mesmo quando escrever o módulo à mão.

O registro e o estado dos apps montados ficam em `window.__TUVIX_RUNTIME__`, e o mapa de módulos também pode ser acessado como `window.__TUVIX_MODULES__`. Micro apps que empacotam cada um a própria cópia de `@tuvix.js/loader` leem e gravam no mesmo registro. No servidor, sem `window`, o estado fica no módulo.

Um micro app escrito à mão que segue o contrato de adaptador:

```ts
import { emitLifecycle, hasServerMarkup, registerModule } from '@tuvix.js/loader';

registerModule('clock', {
  mount({ container }) {
    const hydrated = hasServerMarkup(container);
    if (!hydrated) container.textContent = new Date().toLocaleTimeString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
});
```

### `unregisterModule`

```ts no-check
function unregisterModule(name: string): void;
```

Remove um módulo do registro. `ModuleLoader.unload` o chama para os módulos que resolveu.

### `getRegisteredModule`

```ts no-check
function getRegisteredModule(name: string): MicroAppModule | undefined;
```

Retorna o módulo registrado, ou `undefined`.

### `emitLifecycle`

```ts no-check
function emitLifecycle(type: 'mounted' | 'unmounted' | 'error', detail: LifecycleDetail): void;
```

Registra uma mudança de ciclo de vida e dispara um `CustomEvent` chamado `tuvix:mounted`, `tuvix:unmounted` ou `tuvix:error`. O evento sobe (bubble) e é `composed`, então um listener em `document` recebe eventos de containers dentro de shadow roots. Quando `detail.container` está no DOM, o evento dispara no container e sobe até `document` uma vez. Quando o container está desanexado (`isConnected` é `false`), por exemplo porque o React removeu uma ilha antes de o adaptador reportar `unmounted`, o evento dispara no próprio `document`, já que um evento em um elemento desanexado nunca chega até ele. Nos dois casos, `detail.container` ainda aponta para o elemento. `event.detail` é o `LifecycleDetail`:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `name` | `string` | Nome do micro app. |
| `container` | `HTMLElement` | Elemento em que o app renderizou. |
| `hydrated` | `boolean` | `true` quando o adaptador adotou markup renderizado no servidor em vez de renderizar do zero. |
| `error` | `unknown` | O valor lançado, definido em eventos `error`. |

`mounted` registra o container como montado para `detail.name` e resolve as promises pendentes de `whenMounted(name)`. `unmounted` remove esse container do registro. `error` apenas dispara o evento. Os adaptadores de React, Vue, Svelte e Angular e o `defineMicroApp` do core chamam isso depois que a montagem e a desmontagem terminam e quando qualquer uma delas lança um erro.

### `isMounted`

```ts no-check
function isMounted(name: string): boolean;
```

`true` enquanto pelo menos um container de `name` estiver montado. O runtime rastreia os containers montados por app, então se um módulo é montado em dois containers e você desmonta um, `isMounted(name)` continua `true` até o segundo ser desmontado.

### `whenMounted`

```ts no-check
function whenMounted(name: string, options?: { signal?: AbortSignal }): Promise<LifecycleDetail>;
```

Resolve com o `LifecycleDetail` da primeira montagem. Se o app já estiver montado, resolve na hora com o detail do container montado mais antigo que ainda está montado. Aborte o `signal` para parar de esperar; a promise então rejeita com o motivo do signal.

```ts
import { whenMounted } from '@tuvix.js/loader';

const { container, hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log(`header mounted into #${container.id}, hydrated: ${hydrated}`);
```

### `onLifecycle`

```ts no-check
function onLifecycle(type: LifecycleType, handler: (detail: LifecycleDetail) => void, target?: EventTarget): () => void;
```

Escuta `tuvix:<type>` em `target` (padrão `document`) e retorna uma função que remove o listener. Com o target padrão, o handler roda uma vez por evento, tanto para containers anexados quanto desanexados. Um listener em um elemento container não recebe eventos disparados enquanto esse container está desanexado.

```ts
import { onLifecycle } from '@tuvix.js/loader';

const stop = onLifecycle('error', ({ name, error }) => {
  console.error(`Micro app "${name}" failed`, error);
});

// later
stop();
```

Sem este pacote, escute o evento DOM:

```ts
import type { LifecycleEvent } from '@tuvix.js/loader';

document.addEventListener('tuvix:mounted', (event) => {
  const { name, hydrated } = (event as LifecycleEvent).detail;
  console.log(name, hydrated);
});
```

### `hasServerMarkup`

```ts no-check
function hasServerMarkup(container: Element): boolean;
```

`true` quando o elemento tem um elemento filho ou um nó de texto com texto que não seja só espaço em branco. Comentários e espaços em branco não contam. Os adaptadores o usam para escolher entre hidratar e renderizar do zero.

### Tipos

As interfaces que um módulo de micro app implementa:

```ts
interface MicroAppModule {
  bootstrap?: () => void | Promise<void>;
  mount: (context: MountContext) => void | Promise<void>;
  unmount: (context: UnmountContext) => void | Promise<void>;
  update?: (context: UpdateContext) => void | Promise<void>;
  [key: string]: unknown;
}

interface MountContext {
  container: HTMLElement;
  props?: Record<string, unknown>;
  /** App name the orchestrator registered this module under */
  name?: string;
  /** The orchestrator's event bus */
  bus?: MicroAppBus;
}

interface UnmountContext {
  container: HTMLElement;
}

interface UpdateContext {
  props: Record<string, unknown>;
  /** Container to update; without it, adapters update every mounted instance */
  container?: HTMLElement;
}

interface MicroAppBus {
  on<T = unknown>(event: string, handler: (data: T) => void): () => void;
  once<T = unknown>(event: string, handler: (data: T) => void): () => void;
  emit<T = unknown>(event: string, data?: T): void;
  off<T = unknown>(event: string, handler: (data: T) => void): void;
}
```

O orquestrador passa `name` e `bus` em toda montagem. `bus` é a instância de [`@tuvix.js/event-bus`](/pt/packages/event-bus) do orquestrador; `MicroAppBus` a descreve estruturalmente, então o loader não depende do pacote do event bus.

| Tipo | Significado |
| --- | --- |
| `Entry` | `string \| EntryConfig \| EntryLoader`. |
| `EntryConfig` | `{ scripts, styles?, type?, integrity? }`, veja [Formas de entry](#formas-de-entry). |
| `EntryLoader` | `(context: EntryLoaderContext) => Promise<MicroAppModule \| { default: MicroAppModule }>`. |
| `EntryLoaderContext` | `{ signal: AbortSignal }`. |
| `ScriptType` | `'module' \| 'classic'`. |
| `MicroAppModule` | Objeto de ciclo de vida que um micro app exporta. |
| `MountContext`, `UnmountContext`, `UpdateContext` | Argumentos de `mount`, `unmount` e `update`. |
| `MicroAppBus` | `{ on, once, emit, off }`; `IEventBus` o satisfaz. |
| `LoaderOptions` | `{ timeout?, retries?, retryDelay?, globals? }`. |
| `LoadResult` | `{ status, module, error, duration }`. |
| `LoadStatus` | `'idle' \| 'loading' \| 'loaded' \| 'error'`. |
| `CacheEntry` | `{ module, loadedAt, entry }`, um módulo em cache. |
| `PrefetchStrategy` | `'immediate' \| 'idle' \| 'hover' \| 'none'`. O loader não o lê. |
| `ResourceOptions` | `{ integrity?, signal? }`, compartilhado por `loadScript` e `loadStyle`. |
| `LoadScriptOptions` | `ResourceOptions` mais `type?`. |
| `LoadStyleOptions` | `ResourceOptions` mais `timeout?`. |
| `PrefetchOptions` | `{ as?, type?, integrity? }`. |
| `LifecycleType` | `'mounted' \| 'unmounted' \| 'error'`. |
| `LifecycleDetail` | `{ name, container, hydrated, error? }`. |
| `LifecycleEvent` | `CustomEvent<LifecycleDetail>`. |

## Casos extremos

- **Timeouts.** `timeout` cobre uma tentativa inteira. Quando ele dispara, o loader aborta o `signal` da tentativa, remove as tags da tentativa pelas quais nenhum outro carregamento espera, aguarda `retryDelay` e tenta de novo. O erro diz `[Tuvix Loader] Loading "<name>" timed out after <timeout>ms`. Uma função loader que ignora `signal` continua rodando em segundo plano; o loader para de esperar por ela.
- **Novas tentativas.** Um `<script>` que falhou é removido antes da próxima tentativa, então uma nova tentativa adiciona uma única tag nova. Após a última tentativa, `load()` resolve com o último erro.
- **Mesma URL, vários apps.** Duas entries que listam o mesmo script de vendor compartilham uma tag e um download.
- **Entries em cache.** `load(name, otherEntry)` retorna o módulo em cache sob `name` e ignora `otherEntry`. Chame `unload(name)` antes para trocar de entry.
- **Scripts de módulo rodam uma vez por URL.** Após `unload(name)`, um app cujo script `type: 'module'` chamou `registerModule` não carrega de novo a partir da mesma URL, porque o navegador não executa um script de módulo duas vezes. O carregamento falha com `no exports found`. Use uma entry do tipo função loader ou uma nova URL (um hash de conteúdo ou `?v=2`).
- **`unload` remove tags de script compartilhadas.** Ele remove toda URL de script da entry, inclusive um script de vendor que outro app também lista. O código que já rodou permanece; um carregamento posterior que lista a URL adiciona a tag de novo e um script clássico roda de novo.
- **CORS.** O loader define `crossorigin="anonymous"` em toda tag. Um script ou folha de estilo de outra origem precisa de um header `Access-Control-Allow-Origin`, senão o navegador o bloqueia e o carregamento falha.
- **Globais UMD.** Quando dois bundles UMD carregam ao mesmo tempo, o loader ignora os globais que outro carregamento já reivindicou e associa os restantes ao nome do app, ignorando maiúsculas/minúsculas e pontuação (`my-app` corresponde a `MyApp`). Se sobrarem vários candidatos, o carregamento falha com `several globals with mount() appeared while it loaded (<names>)`. `registerModule` evita a adivinhação.
- **Ciclo de vida ausente.** Um módulo sem `mount` ou `unmount` falha com `[Tuvix Loader] Module "<name>" is missing required "unmount" function.`
- **Nada encontrado.** Uma entry de URL cujos scripts não registram um módulo nem definem um global UMD falha com `Module "<name>" loaded but no exports found`.
- **Vários containers.** O runtime rastreia o estado de montagem por container. Desmontar um de dois containers mantém `isMounted(name)` como `true`; `whenMounted(name)` retorna o container montado mais antigo que ainda está montado.
- **Containers desanexados.** Quando um framework host remove o container antes de o adaptador reportar `unmounted` ou `error`, `emitLifecycle` dispara o evento em `document`. Escute em `document` (o padrão de `onLifecycle`) para receber todos os eventos.
- **`whenMounted` ignora erros.** Um evento `tuvix:error` não o rejeita. Passe um `signal` ou escute com `onLifecycle('error', ...)`.
- **Servidor.** As funções de runtime funcionam sem `window`; `emitLifecycle` pula o evento DOM quando `CustomEvent` é undefined. `ModuleLoader`, `loadScript`, `loadStyle` e `prefetchResource` precisam de `document`.

## O que ele não faz

- Não busca uma página HTML para extrair scripts dela. Liste as URLs de script e estilo, ou use uma função loader.
- Não isola JavaScript. Os scripts rodam no escopo global da página. Para isolamento de CSS, use a opção `sandbox` do orquestrador ou [`@tuvix.js/sandbox`](/pt/packages/sandbox).
- Não monta apps. Você ou o orquestrador chamam `module.mount`.
- Não mantém cache entre carregamentos de página. O cache HTTP do navegador faz isso.
- Não lê `PrefetchStrategy`; a configuração de `prefetch` do orquestrador decide quando chamar `prefetch`.

## Migração a partir da 0.4

- `LoaderOptions.fetch` e `EntryConfig.html` foram removidos. O loader nunca os leu. Apague-os da sua config.
- `loadScript(url, integrity)` e `loadStyle(url, timeoutMs)` continuam funcionando. A forma com objeto de opções acrescenta `type` e `signal`:

  ```ts
  import { loadScript } from '@tuvix.js/loader';

  // 0.4
  await loadScript('/vendor.js', 'sha384-abc');
  // 0.5
  await loadScript('/vendor.js', { integrity: 'sha384-abc', type: 'classic' });
  ```

- A saída ES do Vite terminada em `.js` carregava como script clássico na 0.4 e falhava na primeira instrução `import`. Defina `type: 'module'` na entry.
- Uma entry `type: 'module'` não carrega mais de novo a partir da mesma URL após `unload`. Use uma função loader ou uma nova URL.
- `load()` para um módulo em cache reporta a `duration` real em vez de `0`.
- A versão 0.4 desta página mostrava `loader.load(url)`, `result.app`, `onLoadStart`, `cache` e `loader.clear()`. Nenhum deles existia. Use `load(name, entry)`, `result.module`, `unload(name)` e `clearCache()`.
