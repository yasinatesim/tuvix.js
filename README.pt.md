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

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    console.log('Dashboard bootstrapped');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Welcome, ${props?.user}!</h1>`;
  },

  unmount({ container }) {
    container.innerHTML = '';
  },

  update({ props }) {
    console.log('Props updated:', props);
  },
});
```

---

## 🔌 Comunicação entre Apps

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// App A - emitir evento
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// App B - escutar evento
bus.on('user:login', (data) => {
  console.log(`${data.name} logged in!`);
});
```

---

## 🛣️ Roteamento

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/settings/*', app: 'settings' },
    { path: '/profile/*', app: 'profile' },
  ],
});
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
│   ├── react/              # Exemplo React 18+
│   ├── vue/                # Exemplo Vue 3
│   ├── svelte/             # Exemplo Svelte 5
│   ├── angular/            # Exemplo Angular 15+
│   └── vanilla/            # Exemplo Vanilla JS
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
| [Exemplo React](./examples/react) | React 18+ | `examples/react/` |
| [Exemplo Vue](./examples/vue) | Vue 3 | `examples/vue/` |
| [Exemplo Svelte](./examples/svelte) | Svelte 5 | `examples/svelte/` |
| [Exemplo Angular](./examples/angular) | Angular 15+ | `examples/angular/` |
| [Exemplo Vanilla JS](./examples/vanilla) | Sem framework | `examples/vanilla/` |

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
