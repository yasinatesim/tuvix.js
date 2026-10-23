# @tuvix.js/vue

> Convierte componentes de Vue 3 en micro apps de Tuvix.js con props reactivas, una app de Vue por contenedor e hidratación SSR.

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Instalación

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

Para el renderizado en el servidor, instala también la dependencia peer opcional `@vue/server-renderer`.

## Inicio rápido

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

El módulo se registra a sí mismo con el nombre `'settings'` mediante `registerModule` de `@tuvix.js/loader`, así que el orquestador lo encuentra cuando el script termina de cargar. `App` recibe las props del orquestador como props del componente; decláralas con `defineProps`.

## API

### `createVueMicroApp(config)`

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre en el registro; los eventos de ciclo de vida lo incluyen. |
| `App` | `Component` | obligatorio | Componente raíz de Vue. |
| `plugins` | `VuePluginEntry[]` | ninguno | Plugins, o tuplas `[plugin, ...options]` que se pasan a `app.use(plugin, ...options)`. |
| `bootstrap` | `() => void \| Promise<void>` | ninguno | Configuración que se ejecuta una sola vez. |
| `ssr` | `boolean` | `false` | Hidrata el markup del servidor con `createSSRApp` cuando el contenedor tiene elementos o texto que no sea solo espacios en blanco. |

- Cada contenedor recibe su propia app de Vue y sus propias props, así que un mismo módulo puede montarse en varios lugares. Cada montaje vuelve a instalar los plugins.
- `mount({ container, props })` despacha `tuvix:mounted` con `hydrated`.
- `update({ props, container })` reemplaza las claves de un objeto de props `shallowReactive` (las claves que faltan se eliminan) y se resuelve después de `nextTick`. Sin `container`, actualiza todos los montajes. El estado de los componentes se conserva.
- `unmount({ container })` desmonta la app, vacía el contenedor y despacha `tuvix:unmounted`.

### `createSsrVueMicroApp(config)`

`createVueMicroApp({ ...config, ssr: true })`. Opciones: `name`, `App`, `plugins`, `bootstrap`. Vue adopta el markup de `renderVueToString`; un contenedor vacío recibe un render normal.

```ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString(App, props?, plugins?, ssrContext?)`

Desde `@tuvix.js/vue/server`. Devuelve el HTML de `App` renderizado con el mismo wrapper raíz que usa el cliente, así que la hidratación coincide e `inject('tuvixProps')` funciona en el servidor. Vue escribe `teleports` y `modules` en `ssrContext`.

Solo para el servidor: llámalo desde una función del servidor, no desde un loader de ruta isomórfico. En el navegador devuelve `''`, y un loader que lo importe envía el renderizador de servidor de Vue al cliente.

```ts
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from './App.vue';

export async function renderContact(): Promise<string> {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return `<div id="contact">${html}</div>`;
}
```

### `TUVIX_PROPS_KEY`

`'tuvixProps'`. `inject(TUVIX_PROPS_KEY)` devuelve el objeto de props reactivo en el que escribe `update`, desde cualquier componente del árbol.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus(bus, event, handler)`

Se suscribe en `onMounted`, cancela la suscripción en `onUnmounted` y devuelve una función para cancelarla antes. Pasa `getGlobalBus()` de `@tuvix.js/event-bus`; el adaptador no entrega el bus del orquestador a `App`.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Devuelve un `ShallowRef<T>` que fusiona cada payload de `updateEvent` (por defecto `'tuvix:props:update'`) en `bus`. Nada en Tuvix emite ese evento; lo emites tú. Para las props del orquestador usa `defineProps` o `inject(TUVIX_PROPS_KEY)`.

### Tipos

`VueMicroAppConfig`, `VueSsrMicroAppConfig`, `VuePluginEntry` de `@tuvix.js/vue`; `VueSsrContext` de `@tuvix.js/vue/server`.

## Casos límite

- Los errores de setup, de render y de hooks durante `mount` provocan el rechazo tanto en builds de desarrollo como de producción; el adaptador desmonta la app fallida y despacha `tuvix:error`. El `app.config.errorHandler` de un plugin se sigue ejecutando.
- `mount` sobre un contenedor que el módulo ya ocupa desmonta primero la app anterior.
- `unmount` sobre un contenedor que el módulo nunca montó no hace nada.
- Las props que el componente raíz no declara se aplican como atributos en su elemento raíz.
- Con `ssr: true`, un contenedor que solo tiene espacios en blanco o comentarios recibe un render nuevo.

## Lo que no hace

- Soportar Vue 2.
- Cargar módulos por URL. Usa `@tuvix.js/core` o `@tuvix.js/loader`.
- Recopilar CSS ni hacer streaming de HTML en el servidor. Usa `@tuvix.js/vite` para los enlaces a hojas de estilo.

## Cambios incompatibles en 0.5

- `update()` ya no escribe `app.config.globalProperties.$tuvixProps`. Usa `defineProps` o `inject('tuvixProps')`.
- `unmount()` sobre un contenedor que el módulo nunca montó no hace nada; antes vaciaba el contenedor.
- `VueSsrMicroAppConfig` ya no acepta `ssr`.

Documentación completa: [tuvix.js.org/packages/vue](https://tuvix.js.org/packages/vue)

## Licencia

MIT
