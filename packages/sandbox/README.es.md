# @tuvix.js/sandbox

> Aislamiento de CSS con shadow DOM que sobrevive a los remontajes, adopción de hojas de estilo y un window Proxy para los globales de los scripts

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentación completa: [tuvix.js.org/packages/sandbox](https://tuvix.js.org/packages/sandbox).

`CssSandbox` mueve el DOM de una micro app a un shadow root abierto para que su CSS y el CSS de la página no se mezclen. El orquestador de `@tuvix.js/core` lo usa cuando registras una app con `sandbox: true`. `JsSandbox` evita que las escrituras `window.x = ...` del código que ejecutas a través de él lleguen al `window` real. Es un Proxy, no una barrera de seguridad; usa un `<iframe sandbox>` para código no confiable.

## Instalación

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Inicio rápido

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container); // ShadowRoot, or null with css: false
sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox(options?)` y `Sandbox`

`createSandbox(options)` devuelve `new Sandbox(options)` con el tipo `ISandbox`.

| Opción | Tipo | Por defecto | Significado |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` envuelve el contenedor en un shadow root. Con `false`, `activate` devuelve `null` y no adjunta nada. |
| `js` | `boolean` | `true` | `activate`/`deactivate` alternan `js.active`. En cualquier caso, el proxy mantiene las escrituras fuera de `window`. |
| `allowedGlobals` | `string[]` | `[]` | Nombres que el modo estricto permite asignar al código en sandbox (se siguen guardando en el proxy). |
| `strict` | `boolean` | `false` | Lanza un `TypeError` ante escrituras o `defineProperty` de globales fuera de la lista permitida y de `allowedGlobals`. |

Miembros: `css` (`CssSandbox`), `js` (`JsSandbox`), `activate(container): ShadowRoot | null`, `deactivate(container)`, `destroy(container)` (desactiva y después borra los globales guardados).

### `CssSandbox`

| Método | Comportamiento |
| --- | --- |
| `wrap(container)` | Mueve los hijos a un shadow root abierto. Reutiliza `container.shadowRoot` cuando existe (un `wrap` anterior, `unwrap`, otra instancia), elimina el slot que dejó `unwrap` y vuelve a colocar en orden las hojas de estilo apartadas. Solo lanza un error si falla `attachShadow`. |
| `unwrap(container)` | Devuelve los hijos al light DOM, saca del DOM los `<style>` y `<link rel="stylesheet">` (de `addStyle`, `adoptStyles` o de la app) y los guarda para el siguiente `wrap`, y deja un `<slot>` para que los hijos se rendericen. No hace nada con contenedores que esta instancia no envolvió. |
| `addStyle(shadowRoot, css)` | Añade un `<style>` y lo devuelve. |
| `removeStyle(shadowRoot, styleEl)` | Elimina `styleEl`. Si el contenedor está desenvuelto, el siguiente `wrap` no lo restaura. |
| `adoptStyles(shadowRoot, { urls?, cssText? })` | Inserta los `<link>` y después los `<style>` al principio del shadow root, detrás de los estilos adoptados antes. Omite las URLs ya adoptadas, incluidos los enlaces apartados. Devuelve `{ elements, ready, remove }`. |

`ready` se resuelve cuando cada enlace dispara `load` o `error`, y nunca rechaza. jsdom no dispara ninguno de los dos, así que no lo esperes en tests con jsdom. `remove()` solo elimina los elementos de esa llamada; si el contenedor está desenvuelto, no vuelven en el siguiente `wrap`.

### `JsSandbox`

`new JsSandbox(allowedGlobals = [], strict = false)`.

| Miembro | Comportamiento |
| --- | --- |
| `proxyWindow` | Proxy sobre `window`. Las lecturas consultan primero el almacén del sandbox y después el `window` real (las funciones se enlazan una vez). `window`, `self`, `globalThis` y, fuera de un iframe, `top`/`parent`/`frames` devuelven el proxy. Las escrituras y `Object.defineProperty` van al almacén; un descriptor sin `value` conserva el valor guardado. Los descriptores accessor y los no configurables lanzan un `TypeError`. |
| `execScript(code)` | Ejecuta `code` como script en modo no estricto dentro de `with (scope)`. `window`, `self`, `globalThis` y el `this` de nivel superior son el proxy, y los identificadores libres se resuelven a través de él. `eval("...")` sigue siendo un eval directo dentro de ese scope. |
| `activate()`, `deactivate()`, `active` | Un indicador. No cambia el comportamiento del proxy. |
| `reset()` | Borra los globales guardados y pone `active` a `false`. |

El modo estricto lanza `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "x". Add it to allowedGlobals to permit it.` ante una asignación, un `var x = 1` de nivel superior o un `defineProperty` de un nombre fuera de la lista permitida, y no guarda nada, esté activo o no.

### Tipos

`SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles`.

## Casos límite

- En `execScript`, `x = 1`, `var x = 1`, `window.x = 1`, `window.window.x = 1`, `top.x = 1` y esas mismas sentencias dentro de `eval("...")` guardan `x` en el proxy, nunca en el `window` real. `let`/`const` se quedan locales.
- Leer un identificador no declarado en `execScript` devuelve `undefined` en lugar de lanzar un error, y `"use strict"` en `code` no tiene efecto.
- Dentro de una llamada a función simple como `f()`, `this` es el objeto global real, como define JavaScript en modo no estricto. Ahí, `this.x = 1` escribe en el `window` real; escribe `window.x = 1` en su lugar.
- `execScript` usa `new Function`; tu CSP necesita `'unsafe-eval'`.
- `JsSandbox`, `Sandbox` y `createSandbox()` leen `window` en el constructor y lanzan un error en el servidor.
- Los hijos del light DOM añadidos mientras el contenedor está envuelto no se renderizan. Añádelos dentro del shadow root.

## Lo que no hace

- No parchea timers, event listeners, `document` ni etiquetas `<script>`, y no limpia lo que deja una app.
- No le da al código su propio origen ni su propio objeto global.
- No impide que los estilos heredados (`color`, fuentes, custom properties) lleguen al shadow root.

## Migrar desde 0.4

- `Sandbox({ css: false }).activate()` devuelve `null` y no adjunta ningún shadow root. `ISandbox.activate` devuelve `ShadowRoot | null`.
- `strict: true` lanza un error ante escrituras bloqueadas en lugar de mostrar un aviso.
- `execScript` ejecuta el código en un bloque `with`: sin código en modo estricto, las lecturas no declaradas devuelven `undefined` y un `x = 1` sin más se queda en el proxy.
- `unwrap` guarda las hojas de estilo para el siguiente `wrap` en lugar de borrarlas.

## Licencia

MIT
