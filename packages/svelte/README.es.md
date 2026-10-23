# @tuvix.js/svelte

> Bindings de Svelte 3/4/5 para el framework de micro frontends Tuvix.js

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Instalación

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

## Inicio rápido

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App });
```

El adaptador registra el módulo con `registerModule` de `@tuvix.js/loader`, así que el orquestador lo encuentra por su nombre. En el primer montaje importa `svelte` y comprueba si existe un export `mount`:

- **Svelte 5**: `mount()` / `hydrate()` / `unmount()` de `svelte`.
- **Svelte 3/4**: `new App({ target, props })`, `$set()` y `$destroy()`.

Tu bundler debe resolver `svelte` a su build de cliente (la condición de export `browser`; `@sveltejs/vite-plugin-svelte` la define). Si elige el build de servidor, `mount()` de Svelte 5 lanza `lifecycle_function_unavailable`.

## API

### `createSvelteMicroApp(config)`

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre de la app, registrado con `registerModule` |
| `App` | `unknown` | obligatorio | Componente de Svelte 5 o clase de componente de Svelte 3/4 |
| `bootstrap` | `() => void \| Promise<void>` | ninguno | Configuración que se ejecuta una sola vez |
| `ssr` | `boolean` | `false` | Hidrata el markup del servidor cuando el contenedor tiene alguno |
| `SvelteMap` | clase `SvelteMap` | ninguno | Solo Svelte 5: `SvelteMap` de `svelte/reactivity`, para que `update()` vuelva a renderizar en el sitio en lugar de volver a montar |

- Cada contenedor recibe su propia instancia, así que un mismo módulo puede montarse en varios contenedores.
- `mount` vacía el contenedor (salvo que hidrate), renderiza y despacha `tuvix:mounted` después de que se ejecuten los callbacks de `onMount` y los efectos. Un montaje fallido despacha `tuvix:error` y se rechaza.
- `unmount` destruye la instancia, vacía el contenedor y despacha `tuvix:unmounted`. Si se llama mientras `mount` todavía está cargando, espera al montaje y luego lo desmonta.
- `update({ props, container? })` actualiza un contenedor, o todas las instancias si no pasas `container`. Svelte 3/4 usa `$set()`. Svelte 5 vuelve a montar por defecto: desmonta la instancia, monta una nueva con las props nuevas y despacha `tuvix:mounted` otra vez, así que se pierden los nodos del DOM y el estado del componente. Pasa `SvelteMap` para actualizar en el sitio (funciona con `$props()` y con `export let`):

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App, SvelteMap });
```

El adaptador no importa `svelte/reactivity` por sí mismo: Svelte 3/4 no tiene ese módulo, y esa importación rompería los builds de apps con Svelte 3/4.

El host envía props nuevas a través del orquestador:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
});
await orchestrator.start();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

### `createSsrSvelteMicroApp(config)`

Equivale a `createSvelteMicroApp({ ...config, ssr: true })`. Hidrata cuando el contenedor tiene elementos o texto que no sea solo espacios en blanco, y renderiza desde cero en caso contrario. La hidratación de Svelte 5 necesita los marcadores de comentario que escribe `svelte/server`. Compila los componentes de Svelte 3/4 con `hydratable: true`.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString(App, props?, options?)` de `@tuvix.js/svelte/server`

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | ninguno | `render` de `svelte/server`; sin él, el adaptador importa `svelte/server` en runtime |

Devuelve las etiquetas `<style>` del componente seguidas de su markup. Si pasas `render`, siempre usa `render` de Svelte 5. Sin él, el adaptador importa `svelte`: si ese módulo exporta `mount`, carga `svelte/server` (Svelte 5); si no, llama a `App.render(props)` (Svelte 3/4) y envuelve `css.code` en `<style>`. Los componentes de Svelte 5 compilados con `dev: true` (vite-plugin-svelte en modo serve) incluyen un `App.render` que lanza un error, así que el adaptador nunca decide en función de `App.render`. Llámalo desde una función del servidor; en un navegador devuelve `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const footerHtml = await renderSvelteToString(
  Footer,
  { year: 2026 },
  { render }
);
```

### `renderSvelte(App, props?, options?)` de `@tuvix.js/svelte/server`

Mismas opciones. Devuelve `{ html, head, css }`, para que puedas poner el contenido de `<svelte:head>` en el head del documento.

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const { html, head, css } = await renderSvelte(
  Footer,
  { year: 2026 },
  { render }
);
```

### Tipos

`SvelteMicroAppConfig`, `SvelteProps` (de `@tuvix.js/svelte`); `RenderSvelteOptions`, `SvelteServerRender`, `SvelteRenderResult` (de `@tuvix.js/svelte/server`).

## Casos límite

- Svelte 5 incluye CSS en la salida del servidor solo si compilas con `css: 'injected'` (Vite: `svelte({ compilerOptions: { css: 'injected' } })`). Con el valor por defecto `css: 'external'`, tu bundler escribe el CSS en un archivo.
- Pasa `render` de `svelte/server` cuando el bundle de tu servidor incluya Svelte (Nitro, Vinxi, un build SSR de Vite con `noExternal`). El renderizador de servidor de Svelte falla cuando el componente y el renderizador provienen de dos copias distintas de Svelte.
- Cada actualización reemplaza el conjunto completo de props. Una clave que falta en las props nuevas se elimina en Svelte 5 (se aplica el valor por defecto) y se establece en `undefined` en Svelte 3/4.
- `mount` sobre un contenedor ya montado desmonta primero la instancia anterior. `unmount` sobre un contenedor que el módulo nunca montó no hace nada: deja los hijos del contenedor en su sitio y no despacha ningún evento.
- Un error de importación o de render de Svelte 5 en el servidor provoca un rechazo; no hay fallback a `App.render`.

## Lo que no hace

- No compila archivos `.svelte` ni comprueba qué build de Svelte eligió tu bundler.
- Solo pasa props: nada de slots, snippets ni eventos de componente desde el host.
- No escribe el contenido de `<svelte:head>` en el documento ni enlaza las hojas de estilo de `css: 'external'`.

Documentación completa: [tuvix.js.org/packages/svelte](https://tuvix.js.org/packages/svelte)

## Licencia

MIT
