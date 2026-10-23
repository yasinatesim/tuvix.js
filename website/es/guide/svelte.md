# Con Svelte

`@tuvix.js/svelte` convierte un componente Svelte en una micro app. Es compatible con Svelte 5 y Svelte 3/4, hidrata el markup del servidor y renderiza componentes a HTML en el servidor.

## Instalación

```bash
pnpm add @tuvix.js/svelte svelte
```

## Convertir un componente en una micro app

```ts
// src/main.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

// SvelteMap (Svelte 5 only) lets update() re-render in place; drop it for Svelte 3/4.
export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

En el primer montaje, el adaptador importa `svelte` y comprueba qué API tiene:

| Svelte | Montar | Hidratar | Actualizar | Desmontar |
| --- | --- | --- | --- | --- |
| 5 | `mount(App, { target, props })` | `hydrate(...)` | en el sitio con `SvelteMap`; si no, vuelve a montar | `unmount(instance)` |
| 3 / 4 | `new App({ target, props })` | `new App({ hydrate: true })` | `instance.$set(props)` | `instance.$destroy()` |

Tu bundler debe resolver `svelte` a su build para navegador. Si elige el build de servidor, `mount()` de Svelte 5 lanza `lifecycle_function_unavailable`, o los callbacks de `onMount` nunca se ejecutan. Consulta [Solución de problemas](/es/guide/troubleshooting).

Cada contenedor recibe su propia instancia del componente. `mount` despacha `tuvix:mounted` después de que se hayan ejecutado los callbacks de `onMount` y los efectos. Sin `ssr`, `mount` vacía el contenedor antes de renderizar. `unmount` en un contenedor que este módulo nunca montó, o cuyo montaje falló, no hace nada.

## Props

Svelte 5 con runes:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { userId, theme = 'light' }: { userId: string; theme?: string } = $props();
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 3/4, o Svelte 5 en modo legacy:

```svelte
<script lang="ts">
  export let userId: string;
  export let theme = 'light';
</script>

<div class="theme-{theme}">User {userId}</div>
```

En Svelte 5, pasa `SvelteMap` de `svelte/reactivity` en la configuración. Así, el adaptador entrega al componente un objeto de props respaldado por un `SvelteMap`, y `update({ props })` escribe en él los nuevos valores: solo se vuelven a renderizar las partes que leen una prop modificada, y los nodos del DOM y el estado del componente se conservan. Esto funciona con `$props()` y con `export let`. Sin `SvelteMap`, un `update()` de Svelte 5 desmonta la instancia, monta una nueva con las nuevas props y despacha `tuvix:mounted` de nuevo, por lo que el estado local se reinicia. El adaptador no importa `svelte/reactivity` por sí mismo, porque ese módulo no existe en Svelte 3/4 y sus builds fallarían.

En Svelte 3/4, `update` llama a `$set` e ignora `SvelteMap`.

Cada actualización reemplaza el conjunto completo de props. Una clave que falta en las nuevas props vuelve al valor por defecto de la prop en Svelte 5 y pasa a ser `undefined` en Svelte 3/4. El orquestador siempre envía las props combinadas, así que esto solo importa cuando llamas a `update` tú mismo.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

## Renderizado en el servidor e hidratación

```ts
// server-only module
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooter(): Promise<string> {
  return renderSvelteToString(Footer, { year: 2026 }, { render });
}
```

```ts
// client
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

- `renderSvelteToString(App, props?, { render? })` devuelve las etiquetas `<style>` del componente seguidas de su markup. Llámalo desde código de servidor; en el navegador devuelve `''`.
- Pasa `render` de `svelte/server` cuando tu bundle de servidor incluya Svelte (Nitro, Vinxi, un build SSR de Vite con `noExternal`). Sin él, el adaptador importa `svelte/server` en tiempo de ejecución, lo que puede cargar una segunda copia de Svelte, y el renderizador de servidor de Svelte falla entre copias.
- `renderSvelte(App, props?, { render? })` devuelve `{ html, head, css }` cuando necesitas la salida de `<svelte:head>`. Coloca `head` en el `<head>` del documento tú mismo; la isla no debe contener `<title>` ni `<meta>`.
- `createSsrSvelteMicroApp` hidrata cuando el contenedor tiene elementos o texto que no sea solo espacios en blanco, y en caso contrario renderiza desde cero. Los componentes de Svelte 3/4 deben compilarse con `hydratable: true`.

### CSS en el primer pintado

Elige una opción:

- **CSS en el HTML.** Compila con `compilerOptions: { css: 'injected' }`. Svelte 5 incluye entonces el CSS del componente en la salida del servidor, y `renderSvelteToString` lo incluye como etiquetas `<style>` dentro de la isla.
- **CSS como archivos.** Mantén el valor por defecto `emitCss: true` y enlaza las hojas de estilo de la isla en `<head>` con `@tuvix.js/vite`. Consulta [Islas SSR](/es/guide/ssr-islands).

Con `css: 'injected'` no hay archivo de hoja de estilo, así que `@tuvix.js/vite` no encuentra nada que enlazar. No combines las dos opciones.

## Event bus

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getGlobalBus } from '@tuvix.js/event-bus';

  let count = $state(0);
  const off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
    count = itemCount;
  });
  onDestroy(off);
</script>

<span class="badge">{count}</span>
```

## Lo que no hace el adaptador

- No compila archivos `.svelte`; de eso se encarga `@sveltejs/vite-plugin-svelte`.
- Solo pasa props. Ni slots, ni snippets, ni eventos de componente cruzan desde el host.
- No comprueba qué build de Svelte eligió tu bundler.

## API

| Export | Propósito |
| --- | --- |
| `createSvelteMicroApp({ name, App, bootstrap?, ssr?, SvelteMap? })` | Módulo de micro app de Svelte |
| `createSsrSvelteMicroApp({ name, App, bootstrap?, SvelteMap? })` | Igual, con `ssr: true` |
| `renderSvelteToString(App, props?, options?)` de `@tuvix.js/svelte/server` | Estilos + markup |
| `renderSvelte(App, props?, options?)` de `@tuvix.js/svelte/server` | `{ html, head, css }` |
