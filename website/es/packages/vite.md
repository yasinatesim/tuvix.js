---
title: '@tuvix.js/vite'
---

<PackageHeader
  name="@tuvix.js/vite"
  title="Assets de islas para Vite"
  description="Plugin de Vite que le dice a tu renderizador de servidor qué hojas de estilos y chunks de JS necesita una isla, para que el head renderizado en el servidor los enlace y la isla tenga estilos desde el primer pintado."
  icon="⚡"
  npm="true"
/>

## Instalación

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

El plugin necesita Vite 6 o 7 (rango de peer `^6.0.0 || ^7.0.0`). La suite de tests se ejecuta con Vite 6.

## Cuándo usarlo

Renderizas en el servidor una isla (React, Vue, Svelte, Angular o DOM plano) y su markup llega al navegador antes que su JavaScript. Vite entrega los CSS Modules, los bloques `<style>` de los SFC de Vue y los estilos de Svelte a través de ese JavaScript, así que el navegador pinta la isla sin estilos hasta que se ejecuta el bundle. Con `@tuvix.js/vite`, tu servidor pregunta "¿qué hojas de estilos necesita `src/islands/footer/index.ts`?" e imprime etiquetas `<link>` para ellas en `<head>`.

No lo uses cuando tus islas se renderizan solo en el cliente, o cuando enlazas una única hoja de estilos global que ya cubre todas las islas.

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

Pide los assets en la entry de tu servidor e imprímelos en `<head>`:

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

Haz primero el build del cliente y después el del servidor. El build SSR lee el manifiesto del cliente:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?)`

```ts no-check
function tuvix(options?: TuvixViteOptions): Plugin[];
```

Devuelve tres plugins de Vite:

- `tuvix:assets` proporciona `virtual:tuvix/assets`.
- `tuvix:client-build-info` (solo en builds) escribe `.vite/tuvix-client.json` junto al manifiesto del cliente. Consulta [Builds de producción](#production-builds).
- `tuvix:dev-css-handoff` (solo en el servidor de desarrollo) traspasa los estilos del `<link>` renderizado en el servidor a las etiquetas `<style>` propias de Vite.

Pon el array devuelto en `plugins` como se muestra arriba; Vite aplana los arrays de plugins anidados.

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | Directorio de salida del build del cliente, relativo a la raíz de Vite o absoluto. El build SSR lee `<clientOutDir>/.vite/manifest.json` y, como fallback, `<clientOutDir>/manifest.json`. |
| `base` | `string` | `base` de Vite del build o del servidor de desarrollo que carga el módulo virtual | Base pública desde la que el navegador carga los assets del cliente. Defínela cuando el cliente se sirve desde una base distinta a la del bundle del servidor, como `/_build` en vinxi. |

TanStack Start y vinxi escriben el build del router del cliente en una carpeta aparte bajo `/_build`:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries)`

Exportado por `virtual:tuvix/assets`.

```ts no-check
function getAssets(entries: string[]): Promise<TuvixAssets>;
```

Pasa los módulos de entrada de las islas como rutas relativas a la raíz de Vite, por ejemplo `'src/islands/footer/index.ts'`. La función ignora un `./` o `/` inicial. Con varias entries, combina las listas en el orden de las entries y descarta los duplicados.

`getAssets` devuelve una promesa porque el servidor de desarrollo tiene que transformar cada módulo antes de poder leer sus imports. Llámalo solo desde código de servidor.

### `renderAssetTags(assets)`

Exportado por `virtual:tuvix/assets`.

```ts no-check
function renderAssetTags(assets: TuvixAssets): string;
```

Devuelve una etiqueta `<link rel="stylesheet">` por cada URL de `assets.css` y después una etiqueta `<link rel="modulepreload" crossorigin>` por cada URL de `assets.modulepreload`. Escapa en HTML los valores de `href`. Funciona en el servidor y en el navegador.

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

| Tipo | Exportado desde | Significado |
| --- | --- | --- |
| `TuvixViteOptions` | `@tuvix.js/vite` | Opciones de `tuvix()`: `clientOutDir?`, `base?`. |
| `TuvixAssets` | `@tuvix.js/vite`, `virtual:tuvix/assets` | `{ css: string[]; modulepreload: string[] }`. `css` está en orden de cascada. `modulepreload` está vacío en desarrollo. |
| `@tuvix.js/vite/client` | entrada de tipos | Declara el módulo `virtual:tuvix/assets`. Añádelo a `compilerOptions.types` o referéncialo con `/// <reference types="@tuvix.js/vite/client" />`. |

## Builds de producción {#production-builds}

- En el build del cliente, el plugin activa `build.manifest`, salvo que tú mismo definas `build.manifest`.
- El build del cliente también escribe `.vite/tuvix-client.json` junto al manifiesto, con la forma `{ modules, sharedCss }`. `modules` asocia cada entry y cada destino de `import()`, relativos a la raíz de Vite, con el chunk en el que Rollup los puso. `sharedCss` contiene la única hoja de estilos de un build con `build.cssCodeSplit: false`.
- En el build SSR lee el manifiesto del cliente y `tuvix-client.json`, e incrusta un mapa que va de cada clave del manifiesto que sea una entry (`isEntry`) o una entry dinámica (`isDynamicEntry`) a sus URLs.
- Rollup a veces combina dos entries dinámicas en un solo chunk, por ejemplo una página y un runtime de framework que un adaptador carga con `import()`. El manifiesto de Vite usa entonces la clave `_Page-<hash>.js` para ese chunk y no incluye ninguno de los dos orígenes. El plugin encuentra el chunk mediante `modules` en `tuvix-client.json`.
- Con `build.cssCodeSplit: false`, Vite escribe todo el CSS en un único `style-<hash>.css` que ningún chunk del manifiesto incluye. `getAssets` devuelve ese archivo para cada entry, antes del CSS propio de la entry.
- Sin `tuvix-client.json` (un cliente compilado sin `tuvix()`), solo se resuelven los módulos que tienen su propia clave en el manifiesto. Un asset `style.css` del manifiesto que ningún chunk incluye sigue contando como la única hoja de estilos de `cssCodeSplit: false`.
- Para cada entry recoge el chunk de la entry y todos los chunks que importa de forma estática, transitivamente, además de su CSS. El CSS de los chunks importados va antes que el CSS propio de la entry, que es el orden en que Vite los carga.
- `modulepreload` incluye el chunk de la entry y sus imports estáticos. Las URLs son `base + file`.
- El mapa omite los destinos de `import()`, porque Vite carga esos chunks y su CSS solo cuando se ejecuta el import. Si un módulo lazy se renderiza en el servidor, pasa su ruta a `getAssets` como una entry aparte.
- Cuando el navegador carga después el chunk de la isla, el helper de precarga de Vite encuentra el `<link>` que imprimió tu servidor y no añade un segundo.

## Servidor de desarrollo

- `getAssets` recorre el grafo de módulos del cliente del servidor de desarrollo desde cada entry siguiendo los imports estáticos, en el orden de los imports. Devuelve URLs como `/src/islands/footer/footer.module.css?direct`; Vite responde a las peticiones `?direct` con CSS plano. Los bloques de Vue se devuelven como `/src/App.vue?direct&vue&type=style&index=0&...&lang.css`.
- También se recoge el CSS al que una isla llega a través de un módulo virtual. Una hoja de estilos virtual como `\0virtual:theme.css` se devuelve como `/@id/__x00__virtual:theme.css?direct`, así que el plugin que la proporciona tiene que cargar ids que llevan una query.
- Cuando se ejecuta el JavaScript de la isla, Vite inyecta su propio `<style>` para cada módulo CSS. El plugin `tuvix:dev-css-handoff` pone entonces `link.sheet.disabled = true` en el `<link>` renderizado en el servidor con el mismo href, para que una copia obsoleta de las reglas no pueda sobrescribir tus cambios de HMR. El elemento `<link>` se queda en el DOM, así que un `<head>` de React hidratado no ve ningún cambio.
- Al editar CSS, `tuvix:dev-css-handoff` deja la hoja de estilos `?direct` fuera de la actualización de HMR. Vite actualiza entonces su `<style>` sin recargar la página y sin cambiar el `<link>`. Se aplican dos límites:
  - Una edición de CSS Modules cambia los nombres de clase con hash, así que el HMR propio de la isla (React Fast Refresh, Vue) tiene que volver a renderizarla.
  - Una isla cuyo JavaScript la página aún no ha cargado conserva la hoja de estilos del servidor hasta que recargas.
- `modulepreload` siempre está vacío en desarrollo.
- `getAssets` se comunica con el servidor de desarrollo en el mismo proceso de Node. Funciona con `ssrLoadModule` y con el module runner por defecto de Vite, y sigue funcionando tras `server.restart()`.

## Casos límite

- Una entry que no es ni un input del build ni un destino de `import()` del build del cliente se rechaza con `[tuvix] "<key>" is not an entry or a dynamically imported module in <manifest>`. Añade la isla a `build.rollupOptions.input`, o cárgala con `import()` desde código del cliente.
- Si falta el manifiesto del cliente, el build SSR falla con `[tuvix] No client manifest in <dir>`. Haz primero el build del cliente, o corrige `clientOutDir`.
- En desarrollo, `getAssets` se rechaza con `found no running Vite dev server with the tuvix() plugin in this process` cuando tu código SSR se ejecuta en otro proceso o en un runtime de worker, o después de que el servidor de desarrollo se haya cerrado.
- En el build para navegador de `virtual:tuvix/assets`, `getAssets` se rechaza con `runs during server rendering only`. El bundle del cliente no puede conocer su propio manifiesto.
- En desarrollo, el recorrido no entra en los módulos bajo `/node_modules/`. Se recoge una hoja de estilos que tu propio código importa desde un paquete; no se recoge una hoja de estilos que un paquete importa desde su propio JavaScript.
- Una `base` relativa como `'./'` produce URLs relativas, que fallan en rutas anidadas. Usa una base absoluta.
- Svelte: mantén el valor por defecto `emitCss: true` de `vite-plugin-svelte`. Con `compilerOptions.css: 'injected'` los estilos viven dentro del JavaScript, y el plugin no encuentra ninguna hoja de estilos que enlazar.

## Lo que no hace

- No escribe etiquetas en tu HTML. Tú decides dónde va la salida de `renderAssetTags`.
- No sigue cadenas de `import()`. Pasa como entries propias los módulos lazy que se renderizan en el servidor.
- No admite un nombre de archivo de manifiesto personalizado (`build.manifest: 'name.json'`). Usa `true`.
- No renderiza ni hidrata islas. Combínalo con un adaptador como [`@tuvix.js/react`](/es/packages/react) (`TuvixIsland`), [`@tuvix.js/vue`](/es/packages/vue) o [`@tuvix.js/svelte`](/es/packages/svelte).
