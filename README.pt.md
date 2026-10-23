<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Um toolkit de microfrontend: carregue, monte e conecte apps com deploy independente escritos em React, Vue, Svelte, Angular ou TypeScript puro, no navegador ou como ilhas renderizadas no servidor dentro de uma página React.
</p>

<p align="center">
  <a href="./README.md">🇬🇧 English</a> ·
  <a href="./README.tr.md">🇹🇷 Türkçe</a> ·
  <a href="./README.es.md">🇪🇸 Español</a> ·
  <a href="./README.de.md">🇩🇪 Deutsch</a> ·
  <a href="./README.fr.md">🇫🇷 Français</a> ·
  <a href="./README.ja.md">🇯🇵 日本語</a> ·
  <a href="./README.zh.md">🇨🇳 中文</a> ·
  <a href="./README.it.md">🇮🇹 Italiano</a> ·
  <a href="./README.pt.md">🇧🇷 Português</a> ·
  <a href="./README.hi.md">🇮🇳 हिंदी</a>
</p>

---

## ✨ Funcionalidades

- 🧩 **Adaptadores de framework** para React 18/19, Vue 3, Svelte 3-5 e Angular 15+. Cada um transforma um componente raiz em um módulo de micro app com `mount`, `update` e `unmount`, uma instância por container.
- 🛣️ **Ativação por caminho.** `activeWhen: '/users/:id'` monta um app nos caminhos correspondentes. Query strings e hashes nunca o desmontam. Um único matcher (`matchPath`) atende o orquestrador, o roteador e o pacote de servidor.
- 🔁 **Montagem ordenada.** As mudanças de rota são reconciliadas uma de cada vez; os apps inativos são desmontados antes que os novos sejam montados, então uma navegação rápida A → B → A deixa apenas A na página.
- 🔗 **Roteadores externos.** `orchestrator.connectRouter()` segue o TanStack Router ou o React Router. `interceptLinks()` transforma cliques em `<a href>` comuns em navegações no cliente.
- 🏝️ **Ilhas SSR.** `TuvixIsland` hospeda micro apps Vue, Svelte, Angular e React em uma página React renderizada no servidor, hidrata-os no lugar e nunca reescreve o DOM deles ao renderizar de novo.
- 🎨 **Primeira pintura com estilos.** `@tuvix.js/vite` informa ao seu servidor quais stylesheets cada ilha precisa, para que você os inclua com links no `<head>`.
- 📦 **Entries flexíveis.** URLs de script, `{ scripts, styles, type }` ou funções loader como `() => import('./app')`. Carregamentos em paralelo, novas tentativas, timeouts, hashes SRI.
- 📡 **Event bus compartilhado.** `getGlobalBus()` retorna um único bus por página, mesmo entre apps com bundles separados.
- 🔔 **Eventos de ciclo de vida.** `tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`, além de `whenMounted(name)` e `onLifecycle()`.
- 🔒 **Isolamento de CSS sob demanda.** `sandbox: true` renderiza um app dentro de um shadow root com os próprios stylesheets.
- 🟦 **TypeScript.** Todo pacote de biblioteca publica builds ESM e CommonJS com declarações de tipos.

O Tuvix.js não isola o JavaScript entre os apps: todos os apps rodam no `window` da página. Use um `<iframe>` para código não confiável.

---

## 🤖 Gerador de Componentes com IA

Gere componentes tuvix.js a partir de linguagem natural com o chatbot do site de documentação.

- **Modelo de chat:** MiniMax M2.5 via OpenRouter
- **Modelo de embedding:** NVIDIA Nemotron Embed 1B via OpenRouter (recuperação RAG)
- **Suporta:** React, Vue, Svelte, Angular
- **Dataset:** [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset) no HuggingFace

> Experimente: [Gerador com IA](https://tuvix.js.org/chatbot) no site de documentação

---

## 📦 Instalação

```bash
# Orchestrator, router, loader, event bus and sandbox
pnpm add tuvix.js

# Adapters, as needed
pnpm add @tuvix.js/react @tuvix.js/vue @tuvix.js/svelte @tuvix.js/angular

# Or scaffold a project
npx create-tuvix-app my-app --template shell
```

---

## 🚀 Início Rápido

### Shell

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main-content',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
  fallback: '<p>Dashboard is unavailable.</p>',
});

orchestrator.register({
  name: 'settings',
  entry: () => import('./apps/settings'),
  container: '#main-content',
  activeWhen: '/settings/*',
});

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

### Micro app

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Welcome, {user}</h1>;
}

// Registers itself as "dashboard", so the shell's script entry finds it.
export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Sem framework:

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'settings',
  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Settings for ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

### Atualizar props

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

Um app montado que tem `update` renderiza de novo no lugar. Caso contrário, o orquestrador guarda as props mescladas para a próxima montagem.

---

## 🌉 Seguir um Roteador Externo

```ts
import { createOrchestrator } from 'tuvix.js';
import { router } from './router'; // TanStack Router instance

const orchestrator = createOrchestrator(); // no built-in router

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

await orchestrator.start();
```

---

## 🏝️ Ilhas Renderizadas no Servidor

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });

// `footerHtml` comes from renderSvelteToString() in server-only code.
export function Layout({ footerHtml }: { footerHtml?: string }) {
  return <TuvixIsland name="footer" app={footer} props={{ year: 2026 }} ssrHtml={footerHtml} fallback={<footer>© 2026</footer>} />;
}
```

Durante a hidratação, a ilha lê o HTML dela a partir da página, então o cliente nunca precisa de `footerHtml`. Veja o [guia de Ilhas SSR](https://tuvix.js.org/guide/ssr-islands) e [`examples/with-ssr-islands`](./examples/with-ssr-islands).

---

## 🔔 Eventos de Ciclo de Vida

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer');
container.classList.add(hydrated ? 'hydrated' : 'rendered');
```

---

## 🔌 Event Bus

```ts
import { getGlobalBus } from 'tuvix.js';

const bus = getGlobalBus(); // the same bus the orchestrator passes to mount()

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => console.log(userId));
bus.emit('user:login', { userId: '42' });
off();
```

---

## 📦 Pacotes

| Pacote | Descrição |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | Pacote guarda-chuva: core, roteador, loader, event bus, sandbox |
| [`@tuvix.js/core`](./packages/core) | Orquestrador: registro, reconciliação, props, `connectRouter` |
| [`@tuvix.js/router`](./packages/router) | Roteador history/hash, `matchPath`, `interceptLinks` |
| [`@tuvix.js/loader`](./packages/loader) | Carregamento de entries e o runtime de ciclo de vida |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Bus pub/sub, `getGlobalBus()` para a página inteira |
| [`@tuvix.js/sandbox`](./packages/sandbox) | `CssSandbox` (shadow DOM), `JsSandbox` (window via proxy) |
| [`@tuvix.js/react`](./packages/react) | Adaptador React, `TuvixReactApp`, `TuvixIsland`, hooks |
| [`@tuvix.js/vue`](./packages/vue) | Adaptador Vue 3, `renderVueToString` |
| [`@tuvix.js/svelte`](./packages/svelte) | Adaptador Svelte 3-5, `renderSvelteToString` |
| [`@tuvix.js/angular`](./packages/angular) | Adaptador Angular 15+ (zoneless), `renderAngularToString` |
| [`@tuvix.js/vite`](./packages/vite) | Plugin do Vite: links de stylesheets das ilhas para o `<head>` renderizado no servidor |
| [`@tuvix.js/server`](./packages/server) | Composição de fragmentos HTML no servidor, streaming, métricas |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Entries baseadas em remotes do webpack Module Federation |
| [`@tuvix.js/devtools`](./packages/devtools) | Painel de depuração na página |
| [`create-tuvix-app`](./packages/cli) | Scaffolding de projetos |

---

## 📁 Estrutura do Projeto

```text
tuvix.js/
├── packages/        # the 15 packages above
├── examples/        # runnable examples, see below
├── website/         # documentation site (VitePress, 10 languages)
├── scripts/         # docs and package validators
└── .changeset/      # release notes for the next version
```

---

## 🧪 Exemplos

| Exemplo | Mostra |
| --- | --- |
| [`with-ssr-islands`](./examples/with-ssr-islands) | Host React com ilhas Vue, Svelte, Angular e React renderizadas no servidor |
| [`with-react`](./examples/with-react) | Shell e micro apps React |
| [`with-vue`](./examples/with-vue) | Micro apps Vue 3 |
| [`with-svelte`](./examples/with-svelte) | Micro apps Svelte |
| [`with-angular`](./examples/with-angular) | Micro apps Angular |
| [`with-vanilla`](./examples/with-vanilla) | Sem framework |
| [`with-multiple-frameworks`](./examples/with-multiple-frameworks) | React e Vue em um único shell |
| [`with-react-router`](./examples/with-react-router) | Roteamento |
| [`with-react-event-bus`](./examples/with-react-event-bus) | Event bus |
| [`with-react-sandbox`](./examples/with-react-sandbox) | Sandbox de CSS |
| [`with-react-devtools`](./examples/with-react-devtools) | Painel de devtools |
| [`with-module-federation-react`](./examples/with-module-federation-react) | Module Federation |
| [`with-ssr-react`](./examples/with-ssr-react) | Composição no servidor com `@tuvix.js/server` |
| [`with-ssr-vanilla`](./examples/with-ssr-vanilla) | Composição no servidor sem framework |

---

## 🗺️ Roadmap

Já entregue:

- Orquestrador com reconciliações serializadas, `connectRouter`, montagem por viewport e HTML de fallback
- Adaptadores para React, Vue, Svelte 3-5 e Angular (zoneless), com hidratação SSR
- `TuvixIsland`, eventos de ciclo de vida, assets de ilhas com `@tuvix.js/vite`
- Composição no servidor com streaming e métricas do Prometheus (`@tuvix.js/server`)
- Entries de Module Federation, devtools na página, scaffolding via CLI
- Documentação em 10 idiomas

Planejado:

- Hot module reload entre micro apps
- Suporte nativo a ESM / import maps
- Composição no servidor ciente de edge, com cache de fragmentos stale-while-revalidate
- Utilitários de teste e um orquestrador mock
- Testes A/B de fragmentos

---

## 🤝 Contribuindo

Leia o [Guia de Contribuição](./CONTRIBUTING.md) antes de abrir um pull request.

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js
pnpm install
pnpm build
pnpm test
```

Vindo da 0.4? Leia o [guia de migração](https://tuvix.js.org/guide/migration-0-5).

---

## 🔑 Licença

Copyright © 2026 - Licença MIT.
Veja [LICENSE](./LICENSE) para mais informações.

---

<p align="center">Este README foi gerado com o <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 🥲</p>
