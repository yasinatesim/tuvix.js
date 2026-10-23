# @tuvix.js/vite

> Plugin de Vite que coloca el CSS de las islas y los enlaces modulepreload en el `<head>` renderizado en el servidor

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentación completa: [tuvix.js.org/packages/vite](https://tuvix.js.org/packages/vite).

Cuando renderizas en el servidor una isla de micro app, su markup llega al navegador antes que su JavaScript. Vite envía el CSS de la isla (CSS Modules, `<style>` de los SFC de Vue, estilos de Svelte) dentro de ese JavaScript, así que el primer pintado muestra markup sin estilos. Este plugin le indica a tu servidor qué hojas de estilo necesita cada isla, para que puedas enlazarlas en `<head>`.

Úsalo cuando renderices islas en el servidor con Vite. Omítelo cuando tus islas solo se rendericen en el cliente.

## Instalación

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Requiere Vite 6 o 7. La suite de tests se ejecuta con Vite 6.

## Inicio rápido

Añade el plugin a la configuración de Vite que usas para el build del cliente y el build SSR:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

Añade los tipos del módulo virtual a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@tuvix.js/vite/client"]
  }
}
```

Pide los assets en la entrada de tu servidor e imprímelos en `<head>`:

```ts
// src/entry-server.ts
/// <reference types="@tuvix.js/vite/client" />
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { renderFooter } from './islands/footer/render';

export async function render(): Promise<string> {
  const assets = await getAssets(['src/islands/footer/index.ts']);
  return `<!doctype html>
<html>
  <head>${renderAssetTags(assets)}</head>
  <body><footer data-tuvix-app="footer">${await renderFooter()}</footer></body>
</html>`;
}
```

Haz primero el build del cliente y después el del servidor:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?: TuvixViteOptions): Plugin[]`

Devuelve tres plugins: `tuvix:assets` (proporciona `virtual:tuvix/assets`), `tuvix:client-build-info` (solo en builds; escribe `.vite/tuvix-client.json` en el build del cliente) y `tuvix:dev-css-handoff` (solo en el servidor de desarrollo).

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | Directorio de salida del build del cliente, relativo a la raíz de Vite o absoluto. El build SSR lee `<clientOutDir>/.vite/manifest.json` y, si no existe, `<clientOutDir>/manifest.json`. |
| `base` | `string` | `base` de Vite | Base pública desde la que el navegador carga los assets del cliente. Defínela cuando el cliente se sirva desde una base distinta a la del bundle del servidor. |

Para TanStack Start o vinxi, apunta el plugin a la salida y la base del router del cliente:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries: string[]): Promise<TuvixAssets>`

Desde `virtual:tuvix/assets`. Pasa los módulos de entrada de las islas como rutas relativas a la raíz de Vite, como `'src/islands/footer/index.ts'`. Un `./` o `/` inicial se ignora. Con varias entradas, `getAssets` fusiona las listas en el orden de las entradas y elimina duplicados. Solo en el servidor.

### `renderAssetTags(assets: TuvixAssets): string`

Desde `virtual:tuvix/assets`. Devuelve etiquetas `<link rel="stylesheet">` para `css` y después etiquetas `<link rel="modulepreload" crossorigin>` para `modulepreload`. Escapa los valores de los atributos y funciona tanto en el servidor como en el navegador.

Si tu `<head>` es un componente de React, renderiza las listas tú mismo:

```tsx
import type { TuvixAssets } from '@tuvix.js/vite';

export function IslandAssets({ assets }: { assets: TuvixAssets }) {
  return (
    <>
      {assets.css.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {assets.modulepreload.map((href) => (
        <link key={href} rel="modulepreload" crossOrigin="" href={href} />
      ))}
    </>
  );
}
```

### Tipos

| Tipo | Significado |
| --- | --- |
| `TuvixViteOptions` | Opciones de `tuvix()`. |
| `TuvixAssets` | `{ css: string[]; modulepreload: string[] }`. `css` va en orden de cascada; `modulepreload` está vacío en desarrollo. |

## Builds de producción

- El plugin activa `build.manifest` en el build del cliente, salvo que definas `build.manifest` tú mismo.
- En el build SSR lee el manifiesto del cliente e incrusta un mapa de cada entrada y cada entrada dinámica a sus URLs.
- El build del cliente también escribe `.vite/tuvix-client.json` junto al manifiesto. Este archivo asocia cada entrada y cada destino de `import()` con el chunk en el que Rollup lo colocó. A veces Rollup fusiona dos entradas dinámicas en un solo chunk, por ejemplo una página y un runtime de framework que un adaptador carga con `import()`. En ese caso, el manifiesto de Vite registra ese chunk con la clave `_Page-<hash>.js` y no menciona ninguno de los dos orígenes, y el plugin usa `tuvix-client.json` para encontrarlo. Sin ese archivo (un cliente construido sin `tuvix()`), solo se resuelven los módulos que tienen su propia clave en el manifiesto.
- Con `build.cssCodeSplit: false`, Vite escribe todo el CSS en un único `style-<hash>.css` que ningún chunk del manifiesto incluye. `getAssets` devuelve ese archivo para cada entrada.
- Para cada entrada recopila el chunk de entrada y todos los chunks que importa de forma estática, junto con su CSS. El CSS de los chunks importados va antes que el CSS propio de la entrada, que es el orden en que Vite los carga.
- Omite los destinos de `import()`, porque Vite carga esos chunks y su CSS solo cuando se ejecuta la importación. Si un módulo diferido se renderiza en el servidor, pasa también su ruta a `getAssets`.
- Las URLs empiezan por `base`. Cuando el navegador carga más tarde el chunk de la isla, el helper de precarga de Vite encuentra el `<link>` existente y no añade un segundo.

## Servidor de desarrollo

- `getAssets` recorre el grafo de módulos del cliente del servidor de desarrollo desde cada entrada siguiendo las importaciones estáticas y devuelve URLs como `/src/islands/footer/footer.module.css?direct`. Vite responde a las peticiones `?direct` con CSS plano.
- El CSS al que una isla llega a través de un módulo virtual también funciona. Una hoja de estilo virtual como `\0virtual:theme.css` se devuelve como `/@id/__x00__virtual:theme.css?direct`, así que el plugin que la proporciona debe cargar ids que lleven una query.
- Cuando se ejecuta el JavaScript de la isla, Vite inyecta su propio `<style>` para cada módulo CSS. Entonces el plugin desactiva el `<link>` correspondiente renderizado en el servidor mediante `link.sheet.disabled`, para que una copia obsoleta de las reglas no pueda sobrescribir tus ediciones con HMR. El elemento `<link>` se queda en el DOM, y un `<head>` de React hidratado no ve ningún cambio.
- Al editar CSS, el plugin deja la hoja de estilo `?direct` fuera de la actualización HMR. Así Vite actualiza su `<style>` sin recargar la página y sin reemplazar el `<link>`. Una edición de CSS Modules cambia los nombres de clase con hash, así que el propio HMR de la isla (React Fast Refresh, Vue) tiene que volver a renderizarla. Una isla cuyo JavaScript la página todavía no ha cargado conserva la hoja de estilo del servidor hasta que recargues.
- `modulepreload` siempre está vacío en desarrollo.

## Casos límite

- `getAssets` se rechaza con una ruta que no es ni una entrada del build ni un destino de `import()` del build del cliente. Añade la isla a `build.rollupOptions.input`, o cárgala con `import()` desde el código del cliente.
- El build SSR falla con `[tuvix] No client manifest in <dir>` cuando falta el manifiesto del cliente.
- En desarrollo, `getAssets` necesita el servidor de desarrollo en el mismo proceso de Node (`ssrLoadModule` o el module runner por defecto de Vite). Se rechaza cuando el código SSR se ejecuta en otro proceso o en un runtime de worker, o después de que el servidor de desarrollo se haya cerrado. Sigue funcionando tras `server.restart()`.
- El build para navegador de `virtual:tuvix/assets` exporta un `getAssets` que se rechaza, porque el bundle del cliente no puede conocer su propio manifiesto.
- En desarrollo, el recorrido no entra en los módulos bajo `/node_modules/`, así que no se recopila el CSS que un paquete importa desde su propio JavaScript.
- Una `base` relativa como `'./'` produce URLs relativas, que fallan en rutas anidadas. Usa una base absoluta.
- Svelte: mantén el valor por defecto `emitCss: true` de `vite-plugin-svelte`. Con `compilerOptions.css: 'injected'`, los estilos viven dentro del JavaScript y el plugin no encuentra ninguna hoja de estilo que enlazar.

## Lo que no hace

- No escribe etiquetas en tu HTML. Tú eliges dónde van.
- No sigue cadenas de `import()`.
- No admite un nombre de archivo de manifiesto personalizado (`build.manifest: 'name.json'`). Usa `true`.
- No renderiza ni hidrata islas. Usa un adaptador como `@tuvix.js/react` (`TuvixIsland`), `@tuvix.js/vue` o `@tuvix.js/svelte`.

## Licencia

MIT
