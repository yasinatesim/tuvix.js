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

- **Modelo de chat:** MiniMax M2.5 vía OpenRouter (API gratuita, sin alojamiento propio)
- **Modelo de embedding:** NVIDIA Nemotron Embed 1B vía OpenRouter (recuperación RAG)
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

let titleEl: HTMLHeadingElement | null = null;

export default defineMicroApp({
  name: 'dashboard',

  bootstrap() {
    // Configuración única antes del primer mount (p. ej. precargar datos)
    console.log('Dashboard inicializado');
  },

  mount({ container, props }) {
    container.innerHTML = `<h1>Bienvenido, ${props?.user ?? 'Invitado'}!</h1>`;
    titleEl = container.querySelector('h1');
  },

  unmount({ container }) {
    titleEl = null;
    container.innerHTML = '';
  },

  // Se dispara cuando el shell llama orchestrator.updateAppProps(name, props).
  // Actualiza el DOM en su lugar — sin remount, sin parpadeo.
  update({ props }) {
    if (titleEl) {
      titleEl.textContent = `Bienvenido, ${props?.user ?? 'Invitado'}!`;
    }
  },
});
```

---

## 🔄 Actualización de Props en Tiempo de Ejecución

Pasa nuevas props a una micro app montada sin volver a montarla:

```ts
// Envía props actualizadas desde el shell — invoca el hook update() de la micro app
await orchestrator.updateAppProps('dashboard', {
  user: 'Yasin',
  theme: 'dark',
});
```

Las props se fusionan con las props originales del config. Si la app no
implementa `update()`, las nuevas props se almacenan y se aplican en el
siguiente mount.

---

## 🧭 Control Manual del Ciclo de Vida

```ts
// Mount / unmount manual fuera de la reconciliación de rutas
await orchestrator.mountApp('dashboard');
await orchestrator.unmountApp('dashboard');

// Inspeccionar el estado actual
orchestrator.getAppStatus('dashboard');     // 'mounted' | 'mounting' | 'error' | ...
orchestrator.getMountedApps();              // ['dashboard']
orchestrator.getRegisteredApps();           // ['dashboard', 'settings']

// Destruir todo (idempotente — seguro de llamar varias veces)
await orchestrator.destroy();
```

---

## 🌉 Puente con un Router Externo

Si ya usas TanStack Router, Next.js App Router o React Router, omite
`config.router` por completo y deja que tu router existente maneje Tuvix.js
mediante `reconcile(path)`:

```ts
const orchestrator = createOrchestrator(); // sin config de router

orchestrator.register({
  name: 'dashboard',
  entry: '/dashboard.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();

// Tras cada navegación, indica a tuvix.js cuál es la ruta actual
tanstackRouter.subscribe('onLoad', () => {
  orchestrator.reconcile(window.location.pathname);
});
```

---

## 👁️ Mount Diferido (Viewport)

Difiere micro apps costosas hasta que su contenedor entre en el viewport:

```ts
orchestrator.register({
  name: 'comments',
  entry: '/comments.js',
  container: '#comments-section',
  mountWhenVisible: true, // monta en el primer impacto del IntersectionObserver
});
```

---

## 🛟 HTML de Respaldo en Caso de Fallo

```ts
orchestrator.register({
  name: 'reports',
  entry: '/reports.js',
  container: '#reports',
  activeWhen: '/reports/*',
  fallback: '<p class="error">Reports no disponible temporalmente.</p>',
});
```

---

## ⚡ Estrategias de Prefetch

```ts
const orchestrator = createOrchestrator({
  router: { /* ... */ },
  prefetch: {
    strategy: 'idle', // 'immediate' | 'idle' | 'hover' | 'none' (default)
  },
});
```

| Estrategia | Cuándo se descargan los bundles |
| --- | --- |
| `immediate` | Justo después de `start()` |
| `idle` | En la próxima ventana inactiva del navegador (`requestIdleCallback`) |
| `hover` | Tras el primer `mouseover` del usuario en cualquier parte de la página |
| `none` | Nunca (default) — solo bajo demanda |

---

## 🔌 Comunicación entre Aplicaciones

```ts
import { createEventBus } from 'tuvix.js';

const bus = createEventBus();

// App A — emitir evento
bus.emit('user:login', { userId: 42, name: 'Ahmet' });

// App B — escuchar (devuelve una función de unsubscribe)
const unsubscribe = bus.on('user:login', (data) => {
  console.log(`${data.name} ha iniciado sesión!`);
});

// Disparar una vez y auto-desuscribirse
bus.once('app:ready', () => console.log('listo'));

// Escuchar todos los eventos para depuración
bus.onAny((event, data) => console.log('[bus]', event, data));

// Limpieza
unsubscribe();
```

El orchestrator expone su propio bus mediante `orchestrator.getEventBus()` para
que todas las apps registradas compartan automáticamente un único canal.

---

## 🛣️ Enrutamiento

```ts
import { createRouter } from 'tuvix.js';

const router = createRouter({
  mode: 'history', // o 'hash'
  base: '/',       // ruta base opcional
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'users' },
    { path: '/settings', app: 'settings', exact: true },
  ],
});

// Navegación programática
await router.push('/dashboard/overview');
await router.replace('/users/42');
router.back();

// Navigation guards (devuelve false para cancelar)
const off = router.beforeEach(async ({ from, to }) => {
  if (to.startsWith('/admin') && !isAdmin()) return false;
});

// Reaccionar a cambios
router.onChange(({ from, to, toRoute }) => {
  console.log(`navegado ${from} → ${to}`, toRoute?.params);
});

// O usa el helper de navegación del orchestrator
await orchestrator.navigateTo('/settings');
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
