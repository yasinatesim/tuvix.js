<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Un toolkit de micro frontends: carga, monta y conecta apps desplegadas de forma independiente, escritas en React, Vue, Svelte, Angular o TypeScript puro, en el navegador o como islas renderizadas en el servidor dentro de una página React.
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

- 🧩 **Adaptadores de framework** para React 18/19, Vue 3, Svelte 3-5 y Angular 15+. Cada uno convierte un componente raíz en un módulo de micro app con `mount`, `update` y `unmount`, con una instancia por contenedor.
- 🛣️ **Activación por ruta.** `activeWhen: '/users/:id'` monta una app en las rutas que coinciden. Los query strings y los hashes nunca la desmontan. Un único matcher (`matchPath`) sirve al orquestador, al router y al paquete de servidor.
- 🔁 **Montaje ordenado.** Los cambios de ruta se reconcilian uno a uno; las apps inactivas se desmontan antes de que se monten las nuevas, así que una navegación rápida A → B → A deja solo A en la página.
- 🔗 **Routers externos.** `orchestrator.connectRouter()` sigue a TanStack Router o React Router. `interceptLinks()` convierte los clics en `<a href>` simples en navegaciones del lado del cliente.
- 🏝️ **Islas SSR.** `TuvixIsland` aloja micro apps de Vue, Svelte, Angular y React en una página React renderizada en el servidor, las hidrata en su sitio y nunca reescribe su DOM al volver a renderizar.
- 🎨 **Primer pintado con estilos.** `@tuvix.js/vite` le indica a tu servidor qué hojas de estilo necesita cada isla, para que las enlaces en `<head>`.
- 📦 **Entradas flexibles.** URLs de scripts, `{ scripts, styles, type }` o funciones loader como `() => import('./app')`. Cargas en paralelo, reintentos, timeouts, hashes SRI.
- 📡 **Event bus compartido.** `getGlobalBus()` devuelve un bus por página, incluso entre apps empaquetadas por separado.
- 🔔 **Eventos de ciclo de vida.** `tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`, además de `whenMounted(name)` y `onLifecycle()`.
- 🔒 **Aislamiento de CSS bajo demanda.** `sandbox: true` renderiza una app dentro de un shadow root con sus propias hojas de estilo.
- 🟦 **TypeScript.** Cada paquete de librería incluye builds ESM y CommonJS con declaraciones de tipos.

Tuvix.js no aísla el JavaScript entre apps: todas las apps se ejecutan en el `window` de la página. Usa un `<iframe>` para código no confiable.

---

## 🤖 Generador de componentes con IA

Genera componentes de tuvix.js a partir de lenguaje natural con el chatbot del sitio de documentación.

- **Modelo de chat:** MiniMax M2.5 vía OpenRouter
- **Modelo de embeddings:** NVIDIA Nemotron Embed 1B vía OpenRouter (recuperación RAG)
- **Soporta:** React, Vue, Svelte, Angular
- **Dataset:** [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset) en HuggingFace

> Pruébalo: [Generador IA](https://tuvix.js.org/chatbot) en el sitio de documentación

---

## 📦 Instalación

```bash
# Orchestrator, router, loader, event bus and sandbox
pnpm add tuvix.js

# Adapters, as needed
pnpm add @tuvix.js/react @tuvix.js/vue @tuvix.js/svelte @tuvix.js/angular

# Or scaffold a project
npx create-tuvix-app my-app --template shell
```

---

## 🚀 Inicio rápido

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

Sin framework:

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

### Actualizar props

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

Una app montada que tiene `update` se vuelve a renderizar en su sitio. Si no, el orquestador guarda las props combinadas para el siguiente montaje.

---

## 🌉 Seguir a un router externo

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

## 🏝️ Islas renderizadas en el servidor

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

Durante la hidratación, la isla lee su HTML de la página, así que el cliente nunca necesita `footerHtml`. Consulta la [guía de islas SSR](https://tuvix.js.org/guide/ssr-islands) y [`examples/with-ssr-islands`](./examples/with-ssr-islands).

---

## 🔔 Eventos de ciclo de vida

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer');
container.classList.add(hydrated ? 'hydrated' : 'rendered');
```

---

## 🔌 Event bus

```ts
import { getGlobalBus } from 'tuvix.js';

const bus = getGlobalBus(); // the same bus the orchestrator passes to mount()

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => console.log(userId));
bus.emit('user:login', { userId: '42' });
off();
```

---

## 📦 Paquetes

| Paquete | Descripción |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | Paquete paraguas: core, router, loader, event bus, sandbox |
| [`@tuvix.js/core`](./packages/core) | Orquestador: registro, reconciliación, props, `connectRouter` |
| [`@tuvix.js/router`](./packages/router) | Router history/hash, `matchPath`, `interceptLinks` |
| [`@tuvix.js/loader`](./packages/loader) | Carga de entradas y runtime del ciclo de vida |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Bus pub/sub, `getGlobalBus()` para toda la página |
| [`@tuvix.js/sandbox`](./packages/sandbox) | `CssSandbox` (shadow DOM), `JsSandbox` (window proxy) |
| [`@tuvix.js/react`](./packages/react) | Adaptador de React, `TuvixReactApp`, `TuvixIsland`, hooks |
| [`@tuvix.js/vue`](./packages/vue) | Adaptador de Vue 3, `renderVueToString` |
| [`@tuvix.js/svelte`](./packages/svelte) | Adaptador de Svelte 3-5, `renderSvelteToString` |
| [`@tuvix.js/angular`](./packages/angular) | Adaptador de Angular 15+ (zoneless), `renderAngularToString` |
| [`@tuvix.js/vite`](./packages/vite) | Plugin de Vite: enlaces a las hojas de estilo de las islas para el `<head>` renderizado en el servidor |
| [`@tuvix.js/server`](./packages/server) | Composición de fragmentos HTML en el servidor, streaming, métricas |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Entradas respaldadas por remotes de webpack Module Federation |
| [`@tuvix.js/devtools`](./packages/devtools) | Panel de depuración en la página |
| [`create-tuvix-app`](./packages/cli) | Scaffolding de proyectos |

---

## 📁 Estructura del proyecto

```text
tuvix.js/
├── packages/        # the 15 packages above
├── examples/        # runnable examples, see below
├── website/         # documentation site (VitePress, 10 languages)
├── scripts/         # docs and package validators
└── .changeset/      # release notes for the next version
```

---

## 🧪 Ejemplos

| Ejemplo | Muestra |
| --- | --- |
| [`with-ssr-islands`](./examples/with-ssr-islands) | Host React con islas Vue, Svelte, Angular y React renderizadas en el servidor |
| [`with-react`](./examples/with-react) | Shell y micro apps de React |
| [`with-vue`](./examples/with-vue) | Micro apps de Vue 3 |
| [`with-svelte`](./examples/with-svelte) | Micro apps de Svelte |
| [`with-angular`](./examples/with-angular) | Micro apps de Angular |
| [`with-vanilla`](./examples/with-vanilla) | Sin framework |
| [`with-multiple-frameworks`](./examples/with-multiple-frameworks) | React y Vue en una misma shell |
| [`with-react-router`](./examples/with-react-router) | Enrutamiento |
| [`with-react-event-bus`](./examples/with-react-event-bus) | Event bus |
| [`with-react-sandbox`](./examples/with-react-sandbox) | Sandbox de CSS |
| [`with-react-devtools`](./examples/with-react-devtools) | Panel de devtools |
| [`with-module-federation-react`](./examples/with-module-federation-react) | Module Federation |
| [`with-ssr-react`](./examples/with-ssr-react) | Composición en el servidor con `@tuvix.js/server` |
| [`with-ssr-vanilla`](./examples/with-ssr-vanilla) | Composición en el servidor sin framework |

---

## 🗺️ Hoja de ruta

Disponible:

- Orquestador con reconciliaciones serializadas, `connectRouter`, montaje por viewport y HTML de fallback
- Adaptadores para React, Vue, Svelte 3-5 y Angular (zoneless), con hidratación SSR
- `TuvixIsland`, eventos de ciclo de vida, assets de islas con `@tuvix.js/vite`
- Composición en el servidor con streaming y métricas de Prometheus (`@tuvix.js/server`)
- Entradas de Module Federation, devtools en la página, scaffolding con la CLI
- Documentación en 10 idiomas

Planificado:

- Hot module reload entre micro apps
- Soporte nativo de ESM / import maps
- Composición en el servidor consciente del edge, con caché de fragmentos stale-while-revalidate
- Utilidades de testing y un orquestador simulado
- Tests A/B de fragmentos

---

## 🤝 Contribuir

Lee la [guía de contribución](./CONTRIBUTING.md) antes de abrir un pull request.

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js
pnpm install
pnpm build
pnpm test
```

¿Vienes de 0.4? Lee la [guía de migración](https://tuvix.js.org/guide/migration-0-5).

---

## 🔑 Licencia

Copyright © 2026 - Licencia MIT.
Consulta [LICENSE](./LICENSE) para más información.

---

<p align="center">Este README fue generado por <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 🥲</p>
