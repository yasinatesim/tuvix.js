# Arquitectura

Tuvix.js se divide en paquetes pequeños. El orquestador de `@tuvix.js/core` los une; cada uno de los demás paquetes también funciona por separado.

## Paquetes y sus funciones

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

## De la navegación al montaje

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

La fase 1 termina antes de que empiece la fase 2, así que dos apps que comparten `#app` nunca están en él al mismo tiempo. Si llega una nueva ruta mientras se ejecuta una reconciliación, el orquestador termina el paso actual y después reconcilia la ruta más reciente. Navegar A → B → A en rápida sucesión deja montada solo A.

## El contrato del módulo

Toda micro app, escrita a mano o producida por un adaptador, tiene esta forma (`MicroAppModule` de `@tuvix.js/loader`):

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

- `bootstrap` se ejecuta una vez por cada módulo cargado.
- `mount` recibe el contenedor, las props actuales, el nombre de la app y el event bus del orquestador.
- `update` recibe las props fusionadas cuando la shell llama a `updateAppProps`. `container` indica a un módulo montado en varios sitios qué montaje debe actualizar.
- `unmount` debe eliminar todo lo que creó `mount`.

## Cómo encuentra el loader un módulo

1. **Entry con función loader** (`() => import('./app')`): el loader usa el módulo resuelto, si no su export `default`, y si no el módulo registrado con el nombre de la app.
2. **Entry con URL**: el loader añade etiquetas `<script>` y `<link>`, espera a que carguen y lee el módulo del registro que rellena `registerModule(name, module)`. Los adaptadores y `defineMicroApp` llaman a `registerModule` por ti.
3. **Fallback UMD**: si no se registró nada, el loader elige una nueva global de `window` que tenga una función `mount`. Si aparecieron varias, elige la que tiene el mismo nombre que la app y, si no hay ninguna, falla.

El registro y el estado del ciclo de vida viven en `window.__TUVIX_RUNTIME__`, así que las micro apps empaquetadas por separado, cada una con su propia copia de `@tuvix.js/loader`, siguen viendo un único registro.

Los scripts se cargan como `type="module"` cuando el entry define `type: 'module'` o la URL termina en `.mjs`, `.mts`, `.ts`, `.tsx` o `.jsx`. Las demás URLs se cargan como scripts clásicos.

## Estado compartido del runtime

| Estado | Dónde vive | Por qué |
| --- | --- | --- |
| Registro de módulos | `window.__TUVIX_RUNTIME__` (también `window.__TUVIX_MODULES__`) | El loader encuentra apps de cualquier bundle |
| Apps montadas y esperas pendientes | `window.__TUVIX_RUNTIME__` | `whenMounted` funciona entre bundles |
| Event bus global | `window.__TUVIX_GLOBAL_BUS__` | `getGlobalBus()` devuelve un bus por página |

En el servidor, sin `window`, cada uno de estos estados tiene ámbito de módulo.

## Modelo de aislamiento

- **CSS**: `sandbox: true` en `register` renderiza la app dentro de un shadow root y carga ahí los `styles` de su entry. Consulta [Sandboxing](/es/guide/sandbox).
- **JavaScript**: ninguno por defecto. Todas las apps comparten `window`, `document` y las globales. `JsSandbox` solo aísla el código que ejecutas a través de su proxy.

## Dónde seguir

- [Hooks de ciclo de vida](/es/guide/lifecycle): el contrato en detalle.
- [Eventos de ciclo de vida](/es/guide/lifecycle-events): averigua cuándo una app está en la página.
- [Enrutamiento](/es/guide/routing): reglas de los patrones.
