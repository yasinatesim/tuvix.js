---
title: '@tuvix.js/vue'
---

<PackageHeader
  name="@tuvix.js/vue"
  title="Bindings de Vue"
  description="Convierte un componente de Vue 3 en una micro app de Tuvix.js con props reactivas, una app de Vue por contenedor e hidratación SSR. Renderízalo en el servidor con renderVueToString."
  icon="💚"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/vue vue
# o pnpm add @tuvix.js/vue vue
```

Para el renderizado en el servidor instala también el renderer de servidor de Vue, una dependencia peer opcional:

```bash
npm install @vue/server-renderer
# o pnpm add @vue/server-renderer
```

El paquete necesita Vue 3 (rango de peer `>=3.0.0`). Depende de `@tuvix.js/loader` y `@tuvix.js/event-bus`.

## Cuándo usarlo

Usa `@tuvix.js/vue` cuando una de las micro apps de tu shell de Tuvix sea una app de Vue 3. `createVueMicroApp` envuelve el componente raíz en el módulo `{ bootstrap, mount, unmount, update }` al que llaman el orquestador y el loader. Después, el orquestador lo monta en un contenedor, envía props nuevas con `updateAppProps` y lo desmonta al cambiar de ruta.

Añade renderizado en el servidor cuando la app de Vue deba aparecer en la primera respuesta HTML, por SEO o para evitar una zona en blanco antes de que se ejecute JavaScript. Renderiza el HTML con `renderVueToString` de `@tuvix.js/vue/server` en una función de servidor, ponlo en el contenedor e hidrátalo con `createSsrVueMicroApp`. Dentro de una página host de React, pasa ese HTML a [`TuvixIsland`](/es/packages/react#tuvixisland).

Si toda la página es una sola app de Vue, no necesitas este paquete; usa el propio `createApp` de Vue o Nuxt.

## Inicio rápido

El componente raíz declara las props que pasa la shell:

```vue
<!-- src/micro-apps/settings/App.vue -->
<script setup lang="ts">
defineProps<{ userId: string; theme: 'light' | 'dark' }>();
</script>

<template>
  <section :class="`settings theme-${theme}`">Settings for {{ userId }}</section>
</template>
```

Envuélvelo en un módulo:

```ts
// src/micro-apps/settings/index.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

Regístralo en la shell:

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'settings',
  entry: () => import('./micro-apps/settings'),
  container: '#app',
  activeWhen: '/settings/*',
  props: { userId: 'u_42', theme: 'light' },
});

await orchestrator.start();

// Vuelve a renderizar App con theme="dark"; el estado local del componente se conserva.
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## API

### `createVueMicroApp`

```ts no-check
function createVueMicroApp(config: VueMicroAppConfig): MicroAppModule;
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre con el que se registra el módulo mediante `registerModule` de `@tuvix.js/loader`. Los eventos de ciclo de vida lo incluyen. |
| `App` | `Component` | obligatorio | Componente raíz de Vue. |
| `plugins` | `VuePluginEntry[]` | ninguno | Plugins que se instalan en cada app de Vue. Una entrada es un plugin o una tupla `[plugin, ...options]` que se pasa a `app.use(plugin, ...options)`. |
| `bootstrap` | `() => void \| Promise<void>` | ninguno | Configuración inicial que se ejecuta una sola vez. El `bootstrap()` del módulo la espera. |
| `ssr` | `boolean` | `false` | Hidrata el markup del servidor con `createSSRApp` cuando el contenedor tiene elementos o texto que no sea solo espacios en blanco. Un contenedor vacío recibe un render con `createApp`. |

El módulo devuelto:

- `mount({ container, props })` crea una app de Vue para ese contenedor, instala los plugins y la monta. Despacha `tuvix:mounted` en el contenedor con `hydrated: true` cuando Vue adoptó el markup del servidor.
- `update({ props, container })` escribe `props` en el objeto de props reactivo de ese contenedor y se resuelve cuando Vue aplica el re-render (`nextTick`). Las claves que faltan en las props nuevas se eliminan. Sin `container` actualiza todos los contenedores que el módulo ha montado.
- `unmount({ container })` desmonta la app de Vue, vacía el contenedor con `replaceChildren()` y despacha `tuvix:unmounted`.
- `bootstrap()` ejecuta `config.bootstrap`.

Cada contenedor recibe su propia app de Vue y sus propias props, así que un módulo puede montarse en varios lugares a la vez:

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Badge from './Badge.vue';

const badge = createVueMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Solo cambia el badge de la derecha.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

#### Leer props en los componentes

El adaptador guarda las props en un objeto `shallowReactive` y renderiza `App` a través de un wrapper raíz que las pasa como props del componente. El wrapper no renderiza DOM propio. Puedes leer las props de dos maneras:

- **`defineProps`** en el componente raíz. `update` lo vuelve a renderizar con los valores nuevos.
- **`inject('tuvixProps')`** (o `inject(TUVIX_PROPS_KEY)`) en cualquier componente del árbol. Obtienes el mismo objeto reactivo, así que un `computed` que lo lee se actualiza después de `update`. Úsalo en hijos profundos en lugar de pasar props hacia abajo.

```vue
<!-- src/micro-apps/settings/ThemeLabel.vue -->
<script setup lang="ts">
import { computed, inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

const tuvixProps = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
const theme = computed(() => String(tuvixProps.theme ?? 'light'));
</script>

<template>
  <span>Theme: {{ theme }}</span>
</template>
```

#### Plugins con opciones

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import type { VuePluginEntry } from '@tuvix.js/vue';
import type { App as VueApp } from 'vue';
import App from './App.vue';

const analytics = {
  install(app: VueApp, options: { siteId: string }) {
    app.provide('analyticsSiteId', options.siteId);
  },
};

const plugins: VuePluginEntry[] = [[analytics, { siteId: 'site-42' }]];

export default createVueMicroApp({ name: 'checkout', App, plugins });
```

Cada contenedor recibe su propia app de Vue, así que cada montaje vuelve a llamar a `app.use` para cada plugin. Un objeto de plugin con estado, como un único resultado de `createPinia()`, se comparte entre todos los contenedores del módulo.

### `createSsrVueMicroApp`

```ts no-check
function createSsrVueMicroApp(config: VueSsrMicroAppConfig): MicroAppModule;
```

Equivale a `createVueMicroApp({ ...config, ssr: true })`. Opciones: `name`, `App`, `plugins`, `bootstrap`, como en la tabla anterior.

Cuando el contenedor tiene markup de `renderVueToString`, Vue adopta esos nodos del DOM mediante `createSSRApp` y les adjunta listeners. El servidor y el cliente usan el mismo wrapper raíz, así que los árboles de componentes coinciden. Monta con las mismas props con las que renderizó el servidor:

```ts
// src/micro-apps/contact/client.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString`

Impórtalo desde el subpath `@tuvix.js/vue/server`.

```ts no-check
function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: VuePluginEntry[],
  ssrContext?: VueSsrContext
): Promise<string>;
```

| Argumento | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `App` | `Component` | obligatorio | Componente raíz, el mismo que pasas a `createSsrVueMicroApp`. |
| `props` | `Record<string, unknown>` | `{}` | Props para `App`. `inject('tuvixProps')` también las ve durante el SSR. |
| `plugins` | `VuePluginEntry[]` | ninguno | Plugins que se instalan, con la misma forma de tupla que en `createVueMicroApp`. |
| `ssrContext` | `VueSsrContext` | `{}` | Objeto en el que Vue escribe durante el render. Lee `teleports` y `modules` cuando se resuelva la promesa. |

Crea una app SSR con el wrapper raíz compartido, instala los plugins y devuelve el HTML de `renderToString` de `@vue/server-renderer`. Instala ese paquete; `renderVueToString` lo importa en la primera llamada.

`renderVueToString` es solo de servidor. Llámalo desde una función de servidor (un handler `createServerFn` de TanStack Start, una ruta de API, tu handler de Express), no desde un loader de ruta isomórfico. Un loader también se ejecuta en el navegador durante la navegación en el cliente, donde la función devuelve `''`, y tu bundler envía el renderer de servidor de Vue al cliente porque el loader lo importa.

```ts
// src/server/contact.ts
import { createServerFn } from '@tanstack/react-start';
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from '../micro-apps/contact/App.vue';

export const renderContact = createServerFn().handler(async () => {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return { html, teleports: ssrContext.teleports ?? {} };
});
```

Pon `html` dentro del elemento contenedor (`<div id="contact">…</div>`) de tu página y luego monta `createSsrVueMicroApp` en el cliente como se muestra arriba. El HTML del destino de un `<Teleport>` está en `ssrContext.teleports['#target']`, no en el string devuelto; imprímelo donde esté el destino.

### `TUVIX_PROPS_KEY`

```ts no-check
const TUVIX_PROPS_KEY = 'tuvixProps';
```

Clave de inyección del objeto de props reactivo. `inject(TUVIX_PROPS_KEY)` e `inject('tuvixProps')` devuelven el mismo objeto, en el cliente y durante `renderVueToString`.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): Unsubscribe;
```

Suscribe `handler` a `event` en `onMounted` y cancela la suscripción en `onUnmounted`. La función devuelta cancela la suscripción antes de tiempo. Llámalo durante `setup`. `onMounted` no se ejecuta durante el renderizado en el servidor, así que la suscripción existe solo en el cliente.

El adaptador no pasa el bus del orquestador a `App`. El orquestador usa `getGlobalBus()` a menos que le hayas dado opciones `eventBus`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const count = ref(0);

useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
  count.value = items.length;
});
</script>

<template>
  <span>{{ count }}</span>
</template>
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): ShallowRef<T>;
```

| Argumento | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `initialProps` | `T` | obligatorio | Valor inicial, copiado una sola vez. |
| `bus` | `IEventBus` | ninguno | Bus en el que escuchar. Sin él, el ref conserva `initialProps`. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Evento cuyo payload el composable fusiona en el ref (`{ ...prev, ...payload }`). |

Ni el orquestador ni el adaptador emiten `tuvix:props:update`; lo emites tú. Para las props del orquestador usa `defineProps` o `inject(TUVIX_PROPS_KEY)`, que siguen a `update` sin necesidad de bus.

```vue
<script setup lang="ts">
import { useTuvixProps } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const settings = useTuvixProps({ theme: 'light' }, getGlobalBus());
// En otro lugar: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
</script>

<template>
  <p>Theme: {{ settings.theme }}</p>
</template>
```

### Tipos

| Tipo | Exportado desde | Significado |
| --- | --- | --- |
| `VueMicroAppConfig` | `@tuvix.js/vue` | Configuración de `createVueMicroApp`: `name`, `App`, `plugins?`, `bootstrap?`, `ssr?`. |
| `VueSsrMicroAppConfig` | `@tuvix.js/vue` | `VueMicroAppConfig` sin `ssr`; configuración de `createSsrVueMicroApp`. |
| `VuePluginEntry` | `@tuvix.js/vue` | `Plugin \| [Plugin, ...any[]]`: un plugin, o un plugin más sus opciones de `app.use`. |
| `VueSsrContext` | `@tuvix.js/vue/server` | `{ teleports?: Record<string, string>; modules?: Set<string>; [key: string]: unknown }`, que Vue y sus plugins rellenan durante `renderVueToString`. `@vitejs/plugin-vue` registra en `modules` los módulos de componentes renderizados. |

## Casos límite

- **Errores de montaje.** Los errores de setup, de render y de hooks de ciclo de vida durante `mount` rechazan la promesa tanto en builds de desarrollo como de producción. El adaptador desmonta la app fallida y despacha `tuvix:error`. El `app.config.errorHandler` propio de un plugin sigue recibiendo el error.
- **Montar dos veces en un contenedor.** Un segundo `mount` en un contenedor que el módulo ya ocupa desmonta primero la app anterior (despachando `tuvix:unmounted` y vaciando el contenedor) y luego monta una nueva. Con `ssr: true`, ese segundo montaje renderiza desde cero, porque el contenedor está vacío.
- **Contenedor desconocido.** `unmount` en un contenedor que el módulo nunca montó no hace nada. `update` con un `container` así no cambia nada.
- **Las props se reemplazan.** El `update` del módulo asigna como props el objeto que pasas y borra las claves que faltan. `orchestrator.updateAppProps` fusiona las props nuevas sobre las registradas antes de llamar a `update`.
- **Props no declaradas.** Las props que el componente raíz no declara con `defineProps` le llegan como atributos y pasan a su elemento raíz, como hace Vue con cualquier componente. `{ lang: 'en' }` renderiza `lang="en"` en el elemento raíz a menos que declares `lang` o definas `inheritAttrs: false`.
- **Contenedor con solo espacios en blanco y `ssr: true`.** El adaptador renderiza con `createApp`, porque `hasServerMarkup` ignora el texto de espacios en blanco y los comentarios. Vue no avisa de que se intenta hidratar un contenedor vacío.
- **`renderVueToString` en el navegador.** Devuelve `''` cuando existe `window`.
- **Error al desmontar.** Si `app.unmount()` lanza un error, el adaptador vacía el contenedor, despacha `tuvix:error` y vuelve a lanzar el error.
- **El mismo nombre dos veces.** `registerModule` conserva el último módulo creado con un nombre.

## Lo que no hace

- No es compatible con Vue 2.
- No carga módulos por URL. Importa el módulo, o deja que [`@tuvix.js/core`](/es/packages/core) lo cargue mediante un `entry`.
- No pasa `MountContext.bus` ni `MountContext.name` a tus componentes. Usa `getGlobalBus()` de `@tuvix.js/event-bus`.
- `renderVueToString` no hace streaming y no recopila CSS. Usa [`@tuvix.js/vite`](/es/packages/vite) para imprimir los enlaces a hojas de estilo de las islas renderizadas en el servidor.
- No coloca por ti el HTML teletransportado. Lee `ssrContext.teleports` e imprímelo.

## Migrar desde 0.4

**`$tuvixProps` ya no existe.** `update()` ya no escribe `app.config.globalProperties.$tuvixProps`. Lee las props con `defineProps` o `inject`:

```vue
<!-- Antes (0.4) -->
<template>
  <span>{{ $tuvixProps.theme }}</span>
</template>
```

```vue
<!-- Después (0.5) -->
<script setup lang="ts">
defineProps<{ theme: string }>();
</script>

<template>
  <span>{{ theme }}</span>
</template>
```

**`unmount` en un contenedor desconocido no hace nada.** En 0.4 vaciaba el contenedor. Llama tú mismo a `container.replaceChildren()` si dependías de eso.

**`VueSsrMicroAppConfig` no tiene campo `ssr`.** Quita `ssr` de la configuración que pasas a `createSsrVueMicroApp`.

**Objeto de configuración.** Versiones anteriores de esta página mostraban `createVueMicroApp(App)`. La función recibe un objeto de configuración: `createVueMicroApp({ name: 'settings', App })`.

Consulta la [guía de Vue](/es/guide/vue) para más recorridos.
