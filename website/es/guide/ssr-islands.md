# Islas SSR

Una isla es una micro app que el servidor renderiza a HTML dentro de una página React y que el navegador hidrata con su propio framework. Con `TuvixIsland` de `@tuvix.js/react`, un único host React puede contener islas de Vue, Svelte, Angular y React. El usuario ve contenido con estilos antes de que se ejecute cualquier JavaScript, y cada isla se vuelve interactiva cuando se carga su framework.

## Lo que necesitas

| Pieza | Paquete | Se ejecuta en |
| --- | --- | --- |
| Página host React con renderizado en el servidor | tu app (`react-dom/server`, TanStack Start, ...) | servidor + cliente |
| `TuvixIsland`, `TuvixReactApp` | `@tuvix.js/react` | servidor + cliente |
| Módulos de isla: `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`, `createSsrReactMicroApp` | adaptadores | cliente |
| `renderVueToString`, `renderSvelteToString`, `renderAngularToString` | `@tuvix.js/<adapter>/server` | solo servidor |
| `getAssets`, `renderAssetTags` | `@tuvix.js/vite` | solo servidor |

No interviene ningún orquestador. `TuvixIsland` llama por sí mismo a `mount`, `update` y `unmount` del módulo de la isla.

## Cómo fluye una petición

```text
server                                         browser
──────                                         ───────
renderVueToString(Card, props) ─┐
                                ▼
<TuvixIsland ssrHtml={html}> renders           HTML arrives, CSS links in <head>
<div data-tuvix-app="card">…html…</div>   ──►  apply → styled first paint
getAssets([...]) → <link rel=stylesheet>
                                               hydrateRoot(host)
                                               TuvixIsland reads its innerHTML from the DOM
                                               React leaves the island's children alone
                                               useEffect → card.mount({ container, props })
                                               Vue adapter: createSSRApp → hydrates in place
                                               tuvix:mounted { hydrated: true }
```

## 1. Configurar Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [react(), vue(), svelte(), tuvix()],
});
```

Añade `"@tuvix.js/vite/client"` a `compilerOptions.types` para que TypeScript conozca `virtual:tuvix/assets`.

## 2. Crear los módulos de isla

Cada isla exporta un módulo creado con la variante `Ssr` de su adaptador. Estos archivos se ejecutan en el navegador y no deben importar renderizadores de servidor.

```ts
// src/islands/vue-card/index.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import VueCard from './VueCard.vue';

export const vueCard = createSsrVueMicroApp({ name: 'vue-card', App: VueCard });
```

```ts
// src/islands/svelte-counter/index.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Counter from './Counter.svelte';

// SvelteMap makes TuvixIsland prop changes update in place instead of remounting.
export const svelteCounter = createSsrSvelteMicroApp({ name: 'svelte-counter', App: Counter, SvelteMap });
```

```ts
// src/islands/angular-contact/index.ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { ContactComponent } from './contact.component';

export const angularContact = createSsrAngularMicroApp({ name: 'angular-contact', component: ContactComponent });
```

## 3. Renderizar el HTML de las islas en el servidor

Mantén los renderizadores de servidor en un módulo que solo importe el código de servidor:

```ts
// src/server/render-islands.ts (server only)
import { renderVueToString } from '@tuvix.js/vue/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import { renderAngularToString } from '@tuvix.js/angular/server';
import { render } from 'svelte/server';
import VueCard from '../islands/vue-card/VueCard.vue';
import Counter from '../islands/svelte-counter/Counter.svelte';
import { ContactComponent } from '../islands/angular-contact/contact.component';

export async function renderIslands(): Promise<Record<string, string>> {
  const [card, counter, contact] = await Promise.all([
    renderVueToString(VueCard, { title: 'Hello' }),
    renderSvelteToString(Counter, { start: 3 }, { render }),
    renderAngularToString(ContactComponent, { appId: 'contact', props: { heading: 'Write to us' } }),
  ]);
  return { 'vue-card': card, 'svelte-counter': counter, 'angular-contact': contact };
}
```

Las funciones `render*ToString` son solo de servidor. En el navegador devuelven `''`. Llámalas desde código que nunca se ejecute en el navegador: tu entrada de servidor, una ruta de API o una función de servidor del framework, como `createServerFn` de TanStack Start. No las llames desde un loader de ruta isomórfico. Ese loader también se ejecuta en el navegador durante la navegación en el cliente, donde recibe `''`, y tu bundler envía al cliente el renderizador de servidor de Vue, Svelte o Angular porque el loader lo importa.

## 4. Colocar las islas en la página

```tsx
// src/pages/Home.tsx
import { createContext, useContext } from 'react';
import { TuvixIsland } from '@tuvix.js/react';
import { vueCard } from '../islands/vue-card';
import { svelteCounter } from '../islands/svelte-counter';

// Filled by the server entry; empty on the client.
export const IslandHtml = createContext<Record<string, string>>({});

export function Home() {
  const html = useContext(IslandHtml);
  return (
    <main>
      <TuvixIsland
        name="vue-card"
        app={vueCard}
        props={{ title: 'Hello' }}
        ssrHtml={html['vue-card']}
        fallback={<p>The card failed to load.</p>}
      />
      <TuvixIsland name="svelte-counter" app={svelteCounter} props={{ start: 3 }} ssrHtml={html['svelte-counter']} />
    </main>
  );
}
```

Pasa las mismas props en el servidor y en el cliente. Si el servidor renderizó `{ start: 3 }` y el cliente monta con `{ start: 4 }`, el framework detecta un desajuste de hidratación.

## 5. Enlazar el CSS de las islas en el head

Vite inyecta CSS Modules, bloques `<style>` de Vue y estilos de Svelte desde JavaScript. Sin ayuda, el HTML del servidor llega al navegador antes que ese JavaScript, y el primer pintado sale sin estilos (FOUC). `getAssets` devuelve las URLs de las hojas de estilo que necesita una entrada, para que el servidor pueda enlazarlas en `<head>`:

```tsx
// src/entry-server.tsx
import { renderToString } from 'react-dom/server';
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { Home, IslandHtml } from './pages/Home';
import { renderIslands } from './server/render-islands';

export async function render(): Promise<string> {
  const [islandHtml, assets] = await Promise.all([
    renderIslands(),
    getAssets(['src/entry-client.tsx', 'src/pages/Home.tsx']),
  ]);

  const body = renderToString(
    <IslandHtml.Provider value={islandHtml}>
      <Home />
    </IslandHtml.Provider>,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <title>Home</title>
    ${renderAssetTags(assets)}
  </head>
  <body>
    <div id="app">${body}</div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>`;
}
```

- Pasa rutas de módulo relativas a la raíz de Vite. En un build de producción, cada ruta debe ser una entrada del build o el destino de un `import()` en el build de cliente; cualquier otra cosa se rechaza.
- Si Rollup fusiona dos destinos de `import()` en un mismo chunk, el manifest lista ese chunk con su nombre con hash en lugar de la ruta de tu módulo, y `getAssets` se rechaza para esa ruta. El ejemplo se topa con esto cuando `@angular/core` acaba en un chunk de página, y lo resuelve con `manualChunks`, que dan a `@angular/core` su propio chunk.
- `getAssets` sigue los imports estáticos y omite los destinos de `import()`. Una página o isla importada de forma diferida que se renderiza en el servidor necesita su propia entrada en la lista.
- En desarrollo devuelve URLs de CSS con `?direct` y, cuando Vite inyecta su propio `<style>`, desactiva el `<link>` correspondiente, de modo que las ediciones con HMR se aplican.
- Las islas de Angular llevan sus estilos incrustados: `renderAngularToString` coloca las etiquetas `<style>` del componente delante del markup.
- Svelte: compila con `css: 'injected'` (estilos incrustados en el HTML de la isla) o mantén `emitCss` y enlázalos con `getAssets`. No ambas cosas.

## 6. Hidratar en el cliente

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Home } from './pages/Home';

hydrateRoot(document.getElementById('app')!, <Home />);
```

El cliente renderiza sin el HTML de las islas. Cada `TuvixIsland` lee su markup de la página durante la hidratación, React conserva esos nodos y el módulo de la isla los hidrata.

## Por qué el HTML no se envía dos veces

Una isla ingenua pasa el HTML del servidor como prop en ambos lados. React necesita entonces la cadena en el cliente para hidratar `dangerouslySetInnerHTML`, así que el HTML viaja una vez en el documento y otra vez en los datos de hidratación. Además, cada re-renderizado del padre con un nuevo objeto `{ __html }` hace que React vuelva a asignar `innerHTML`, lo que borra el DOM y los listeners que el framework de la isla había añadido.

`TuvixIsland` evita ambas cosas:

- En el servidor escribe `ssrHtml` dentro de `<div data-tuvix-app={name} data-tuvix-island={id}>`.
- Durante la hidratación encuentra ese elemento por su atributo `data-tuvix-island` basado en `useId` y lee `innerHTML` una sola vez. El cliente nunca necesita `ssrHtml`.
- Mantiene el objeto `{ __html }` en el estado, así que los renderizados posteriores entregan a React el mismo objeto y React nunca reescribe los hijos de la isla.

Lo que tu framework haga con los datos del loader es otra cuestión. Si devuelves el HTML de una isla desde un loader de TanStack Start o Remix, el framework también serializa ese resultado del loader en la página. Entrega el HTML a la isla mediante algo que el framework no serialice, como un contexto de React que rellene tu entrada de servidor, como en el paso 4.

## Estado por petición {#per-request-state}

El código de servidor atiende muchas peticiones en un mismo proceso. Todo lo que creas a nivel de módulo vive a lo largo de todas ellas.

- Crea una caché de datos, como el `QueryClient` de TanStack Query, por petición y no a nivel de módulo. Un cliente a nivel de módulo en el servidor mezcla datos entre peticiones y usuarios, y sus entradas obsoletas provocan desajustes de hidratación.
- Pasa los datos que necesita una isla como props, desde la caché propia de la petición. El módulo de la isla crea su propio estado de cliente al montarse.
- Formatea fechas y números con un `timeZone` y una configuración regional explícitos. El servidor suele ejecutarse en UTC y el navegador en la zona del usuario; `Intl.DateTimeFormat` sin `timeZone` renderiza un día distinto cerca de la medianoche y rompe la hidratación.

```tsx
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

declare function createRequestCache(): { dehydrate(): unknown };
declare function Page(props: { data: unknown }): ReactElement;

export function renderRequest(): string {
  const cache = createRequestCache(); // one per request
  return renderToString(<Page data={cache.dehydrate()} />);
}
```

## Las etiquetas head y meta pertenecen al host

Las islas se renderizan dentro de un `<div>` en el body. No deben emitir `<title>`, `<meta>` ni `<link rel=canonical>`. Defínelas en el host (la API de head de tu framework o la plantilla HTML). Para componentes Svelte que usan `<svelte:head>`, llama a `renderSvelte` en lugar de `renderSvelteToString` y coloca tú mismo su salida `head` en el head del documento.

## Errores

- Si `mount` o `update` de la isla se rechaza, `TuvixIsland` renderiza `fallback` en su lugar. El adaptador ya ha despachado `tuvix:error`.
- Si un renderizador de servidor lanza un error, decide tu código de servidor: captúralo y no pases `ssrHtml`, y la isla empezará vacía y se renderizará en el cliente.
- `TuvixReactApp` envuelve su componente en `<Suspense>`, así que un error de renderizado en el servidor reemplaza solo esa app por su `fallback`, y React lo reintenta en el cliente.

Observa las islas desde el código de la página con `onLifecycle('mounted', ...)` y `onLifecycle('error', ...)`; consulta [Eventos de ciclo de vida](/es/guide/lifecycle-events).

## Proyecto de ejemplo

`examples/with-ssr-islands` en el repositorio lo reúne todo: un servidor Express + Vite con un host React 19, una tarjeta Vue 3, un contador Svelte 5, un formulario de contacto Angular 20 sin zone.js (JIT; el compilador se carga como chunk diferido), una newsletter con `TuvixReactApp` y una isla que falla a propósito para mostrar su fallback. `src/server/render-islands.ts` contiene los renderizadores de servidor, `src/entry-server.tsx` enlaza los assets con `getAssets` y `src/runtime/islands.ts` reacciona a los eventos de ciclo de vida. La isla de Angular recibe su input `heading` a través de la opción `props` en el servidor y del mismo objeto en el cliente. Desde la raíz del repositorio, ejecuta `pnpm --filter with-ssr-islands dev` (puerto 5186), o `build` y luego `start` (puerto 5185; `PORT` lo sobrescribe). El README del ejemplo explica cada pieza y las comprobaciones que ejecuta su spec de Playwright.

## Lo que no hacen las islas

- `TuvixIsland` no carga módulos por URL. Importa el módulo de la isla en el bundle del host.
- No comparte estado entre islas. Usa props, el event bus o tu propio store.
- Las islas de Angular se vuelven a renderizar sobre el DOM del servidor en lugar de hidratarlo de forma no destructiva; consulta [Angular](/es/guide/angular).
- Nada de esto funciona sin un paso de renderizado en el servidor. Para islas solo de cliente, omite `ssrHtml` y usa los adaptadores sin `Ssr`.
