# Primeros pasos

Esta página construye una shell con dos micro apps: una página de inicio y un dashboard. Registrarás las apps, dejarás que el router las monte y enviarás nuevas props a una app montada.

## Instalación

Instala el paquete paraguas. Contiene el orquestador, el router, el loader, el event bus y el sandbox:

```bash
pnpm add tuvix.js
```

Añade un adaptador por cada framework que usen tus micro apps:

```bash
pnpm add @tuvix.js/react react react-dom
pnpm add @tuvix.js/vue vue
pnpm add @tuvix.js/svelte svelte
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
```

## Genera un proyecto

`create-tuvix-app` crea un proyecto de shell o de micro app que depende de los paquetes 0.5:

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-dashboard --template react-app
```

Plantillas: `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. Pasa `--example <name>` para copiar en su lugar uno de los ejemplos del repositorio.

## Construye una shell

La shell controla el layout de la página y decide qué app va en cada sitio. Dale un elemento contenedor:

```html
<nav>
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
</nav>
<main id="app"></main>
<script type="module" src="/src/main.ts"></script>
```

Después crea el orquestador, registra las apps e inícialo:

```ts
// src/main.ts
import { createOrchestrator, interceptLinks, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  // '/' alone would match every path; `end: true` makes it exact.
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
});

// Turn <a href> clicks into router navigations instead of page loads.
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

Qué ocurre:

1. `start()` lee la ruta actual y monta cada app cuyo `activeWhen` coincide.
2. Un clic en `<a href="/dashboard">` llama a `navigateTo('/dashboard')`. El router añade la URL al historial, y el orquestador desmonta `home` y después monta `dashboard`.
3. El primer montaje de `dashboard` carga su script y su hoja de estilo. Los montajes posteriores reutilizan el módulo cargado.

El router nunca intercepta clics por sí solo. Sin `interceptLinks`, un clic en un enlace recarga la página, y el orquestador monta la app correcta en la nueva carga.

## Escribe una micro app

Una micro app es un objeto con `mount` y `unmount`. `defineMicroApp` comprueba la forma y registra el módulo con su nombre, para que el loader pueda encontrarlo después de que se ejecute el script:

```ts
// apps/home.ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'home',

  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Welcome, ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },

  update({ props, container }) {
    const title = container?.querySelector('h1');
    if (title) title.textContent = `Welcome, ${String(props.user ?? 'Guest')}`;
  },

  unmount({ container }) {
    container.replaceChildren();
  },
});
```

El `name` que pasas a `defineMicroApp` debe ser igual al nombre que registras en la shell. El loader busca el módulo por ese nombre.

## Usa un adaptador de framework

Los adaptadores crean el mismo módulo a partir de un componente raíz. Lo registran, mantienen una instancia del framework por contenedor y despachan eventos de ciclo de vida.

```tsx
// dashboard/src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Dashboard for {user}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

```ts
// settings/src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Settings from './Settings.vue';

export default createVueMicroApp({ name: 'settings', App: Settings });
```

Páginas por framework: [React](/es/guide/react), [Vue](/es/guide/vue), [Svelte](/es/guide/svelte), [Angular](/es/guide/angular).

Haz el build de cada micro app como un bundle de módulos ES y súbelo. Un build de librería de Vite funciona:

```ts
// dashboard/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.tsx', formats: ['es'], fileName: 'main' },
  },
});
```

La salida ES de Vite termina en `.js`, que el loader trata como un script clásico salvo que el entry indique `type: 'module'`. Mantén `type: 'module'` en el entry de la shell, como arriba.

## Actualiza props en tiempo de ejecución

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

`updateAppProps` fusiona las nuevas props con las registradas. Si la app está montada y tiene `update`, el orquestador la llama con las props fusionadas y la app se vuelve a renderizar en su sitio. Si la app no está montada, el orquestador guarda las props para el siguiente montaje.

## Lo que la shell no hace

- No renderiza tu layout. El propio HTML de la shell contiene los contenedores.
- No comparte instancias de framework entre apps. Dos apps React obtienen dos raíces React.
- No aplica sandbox a JavaScript. Todas las apps se ejecutan en el `window` de la página.

## Próximos pasos

- [Arquitectura](/es/guide/architecture): el camino desde la navegación hasta `mount`.
- [Enrutamiento](/es/guide/routing): patrones de `activeWhen`, el router integrado, guards.
- [Router externo](/es/guide/external-router): sigue a TanStack Router o React Router.
- [Islas SSR](/es/guide/ssr-islands): renderiza micro apps en el servidor dentro de una página React.
