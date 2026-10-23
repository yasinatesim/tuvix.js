# Eventos de ciclo de vida

Los adaptadores y `defineMicroApp` avisan a la página cuando una micro app se monta, se desmonta o falla. Puedes escuchar eventos DOM, esperar a `whenMounted(name)` o consultar `isMounted(name)`. Úsalos para iniciar una animación en cuanto una isla es interactiva, para ocultar un skeleton o para informar de errores, en lugar de sondear el DOM o leer detalles internos del framework como `__vue_app__`.

## Eventos

| Evento DOM | Se despacha |
| --- | --- |
| `tuvix:mounted` | Después de que la app se haya renderizado o hidratado y se hayan ejecutado los callbacks de montaje de su framework. |
| `tuvix:unmounted` | Después de que la app se haya destruido y su contenedor se haya vaciado. |
| `tuvix:error` | Cuando `mount` o `unmount` lanzan un error, o cuando una app React lanza un error al renderizar después del montaje. |

Cada evento es un `CustomEvent<LifecycleDetail>` despachado en el contenedor de la app. Hace bubbling y es `composed`, así que un listener en `document` lo recibe, incluso desde dentro de un shadow root. Cuando el contenedor ya no está en el DOM (React eliminó una isla antes de que su módulo informara de `unmounted`), el evento se despacha en `document` en su lugar, y `detail.container` sigue apuntando al elemento.

```ts
import type { LifecycleDetail } from '@tuvix.js/loader';

const detail: LifecycleDetail = {
  name: 'footer', // the app name
  container: document.body, // the element the app rendered into
  hydrated: true, // true when the adapter adopted server markup
  error: undefined, // the thrown value, on 'error' only
};
```

## Escucha con onLifecycle

```ts
import { onLifecycle } from 'tuvix.js';

const stopMounted = onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} is interactive (hydrated: ${hydrated})`);
});

const stopErrors = onLifecycle('error', ({ name, error }) => {
  console.error(`${name} failed`, error);
});

// later
stopMounted();
stopErrors();
```

`onLifecycle(type, handler, target = document)` devuelve una función que elimina el listener. Pasa un contenedor como `target` para escuchar solo una región. Un `addEventListener('tuvix:mounted', ...)` normal también funciona.

## Espera con whenMounted

```ts
import { whenMounted } from 'tuvix.js';

const controller = new AbortController();
setTimeout(() => controller.abort(new Error('footer did not mount in 5 s')), 5000);

const { container } = await whenMounted('footer', { signal: controller.signal });
container.classList.add('is-ready');
```

- Se resuelve de inmediato cuando la app ya está montada, así que no importa el orden entre tu código y el montaje.
- No se rechaza cuando el montaje falla. Pasa un `signal` con un timeout, o escucha también `tuvix:error`.
- Cuando el signal se aborta, la promesa se rechaza con el motivo del signal.

## Comprueba con isMounted

```ts
import { isMounted } from 'tuvix.js';

if (isMounted('footer')) {
  console.log('footer is on the page');
}
```

## Sustituye la detección del framework

Sin eventos de ciclo de vida, un host tiene que adivinar cuándo una isla está lista, por ejemplo sondeando las propiedades privadas de un framework:

```ts no-check
// Breaks on Svelte, Angular and any Vue release that renames the property.
const timer = setInterval(() => {
  if ((container as any).__vue_app__) {
    clearInterval(timer);
    startReveal(container);
  }
}, 50);
```

Con eventos de ciclo de vida, un solo listener funciona para todos los adaptadores:

```ts
import { onLifecycle } from 'tuvix.js';

declare function startReveal(container: HTMLElement): void;

onLifecycle('mounted', ({ name, container }) => {
  if (name === 'footer') startReveal(container);
});
```

## Quién despacha los eventos

| Origen | Despacha |
| --- | --- |
| `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp` (y las variantes `Ssr`) | los tres |
| `TuvixReactApp` | los tres |
| `TuvixIsland` | ninguno por sí mismo; los despacha el módulo que aloja |
| `defineMicroApp` | los tres; con `ssr: true`, `hydrated` es `true` cuando el contenedor tenía markup antes de `mount` |
| Objetos `{ mount, unmount }` simples | ninguno, salvo que llames a `emitLifecycle` |
| El orquestador | ninguno; en su lugar emite eventos `tuvix:app:*` en el event bus |

`defineMicroApp` despacha `tuvix:mounted` cuando se resuelve tu `mount`, `tuvix:unmounted` cuando se resuelve tu `unmount`, y `tuvix:error` (y después vuelve a lanzar el error) cuando cualquiera de los dos lanza un error. Un `unmount` para un contenedor cuyo `mount` todavía se está ejecutando espera a que termine:

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'clock',
  ssr: true, // the server rendered the time into the container
  mount({ container }) {
    container.textContent = new Date().toISOString();
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Un módulo escrito como objeto simple puede despachar los eventos por sí mismo:

```ts
import { emitLifecycle, type MicroAppModule } from '@tuvix.js/loader';

export const clock: MicroAppModule = {
  mount({ container }) {
    container.textContent = new Date().toISOString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated: false });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
};
```

## Casos límite

- Un módulo puede montarse en varios contenedores. `isMounted(name)` sigue siendo `true` mientras cualquiera de ellos esté montado, y `whenMounted(name)` se resuelve con el contenedor más antiguo que siga montado. Da a cada ubicación su propio nombre cuando necesites distinguirlas.
- Un evento `tuvix:unmounted` para un contenedor desconectado llega una vez a los listeners de `document`. `onLifecycle` con un contenedor como `target` no lo ve, porque el evento ya no pasa por ese elemento.
- El estado vive en `window.__TUVIX_RUNTIME__`, así que las copias de `@tuvix.js/loader` empaquetadas por separado lo comparten.
- En el servidor no hay DOM ni eventos. No llames a `whenMounted` ahí; nunca se resuelve.

## Lo que no hace

- No informa del progreso de carga. El `onStatusChange` del orquestador cubre `bootstrapping`, `mounting` y el resto.
- No reintenta ni se recupera. Usa el `fallback` del orquestador, o `fallback` en `TuvixIsland` y `TuvixReactApp`.
