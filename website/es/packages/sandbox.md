---
title: '@tuvix.js/sandbox'
---

<PackageHeader
  name="@tuvix.js/sandbox"
  title="Sandbox"
  description="Aislamiento de CSS en un shadow root reutilizable, adopción de hojas de estilos en ese root y un window Proxy que mantiene los globals de los scripts fuera del window real."
  icon="🔒"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Cuándo usarlo

Usa `CssSandbox` cuando el CSS de una micro app y el CSS de la página no deban afectarse entre sí. Mueve el DOM de la app a un shadow root abierto en el contenedor, así que los selectores de la app se quedan dentro y los de la página se quedan fuera. El orquestador de `@tuvix.js/core` lo hace por ti cuando registras una app con `sandbox: true`. Llama tú mismo a este paquete cuando montes apps sin el orquestador.

Usa `JsSandbox` cuando ejecutes texto de scripts de terceros y quieras que sus escrituras globales no lleguen al `window` real. Ejecutas el código mediante `execScript`, que resuelve `window`, `this` y los identificadores libres a través de un Proxy. El orquestador no lo aplica.

Elige otra opción cuando necesites un aislamiento fuerte para código no confiable. Un `<iframe>` con el atributo `sandbox` le da al código su propio objeto global y su propio origen; este paquete no.

## Inicio rápido

A través del orquestador (solo CSS):

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'cart',
  entry: { scripts: ['/apps/cart/main.js'], styles: ['/apps/cart/style.css'] },
  container: '#cart',
  activeWhen: '/cart/*',
  sandbox: true,
});

await orchestrator.start();
```

El orquestador envuelve `#cart` en un shadow root, renderiza la app en un `<div data-tuvix-sandbox-root="cart">` dentro de él y carga `style.css` en el shadow root en lugar de en `<head>`. El montaje espera a esas hojas de estilos, hasta el `timeout` del loader (10000 ms por defecto). El orquestador reutiliza el shadow root cuando la app se vuelve a montar.

A mano:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container);
const target = shadowRoot ?? container;

const adopted = sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });
await adopted.ready;
target.append(Object.assign(document.createElement('p'), { textContent: 'Cart' }));

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox`

```ts
import type { ISandbox, SandboxOptions } from '@tuvix.js/sandbox';

declare function createSandbox(options?: SandboxOptions): ISandbox;
```

Devuelve `new Sandbox(options)`.

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` envuelve el contenedor en un shadow root. Con `false`, `activate` devuelve `null` y no adjunta nada. |
| `js` | `boolean` | `true` | `activate`/`deactivate` alternan `sandbox.js.active`. El proxy de `sandbox.js.proxyWindow` mantiene las escrituras fuera del `window` real en ambos casos. |
| `allowedGlobals` | `string[]` | `[]` | Nombres de globals adicionales que el modo estricto permite asignar al código en el sandbox. Las escrituras en ellos siguen yendo al proxy. |
| `strict` | `boolean` | `false` | Lanza un `TypeError` cuando el código en el sandbox asigna o define un global fuera de la lista de permitidos integrada y de `allowedGlobals`. |

### `Sandbox`

```ts
import { Sandbox } from '@tuvix.js/sandbox';

const sandbox = new Sandbox({ css: false, js: true });
console.log(sandbox.activate(document.body)); // null
```

La clase detrás de `createSandbox`. Implementa `ISandbox`:

| Miembro | Firma | Comportamiento |
| --- | --- | --- |
| `css` | `readonly ICssSandbox` | La instancia de `CssSandbox` que usa. |
| `js` | `readonly IJsSandbox` | La instancia de `JsSandbox` que usa. |
| `activate` | `(container: HTMLElement) => ShadowRoot \| null` | `css.wrap(container)` cuando `css` está activado, y después `js.activate()` cuando `js` está activado. Devuelve el shadow root o `null`. |
| `deactivate` | `(container: HTMLElement) => void` | `js.deactivate()` y después `css.unwrap(container)`. |
| `destroy` | `(container: HTMLElement) => void` | `deactivate(container)` y después `js.reset()`, que borra todos los globals almacenados. |

### `CssSandbox`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const container = document.querySelector<HTMLElement>('#widget')!;

const shadowRoot = cssSandbox.wrap(container);
const style = cssSandbox.addStyle(shadowRoot, ':host { display: block; } p { color: teal; }');
cssSandbox.unwrap(container); // the <style> leaves the DOM and waits for the next wrap
cssSandbox.removeStyle(shadowRoot, style); // removed for good: the next wrap does not restore it
```

| Método | Firma | Comportamiento |
| --- | --- | --- |
| `wrap` | `(container: HTMLElement) => ShadowRoot` | Mueve los hijos del contenedor a un shadow root abierto y lo devuelve. |
| `unwrap` | `(container: HTMLElement) => void` | Devuelve los hijos al light DOM, aparta las hojas de estilos del shadow root y deja un `<slot>` en el shadow root. |
| `addStyle` | `(shadowRoot: ShadowRoot, css: string) => HTMLStyleElement` | Añade un `<style>` con `css` al final del shadow root. |
| `removeStyle` | `(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement) => void` | Elimina `styleEl`. Cuando el host está desenvuelto, también quita `styleEl` de la lista de apartados, así que el siguiente `wrap` no lo restaura. |
| `adoptStyles` | `(shadowRoot: ShadowRoot, styles: AdoptStylesOptions) => AdoptedStyles` | Inserta elementos `<link>` y `<style>` al principio del shadow root. |

#### `wrap` y los remontajes

Un elemento del DOM no puede perder su shadow root una vez adjuntado. `wrap` lo gestiona así:

1. Si esta instancia de `CssSandbox` ya envolvió el contenedor y no lo ha desenvuelto, `wrap` devuelve el mismo shadow root y no mueve nada.
2. Si el contenedor tiene un `shadowRoot` abierto (de un `wrap` anterior, de un `unwrap` o de otra instancia de `CssSandbox`), `wrap` elimina el `<slot>` que dejó `unwrap`, vuelve a poner las hojas de estilos que `unwrap` apartó (al principio, en su orden original) y reutiliza el root.
3. En otro caso, llama a `container.attachShadow({ mode: 'open' })`.

Después mueve cada hijo del light DOM al shadow root. `wrap` solo lanza un error cuando falla `attachShadow`, por ejemplo en un elemento que no puede alojar un shadow root (`<img>`, `<input>`) o en uno que ya tiene un root cerrado: `[Tuvix Sandbox] Cannot attach Shadow DOM to <img>: ...`.

#### `unwrap` y el slot

`unwrap` devuelve los hijos del shadow root al contenedor. Saca del DOM los nodos `<style>` y `<link rel="stylesheet">`, tanto si vienen de `addStyle` o `adoptStyles` como de la app, así que el CSS de la app deja de aplicarse y nunca llega a la página. Los guarda junto al shadow root. El shadow root se mantiene y contiene un `<slot data-tuvix-sandbox-slot>`, a través del cual el navegador renderiza los hijos restaurados. `unwrap` no hace nada con un contenedor que esta instancia no envolvió.

El siguiente `wrap` de ese host, por parte de esta o de cualquier otra instancia de `CssSandbox`, elimina el slot, vuelve a poner en orden las hojas de estilos apartadas y mueve los hijos de nuevo hacia dentro. No necesitas volver a adoptar estilos después de un remontaje. Llamar a `removeStyle(shadowRoot, el)` o a `adopted.remove()` mientras el host está desenvuelto elimina esas hojas definitivamente.

#### `adoptStyles`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const shadowRoot = cssSandbox.wrap(document.querySelector<HTMLElement>('#cart')!);

const adopted = cssSandbox.adoptStyles(shadowRoot, {
  urls: ['/apps/cart/style.css', '/shared/tokens.css'],
  cssText: ':host { display: block; }',
});

await adopted.ready; // every <link> fired load or error
console.log(adopted.elements.length); // 3

adopted.remove();
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `urls` | `readonly string[]` | `[]` | Cada URL se convierte en un `<link rel="stylesheet" data-tuvix-style>`, en orden. |
| `cssText` | `string \| readonly string[]` | ninguno | Cada cadena se convierte en un `<style data-tuvix-style>`, colocado después de los links. |

Comportamiento:

- Los elementos van al principio del shadow root, después de los estilos adoptados antes, así que el contenido de la app y los estilos de `addStyle` quedan más tarde en la cascada.
- Una URL ya adoptada en este shadow root se omite y no aparece en `elements`. Eso incluye los links que `unwrap` apartó. `ready` sigue esperando a ese link existente cuando lo creó una llamada anterior.
- `ready` resuelve cuando cada link dispara `load` o `error`. Nunca se rechaza, así que una hoja de estilos con 404 no te bloquea. jsdom no dispara ninguno de los dos eventos, así que no hagas await de `ready` en tests con jsdom.
- `remove()` elimina solo los elementos que insertó esta llamada, incluidos los apartados, así que el siguiente `wrap` no los restaura.

### `JsSandbox`

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const jsSandbox = new JsSandbox(['analyticsQueue'], true);
jsSandbox.activate();

jsSandbox.execScript('window.analyticsQueue = []'); // allowed, stored on the proxy
console.log('analyticsQueue' in window); // false
console.log(Reflect.get(jsSandbox.proxyWindow, 'analyticsQueue')); // []

try {
  jsSandbox.execScript('window.tracker = {}');
} catch (error) {
  console.log(error instanceof TypeError); // true
}

jsSandbox.reset();
```

Constructor: `new JsSandbox(allowedGlobals: string[] = [], strict = false)`.

| Miembro | Firma | Comportamiento |
| --- | --- | --- |
| `proxyWindow` | `readonly WindowProxy` | Proxy sobre el `window` real. |
| `active` | `readonly boolean` | Indicador que activa `activate` y desactivan `deactivate`/`reset`. |
| `activate` | `() => void` | Pone `active` en `true`. |
| `deactivate` | `() => void` | Pone `active` en `false`. Los globals almacenados se mantienen. |
| `execScript` | `(code: string) => unknown` | Ejecuta `code` como script en modo no estricto dentro de `with (scope)` mediante `new Function`. `window`, `self`, `globalThis` y el `this` de nivel superior son el proxy, y los identificadores libres se resuelven a través de él. `eval("...")` sigue siendo un eval directo dentro de ese ámbito. Devuelve lo que devuelva el código. |
| `reset` | `() => void` | Borra todos los globals almacenados y pone `active` en `false`. |

El proxy:

- Las lecturas consultan primero el almacén propio del sandbox y después pasan al `window` real. Las funciones del window real sin `prototype` (`fetch`, `setTimeout`) se devuelven ligadas al `window` real, una vez por función, así que `proxyWindow.fetch === proxyWindow.fetch`.
- `proxyWindow.window`, `.self`, `.globalThis`, y `.top`/`.parent`/`.frames` cuando la página no está en un iframe, devuelven el propio proxy. En un iframe, `top` y `parent` siguen siendo los reales.
- Las asignaciones y `Object.defineProperty` almacenan el valor en el proxy. El `window` real nunca cambia. Un descriptor sin `value` (`{ enumerable: false }`) conserva el valor almacenado. Los descriptores de accesor (`get`/`set`) y `configurable: false` hacen que `Object.defineProperty` lance un `TypeError`.
- `delete proxyWindow.x` elimina un valor almacenado. Para una propiedad del window real devuelve `false`, lo que lanza un `TypeError` en código en modo estricto.
- `in` comprueba el almacén y el `window` real.

Modo estricto (`strict: true`): una asignación (`window.x = 1` o un `x = 1` sin declarar), un `var x = 1` de nivel superior o una llamada a `Object.defineProperty` para un nombre fuera de la lista de permitidos integrada y de `allowedGlobals` lanza `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "tracker". Add it to allowedGlobals to permit it.` y no almacena nada. La comprobación se ejecuta tanto si el sandbox está activo como si no. Las claves de tipo Symbol siempre cuentan como bloqueadas. La lista de permitidos integrada cubre globals estándar como `console`, los timers, `Promise`, `Map`, `JSON`, `fetch`, `URL`, `navigator`, `document`, `location` e `history`. Las escrituras permitidas, incluidas las escrituras en esos nombres, se quedan en el proxy.

### Tipos

| Tipo | Significado |
| --- | --- |
| `SandboxOptions` | `{ css?, js?, allowedGlobals?, strict? }`, las opciones de `createSandbox`. |
| `ISandbox` | Interfaz que implementa `Sandbox`: `css`, `js`, `activate`, `deactivate`, `destroy`. |
| `ICssSandbox` | Interfaz que implementa `CssSandbox`. |
| `IJsSandbox` | Interfaz que implementa `JsSandbox`. |
| `AdoptStylesOptions` | `{ urls?, cssText? }` para `adoptStyles`. |
| `AdoptedStyles` | `{ elements, ready, remove }` que devuelve `adoptStyles`. |

## Casos límite

- Dentro de `execScript`, `x = 1`, un `var x = 1` de nivel superior, `window.x = 1`, `window.window.x = 1`, `top.x = 1` y las mismas sentencias dentro de `eval("...")` almacenan todas `x` en el proxy, nunca en el `window` real. `let` y `const` se quedan locales al script.
- Leer un identificador no declarado dentro de `execScript` devuelve `undefined` en lugar de lanzar un `ReferenceError`, y una directiva `"use strict"` en `code` no tiene efecto, ya que `with` necesita el modo no estricto.
- Dentro de una llamada a función simple como `f()`, `this` es el objeto global real, tal como lo define JavaScript en modo no estricto. `this.x = 1` en una función así escribe en el `window` real. Escribe `window.x = 1` en el código que ejecutes mediante `execScript`.
- `execScript` usa `new Function`, así que una Content Security Policy sin `'unsafe-eval'` lo bloquea.
- Construir `JsSandbox`, `Sandbox` o `createSandbox()` lee `window`, así que lanzan un `ReferenceError` en el servidor. `CssSandbox` necesita `document` solo cuando llamas a sus métodos.
- Dos instancias de `CssSandbox` pueden compartir un host. El segundo `wrap` reutiliza el shadow root de la primera instancia.
- Los hijos del light DOM que añadas mientras el contenedor está envuelto se quedan fuera del shadow root y no se renderizan a través de ningún slot, así que no se ven. Añádelos dentro del shadow root.
- `Sandbox({ css: false }).activate()` devuelve `null`. Renderiza en el contenedor.

## Lo que no hace

- No modifica timers, event listeners, `document` ni etiquetas `<script>`. El código que no pasa por `proxyWindow` afecta a la página real.
- No limpia los intervalos ni los listeners que deja una app. Elimínalos en el `unmount` de la app.
- No le da al código un origen ni un objeto global separados. Usa un `<iframe sandbox>` para código no confiable.
- No separa un shadow root. El DOM no tiene una API para eso; `unwrap` deja un slot en su lugar.
- No detiene la herencia. `color`, `font-family` y las propiedades personalizadas de CSS definidas en el host o en sus ancestros siguen llegando al shadow root.

## Migrar desde 0.4

- `Sandbox({ css: false }).activate(container)` devuelve `null` y no adjunta ningún shadow root. En 0.4 adjuntaba uno y ocultaba los hijos del contenedor. `ISandbox.activate` ahora devuelve `ShadowRoot | null`:

  ```ts
  import { createSandbox } from '@tuvix.js/sandbox';

  const container = document.querySelector<HTMLElement>('#app')!;
  const sandbox = createSandbox({ css: false });

  // 0.4: const root: ShadowRoot = sandbox.activate(container);
  const root = sandbox.activate(container) ?? container;
  ```

- `strict: true` lanza un `TypeError` ante una escritura bloqueada. En 0.4 registraba una advertencia y almacenaba el valor. Añade a `allowedGlobals` los nombres que definen tus scripts.
- `execScript` ejecuta el código dentro de un bloque `with`. El código no puede estar en modo estricto, leer un identificador no declarado devuelve `undefined` en lugar de lanzar un error, y un `x = 1` sin declarar ahora va al proxy en lugar de al `window` real.
- `unwrap` conserva las hojas de estilos del shadow root y el siguiente `wrap` las restaura. En 0.4 `unwrap` las borraba. Elimina el código que vuelve a añadir estilos con `cssText` o `addStyle` después de un remontaje, o tendrás duplicados.
- La documentación de 0.4 decía que `js: true` intercepta `addEventListener`, los timers y `document.createElement`. Nunca lo hizo, y 0.5 tampoco.
