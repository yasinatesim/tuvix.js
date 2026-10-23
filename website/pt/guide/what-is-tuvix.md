# O que é o Tuvix.js?

O Tuvix.js é um toolkit de microfrontends para o navegador. Uma página host (o shell) registra micro apps, e o Tuvix.js carrega o código de cada app, monta o app em um container, passa props para ele e o desmonta quando a URL ou o seu código determinam. Cada micro app pode usar React, Vue, Svelte, Angular ou nenhum framework, e cada time pode fazer o build e o deploy do seu app no próprio ritmo.

## O que ele faz

- **Orquestra micro apps.** `createOrchestrator()` mantém um registro de apps. Para cada um, ele decide, a partir do path atual, se o app deve estar montado, e executa um reconcile por vez para que dois apps que compartilham um container nunca se sobreponham.
- **Carrega código sob demanda.** O `entry` de um app pode ser a URL de um script, uma lista de scripts e folhas de estilo, ou uma função como `() => import('./dashboard')`. O loader tenta de novo carregamentos que falharam e aborta os lentos.
- **Roteia pela URL.** `activeWhen: '/dashboard/*'` monta um app em `/dashboard` e em todos os paths abaixo dele. Você pode usar o roteador embutido ou acompanhar o TanStack Router ou o React Router com `connectRouter()`.
- **Adapta frameworks.** `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp` e `createAngularMicroApp` transformam um componente raiz em um módulo com `mount`, `update` e `unmount`.
- **Hospeda ilhas em uma página React.** `TuvixIsland` monta um micro app Vue, Svelte, Angular ou React dentro de uma árvore React renderizada no servidor e hidrata o HTML do servidor sem enviá-lo duas vezes. Veja [Ilhas SSR](/pt/guide/ssr-islands).
- **Informa o ciclo de vida.** Os adaptadores e `defineMicroApp` disparam os eventos DOM `tuvix:mounted`, `tuvix:unmounted` e `tuvix:error`, e `whenMounted(name)` é resolvida assim que um app está na página. Veja [Eventos de ciclo de vida](/pt/guide/lifecycle-events).
- **Conecta apps.** Todos os apps de uma página compartilham um único event bus por meio de `getGlobalBus()`, mesmo quando cada app inclui no bundle a própria cópia de `@tuvix.js/event-bus`.
- **Isola CSS quando solicitado.** `sandbox: true` renderiza um app dentro de uma shadow root, para que o CSS da página e o CSS do app fiquem separados.

## Quando usar

Use o Tuvix.js quando vários times entregam partes de uma mesma página e precisam fazer deploy delas separadamente, ou quando você quer manter um app legado rodando ao lado de uma reescrita em outro framework. Ele também serve para um único time que quer widgets Vue ou Svelte dentro de um site React com renderização no servidor.

## Quando não usar

- Um time, um framework, um deploy: uma single-page app comum é mais simples.
- Você precisa de isolamento de segurança rígido entre apps. O Tuvix.js executa todos os apps no mesmo realm JavaScript. `JsSandbox`, de `@tuvix.js/sandbox`, esconde escritas globais feitas pelo seu proxy, mas não impede que um app alcance `window`. Use um `<iframe>` para código não confiável.
- Você quer um único bundle com estado compartilhado entre todos os apps. Por design, micro apps se comunicam por eventos e props.

## Pacotes

| Pacote | Use para |
| --- | --- |
| `tuvix.js` | Uma única instalação com core, roteador, event bus, loader e sandbox |
| `@tuvix.js/core` | `createOrchestrator`, `defineMicroApp` |
| `@tuvix.js/router` | `createRouter`, `matchPath`, `interceptLinks` |
| `@tuvix.js/loader` | Carregamento de entries e o runtime de ciclo de vida (`whenMounted`, `onLifecycle`) |
| `@tuvix.js/event-bus` | `createEventBus`, `getGlobalBus` |
| `@tuvix.js/sandbox` | `CssSandbox`, `JsSandbox` |
| `@tuvix.js/react`, `vue`, `svelte`, `angular` | Adaptadores de framework, `TuvixIsland` (React) |
| `@tuvix.js/vite` | Links de folhas de estilo das ilhas para o `<head>` renderizado no servidor |
| `@tuvix.js/server` | Composição de fragmentos HTML no servidor |
| `@tuvix.js/module-federation` | Entries carregados de remotes do webpack Module Federation |
| `@tuvix.js/devtools` | Painel de depuração na página |
| `create-tuvix-app` | Scaffolding de projetos |

## Conceitos principais

| Termo | Significado |
| --- | --- |
| Shell | A página host que cria o orquestrador e controla o layout |
| Micro app | Um módulo com `mount` e `unmount` (e, opcionalmente, `bootstrap` e `update`) |
| Entry | De onde o loader obtém um micro app: URL, `{ scripts, styles }` ou uma função de carregamento |
| Container | O elemento em que um micro app é renderizado |
| Ilha | Um micro app que o host renderiza no servidor e o cliente hidrata no lugar |
| Event bus | Um canal pub/sub compartilhado por todos os apps da página |

## Próximos passos

- [Primeiros passos](/pt/guide/getting-started) monta um shell e dois micro apps.
- [Arquitetura](/pt/guide/architecture) mostra como uma navegação se transforma em uma montagem.
- Vem da 0.4? Leia [Migração para a 0.5](/pt/guide/migration-0-5).
