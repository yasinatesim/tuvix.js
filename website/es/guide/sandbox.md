# Sandboxing

`@tuvix.js/sandbox` tiene dos herramientas. `CssSandbox` coloca una app dentro de un shadow root para que su CSS y el CSS de la página no se mezclen. `JsSandbox` ejecuta código contra un `window` proxy para que sus escrituras globales caigan en el proxy. El orquestador usa `CssSandbox` para las apps que registras con `sandbox: true`; nunca aplica `JsSandbox`.

## Aislamiento de CSS por app

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'widget',
  entry: {
    scripts: ['https://cdn.example.com/widget/main.js'],
    styles: ['https://cdn.example.com/widget/main.css'],
    type: 'module',
  },
  container: '#widget',
  activeWhen: '/',
  sandbox: true, // same as { css: true }
});
```

Para esta app, el orquestador:

1. adjunta un shadow root abierto a `#widget` (o reutiliza el de un montaje anterior);
2. crea un `<div data-tuvix-sandbox-root>` dentro y pasa ese elemento a `mount` como `container`;
3. añade los `styles` de la entry como etiquetas `<link>` dentro del shadow root, no en `document.head`, y espera hasta `loader.timeout` a que carguen antes de llamar a `mount`.

El CSS de la página ya no llega a la app, y el CSS de la app ya no llega a la página. Las propiedades heredadas como `color` y `font-family` siguen llegando desde el elemento host; defínelas en `:host` en el CSS de la app para evitarlo.

Úsalo cuando una app incluye selectores globales (`button { ... }`, un reset de CSS) o cuando el CSS de la página rompe la app.

### Casos límite

- Los estilos que un framework inyecta en runtime van a `document.head`, fuera del shadow root. La inyección de CSS de Vite, las librerías CSS-in-JS y los estilos de componentes de Angular lo hacen. Distribuye un archivo CSS y lístalo en `entry.styles`, o añade tú mismo el CSS al shadow root.
- Los portales, modales y toasts que se renderizan en `document.body` salen del shadow root y pierden los estilos de la app.
- `document.querySelector` desde dentro de la app no encuentra elementos en el shadow root. Consulta desde `container`.
- Las entries de tipo función loader no listan `styles`, así que tu bundler inyecta su CSS en `document.head`, donde el shadow root lo deja fuera. Registra las apps con sandbox con una entry `{ scripts, styles, type }`.

## CssSandbox a mano

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const css = new CssSandbox();
const shadow = css.wrap(container); // moves existing children into the shadow root

const adopted = css.adoptStyles(shadow, {
  urls: ['/widget/main.css'],
  cssText: ':host { display: block; font-family: system-ui; }',
});
await adopted.ready; // resolves once each <link> fired load or error

const button = document.createElement('button');
button.textContent = 'Buy';
shadow.append(button);

// Later
adopted.remove();
css.unwrap(container);
```

| Método | Efecto |
| --- | --- |
| `wrap(container)` | Adjunta un shadow root abierto, o reutiliza uno abierto existente, y mueve dentro los hijos del contenedor. |
| `adoptStyles(shadow, { urls, cssText })` | Inserta elementos `<link>` y `<style>` al principio del shadow root. Omite una URL ya adoptada allí. Devuelve `{ elements, ready, remove }`. |
| `addStyle(shadow, css)` / `removeStyle(shadow, el)` | Añade o elimina un `<style>`. |
| `unwrap(container)` | Devuelve los nodos que no son de estilo al light DOM y deja un `<slot>` para que se rendericen. Saca del DOM los nodos `<style>` y `<link>` de hojas de estilo (incluidos los de `addStyle` y `adoptStyles`); el siguiente `wrap` de ese contenedor los vuelve a colocar en orden. |

`wrap` lanza una excepción cuando el elemento no puede alojar un shadow root (por ejemplo `<input>`) o ya tiene uno cerrado. `ready` nunca se rechaza. jsdom nunca dispara `load` en los links, así que no esperes `ready` en tests con jsdom. Cuando llamas a `removeStyle` o a `adopted.remove()` mientras el contenedor no está envuelto, esa hoja de estilos no vuelve en el siguiente `wrap`.

## JsSandbox

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const js = new JsSandbox(['dataLayer'], /* strict */ true);

js.execScript('window.dataLayer = []'); // allowed, stored on the proxy
console.log('dataLayer' in window); // false, unless the page defined it

try {
  js.execScript('counter = 1'); // bare assignment to a global that is not allowed
} catch (error) {
  console.log(error instanceof TypeError); // true: strict mode blocked the write
}

const loose = new JsSandbox(); // not strict
loose.execScript('var version = 2; build = 7;');
console.log(Reflect.get(loose.proxyWindow, 'version'), 'version' in window); // 2 false

js.reset(); // forget every stored global
```

- Las escrituras y `Object.defineProperty` a través del proxy van a un almacén del sandbox. Las lecturas consultan ese almacén y después el `window` real.
- Con `strict: true`, asignar, declarar con `var` en el nivel superior o aplicar `Object.defineProperty` a un global fuera de la allowlist integrada y de `allowedGlobals` lanza un `TypeError` y no guarda nada.
- `execScript(code)` ejecuta `code` dentro de `with (scope)`, con `window`, `self`, `globalThis` y `this` enlazados al proxy. Las asignaciones directas (`x = 1`), `var x` en el nivel superior y `window.x = 1` caen en el proxy; `let` y `const` se quedan locales al script.
- Dentro de `execScript`, leer un identificador no declarado devuelve `undefined` en lugar de lanzar un `ReferenceError`, y una directiva `"use strict"` no tiene efecto, porque `with` necesita sloppy mode. Usa `new Function`, así que tu Content Security Policy necesita `unsafe-eval`.
- `activate()` y `deactivate()` establecen el flag `active`. El proxy guarda las escrituras en ambos estados.

`JsSandbox` solo cubre el código que llega a los globales a través de `proxyWindow`. Un script cargado con una etiqueta `<script>`, un módulo empaquetado, los timers y los event listeners usan el `window` real. Trátalo como una protección contra escrituras globales accidentales en los fragmentos que ejecutas, no como una frontera de seguridad.

## Sandbox combinado

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });

const shadow = sandbox.activate(container); // ShadowRoot | null
if (shadow) sandbox.css.addStyle(shadow, '.box { padding: 8px; }');

sandbox.deactivate(container); // unwrap
sandbox.destroy(container); // deactivate + reset the JS store
```

`activate` devuelve `null` cuando `css` es `false`; en ese caso no adjunta nada.

## Usarlo dentro de una micro app

```ts
import { defineMicroApp } from '@tuvix.js/core';
import { CssSandbox } from '@tuvix.js/sandbox';

const css = new CssSandbox();

export default defineMicroApp({
  name: 'widget',
  mount({ container }) {
    const shadow = css.wrap(container);
    css.addStyle(shadow, 'p { color: rebeccapurple; }');
    const text = document.createElement('p');
    text.textContent = 'Isolated';
    shadow.append(text);
  },
  unmount({ container }) {
    container.shadowRoot?.replaceChildren();
    css.unwrap(container);
  },
});
```

Prefiere `sandbox: true` en `register` cuando el orquestador monta la app; hace el mismo trabajo y reutiliza el shadow root entre montajes.

## Cuándo no usar sandbox

- La app usa portales hacia `document.body` y necesita sus estilos allí.
- El sistema de diseño de la página debe dar estilo a la app.
- Necesitas aislamiento real de JavaScript. Usa un `<iframe>`.
