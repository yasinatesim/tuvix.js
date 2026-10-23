---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="CLI que genera un proyecto de Vite para una shell de Tuvix.js o una micro app de React, Vue, Svelte, Angular o vanilla, y después instala sus dependencias."
  icon="🚀"
  npm="true"
  github="cli"
/>

## Uso

El nombre del paquete empieza por `create-`, así que el comando `create` de cualquier gestor de paquetes lo encuentra, y `npx` ejecuta su binario `create-tuvix-app`:

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app
```

`npm create` solo reenvía los flags que van después de `--`. Los demás comandos los pasan directamente:

```bash
npm create tuvix-app@latest my-app -- --template react-app --typescript
pnpm create tuvix-app my-app --template react-app --typescript
```

El binario necesita Node.js. Escribe en una carpeta nueva dentro del directorio actual.

## Cuándo usarlo

Úsalo para empezar desde cero una pieza de Tuvix.js: una shell que registra micro apps, o una micro app en un framework concreto. Cada ejecución crea un proyecto de Vite con `tuvix.js` y el adaptador `@tuvix.js/*` correspondiente en `^0.5.0`.

Elige otra opción cuando añadas Tuvix.js a una app que ya existe. Instala el adaptador con tu gestor de paquetes y sigue la [guía](/es/guide/getting-started). Para tener una configuración con varias apps que funcione y que puedas leer o copiar, usa `--example` (consulta [Ejemplos](#examples)).

## Inicio rápido

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

La CLI escribe seis archivos, ejecuta `pnpm install` en `checkout/` e imprime los siguientes pasos:

```text
checkout/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    └── main.tsx
```

`src/main.tsx` exporta el módulo de la micro app que carga una shell:

```tsx [src/main.tsx]
import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export default createReactMicroApp({
  name: 'my-react-app',
  App,
});
```

Cambia `my-react-app` por el nombre que registra tu shell. La CLI no inserta ahí el nombre de tu proyecto.

## Opciones

```text
create-tuvix-app [project-name] [options]
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `project-name` | posicional | pregunta | Nombre de la carpeta y `name` del `package.json`. Lo define el primer argumento que no empieza por `-`; uno posterior lo reemplaza. |
| `--template`, `-t` | `string` | pregunta | Uno de `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. |
| `--typescript` | flag | pregunta (`Yes` preseleccionado) | Genera archivos TypeScript y un `tsconfig.json`. |
| `--no-typescript` | flag | pregunta | Genera archivos JavaScript. `angular-app` lo ignora. |
| `--example`, `-e` | `string` | ninguno | Descarga una carpeta de `examples/` del repositorio de GitHub en lugar de una plantilla. Omite las preguntas y el paso de instalación. |
| `--help`, `-h` | flag | `false` | Imprime el uso y termina. |
| `--version`, `-v` | flag | `false` | Imprime `create-tuvix-app v<version>` y termina. La CLI lee la versión de su propio `package.json`. |

Por cada valor que omitas, la CLI pregunta de forma interactiva, en este orden: nombre del proyecto (`my-app` como placeholder, se rechaza una entrada vacía), plantilla y, por último, TypeScript. Pasa los tres para ejecutarla sin preguntas:

```bash
npx create-tuvix-app admin --template angular-app --typescript
```

La CLI ignora los flags que no conoce.

## Plantillas

Todas las plantillas escriben `index.html`, `package.json` y `src/main.<ext>`. El `package.json` generado es `private`, tiene `"type": "module"`, la versión `0.1.0` y tres scripts: `dev` (`vite`), `build` (`vite build`) y `preview` (`vite preview`). `svelte-app` en modo TypeScript añade un cuarto, `check`. Todos los `package.json` incluyen `tuvix.js@^0.5.0` y `vite@^6.0.0`, además de `typescript@^5.7.0` en modo TypeScript.

| Plantilla | Archivos además de `index.html` y `package.json` | Dependencias adicionales |
| --- | --- | --- |
| `shell` | `src/main.ts` | ninguna |
| `react-app` | `src/main.tsx`, `src/App.tsx`, `vite.config.ts` | `react`, `react-dom` `^19.0.0`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3.0`; `@types/react`, `@types/react-dom` en modo TS |
| `vue-app` | `src/main.ts`, `src/App.vue`, `vite.config.ts`; `src/vite-env.d.ts` en modo TS | `vue@^3.5.0`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2.0` |
| `svelte-app` | `src/main.ts`, `src/App.svelte`, `vite.config.ts`, `svelte.config.js`; `src/vite-env.d.ts` en modo TS | `svelte@^5.0.0`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5.0.0`; `svelte-check@^4.0.0` en modo TS |
| `angular-app` | `src/main.ts`, `src/app/app.component.ts`, `vite.config.ts` | `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/platform-browser` `^20.0.0`, `rxjs@^7.8.0`, `tslib@^2.6.0`, `@tuvix.js/angular`, `typescript@~5.8.0` |
| `vanilla-app` | `src/main.ts` | ninguna |

El modo TypeScript añade `tsconfig.json` (`ES2020`, módulos `ESNext`, resolución `bundler`, `strict`). En `react-app`, `vue-app` y `svelte-app` incluye `vite.config.ts` junto a `src`. El modo JavaScript usa `.js` y `.jsx` y no escribe `tsconfig.json`; `vite.config.ts` sigue siendo TypeScript, que Vite carga en ambos casos. Todos los paquetes `@tuvix.js/*` reciben `^0.5.0`.

### `shell`

Un orquestador con un router en modo history. `index.html` tiene un `#header`, un `<nav>` con enlaces a `/dashboard` y `/settings`, y un `<main id="main">`. `src/main.ts`:

```ts [src/main.ts]
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
  onError(error, appName) {
    console.error(`App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

orchestrator.start();
```

Reemplaza la URL de `entry` por la entrada compilada de tu app de dashboard y registra `settings` tú mismo. La plantilla solo registra `dashboard`.

### `react-app`

`createReactMicroApp({ name: 'my-react-app', App })` de `@tuvix.js/react`. `App` renderiza un encabezado y las props que recibe en formato JSON. `vite.config.ts` añade `@vitejs/plugin-react`, que compila JSX con el runtime automático, así que `App.jsx` no necesita importar `React` en modo JavaScript. El `tsconfig.json` de TS define `"jsx": "react-jsx"`.

### `vue-app`

`createVueMicroApp({ name: 'my-vue-app', App })` de `@tuvix.js/vue`, y `vite.config.ts` añade `@vitejs/plugin-vue`. `App.vue` es un componente con `<script setup>` que lee las props de la shell con `inject`:

```vue [src/App.vue]
<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>Vue Micro App</h1>
    <p>This is a Tuvix.js micro frontend.</p>
    <pre>{{ JSON.stringify(props, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

// The props the shell passes to mount() and update(), kept reactive.
const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
</script>
```

En modo TS, `src/vite-env.d.ts` referencia `vite/client` y declara los módulos `*.vue`, así que `tsc` acepta la importación de `App`.

### `svelte-app`

Una micro app de Svelte 5. `src/main.ts` pasa `SvelteMap` de `svelte/reactivity`, así que `update({ props })` vuelve a renderizar en el sitio en lugar de volver a montar:

```ts [src/main.ts]
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({
  name: 'my-svelte-app',
  App,
  SvelteMap,
});
```

`App.svelte` lee su prop `name` con `$props()`. `vite.config.ts` añade el plugin de Svelte, y `svelte.config.js` define `preprocess: vitePreprocess()` para que `<script lang="ts">` compile. En modo TS, `src/vite-env.d.ts` referencia los tipos de `svelte` y `vite/client`, y `package.json` recibe un script `check` (`svelte-check --tsconfig ./tsconfig.json`).

### `angular-app`

Angular 20 sin zone.js. La plantilla siempre usa TypeScript, incluso con `--no-typescript`, e imprime `Angular requires TypeScript. Switching to TypeScript automatically.` cuando eliges JavaScript en la pregunta.

```ts [src/main.ts]
// Load the JIT compiler before any Angular package that ships partially
// compiled code (@angular/common, forms, router) is evaluated.
import '@angular/compiler';
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app/app.component';

export default createSsrAngularMicroApp({
  name: 'my-angular-app',
  component: AppComponent,
});
```

`AppComponent` es un componente standalone con una plantilla en línea. `createSsrAngularMicroApp` lo renderiza desde cero en un contenedor vacío, y renderiza sobre el marcado cuando el contenedor contiene HTML de `renderAngularToString`. El adaptador funciona sin zonas. Vite no compila Angular en modo AOT, así que los componentes se compilan en el navegador: mantén `import '@angular/compiler'` como primera línea de `src/main.ts`, y mantén el compilador como dependencia de runtime. `tsconfig.json` apunta a `ES2022` con `experimentalDecorators` activado y `useDefineForClassFields` desactivado, y `vite.config.ts` fija el target de esbuild en `es2022`.

### `vanilla-app`

`defineMicroApp` de `tuvix.js` con un `mount` que escribe un encabezado en `container.innerHTML` y un `unmount` que lo vacía.

## Ejemplos {#examples}

`--example <name>` descarga `https://codeload.github.com/yasinatesim/tuvix.js/tar.gz/master` y extrae `examples/<name>/` en la carpeta de tu proyecto. Se omiten las preguntas, `--template`, `--typescript` y el paso de instalación. La CLI imprime `<pm> install` y `<pm> run dev` como siguientes pasos.

```bash
npx create-tuvix-app my-app --example with-multiple-frameworks
```

Sin nombre de proyecto, la carpeta es `my-app`. El nombre solo puede contener letras, dígitos y guiones. Estas carpetas existen en `examples/`:

| Ejemplo | Muestra |
| --- | --- |
| `with-react` | Micro apps de React en una shell |
| `with-vue` | Micro apps de Vue en una shell |
| `with-svelte` | Micro apps de Svelte en una shell |
| `with-angular` | Micro apps de Angular en una shell |
| `with-vanilla` | Micro apps sin framework |
| `with-multiple-frameworks` | Micro apps de React y Vue en una misma página |
| `with-react-router` | `@tuvix.js/router` con apps de React |
| `with-react-event-bus` | Apps que se comunican a través de `@tuvix.js/event-bus` |
| `with-react-sandbox` | Aislamiento de CSS con `@tuvix.js/sandbox` |
| `with-react-devtools` | El overlay de [`@tuvix.js/devtools`](/es/packages/devtools) |
| `with-module-federation-react` | `@tuvix.js/module-federation` con remotes de React |
| `with-ssr-react` | `@tuvix.js/server` componiendo fragmentos de React |
| `with-ssr-vanilla` | `@tuvix.js/server` componiendo fragmentos de HTML plano |
| `with-ssr-islands` | Islas renderizadas en el servidor en varios frameworks con [`@tuvix.js/vite`](/es/packages/vite) |

Los ejemplos viven dentro del monorepo, así que sus archivos `package.json` dependen de `workspace:*`. Reemplaza cada `workspace:*` y `workspace:^` por `^0.5.0` antes de ejecutar el comando de instalación, o el gestor de paquetes se detendrá con un error de protocolo no soportado.

## Detección del gestor de paquetes

La CLI elige el gestor de paquetes para el paso de instalación y para los comandos que imprime según cómo la iniciaste. Comprueba, en orden:

1. `process.versions.bun` está definido: `bun`.
2. `npm_execpath` contiene `pnpm` o `yarn`: ese gestor.
3. `npm_config_user_agent` empieza por `pnpm`, `yarn` o `bun/`: ese gestor.
4. En otro caso: `npm`.

`pnpm create tuvix-app` y `pnpm dlx create-tuvix-app` instalan con pnpm, `yarn create` con yarn, `npx` y `npm create` con npm. Ningún flag cambia esta elección.

## Paso de instalación

Después de ejecutar una plantilla, la CLI ejecuta `<pm> install` en la carpeta nueva detrás de un spinner (`Installing dependencies with <pm>`). Oculta la salida del gestor de paquetes.

- Código de salida 0: el spinner termina con `Dependencies installed`, y la CLI imprime `cd <name>` y `<pm> run dev`.
- Código de salida distinto de cero, o falta el binario: el spinner termina con `Install failed. Run manually:` seguido de `cd <absolute path>` y `<pm> install`. Los archivos del proyecto se conservan, y la CLI sigue terminando con código 0.

Las ejecuciones con `--example` nunca instalan.

## Casos límite

- Una carpeta existente detiene la ejecución con `Directory "<name>" already exists.` y código de salida 1. La CLI nunca escribe dentro de una carpeta existente ni la fusiona.
- Un nombre cuya ruta resuelta no empieza por el directorio actual, como `../app`, se detiene con `Project directory must be within the current working directory.`
- Un valor desconocido de `--template` falla después de las preguntas con `Unknown template "<value>". Available: shell, react-app, vue-app, vanilla-app, svelte-app, angular-app`.
- `--template` o `--example` como último argumento, sin valor, cuenta como no indicado: obtienes la pregunta de plantilla, o una ejecución normal de plantilla.
- La CLI usa el nombre del proyecto tal como lo escribes tanto para la carpeta como para el `name` del `package.json`. No comprueba las reglas de nombres de npm, así que `My App` produce un nombre de paquete no válido.
- Cancelar una pregunta (Ctrl+C) imprime `Operation cancelled.` y termina con código 0.
- Un nombre de ejemplo que no existe en `master` deja una carpeta vacía y falla con `Example "<name>" was not found or failed to extract.` Borra la carpeta antes de reintentarlo.
- La CLI descarga el tarball completo del repositorio para un solo ejemplo. Con una conexión lenta, `--example` es lento.

## Lo que no hace

- Las plantillas de micro app no se montan solas. `src/main` exporta el módulo y nada en `index.html` llama a `mount`, así que `pnpm run dev` muestra un `#app` vacío hasta que una shell carga la entrada.
- No incluye una configuración de Vite en modo librería. `vite build` produce un build de app normal con nombres de archivo con hash, y tú eliges la entrada que carga tu shell.
- No configura monorepo, workspace ni varias apps. Ejecuta la CLI una vez por app, o parte de un `--example`.
- No hace git init, ni añade linter, test runner o configuración de CSS.
- No hay flag `--no-install` ni flag para elegir el gestor de paquetes.
- No hay API programática. Importar el paquete ejecuta la CLI.
