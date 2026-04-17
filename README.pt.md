<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Um framework <strong>microfrontend</strong> leve e flexível para construir aplicações frontend escaláveis e implantáveis de forma independente.<br/>
  O Tuvix.js une múltiplas aplicações frontend em uma experiência de usuário fluida e unificada - assim como o seu nome sugere.
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

- 🧩 **Agnóstico de Framework** - Use React, Vue, Svelte, Angular ou Vanilla JS
- 📦 **Deployment independente** - Implante cada micro app separadamente
- 🔗 **Carregamento Dinâmico de Módulos** - Carregue microfrontends sob demanda
- 🛣️ **Roteamento Integrado** - Roteamento transparente entre micro apps
- 📡 **Comunicação entre Apps** - Event bus para mensagens cross-app
- ⚡ **Lightweight** - Zero dependências em runtime, core mínimo
- 🔄 **Gerenciamento de Lifecycle** - Hooks de mount, unmount e update
- 🔒 **Type-Safe** - Suporte completo a TypeScript com tipos rigorosos

---

## 🤖 Gerador de Componentes IA

Gere componentes tuvix.js a partir de linguagem natural usando nosso chatbot de IA integrado.

- **Modelo de chat:** MiniMax M2.5 via OpenRouter (API gratuita, sem necessidade de self-hosting)
- **Modelo de embedding:** NVIDIA Nemotron Embed 1B via OpenRouter (recuperação RAG)
- **Suporta:** React, Vue, Svelte, Angular
- **Dataset:** [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset) no HuggingFace

---

## 📦 Instalação

```bash
# Pacote tudo-em-um
npm install tuvix.js

# Ou instale pacotes individuais
npm install @tuvix.js/core @tuvix.js/router
```

---

## 🚀 Início Rápido

### Aplicação Host (Shell)

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main-content',
  activeWhen: '/dashboard/*',
});

orchestrator.register({
  name: 'settings',
  entry: 'https://cdn.example.com/settings/main.js',
  container: '#main-content',
  activeWhen: '/settings/*',
});

orchestrator.start();
```

### App Micro Frontend

```ts
import { defineMicroApp } from 'tuvix.js';

let titleEl: HTMLHeadingElement | null = null;

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    // Configuração única antes do primeiro mount (ex: pré-carregar dados)
    console.log('Dashboard bootstrapped');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Bem-vindo, ${props?.user ?? 'Visitante'}!</h1>`;
    titleEl = container.querySelector('h1');
  },

  unmount({ container }) {
    titleEl = null;
    container.innerHTML = '';
  },

  // Disparado quando o shell chama orchestrator.updateAppProps(name, props).
  // Atualiza o DOM no lugar — sem remount, sem flash.
  update({ props }) {
    if (titleEl) {
      titleEl.textContent = `Bem-vindo, ${props?.user ?? 'Visitante'}!`;
    }
  },
});
```

---

## 🔄 Atualização de Props em Tempo de Execução

Passe novas props para uma micro app montada sem remontá-la:

```ts
// Envia props atualizadas do shell — invoca o hook update() da micro app
await orchestrator.updateAppProps('dashboard', {
  user: 'Yasin',
  theme: 'dark',
});
```

As props são mescladas com as props originais do config. Se a app não
implementar `update()`, as novas props são armazenadas e aplicadas no
próximo mount.

---

## 🧭 Controle Manual do Ciclo de Vida

```ts
// Mount / unmount manual fora da reconciliação de rotas
await orchestrator.mountApp('dashboard');
await orchestrator.unmountApp('dashboard');

// Inspecionar estado atual
orchestrator.getAppStatus('dashboard');     // 'mounted' | 'mounting' | 'error' | ...
orchestrator.getMountedApps();              // ['dashboard']
orchestrator.getRegisteredApps();           // ['dashboard', 'settings']

// Destruir tudo (idempotente — seguro chamar várias vezes)
await orchestrator.destroy();
```

---

## 🌉 Ponte com Router Externo

Se você já usa TanStack Router, Next.js App Router ou React Router, omita
`config.router` por completo e deixe seu router existente conduzir o Tuvix.js
via `reconcile(path)`:

```ts
const orchestrator = createOrchestrator(); // sem config de router

orchestrator.register({
  name: 'dashboard',
  entry: '/dashboard.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();

// Após cada navegação, informe ao tuvix.js o caminho atual
tanstackRouter.subscribe('onLoad', () => {
  orchestrator.reconcile(window.location.pathname);
});
```

---

## 👁️ Mount Tardio (Viewport)

Adie micro apps caras até que seu container entre no viewport:

```ts
orchestrator.register({
  name: 'comments',
  entry: '/comments.js',
  container: '#comments-section',
  mountWhenVisible: true, // monta no primeiro hit do IntersectionObserver
});
```

---

## 🛟 HTML de Fallback em Caso de Falha

```ts
orchestrator.register({
  name: 'reports',
  entry: '/reports.js',
  container: '#reports',
  activeWhen: '/reports/*',
  fallback: '<p class="error">Reports temporariamente indisponível.</p>',
});
```

---

## ⚡ Estratégias de Prefetch

```ts
const orchestrator = createOrchestrator({
  router: { /* ... */ },
  prefetch: {
    strategy: 'idle', // 'immediate' | 'idle' | 'hover' | 'none' (padrão)
  },
});
```

| Estratégia | Quando os bundles são buscados |
| --- | --- |
| `immediate` | Logo após `start()` |
| `idle` | Na próxima janela ociosa do navegador (`requestIdleCallback`) |
| `hover` | Após o primeiro `mouseover` do usuário em qualquer lugar da página |
| `none` | Nunca (padrão) — apenas sob demanda |

---

## 🔌 Comunicação entre Apps

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// App A — emitir evento
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// App B — assinar (retorna função de unsubscribe)
const unsubscribe = bus.on('user:login', (data) => {
  console.log(`${data.name} logged in!`);
});

// Disparar uma vez e auto-cancelar
bus.once('app:ready', () => console.log('pronto'));

// Escutar todos os eventos para depuração
bus.onAny((event, data) => console.log('[bus]', event, data));

// Limpeza
unsubscribe();
```

O orchestrator expõe seu próprio bus via `orchestrator.getEventBus()` para que
todas as apps registradas compartilhem automaticamente um único canal.

---

## 🛣️ Roteamento

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // ou 'hash'
  base: '/',       // base path opcional
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'users' },
    { path: '/settings', app: 'settings', exact: true },
  ],
});

// Navegação programática
await router.push('/dashboard/overview');
await router.replace('/users/42');
router.back();

// Navigation guards (retorne false para cancelar)
const off = router.beforeEach(async ({ from, to }) => {
  if (to.startsWith('/admin') && !isAdmin()) return false;
});

// Reagir a mudanças
router.onChange(({ from, to, toRoute }) => {
  console.log(`navegou ${from} → ${to}`, toRoute?.params);
});

// Ou use o helper de navegação do orchestrator
await orchestrator.navigateTo('/settings');
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│              Tuvix.js Shell                  │
│  ┌─────────────────────────────────────────┐│
│  │            Orchestrator                 ││
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ││
│  │  │ Router   │ │Event Bus │ │ Loader  │ ││
│  │  └──────────┘ └──────────┘ └─────────┘ ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌───────┐  ┌───────┐  ┌───────┐          │
│  │ App A │  │ App B │  │ App C │  ...      │
│  │(React)│  │ (Vue) │  │(Svelte│          │
│  └───────┘  └───────┘  └───────┘          │
└─────────────────────────────────────────────┘
```

---

## 📦 Pacotes

| Pacote | Descrição |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | Pacote guarda-chuva tudo-em-um |
| [`@tuvix.js/core`](./packages/core) | Core Orchestrator with Lifecycle management |
| [`@tuvix.js/router`](./packages/router) | Roteamento de micro apps baseado em URL |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Event bus para comunicação entre apps |
| [`@tuvix.js/loader`](./packages/loader) | Carregador dinâmico de módulos |
| [`@tuvix.js/sandbox`](./packages/sandbox) | Isolamento CSS/JS (Shadow DOM + Proxy) |
| [`@tuvix.js/react`](./packages/react) | Bindings e hooks para React 18+ |
| [`@tuvix.js/vue`](./packages/vue) | Bindings e composables para Vue 3 |
| [`@tuvix.js/svelte`](./packages/svelte) | Bindings para Svelte 3-5 |
| [`@tuvix.js/angular`](./packages/angular) | Bindings para Angular 15+ |
| [`create-tuvix-app`](./packages/cli) | Ferramenta CLI de scaffolding |
| [`@tuvix.js/devtools`](./packages/devtools) | Painel de debug in-page |
| [`@tuvix.js/server`](./packages/server) | Composição server-side |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Integração com Webpack Module Federation |

---

## 📁 Estrutura do Projeto

```
tuvix.js/
├── packages/
│   ├── core/               # @tuvix.js/core
│   ├── router/             # @tuvix.js/router
│   ├── event-bus/          # @tuvix.js/event-bus
│   ├── loader/             # @tuvix.js/loader
│   ├── sandbox/            # @tuvix.js/sandbox
│   ├── react/              # @tuvix.js/react
│   ├── vue/                # @tuvix.js/vue
│   ├── svelte/             # @tuvix.js/svelte
│   ├── angular/            # @tuvix.js/angular
│   ├── cli/                # create-tuvix-app
│   ├── devtools/           # @tuvix.js/devtools
│   ├── server/             # @tuvix.js/server
│   ├── module-federation/  # @tuvix.js/module-federation
│   └── tuvix/              # tuvix.js (guarda-chuva)
├── examples/
│   ├── with-angular/              # Exemplo Angular 15+
│   ├── with-module-federation-react/ # Exemplo Module Federation + React
│   ├── with-multiple-frameworks/  # Exemplo múltiplos frameworks
│   ├── with-react/                # Exemplo React 18+
│   ├── with-react-devtools/       # Exemplo React + DevTools
│   ├── with-react-event-bus/      # Exemplo React + Event Bus
│   ├── with-react-router/         # Exemplo React + Router
│   ├── with-react-sandbox/        # Exemplo React + Sandbox
│   ├── with-ssr-react/            # Exemplo SSR + React
│   ├── with-ssr-vanilla/          # Exemplo SSR + Vanilla JS
│   ├── with-svelte/               # Exemplo Svelte 5
│   ├── with-vanilla/              # Exemplo Vanilla JS
│   └── with-vue/                  # Exemplo Vue 3
├── website/                # Site de documentação (VitePress, 10 idiomas)
├── .github/                # Workflows CI/CD
├── package.json            # Configuração root do workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vitest.config.ts
```

---

## 🗺️ Roadmap

### ✅ Concluídos

- [x] Core Orchestrator
- [x] Gerenciamento de Lifecycle
- [x] Carregamento dinâmico de módulos
- [x] Event bus
- [x] Roteamento URL com modos history/hash
- [x] Isolamento sandbox CSS/JS
- [x] Ferramenta CLI de scaffolding (`npx create-tuvix-app`)
- [x] Extensão de navegador DevTools
- [x] Composição server-side
- [x] Suporte a module federation
- [x] Bindings para frameworks (React, Vue, Svelte, Angular)
- [x] Documentação i18n (10 idiomas)

### 🔜 Em Breve

- [ ] Hot module reload entre micro apps
- [ ] Adaptador de gerenciamento de estado compartilhado
- [ ] Estratégias de preloading e prefetching
- [ ] Sistema de plugins e API de middleware
- [ ] Grafo visual de dependências no DevTools
- [ ] Utilitários de teste e mock orchestrator
- [ ] Suporte nativo a ESM / importmap
- [ ] Composição server-side para Edge/CDN
- [ ] Extensão VS Code para integração com DevTools
- [ ] Integração com Storybook para isolamento de micro apps

---

## 🧪 Exemplos

Exemplos prontos para execução para cada framework suportado estão disponíveis no diretório [`examples/`](./examples):

| Exemplo | Framework | Caminho |
| --- | --- | --- |
| [Exemplo Angular](./examples/with-angular) | Angular 15+ | `examples/with-angular/` |
| [Exemplo Module Federation + React](./examples/with-module-federation-react) | React 18+ | `examples/with-module-federation-react/` |
| [Exemplo Múltiplos Frameworks](./examples/with-multiple-frameworks) | Misto | `examples/with-multiple-frameworks/` |
| [Exemplo React](./examples/with-react) | React 18+ | `examples/with-react/` |
| [Exemplo React + DevTools](./examples/with-react-devtools) | React 18+ | `examples/with-react-devtools/` |
| [Exemplo React + Event Bus](./examples/with-react-event-bus) | React 18+ | `examples/with-react-event-bus/` |
| [Exemplo React + Router](./examples/with-react-router) | React 18+ | `examples/with-react-router/` |
| [Exemplo React + Sandbox](./examples/with-react-sandbox) | React 18+ | `examples/with-react-sandbox/` |
| [Exemplo SSR + React](./examples/with-ssr-react) | React 18+ | `examples/with-ssr-react/` |
| [Exemplo SSR + Vanilla JS](./examples/with-ssr-vanilla) | Sem framework | `examples/with-ssr-vanilla/` |
| [Exemplo Svelte](./examples/with-svelte) | Svelte 5 | `examples/with-svelte/` |
| [Exemplo Vanilla JS](./examples/with-vanilla) | Sem framework | `examples/with-vanilla/` |
| [Exemplo Vue](./examples/with-vue) | Vue 3 | `examples/with-vue/` |

Cada exemplo demonstra:

- Uma aplicação **shell (host)** que inicializa o orquestrador
- Duas **apps micro frontend** registradas e carregadas dinamicamente
- Comunicação entre apps via event bus

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia o [Guia de Contribuição](./CONTRIBUTING.md) antes de enviar uma PR.

```bash
# Clone o repositório
git clone https://github.com/yasinatesim/tuvix.js.git

# Instale as dependências
pnpm install

# Compile todos os pacotes
pnpm build

# Execute os testes
pnpm test
```

---

## 🔑 Licença

Copyright © 2026 - Licença MIT.
Consulte [LICENSE](./LICENSE) para mais informações.

---

<p align="center">This README was generated by <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 🥲</p>
