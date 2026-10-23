# Micro apps

Una micro app es un módulo con funciones `mount` y `unmount`. La shell llama a `mount` con un elemento contenedor y props; la app se renderiza en ese elemento. La shell llama a `unmount` cuando la app debe salir de la página; la app elimina lo que renderizó.

## La forma del módulo

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  bootstrap: async () => {},
  mount: async ({ container, props, name, bus }) => {
    container.textContent = `${name ?? 'app'} mounted`;
    void props;
    void bus;
  },
  update: async ({ props, container }) => {
    if (container) container.dataset.props = JSON.stringify(props);
  },
  unmount: async ({ container }) => {
    container.replaceChildren();
  },
};
```

| Hook | Obligatorio | Cuándo se llama |
| --- | --- | --- |
| `bootstrap()` | no | Una vez, después de la primera carga y antes del primer `mount`. |
| `mount({ container, props, name, bus })` | sí | Cada vez que la app pasa a estar activa. |
| `update({ props, container })` | no | Cuando la shell llama a `updateAppProps` mientras la app está montada. |
| `unmount({ container })` | sí | Cada vez que la app pasa a estar inactiva. |

Cada hook puede devolver una promesa. El orquestador la espera antes del siguiente paso.

## Escribe una a mano

`defineMicroApp` valida los hooks, registra el módulo con `name`, despacha `tuvix:mounted`, `tuvix:unmounted` y `tuvix:error` en el contenedor, y devuelve el módulo:

```ts
import { defineMicroApp } from '@tuvix.js/core';

let off: (() => void) | undefined;

export default defineMicroApp({
  name: 'notifications',

  mount({ container, props, bus }) {
    const list = document.createElement('ul');
    container.replaceChildren(list);
    off = bus?.on<{ text: string }>('notify', ({ text }) => {
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    });
    container.dataset.user = String(props?.user ?? '');
  },

  unmount({ container }) {
    off?.();
    off = undefined;
    container.replaceChildren();
  },
});
```

Usa el `bus` del contexto de montaje. Es el bus del orquestador, que es `getGlobalBus()` salvo que la shell haya pasado opciones de `eventBus`.

## Usa un adaptador

Los adaptadores construyen el módulo a partir de un componente y se encargan de detalles que de otro modo escribirías tú:

- una instancia del framework por contenedor, para que un módulo pueda montarse en varios sitios;
- `update` vuelve a renderizar con las nuevas props sin volver a montar;
- un `unmount` que llega mientras `mount` todavía está cargando espera y deja el contenedor vacío;
- eventos `tuvix:mounted`, `tuvix:unmounted` y `tuvix:error` en el contenedor;
- hidratación del markup renderizado en el servidor cuando pasas `ssr: true`.

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Cart({ items }: { items: number }) {
  return <p>{items} items</p>;
}

export default createReactMicroApp({ name: 'cart', App: Cart });
```

## Expón el módulo al loader

El orquestador obtiene un módulo a través del `entry` de la app:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

// Bundled with the shell, code-split by your bundler.
orchestrator.register({
  name: 'cart',
  entry: () => import('./apps/cart'),
  container: '#cart',
  activeWhen: '/shop/*',
});

// Deployed on its own. The script registers itself by name.
orchestrator.register({
  name: 'notifications',
  entry: { scripts: ['https://cdn.example.com/notifications/main.js'], type: 'module' },
  container: '#notifications',
  activeWhen: '/',
});
```

Para un entry con URL, el módulo debe llamar a `registerModule(name, module)` (los adaptadores y `defineMicroApp` lo hacen) o exponer una global UMD con una función `mount`. Una función loader solo tiene que resolverse con el módulo o con `{ default: module }`.

## Pasa props

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./apps/profile'),
  container: '#app',
  activeWhen: '/profile/*',
  props: { userId: '42', theme: 'dark' },
});

await orchestrator.updateAppProps('profile', { theme: 'light' });
// The app now has { userId: '42', theme: 'light' }.
```

- Las props se fusionan de forma superficial. Para eliminar una clave, asígnale `undefined`.
- Cuando la app está montada y tiene `update`, el orquestador la llama y se resuelve cuando termina. Un `update` rechazado pone la app en estado `error` y llama a `onError`.
- Cuando la app no está montada, o no tiene `update`, el orquestador guarda las props fusionadas para el siguiente montaje. No vuelve a montar la app.

## Monta un módulo en varios sitios

Los adaptadores mantienen una instancia separada por contenedor. `TuvixIsland` y tu propio código pueden llamar a `mount` en dos contenedores con el mismo módulo:

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Price from './Price.vue';

const price = createVueMicroApp({ name: 'price', App: Price });

const first = document.querySelector<HTMLElement>('#price-1');
const second = document.querySelector<HTMLElement>('#price-2');
if (first && second) {
  await price.mount({ container: first, props: { sku: 'a' } });
  await price.mount({ container: second, props: { sku: 'b' } });
  await price.update?.({ props: { sku: 'c' }, container: second }); // only #price-2
}
```

Sin `container`, `update` actualiza todos los montajes de ese módulo. El orquestador siempre pasa `container`.

## Build y despliegue

Haz el build de cada app como un bundle de módulos ES y regístrala con `type: 'module'`, o como un bundle IIFE/UMD y registra su URL como script clásico. Con Vite:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', formats: ['es'], fileName: 'main' },
    // Leave dependencies bundled unless the shell provides them.
  },
});
```

Ten en cuenta las copias de framework: dos micro apps que incluyen cada una React en su bundle envían React dos veces. La página sigue funcionando, porque cada app renderiza su propia raíz. Para compartir una sola copia, usa import maps, Module Federation (`@tuvix.js/module-federation`), o haz que la shell empaquete las apps mediante entries con función loader.

## Lo que una micro app no debe hacer

- Escribir fuera de su contenedor. Tuvix.js no lo impide, y la siguiente app en ese contenedor no lo espera.
- Dejar listeners, timers o suscripciones activos después de `unmount`.
- Depender de que `bootstrap` se ejecute más de una vez. Se ejecuta una vez por cada módulo cargado.
