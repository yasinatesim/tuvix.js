# Con Vue

`@tuvix.js/vue` convierte un componente raíz de Vue 3 en una micro app, hidrata el markup renderizado en el servidor y renderiza componentes a HTML en el servidor.

## Instalación

```bash
pnpm add @tuvix.js/vue vue
# para renderVueToString en el servidor
pnpm add @vue/server-renderer
```

## Convertir un componente en una micro app

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import { createPinia } from 'pinia';
import { analytics } from './analytics-plugin';
import App from './App.vue';

export default createVueMicroApp({
  name: 'settings',
  App,
  plugins: [createPinia(), [analytics, { id: 'G-123' }]],
});
```

| Opción | Tipo | Descripción |
| --- | --- | --- |
| `name` | `string` | Obligatoria. Debe coincidir con el nombre de la app registrada. |
| `App` | `Component` | Obligatoria. Componente raíz. |
| `plugins` | `Array<Plugin \| [Plugin, ...options]>` | Se instalan con `app.use(plugin, ...options)` en cada montaje. |
| `bootstrap` | `() => void \| Promise<void>` | Se ejecuta una vez antes del primer montaje. |
| `ssr` | `boolean` | Hidrata el markup del servidor. `createSsrVueMicroApp` la activa. |

Cada contenedor tiene su propia app de Vue, así que cada montaje vuelve a ejecutar el `install` de cada plugin. Una instancia de plugin como `createPinia()` la comparten todos los montajes del módulo. Créala dentro de una función de plugin cuando cada montaje necesite su propio store.

Montar en un contenedor que ya tiene esta app desmonta primero la instancia anterior. `unmount` destruye la app, vacía el contenedor y despacha `tuvix:unmounted`.

## Props

El adaptador pasa las props al componente raíz y también las provee bajo `'tuvixProps'` (`TUVIX_PROPS_KEY`) para cualquier descendiente:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

defineProps<{ userId: string; theme?: 'light' | 'dark' }>();

const all = inject<Record<string, unknown>>(TUVIX_PROPS_KEY);
</script>

<template>
  <div :class="theme">User {{ userId }} ({{ Object.keys(all ?? {}).length }} props)</div>
</template>
```

`update({ props })` reemplaza las props en un objeto `shallowReactive` y espera al siguiente tick de Vue. El componente raíz se vuelve a renderizar con los nuevos valores y conserva su estado local. Las claves que faltan en las nuevas props se eliminan. Sin `container`, `update` actualiza todos los montajes del módulo.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## Renderizado en el servidor e hidratación

Renderiza en el servidor con `renderVueToString` e hidrata en el cliente con `createSsrVueMicroApp`:

```ts
// módulo solo de servidor
import { renderVueToString } from '@tuvix.js/vue/server';
import Newsletter from './Newsletter.vue';

export async function renderNewsletter(list: string): Promise<string> {
  const ssrContext: { teleports?: Record<string, string> } = {};
  const html = await renderVueToString(Newsletter, { list }, [], ssrContext);
  return html; // ssrContext.teleports contiene la salida de <Teleport>
}
```

```ts
// cliente
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

export const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });
```

- `renderVueToString(App, props?, plugins?, ssrContext?)` envuelve `App` en el mismo root que usa el cliente, así que `inject('tuvixProps')` funciona en el servidor y la hidratación coincide.
- Llámalo solo desde código de servidor: una server function, una ruta de API o tu entry de servidor. En el navegador devuelve `''`. Un loader de ruta isomórfico también se ejecuta en el navegador, y entonces el bundler envía al cliente el renderizador de servidor de Vue.
- Con `ssr: true` y markup del servidor en el contenedor, el adaptador llama a `createSSRApp` y conserva los nodos DOM del servidor. Un contenedor vacío recibe un render nuevo con `createApp`.
- El HTML no contiene CSS. Vite inyecta los bloques `<style>` de los SFC desde JavaScript, después de que empieza la hidratación. Enlaza las hojas de estilo en `<head>` con `@tuvix.js/vite`; consulta [Islas SSR](/es/guide/ssr-islands).

Dentro de un host de React, monta el módulo con `TuvixIsland`.

## Composables

### useTuvixBus

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/vue';

const count = ref(0);
useTuvixBus<{ itemCount: number }>(getGlobalBus(), 'cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

Se suscribe en `onMounted`, cancela la suscripción en `onUnmounted` y devuelve una función para limpiar antes.

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` devuelve un `ShallowRef` que combina cada payload emitido en `updateEvent`. Nada en Tuvix.js emite ese evento. Con el adaptador, las props que pasas con `updateAppProps` ya vuelven a renderizar el componente, así que rara vez lo necesitas.

## Casos límite

- Los path aliases como `~/utils` también deben resolverse en los archivos `.vue`. Si tu alias viene de `vite-tsconfig-paths`, incluye `**/*.vue` en el `include` de ese tsconfig, o define `resolve.alias` en la configuración de Vite. Consulta [Solución de problemas](/es/guide/troubleshooting).
- Un error en setup, en el render o en un hook de ciclo de vida durante el montaje rechaza `mount` y despacha `tuvix:error`, también en builds de producción. El `app.config.errorHandler` propio de un plugin se sigue ejecutando.
- `unmount` en un contenedor que este módulo nunca montó no hace nada.

## API

| Export | Propósito |
| --- | --- |
| `createVueMicroApp({ name, App, plugins?, bootstrap?, ssr? })` | Módulo de micro app de Vue |
| `createSsrVueMicroApp({ name, App, plugins?, bootstrap? })` | Igual, con `ssr: true` |
| `TUVIX_PROPS_KEY` | Clave de inyección (`'tuvixProps'`) para las props reactivas |
| `useTuvixBus(bus, event, handler)` | Suscripción al event bus ligada al componente |
| `useTuvixProps(initial, bus?, event?)` | `ShallowRef` combinado a partir de eventos del bus |
| `renderVueToString(App, props?, plugins?, ssrContext?)` de `@tuvix.js/vue/server` | HTML del servidor |
