# @tuvix.js/loader

> Carrega bundles de micro apps pelo nome a partir de URLs de script ou funções de carregamento, com novas tentativas, timeouts, um registro de módulos compartilhado e eventos de ciclo de vida.

Parte do framework de microfrontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentação completa: [tuvix.js.org/packages/loader](https://tuvix.js.org/packages/loader).

## Instalação

```bash
npm install @tuvix.js/loader
# or pnpm add @tuvix.js/loader
```

`@tuvix.js/core` cria um `ModuleLoader` para você e repassa a ele o `createOrchestrator({ loader })`. Importe este pacote quando escrever um micro app ou adaptador, quando precisar aguardar a montagem de outro app ou quando carregar apps sem o orquestrador.

## Início rápido

O micro app, gerado em `https://cdn.example.com/dashboard/main.js`:

```ts
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

O shell:

```ts
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
  console.error(result.error);
}
```

`load()` nunca lança erro. Uma falha resolve com `status: 'error'`, `module: null` e o último erro.

## Entries

`Entry` é um destes:

- uma string de URL, lida como `{ scripts: [url] }`
- um `EntryConfig`
- uma função de carregamento como `() => import('./dashboard')`. Ela recebe `{ signal }`, que é abortado no timeout, e pode resolver para o módulo, para `{ default: module }` ou para qualquer valor depois de chamar `registerModule(name, module)`.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `scripts` | `string[]` | obrigatório | URLs de script, executadas uma após a outra. |
| `styles` | `string[]` | `[]` | URLs de folhas de estilo, carregadas em paralelo com os scripts. |
| `type` | `'module' \| 'classic'` | inferido por URL | `.mjs`, `.mts`, `.ts`, `.tsx`, `.jsx` carregam como módulos, o resto como clássico. Defina `'module'` para a saída `.js` do Vite. |
| `integrity` | `Record<string, string>` | nenhum | Hashes SRI indexados por URL. |

## API

### `ModuleLoader` e `createLoader`

```ts no-check
new ModuleLoader(options?: LoaderOptions);
createLoader(options?: LoaderOptions): ModuleLoader;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `timeout` | `number` | `10000` | ms por tentativa, cobrindo todos os scripts e folhas de estilo. `0` o desativa. |
| `retries` | `number` | `2` | Tentativas extras depois da primeira falha. |
| `retryDelay` | `number` | `1000` | ms entre tentativas. |
| `globals` | `Record<string, unknown>` | `{}` | Atribuídos a `window` antes de cada tentativa de uma entry de URL. |

| Método | Comportamento |
| --- | --- |
| `load(name, entry): Promise<LoadResult>` | Carrega, valida `mount`/`unmount` e guarda em cache pelo nome. Resolve o módulo primeiro a partir de `registerModule(name)`, depois a partir de um novo global UMD com `mount`. Um nome em cache ignora `entry`; um nome que já está carregando retorna a mesma promise. |
| `prefetch(entry)` | `<link rel="modulepreload">` para scripts de módulo, `<link rel="prefetch">` nos demais casos. Ignora funções de carregamento. |
| `removeStyles(name)` | Remove as folhas de estilo do app, a menos que outro app em cache as use. O próximo `load(name)` as adiciona de novo. |
| `unload(name)` | Remove os estilos e as tags de script, descarta a entrada do cache e cancela o registro do módulo que este loader resolveu. |
| `clearCache()` | `unload` para cada app em cache. |
| `isLoaded(name)`, `getModule(name)`, `getStatus(name)`, `getCachedNames()` | Leem o cache. `getStatus` retorna `'idle'`, `'loading'` ou `'loaded'`. |

### `normalizeEntry`

```ts no-check
normalizeEntry(entry: string | EntryConfig): EntryConfig;
```

### `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource`

```ts no-check
loadScript(url: string, options?: { type?, integrity?, signal? } | string): Promise<void>;
loadStyle(url: string, options?: { timeout?, integrity?, signal? } | number): Promise<void>;
removeScript(url: string): void;
removeStyle(url: string): void;
prefetchResource(url: string, options?: { as?, type?, integrity? }): void;
```

Uma tag por URL, compartilhada entre chamadas concorrentes. Um carregamento que falha remove sua tag e rejeita com `[Tuvix Loader] Failed to load script: <url>`. Uma chamada abortada remove a tag quando nenhuma outra chamada está esperando por ela. `loadStyle` expira depois de `10000` ms por padrão. Toda tag recebe `crossorigin="anonymous"`. Um segundo argumento string em `loadScript` é o hash de integridade; um número em `loadStyle` é o timeout (formas da 0.4).

### Registro em runtime e ciclo de vida

O estado fica em `window.__TUVIX_RUNTIME__`, então micro apps que empacotam sua própria cópia o compartilham. Sem `window`, ele fica no módulo.

| Export | Comportamento |
| --- | --- |
| `registerModule(name, module)` | Publica um módulo para o loader. Os adaptadores e `defineMicroApp` o chamam. |
| `unregisterModule(name)` | Remove o módulo. |
| `getRegisteredModule(name)` | Retorna o módulo ou `undefined`. |
| `emitLifecycle(type, { name, container, hydrated, error? })` | Dispara um `CustomEvent` `tuvix:mounted`, `tuvix:unmounted` ou `tuvix:error`, com bubbling e composed, no `container`, ou em `document` quando o container está desanexado, e registra os containers montados. Os adaptadores e `defineMicroApp` o chamam. |
| `isMounted(name)` | `true` enquanto qualquer container do app estiver montado. |
| `whenMounted(name, { signal? })` | Resolve com o `LifecycleDetail` da primeira montagem, ou imediatamente com o container mais antigo ainda montado; rejeita com `signal.reason` ao abortar. |
| `onLifecycle(type, handler, target = document)` | Escuta `tuvix:<type>`; retorna uma função de remoção. |
| `hasServerMarkup(el)` | `true` para um elemento filho ou texto que não seja só espaço em branco. |

```ts
import { onLifecycle, whenMounted } from '@tuvix.js/loader';

onLifecycle('error', ({ name, error }) => console.error(name, error));
const { hydrated } = await whenMounted('header', { signal: AbortSignal.timeout(5000) });
console.log('header hydrated:', hydrated);
```

### Tipos

`Entry`, `EntryConfig`, `EntryLoader`, `EntryLoaderContext`, `ScriptType`, `MicroAppModule`, `MountContext` (`container`, `props?`, `name?`, `bus?`), `UnmountContext`, `UpdateContext` (`props`, `container?`), `MicroAppBus` (`on`, `once`, `emit`, `off`; `IEventBus` o satisfaz), `LoaderOptions`, `LoadResult`, `LoadStatus`, `CacheEntry`, `PrefetchStrategy` (não é lido pelo loader), `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent`.

## Casos extremos

- Um timeout aborta o `signal` da tentativa, remove suas tags e tenta de novo depois de `retryDelay`. Uma função de carregamento que ignora `signal` continua rodando; o loader para de esperar.
- Depois de `unload(name)`, um script `type: 'module'` que se registrou sozinho não roda de novo a partir da mesma URL. Use uma função de carregamento ou uma nova URL.
- `unload` remove todas as URLs de script da entry, inclusive scripts de terceiros que outros apps listam.
- Dois bundles UMD carregando ao mesmo tempo: o loader associa os novos globais ao nome do app e falha, informando os nomes candidatos, quando não consegue distingui-los.
- Scripts e estilos de outra origem precisam de `Access-Control-Allow-Origin`.
- O estado de montagem é por container: desmontar um de dois containers mantém `isMounted(name)` como `true`. `whenMounted` não rejeita em `tuvix:error`.
- O evento de ciclo de vida de um container desanexado dispara em `document` com `detail.container` ainda definido. `onLifecycle` em `document` (o padrão) recebe cada evento uma única vez.

## O que ele não faz

- Ele não busca páginas HTML para extrair scripts.
- Ele não isola JavaScript; os scripts rodam no escopo global da página.
- Ele não monta apps nem faz roteamento.

## Licença

MIT
