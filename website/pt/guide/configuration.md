# Configuração

Toda a configuração é feita em código. O Tuvix.js não lê variáveis de ambiente nem arquivos de configuração.

## Opções do orquestrador

```ts
import { createOrchestrator } from 'tuvix.js';

declare function reportError(error: Error, app: string): void;

const orchestrator = createOrchestrator({
  // Built-in router. Omit it when you follow an external router with connectRouter().
  router: {
    mode: 'history', // or 'hash'
    base: '/',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },

  // Passing eventBus options gives this orchestrator a private bus.
  // Omit it to share getGlobalBus() with every app on the page.
  eventBus: { maxListeners: 50, debug: false },

  // Forwarded to the module loader.
  loader: { timeout: 10000, retries: 2, retryDelay: 1000, globals: {} },

  // 'immediate' | 'idle' | 'hover' | 'none' (default)
  prefetch: { strategy: 'hover' },

  onError: (error, appName) => reportError(error, appName),
  onStatusChange: (appName, status) => console.debug(appName, status),
});
```

| Opção | Padrão | Efeito |
| --- | --- | --- |
| `router` | nenhum | Cria o roteador embutido. Veja [Roteamento](/pt/guide/routing). |
| `eventBus` | nenhum (bus global) | Bus privado com estas opções. `destroy()` destrói um bus privado e mantém o global ativo. |
| `loader.timeout` | `10000` | Milissegundos até uma tentativa de carregamento ser abortada. Também limita a espera pelas folhas de estilo em sandbox. |
| `loader.retries` | `2` | Tentativas extras depois da primeira falha. |
| `loader.retryDelay` | `1000` | Milissegundos entre tentativas. |
| `loader.globals` | `{}` | Propriedades escritas em `window` antes de os scripts de uma entry rodarem. |
| `prefetch.strategy` | `'none'` | Quando buscar entries antes de serem montados. Veja a tabela abaixo. |
| `onError` | nenhum | Chamado com `(error, appName)` quando load, bootstrap, mount, update ou unmount falha. |
| `onStatusChange` | nenhum | Chamado com `(appName, status)` a cada mudança de status. |

Para compartilhar dependências como React entre apps, use `@tuvix.js/module-federation` ou import maps. O orquestrador não tem opção para isso.

### Estratégias de prefetch

| Estratégia | Quando as entries são buscadas |
| --- | --- |
| `none` | Só quando um app é montado. |
| `immediate` | Todas as entries registradas, logo após `start()`. |
| `idle` | Todas as entries registradas, no primeiro `requestIdleCallback` após `start()` (timeout de 200 ms onde a API não existe). |
| `hover` | Quando o ponteiro entra em um link de mesma origem cujo path ativaria um app, ou quando o foco chega nele. Cada app é buscado uma vez. |

O prefetch adiciona `<link rel="modulepreload">` para scripts de módulo e `<link rel="prefetch">` para scripts clássicos e estilos. Ele ignora entries que são funções de carregamento, porque chamar a função executaria o módulo.

## Registrar um micro app

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main',
  activeWhen: '/dashboard/*',
  props: { theme: 'dark' },
  fallback: '<p>Dashboard is unavailable.</p>',
  sandbox: false,
  mountWhenVisible: false,
});
```

| Campo | Tipo | Efeito |
| --- | --- | --- |
| `name` | `string` | Único. Deve ser igual ao nome com que o módulo se registra. |
| `entry` | `string \| EntryConfig \| EntryLoader` | De onde vem o código. Veja abaixo. |
| `container` | `string \| HTMLElement` | Seletor ou elemento. Resolvido no momento da montagem, então o elemento só precisa existir nessa hora. |
| `activeWhen` | `string \| (path) => boolean` | Padrão de rota ou predicado. Sem ele, o app segue as `routes` do roteador que o citam, ou você o monta manualmente. |
| `props` | `Record<string, unknown>` | Props iniciais. `updateAppProps` faz a mesclagem nelas. |
| `fallback` | `string` | HTML escrito no container quando load, bootstrap ou mount falha. |
| `sandbox` | `boolean \| { css?: boolean }` | `true` renderiza o app em uma shadow root. Veja [Sandbox](/pt/guide/sandbox). |
| `mountWhenVisible` | `boolean` | Monta assim que 10% do container estiver visível. Mudanças de rota passam a não afetar o app. |

### Formas de entry

```ts
import type { Entry } from 'tuvix.js';

// One classic script (UMD or IIFE bundle).
const classic: Entry = 'https://cdn.example.com/legacy/app.js';

// Scripts and styles. `type: 'module'` for ES module bundles such as Vite's `.js` output.
const esm: Entry = {
  scripts: ['https://cdn.example.com/cart/main.js'],
  styles: ['https://cdn.example.com/cart/main.css'],
  type: 'module',
  integrity: { 'https://cdn.example.com/cart/main.js': 'sha384-...' },
};

// A loader function. Your bundler code-splits it; the loader passes an AbortSignal.
const lazy: Entry = () => import('./apps/profile');
```

Sem `type`, URLs terminadas em `.mjs`, `.mts`, `.ts`, `.tsx` ou `.jsx` são carregadas como módulos, e todo o resto é carregado como script clássico. Um navegador executa um script de módulo uma vez por URL, então um app `type: 'module'` que você descarrega não pode ser carregado de novo a partir da mesma URL. Use uma função de carregamento quando precisar descarregar e recarregar.

### O que saber sobre o registro

- `register` lança um erro para nome duplicado, `entry` ausente ou `container` ausente.
- `register` depois de `start()` tem efeito imediato: um app gerenciado por rota é montado se o path atual o ativa, e um app `mountWhenVisible` passa a ser observado. Antes de `start()`, `register` apenas guarda a configuração.
- Um app de viewport continua montado depois de sair da área visível. Desmonte-o com `unmountApp(name)`.
- Um app sem `activeWhen` e sem rota no roteador fica do jeito que você o deixar. Chame `mountApp(name)` e `unmountApp(name)` você mesmo.
- `fallback` é HTML bruto. Não o construa a partir de entrada do usuário.

## Opções do roteador

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // 'hash' reads the path from location.hash
  base: '/app', // stripped before matching, added by push() and replace()
  routes: [
    { path: '/users/:id', app: 'users', meta: { title: 'User' } },
    { path: '/settings/*', app: 'settings' },
  ],
});

router.beforeEach(async ({ to }) => !to.startsWith('/admin'));
```

Os paths de rota correspondem ao path inteiro, então `/settings` corresponde apenas a `/settings` e `/settings/`, e `'/'` corresponde apenas a `/`. Termine um path com `/*` para corresponder a sub-paths; `'/*'` corresponde a todos os paths.

## Opções do sandbox

```ts
import { createSandbox } from 'tuvix.js';

const sandbox = createSandbox({
  css: true, // shadow root on activate()
  js: true, // proxy window for execScript()
  allowedGlobals: ['gtag'], // extra globals strict mode lets you write
  strict: false, // true: writing any other global throws a TypeError
});
```

O orquestrador aplica isolamento de CSS para apps registrados com `sandbox: true`. Ele nunca aplica `JsSandbox`. Veja [Sandbox](/pt/guide/sandbox).

## Opções do event bus

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus({
  maxListeners: 0, // 0 = unlimited; past the limit, `on` still adds the listener and warns once per event
  debug: false, // log every emit and subscription
  logger: console.log,
});
```
