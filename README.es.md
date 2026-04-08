<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Un <strong>framework de microfrontends</strong> ligero y flexible para construir aplicaciones frontend escalables y desplegables de forma independiente.<br/>
  Tuvix.js fusiona múltiples aplicaciones frontend en una experiencia de usuario fluida y unificada - tal como su nombre sugiere.
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

## ✨ Características

- 🧩 **Agnóstico de Framework** - Usa React, Vue, Svelte, Angular o Vanilla JS
- 📦 **Deployment independiente** - Despliega cada micro aplicación por separado
- 🔗 **Carga Dinámica de Módulos** - Carga microfrontends bajo demanda
- 🛣️ **Enrutamiento Integrado** - Enrutamiento fluido entre micro aplicaciones
- 📡 **Comunicación entre Aplicaciones** - Bus de eventos para mensajería entre apps
- ⚡ **Lightweight** - Cero dependencias en tiempo de ejecución, núcleo mínimo
- 🔄 **Gestión del Lifecycle** - Hooks de montaje, desmontaje y actualización
- 🔒 **Type-Safe** - Soporte completo de TypeScript con tipos estrictos

---

## 🤖 Generador de Componentes IA

Genera componentes tuvix.js desde lenguaje natural usando nuestro chatbot de IA integrado.

- **Impulsado por:** Ollama + StarCoder2 (funciona 100% localmente, sin costos de API)
- **Basado en RAG:** Recupera ejemplos relevantes de 600 ejemplos de componentes open-source
- **Soporta:** React, Vue, Svelte, Angular
- **Dataset:** [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset) en HuggingFace

---

## 📦 Instalación

```bash
# Paquete todo en uno
npm install tuvix.js

# O instala paquetes individuales
npm install @tuvix.js/core @tuvix.js/router
```

---

## 🚀 Inicio Rápido

### Aplicación Anfitriona (Shell)

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

### Aplicación Micro Frontend

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    console.log('Dashboard inicializado');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Bienvenido, ${props?.user}!</h1>`;
  },

  unmount({ container }) {
    container.innerHTML = '';
  },

  update({ props }) {
    console.log('Props actualizados:', props);
  },
});
```

---

## 🔌 Comunicación entre Aplicaciones

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// App A - emitir evento
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// App B - escuchar evento
bus.on('user:login', (data) => {
  console.log(`${data.name} ha iniciado sesión!`);
});
```

---

## 🛣️ Enrutamiento

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

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────┐
│              Shell de Tuvix.js              │
│  ┌─────────────────────────────────────────┐│
│  │          Orchestrator                   ││
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

## 📦 Paquetes

| Paquete | Descripción |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | Paquete paraguas todo en uno |
| [`@tuvix.js/core`](./packages/core) | Core Orchestrator with Lifecycle management |
| [`@tuvix.js/router`](./packages/router) | Enrutamiento de micro apps basado en URL |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Bus de eventos para comunicación entre apps |
| [`@tuvix.js/loader`](./packages/loader) | Cargador dinámico de módulos |
| [`@tuvix.js/sandbox`](./packages/sandbox) | Aislamiento CSS/JS (Shadow DOM + Proxy) |
| [`@tuvix.js/react`](./packages/react) | Bindings y hooks para React 18+ |
| [`@tuvix.js/vue`](./packages/vue) | Bindings y composables para Vue 3 |
| [`@tuvix.js/svelte`](./packages/svelte) | Bindings para Svelte 3-5 |
| [`@tuvix.js/angular`](./packages/angular) | Bindings para Angular 15+ |
| [`create-tuvix-app`](./packages/cli) | Herramienta CLI de scaffolding |
| [`@tuvix.js/devtools`](./packages/devtools) | Panel de depuración en página |
| [`@tuvix.js/server`](./packages/server) | Composición del lado del servidor |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Integración con Webpack Module Federation |

---

## 📁 Estructura del Proyecto

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
│   └── tuvix/              # tuvix.js (paraguas)
├── examples/
│   ├── with-angular/              # Ejemplo Angular 15+
│   ├── with-module-federation-react/ # Ejemplo Module Federation + React
│   ├── with-multiple-frameworks/  # Ejemplo múltiples frameworks
│   ├── with-react/                # Ejemplo React 18+
│   ├── with-react-devtools/       # Ejemplo React + DevTools
│   ├── with-react-event-bus/      # Ejemplo React + Event Bus
│   ├── with-react-router/         # Ejemplo React + Router
│   ├── with-react-sandbox/        # Ejemplo React + Sandbox
│   ├── with-ssr-react/            # Ejemplo SSR + React
│   ├── with-ssr-vanilla/          # Ejemplo SSR + Vanilla JS
│   ├── with-svelte/               # Ejemplo Svelte 5
│   ├── with-vanilla/              # Ejemplo Vanilla JS
│   └── with-vue/                  # Ejemplo Vue 3
├── website/                # Sitio de documentación (VitePress, 10 idiomas)
├── .github/                # Flujos de trabajo CI/CD
├── package.json            # Configuración raíz del workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vitest.config.ts
```

---

## 🗺️ Hoja de Ruta

### ✅ Completado

- [x] Core Orchestrator
- [x] Gestión del Lifecycle
- [x] Carga dinámica de módulos
- [x] Bus de eventos
- [x] Enrutamiento por URL con modos history/hash
- [x] Aislamiento CSS/JS con sandbox
- [x] Herramienta CLI de scaffolding (`npx create-tuvix-app`)
- [x] Extensión de navegador DevTools
- [x] Composición del lado del servidor
- [x] Soporte de Module Federation
- [x] Bindings de frameworks (React, Vue, Svelte, Angular)
- [x] Documentación i18n (10 idiomas)

### 🔜 Próximamente

- [ ] Recarga de módulos en caliente entre micro apps
- [ ] Adaptador de gestión de estado compartido
- [ ] Estrategias de precarga y prefetching
- [ ] Sistema de plugins y API de middleware
- [ ] Grafo visual de dependencias en DevTools
- [ ] Utilidades de testing y orquestador simulado
- [ ] Soporte nativo de ESM / importmap
- [ ] Composición en servidor con soporte Edge/CDN
- [ ] Extensión de VS Code para integración con DevTools
- [ ] Integración con Storybook para aislamiento de micro apps

---

## 🧪 Ejemplos

Ejemplos listos para ejecutar de cada framework soportado están disponibles en el directorio [`examples/`](./examples):

| Ejemplo | Framework | Ruta |
| --- | --- | --- |
| [Ejemplo Angular](./examples/with-angular) | Angular 15+ | `examples/with-angular/` |
| [Ejemplo Module Federation + React](./examples/with-module-federation-react) | React 18+ | `examples/with-module-federation-react/` |
| [Ejemplo Múltiples Frameworks](./examples/with-multiple-frameworks) | Mixto | `examples/with-multiple-frameworks/` |
| [Ejemplo React](./examples/with-react) | React 18+ | `examples/with-react/` |
| [Ejemplo React + DevTools](./examples/with-react-devtools) | React 18+ | `examples/with-react-devtools/` |
| [Ejemplo React + Event Bus](./examples/with-react-event-bus) | React 18+ | `examples/with-react-event-bus/` |
| [Ejemplo React + Router](./examples/with-react-router) | React 18+ | `examples/with-react-router/` |
| [Ejemplo React + Sandbox](./examples/with-react-sandbox) | React 18+ | `examples/with-react-sandbox/` |
| [Ejemplo SSR + React](./examples/with-ssr-react) | React 18+ | `examples/with-ssr-react/` |
| [Ejemplo SSR + Vanilla JS](./examples/with-ssr-vanilla) | Sin framework | `examples/with-ssr-vanilla/` |
| [Ejemplo Svelte](./examples/with-svelte) | Svelte 5 | `examples/with-svelte/` |
| [Ejemplo Vanilla JS](./examples/with-vanilla) | Sin framework | `examples/with-vanilla/` |
| [Ejemplo Vue](./examples/with-vue) | Vue 3 | `examples/with-vue/` |

Cada ejemplo demuestra:

- Una aplicación **shell (anfitriona)** que inicia el orquestador
- Dos **aplicaciones micro frontend** registradas y cargadas dinámicamente
- Comunicación entre aplicaciones mediante el bus de eventos

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor, lee la [Guía de Contribución](./CONTRIBUTING.md) antes de enviar un PR.

```bash
# Clonar el repositorio
git clone https://github.com/yasinatesim/tuvix.js.git

# Instalar dependencias
pnpm install

# Compilar todos los paquetes
pnpm build

# Ejecutar tests
pnpm test
```

---

## 🔑 Licencia

Copyright © 2026 - Licencia MIT.
Consulta [LICENSE](./LICENSE) para más información.

---

<p align="center">Este README fue generado por <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 🥲</p>
