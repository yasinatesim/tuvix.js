# Solución de problemas

Cada entrada empieza por lo que ves y después explica la causa y la solución.

## Svelte: onMount nunca se ejecuta, o mount() lanza lifecycle_function_unavailable

**Síntoma.** Una isla de Svelte se renderiza, pero los callbacks de `onMount` nunca se disparan, o `mount()` de Svelte 5 lanza `lifecycle_function_unavailable`.

**Causa.** `svelte` incluye un runtime de navegador y un runtime de servidor bajo el mismo import. Tu bundle de cliente eligió el de servidor. Algunas configuraciones SSR (Vinxi, entornos personalizados de Vite, Vitest en jsdom) resuelven el cliente sin la condición de export `browser`, y el optimizador de dependencias de Vite preempaqueta entonces el runtime de servidor. En las devtools del navegador ves `svelte/src/index-server.js` (Svelte 5) o `svelte/src/runtime/ssr.js` (Svelte 4) en lugar del archivo de cliente.

**Solución.** Vuelve a poner `browser` en las condiciones de resolución del cliente y reinicia Vite con `--force` para que reconstruya las dependencias optimizadas:

```ts
// vite.config.ts (the client build or client environment)
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  resolve: { conditions: ['browser', ...defaultClientConditions] },
});
```

Para Vitest con jsdom, añade la condición e incluye Svelte inline para que Vite lo resuelva:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['browser'] },
  test: { environment: 'jsdom', server: { deps: { inline: [/svelte/] } } },
});
```

No excluyas `svelte` de `optimizeDeps`; en ese caso esbuild falla con "The entry point "svelte" cannot be marked as external".

## Vue: el alias ~ falla en archivos .vue

**Síntoma.** El build de producción falla con `Rollup failed to resolve import "~/utils/x" from ".../Card.vue?vue&type=script..."`, mientras que el mismo import funciona en archivos `.ts` e `import type` desde `~/` funciona en archivos `.vue`.

**Causa.** `vite-tsconfig-paths` aplica los alias solo a los archivos que su tsconfig incluye en `include`. Un tsconfig que incluye `**/*.ts` y `**/*.tsx` deja fuera los archivos `.vue`. Los imports de solo tipos se eliminan antes de la resolución, así que nunca fallan.

**Solución.** Incluye los archivos `.vue` en ese tsconfig:

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

o declara el alias en el propio Vite:

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
});
```

Usa la extensión de editor Vue - Official (Volar). Vetur no entiende las macros de `<script setup>` ni `moduleResolution: "Bundler"`.

## Angular 15-17: los clics no actualizan la vista

**Síntoma.** Una isla de Angular se renderiza, pero un handler de botón cambia un campo y la plantilla no se actualiza.

**Causa.** El adaptador ejecuta Angular sin zone.js. Angular 18+ programa por sí mismo la detección de cambios en modo zoneless; en 15-17 el adaptador reemplaza `NgZone` por una zona no-op, y nada ejecuta la detección de cambios después de los eventos del DOM.

**Solución.** Llama a `detectChanges()` después del cambio:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-like',
  standalone: true,
  template: `<button (click)="like()">{{ likes }}</button>`,
})
export class LikeComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  likes = 0;

  like(): void {
    this.likes += 1;
    this.cdr.detectChanges();
  }
}
```

O importa `zone.js` al principio de tu entrada de cliente y pasa `zone: true` a `createAngularMicroApp`. Mantén zone.js fuera del servidor: parchea el `Promise` global y rompe `fetch` en el servidor.

## Desajuste de hidratación por fechas

**Síntoma.** React informa el error #418 (o Vue y Svelte registran un desajuste de hidratación) solo para algunos usuarios o solo cerca de la medianoche. El diff muestra una fecha con un día de diferencia, como `21 Mart 2026` frente a `22 Mart 2026`.

**Causa.** El servidor formatea las fechas en su zona horaria (normalmente UTC) y el navegador las formatea en la zona del usuario. `new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })` sin `timeZone` produce un texto distinto en cada lado.

**Solución.** Pasa un `timeZone` explícito en todos los lugares donde formateas fechas que renderiza el servidor:

```ts
const format = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Istanbul',
});

console.log(format.format(new Date('2026-03-21T22:30:00Z'))); // 22 Mart 2026 on server and client
```

Lo mismo se aplica a `toLocaleString`, a los tiempos relativos ("hace 3 horas") y a cualquier cosa que use `Date.now()` durante el renderizado.

## Los datos de una petición aparecen en otra

**Síntoma.** Una isla renderizada en el servidor muestra datos obsoletos, o datos de la petición de otro usuario, y después el cliente vuelve a renderizar con un contenido distinto.

**Causa.** Una caché a nivel de módulo, por ejemplo `export const queryClient = new QueryClient()` importada por varias micro apps, vive durante toda la vida del proceso del servidor. Todas las peticiones leen y escriben en la misma instancia.

**Solución.** Crea la caché por petición en el servidor y pasa lo que necesita la isla como props. Mantén un único cliente a nivel de módulo solo en el código del navegador.

```ts
import { QueryClient } from '@tanstack/query-core';

export function createRequestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}
```

Consulta [Estado por petición](/es/guide/ssr-islands#per-request-state).

## Una app de script de módulo no se carga después de descargarla

**Síntoma.** Después de `orchestrator.unregister(name)` o `loader.unload(name)`, volver a registrar y montar la misma app falla con `Module "<name>" loaded but no exports found`.

**Causa.** Los navegadores ejecutan un script de módulo una vez por URL. El segundo `<script type="module" src="...">` para la misma URL no hace nada, así que la app nunca vuelve a llamar a `registerModule`.

**Solución.** Usa una entrada con función loader, que mantiene el módulo en la caché de módulos del bundler, o cambia la URL (por ejemplo, con una query string de versión):

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

## "loaded but no exports found"

**Síntoma.** `[Tuvix Loader] Module "dashboard" loaded but no exports found.`

**Causa y solución**, en el orden en que debes comprobarlas:

1. El nombre que registra el bundle es distinto del nombre registrado. `createReactMicroApp({ name: 'Dashboard' })` y `register({ name: 'dashboard' })` no coinciden. Usa una sola cadena.
2. Un bundle de módulo ES se cargó como script clásico. La salida ES de Vite termina en `.js`; añade `type: 'module'` a la entrada.
3. El bundle exporta el módulo pero nunca lo registra. Usa un adaptador o `defineMicroApp`, o llama tú mismo a `registerModule(name, module)`.

## Contenedor no encontrado

**Síntoma.** `[Tuvix] Container "#app" not found in DOM.`

**Causa.** El orquestador busca el contenedor cuando monta la app. Es posible que un componente de ruta de un router externo todavía no lo haya renderizado.

**Solución.** Mantén los contenedores en un layout que exista antes de la navegación, o aloja esa app con `TuvixIsland` dentro del componente de ruta. Consulta [Router externo](/es/guide/external-router#containers-rendered-by-routes).

## Primer pintado sin estilos

**Síntoma.** Con JavaScript desactivado, o durante un momento en conexiones lentas, las islas renderizadas en el servidor se muestran sin su CSS.

**Causa.** Vite inyecta CSS Modules, `<style>` de Vue y estilos de Svelte desde JavaScript. El HTML del servidor no enlaza ninguno de ellos.

**Solución.** Añade `tuvix()` de `@tuvix.js/vite` a tu configuración de Vite e imprime `renderAssetTags(await getAssets([...]))` en `<head>`. Consulta [Islas SSR](/es/guide/ssr-islands).
