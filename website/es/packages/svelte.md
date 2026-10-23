---
title: '@tuvix.js/svelte'
---

<PackageHeader
  name="@tuvix.js/svelte"
  title="Bindings de Svelte"
  description="Convierte un componente de Svelte 3, 4 o 5 en una micro app de Tuvix.js: una instancia por contenedor, actualización de props sin remontar, hidratación del markup del servidor y renderizado en el servidor con CSS."
  icon="🔥"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/svelte svelte
# o pnpm add @tuvix.js/svelte svelte
```

El rango de peer cubre Svelte 3, 4 y 5. El paquete tiene dos puntos de entrada: `@tuvix.js/svelte` para el navegador y `@tuvix.js/svelte/server` para el renderizado en el servidor.

## Cuándo usarlo

Usa este paquete cuando un componente de Svelte deba ejecutarse como micro app de Tuvix.js: el orquestador lo monta en un contenedor en una ruta, le pasa props, las actualiza y lo desmonta cuando cambia la ruta. También cubre las islas: renderizas el componente en el servidor, pones el HTML en la página y el cliente lo hidrata.

No lo necesitas para una página que Svelte controla de principio a fin (SvelteKit). En ese caso Svelte se monta solo y no hay ningún orquestador con el que comunicarse.

## Inicio rápido

Un componente de Svelte 5 con props:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { name, theme = 'light' }: { name: string; theme?: string } = $props();
</script>

<p class={theme}>Hello {name}</p>
```

La entrada de la micro app lo envuelve. Pasar `SvelteMap` permite que las actualizaciones de props vuelvan a renderizar el componente sin remontarlo:

```ts
// profile-app.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

La shell registra la app e inicia el orquestador:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Más tarde: el componente se vuelve a renderizar sin remontarse.
await orchestrator.updateAppProps('profile', { name: 'Grace', theme: 'dark' });
```

El bundle del cliente debe resolver `svelte` a su build para navegador. `@sveltejs/vite-plugin-svelte` lo hace por ti. Si tu configuración descarta la condición de export `browser`, `mount()` de Svelte 5 lanza `lifecycle_function_unavailable` y `onMount` nunca se ejecuta.

## API

### `createSvelteMicroApp`

```ts no-check
function createSvelteMicroApp(config: SvelteMicroAppConfig): MicroAppModule;
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre de la app. El adaptador registra el módulo con ese nombre mediante `registerModule` de `@tuvix.js/loader`. |
| `App` | `unknown` | obligatorio | Componente raíz: un componente compilado de Svelte 5 (una función) o una clase de componente de Svelte 3/4. |
| `bootstrap` | `() => void \| Promise<void>` | ninguno | Configuración inicial que se ejecuta una sola vez. El `bootstrap()` del módulo la espera. |
| `ssr` | `boolean` | `false` | Hidrata el markup del servidor cuando el contenedor tiene elementos o texto que no sea solo espacios en blanco. Si no, renderiza desde cero. |
| `SvelteMap` | clase `SvelteMap` de `svelte/reactivity` | ninguno | Solo Svelte 5. Con ella, `update()` vuelve a renderizar sin remontar; sin ella, un `update()` de Svelte 5 remonta el componente. Svelte 3/4 la ignoran. |

En el primer montaje el adaptador importa `svelte` y comprueba si existe un export `mount`. Guarda el resultado en caché para la página.

- **Svelte 5** (`mount` existe): renderiza con `mount()`, hidrata con `hydrate()` y destruye con `unmount()`. El funcionamiento de `update()` depende de `SvelteMap`:
  - Con `SvelteMap`, el componente recibe un objeto de props respaldado por un `SvelteMap`. `update()` escribe los valores nuevos en ese mapa, así que las partes de la plantilla que leen una prop modificada se vuelven a renderizar y el componente conserva sus nodos del DOM y su estado. Funciona con componentes `$props()` y con componentes heredados `export let` compilados por Svelte 5.
  - Sin ella, `update()` desmonta la instancia, vacía el contenedor, monta una instancia nueva con las props nuevas y vuelve a despachar `tuvix:mounted` con `hydrated: false`. Se pierden los nodos del DOM, el foco y el estado del componente.
- **Svelte 3/4** (sin `mount`): `new App({ target, props, hydrate })`, `$set()` y `$destroy()`.

El módulo devuelto funciona por contenedor. Cada contenedor recibe su propia instancia, así que un módulo puede renderizarse en tres contenedores a la vez.

- `mount({ container, props })` vacía el contenedor (salvo que hidrate), renderiza, ejecuta los callbacks de `onMount` y los effects, y luego despacha `tuvix:mounted` en el contenedor con `hydrated: true | false`. Un fallo despacha `tuvix:error` y rechaza con el error original.
- `update({ props, container? })` actualiza la instancia de `container`, o todas las instancias si omites `container`. Cada actualización reemplaza el conjunto completo de props: una clave que falta en las props nuevas vuelve al valor por defecto del componente en Svelte 5 y pasa a ser `undefined` en Svelte 3/4.
- `unmount({ container })` destruye la instancia, vacía el contenedor y despacha `tuvix:unmounted`.

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import { onLifecycle } from '@tuvix.js/loader';
import Cart from './Cart.svelte';

const cart = createSvelteMicroApp({ name: 'cart', App: Cart, SvelteMap });

onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} mounted`, { hydrated });
});

const header = document.querySelector<HTMLElement>('#cart-header')!;
const sidebar = document.querySelector<HTMLElement>('#cart-sidebar')!;

await cart.mount({ container: header, props: { compact: true } });
await cart.mount({ container: sidebar, props: { compact: false } });

// Actualiza solo la instancia de la barra lateral.
await cart.update?.({ props: { compact: true }, container: sidebar });
```

### `createSsrSvelteMicroApp`

```ts no-check
function createSsrSvelteMicroApp(config: Omit<SvelteMicroAppConfig, 'ssr'>): MicroAppModule;
```

Equivale a `createSvelteMicroApp({ ...config, ssr: true })`. Úsalo en el cliente para islas que el servidor renderizó con `renderSvelteToString` o `renderSvelte`.

- **Svelte 5**: `hydrate(App, { target, props })`. El markup debe venir de `svelte/server`, porque la hidratación lee los comentarios marcadores (`<!--[-->`) que escribe.
- **Svelte 3/4**: `new App({ target, props, hydrate: true })`. Compila el componente con `hydratable: true`.

La hidratación conserva los nodos del DOM del servidor y les adjunta los manejadores de eventos. Un contenedor que solo tiene espacios en blanco o comentarios recibe un render nuevo.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelteToString(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<string>;
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | ninguno | `render` de `svelte/server`. Sin ella, el adaptador importa `svelte/server` en tiempo de ejecución. |

Renderiza el componente en el servidor y devuelve sus etiquetas `<style>` seguidas de su markup. Pon el string dentro del contenedor de la isla y móntalo con `createSsrSvelteMicroApp`. El string no incluye el contenido de `<svelte:head>`; usa `renderSvelte` cuando lo necesites.

La función elige la versión de Svelte en tiempo de ejecución. Si pasas `render`, siempre toma el camino de Svelte 5 y llama a `render(App, { props })`. Sin ella, el adaptador importa `svelte`: si ese módulo exporta `mount`, carga `svelte/server` y renderiza con Svelte 5. Si no, llama a `App.render(props)` (Svelte 3/4, compilado con `generate: 'ssr'`) y envuelve `css.code` en una etiqueta `<style>`. El adaptador nunca decide comprobando `App.render`, porque los componentes de Svelte 5 compilados con `dev: true` (vite-plugin-svelte en modo serve) llevan un stub `App.render` que lanza un error.

Llámala desde una función de servidor, no desde código que también se ejecute en el navegador. En un navegador devuelve `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooterIsland(): Promise<string> {
  const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
  return `<footer id="footer" data-tuvix-app="footer">${html}</footer>`;
}
```

### `renderSvelte`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelte(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<SvelteRenderResult>;
```

Recibe los mismos argumentos y opciones que `renderSvelteToString` y devuelve las partes por separado:

| Campo | Significado |
| --- | --- |
| `html` | Markup del componente. La salida de Svelte 5 incluye los comentarios de hidratación. |
| `head` | Contenido de `<svelte:head>` sin las etiquetas `<style>` del componente. Ponlo en el `<head>` del documento. |
| `css` | CSS del componente como etiquetas `<style>`, o `''` cuando el compilador no emitió ninguno. |

En un navegador los tres campos son `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Article from './Article.svelte';

export async function renderArticlePage(slug: string): Promise<string> {
  const { html, head, css } = await renderSvelte(Article, { slug }, { render });
  return `<!doctype html>
<html>
  <head>${head}${css}</head>
  <body>
    <main id="article" data-tuvix-app="article">${html}</main>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}
```

### Tipos

| Tipo | Entrada | Significado |
| --- | --- | --- |
| `SvelteMicroAppConfig` | `@tuvix.js/svelte` | Opciones de `createSvelteMicroApp`. |
| `SvelteProps` | `@tuvix.js/svelte` | `Record<string, unknown>`: las props que el orquestador pasa al componente. |
| `RenderSvelteOptions` | `@tuvix.js/svelte/server` | `{ render?: SvelteServerRender }`. |
| `SvelteServerRender` | `@tuvix.js/svelte/server` | Forma de `render` de Svelte 5 en `svelte/server`. |
| `SvelteRenderResult` | `@tuvix.js/svelte/server` | `{ html, head, css }`, devuelto por `renderSvelte`. |

## Renderizado en el servidor

Una isla pasa por tres pasos: renderizado en el servidor, envío del HTML dentro del contenedor e hidratación en el cliente.

1. Llama a `renderSvelteToString` (o `renderSvelte`) en una función de servidor y pon el resultado en el elemento contenedor.
2. Carga la entrada del cliente, que exporta `createSsrSvelteMicroApp({ name, App })`.
3. El orquestador monta la app en el mismo contenedor. El adaptador detecta el markup y lo hidrata.

**CSS.** Svelte 5 incluye el CSS del componente en la salida del render solo cuando compilas con `css: 'injected'`. Con el valor por defecto `css: 'external'`, tu bundler escribe el CSS en un archivo y el string no contiene etiquetas `<style>`. En Vite:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { css: 'injected' } })],
});
```

Si mantienes `css: 'external'`, enlaza la hoja de estilo generada desde el head de la página. [`@tuvix.js/vite`](/es/packages/vite) indica a tu servidor qué hojas de estilo necesita la entrada de una isla.

**Una sola copia de Svelte.** Pasa `render` de `svelte/server` cuando tu bundle de servidor incluya Svelte (Nitro, Vinxi, un build SSR de Vite con `noExternal`). Así el componente y el renderer comparten una única copia de Svelte. Sin la opción, el adaptador importa `svelte/server` en tiempo de ejecución, lo que puede cargar una segunda copia desde `node_modules`. El renderer de servidor de Svelte usa comprobaciones `instanceof` y falla cuando el componente y el renderer vienen de copias distintas.

## Casos límite

- `mount` en un contenedor que ya tiene una instancia del mismo módulo desmonta primero la instancia anterior.
- `unmount` llamado mientras `mount` todavía está cargando `svelte` espera a que termine el montaje y luego destruye la instancia. No queda ningún componente huérfano.
- `unmount` en un contenedor que este módulo nunca montó, o cuyo montaje falló, no hace nada: el contenedor conserva sus hijos y no se dispara ningún evento.
- `update` llamado mientras hay un montaje pendiente lo espera y luego aplica las props. Una actualización de un montaje que falló no hace nada.
- En Svelte 3/4, una prop que falta en las props nuevas pasa a ser `undefined`. El valor por defecto de `export let name = 'x'` no vuelve. En Svelte 5 se aplica el valor por defecto, con o sin `SvelteMap`.
- El adaptador no importa `svelte/reactivity` por sí mismo. Svelte 3/4 no tienen ese módulo, y un bundler no podría compilar una app de Svelte 3/4 que lo referenciara, así que el import va en tu entrada de Svelte 5.
- Un remontaje de Svelte 5 (sin `SvelteMap`) vuelve a despachar `tuvix:mounted`, pero ningún `tuvix:unmounted` entre medias. Si el render nuevo lanza un error, `update()` se rechaza con ese error y la instancia anterior ya no existe.
- Sin `ssr`, `mount` vacía el contenedor antes de renderizar, así que los placeholders de carga desaparecen.
- Con `ssr`, el adaptador hidrata cuando el contenedor tiene un elemento o texto que no sea solo espacios en blanco. Los comentarios y los espacios en blanco por sí solos provocan un render nuevo.
- El adaptador detecta la versión de Svelte una vez por página. Si `import('svelte')` falla, el siguiente montaje lo reintenta.
- Un error de import o de render de Svelte 5 en el servidor te llega como una promesa rechazada. El adaptador no recurre a `App.render` como fallback.
- `render` de Svelte 5 puede devolver una promesa (renderizado asíncrono en el servidor). Ambas funciones de servidor la esperan.

## Lo que no hace

- No compila archivos `.svelte`. De eso se encarga tu bundler con `@sveltejs/vite-plugin-svelte` o `svelte/compiler`.
- No comprueba qué build de Svelte eligió tu bundler. Un bundle de cliente que resuelve `svelte` al build de servidor falla al montar.
- Solo pasa props. Los slots, snippets y eventos de componente no tienen canal desde el host. Usa [`@tuvix.js/event-bus`](/es/packages/event-bus) para comunicarte entre apps.
- No escribe el contenido de `<svelte:head>` en el documento. `renderSvelte` lo devuelve; tu servidor lo pone en `<head>`.
- No enlaza el CSS compilado con `css: 'external'`. Consulta [`@tuvix.js/vite`](/es/packages/vite).
- No espera datos en el servidor. Cárgalos primero y pásalos como props.

## Migrar desde 0.4

- **Svelte 5 funciona.** En 0.4 el adaptador llamaba a `new App()` con cada componente, así que los componentes de Svelte 5 fallaban, y `createSsrSvelteMicroApp` renderizaba una segunda copia en lugar de hidratar. El montaje no requiere cambios de código. Para actualizar props sin remontar, pasa `SvelteMap` de `svelte/reactivity` en la configuración; sin él, cada actualización de Svelte 5 remonta el componente.
- **El contenedor se vacía al montar.** Sin `ssr`, Svelte 3/4 añadía el componente después del markup que ya hubiera en el contenedor. Ahora el adaptador vacía primero el contenedor. Si dependías de que hubiera markup junto al componente, muévelo fuera del contenedor.
- **Sin fallback silencioso en el servidor.** `renderSvelteToString` recurría a `App.render` cuando `svelte/server` no se podía cargar. Ahora toma el camino de Svelte 5 cuando pasas `render` o cuando `svelte` exporta `mount`, llama a `App.render` solo en Svelte 3/4 y se rechaza ante un error de import o de render de Svelte 5. Los builds de desarrollo de Svelte 5 en el SSR de desarrollo de Vite toman el camino de Svelte 5 aunque lleven un stub `App.render`.
- **`unmount` en un contenedor desconocido no hace nada.** `unmount({ container })` en un contenedor que el módulo nunca montó lo vaciaba. Ahora deja el contenedor intacto, como los adaptadores de React, Vue y Angular.
- **Pasa `render`.** Añade `{ render }` de `svelte/server` como tercer argumento cuando tu bundle de servidor incluya Svelte:

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

// 0.4: await renderSvelteToString(Footer, { year: 2026 });
const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
```

Consulta la [guía de Svelte](/es/guide/svelte) para ver una app completa.
