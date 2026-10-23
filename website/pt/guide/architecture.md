# Arquitetura

O Tuvix.js é dividido em pacotes pequenos. O orquestrador em `@tuvix.js/core` une todos eles; cada um dos outros pacotes também funciona sozinho.

## Pacotes e suas funções

```text
@tuvix.js/core          createOrchestrator, defineMicroApp: registry, reconcile, props
@tuvix.js/router        createRouter, matchPath, interceptLinks
@tuvix.js/loader        ModuleLoader, registerModule, lifecycle runtime
@tuvix.js/event-bus     createEventBus, getGlobalBus
@tuvix.js/sandbox       CssSandbox (shadow DOM), JsSandbox (proxy window)
@tuvix.js/react         createReactMicroApp, TuvixReactApp, TuvixIsland
@tuvix.js/vue           createVueMicroApp, renderVueToString (/server)
@tuvix.js/svelte        createSvelteMicroApp, renderSvelteToString (/server)
@tuvix.js/angular       createAngularMicroApp, renderAngularToString (/server)
@tuvix.js/vite          Vite plugin: island CSS links for the server-rendered <head>
@tuvix.js/server        Server-side composition of HTML fragments
@tuvix.js/module-federation  Entries backed by webpack remotes
@tuvix.js/devtools      In-page debug panel
tuvix.js                Umbrella: core, router, loader, event bus, sandbox
create-tuvix-app        Project scaffolding
```

## Da navegação à montagem

```text
URL changes (router.push, popstate, connectRouter callback, or reconcile(path))
  │
  ▼
orchestrator queues a reconcile for the path
  │  (only the newest queued path runs next)
  ▼
for each app: should it be mounted?  activeWhen string → matchPath
  │                                   activeWhen function → your code
  │                                   no activeWhen → router routes naming it
  ▼
phase 1: unmount every app that turned inactive
phase 2: mount every app that turned active
  │
  ▼
loader.load(name, entry)   function entry → await it
  │                        URL entry → <script>/<link> tags, then registry lookup
  ▼
module.bootstrap()  (first load only)
module.mount({ container, props, name, bus })
```

A fase 1 termina antes de a fase 2 começar, então dois apps que compartilham `#app` nunca ficam nele ao mesmo tempo. Se um novo path chegar enquanto um reconcile está em execução, o orquestrador termina o passo atual e depois faz o reconcile do path mais recente. Navegar A → B → A em sequência rápida deixa apenas A montado.

## O contrato do módulo

Todo micro app, escrito à mão ou produzido por um adaptador, tem este formato (`MicroAppModule` de `@tuvix.js/loader`):

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  async bootstrap() {
    // once, before the first mount
  },
  async mount({ container, props, name, bus }) {
    container.textContent = `${name ?? ''}: ${JSON.stringify(props ?? {})}`;
    bus?.emit('app:ready', { name });
  },
  async update({ props, container }) {
    if (container) container.textContent = JSON.stringify(props);
  },
  async unmount({ container }) {
    container.replaceChildren();
  },
};
```

- `bootstrap` roda uma vez por módulo carregado.
- `mount` recebe o container, as props atuais, o nome do app e o event bus do orquestrador.
- `update` recebe as props mescladas quando o shell chama `updateAppProps`. `container` indica a um módulo montado em vários lugares qual montagem deve ser atualizada.
- `unmount` deve remover tudo o que `mount` criou.

## Como o loader encontra um módulo

1. **Entry com função de carregamento** (`() => import('./app')`): o loader usa o módulo resolvido, senão o export `default` dele, senão o módulo registrado com o nome do app.
2. **Entry com URL**: o loader adiciona tags `<script>` e `<link>`, espera que carreguem e lê o módulo do registro preenchido por `registerModule(name, module)`. Os adaptadores e `defineMicroApp` chamam `registerModule` por você.
3. **Fallback UMD**: se nada foi registrado, o loader escolhe um novo global em `window` que tenha uma função `mount`. Quando vários aparecem, ele escolhe aquele cujo nome corresponde ao nome do app e falha caso contrário.

O registro e o estado do ciclo de vida ficam em `window.__TUVIX_RUNTIME__`, então micro apps com bundles separados, cada um com a própria cópia de `@tuvix.js/loader`, ainda enxergam um único registro.

Os scripts são carregados como `type="module"` quando a entry define `type: 'module'` ou quando a URL termina em `.mjs`, `.mts`, `.ts`, `.tsx` ou `.jsx`. As demais URLs são carregadas como scripts clássicos.

## Estado de runtime compartilhado

| Estado | Onde fica | Por quê |
| --- | --- | --- |
| Registro de módulos | `window.__TUVIX_RUNTIME__` (também `window.__TUVIX_MODULES__`) | O loader encontra apps de qualquer bundle |
| Apps montados e quem espera por eles | `window.__TUVIX_RUNTIME__` | `whenMounted` funciona entre bundles |
| Event bus global | `window.__TUVIX_GLOBAL_BUS__` | `getGlobalBus()` retorna um bus por página |

No servidor, sem `window`, cada um deles tem escopo de módulo.

## Modelo de isolamento

- **CSS**: `sandbox: true` em `register` renderiza o app dentro de uma shadow root e carrega ali os `styles` da entry. Veja [Sandbox](/pt/guide/sandbox).
- **JavaScript**: nenhum por padrão. Todos os apps compartilham `window`, `document` e os globais. `JsSandbox` isola apenas o código que você executa pelo seu proxy.

## Onde continuar

- [Hooks de ciclo de vida](/pt/guide/lifecycle): o contrato em detalhes.
- [Eventos de ciclo de vida](/pt/guide/lifecycle-events): descubra quando um app está na página.
- [Roteamento](/pt/guide/routing): regras de padrões.
