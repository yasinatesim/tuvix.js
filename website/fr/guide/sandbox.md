# Isolation

`@tuvix.js/sandbox` propose deux outils. `CssSandbox` place une app dans un shadow root pour séparer son CSS de celui de la page. `JsSandbox` exécute du code avec un proxy de `window`, pour que ses écritures globales arrivent sur le proxy. L'orchestrateur utilise `CssSandbox` pour les apps que vous enregistrez avec `sandbox: true` ; il n'applique jamais `JsSandbox`.

## Isolation CSS par app {#css-isolation-per-app}

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

Pour cette app, l'orchestrateur :

1. attache un shadow root ouvert à `#widget` (ou réutilise celui d'un montage précédent) ;
2. crée un `<div data-tuvix-sandbox-root>` à l'intérieur et passe cet élément à `mount` comme `container` ;
3. ajoute les `styles` de l'entrée sous forme de balises `<link>` dans le shadow root, pas dans `document.head`, et attend leur chargement pendant au plus `loader.timeout` avant d'appeler `mount`.

Le CSS de la page n'atteint plus l'app, et le CSS de l'app n'atteint plus la page. Les propriétés héritées comme `color` et `font-family` arrivent toujours depuis l'élément hôte ; définissez-les sur `:host` dans le CSS de l'app pour l'empêcher.

Utilisez-la quand une app livre des sélecteurs globaux (`button { ... }`, un reset CSS) ou quand le CSS de la page casse l'app.

### Cas limites {#edge-cases}

- Les styles qu'un framework injecte à l'exécution vont dans `document.head`, hors du shadow root. L'injection CSS de Vite, les bibliothèques CSS-in-JS et les styles de composants d'Angular font tous cela. Livrez un fichier CSS et listez-le dans `entry.styles`, ou ajoutez vous-même le CSS au shadow root.
- Les portals, modales et toasts rendus dans `document.body` sortent du shadow root et perdent les styles de l'app.
- `document.querySelector` depuis l'app ne trouve pas les éléments du shadow root. Faites vos requêtes depuis `container`.
- Les entrées de type fonction de chargement ne listent aucun `styles` : votre bundler injecte donc leur CSS dans `document.head`, où le shadow root le tient à l'écart. Enregistrez les apps isolées avec une entrée `{ scripts, styles, type }`.

## CssSandbox à la main {#csssandbox-by-hand}

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

| Méthode | Effet |
| --- | --- |
| `wrap(container)` | Attache un shadow root ouvert, ou réutilise un shadow root ouvert existant, et y déplace les enfants du conteneur. |
| `adoptStyles(shadow, { urls, cssText })` | Insère des éléments `<link>` et `<style>` au début du shadow root. Ignore une URL déjà adoptée à cet endroit. Renvoie `{ elements, ready, remove }`. |
| `addStyle(shadow, css)` / `removeStyle(shadow, el)` | Ajoute ou retire un `<style>`. |
| `unwrap(container)` | Replace les nœuds autres que les styles dans le light DOM et laisse un `<slot>` pour qu'ils s'affichent. Retire du DOM les nœuds `<style>` et les `<link>` de feuille de style (y compris ceux de `addStyle` et `adoptStyles`) ; le `wrap` suivant de ce conteneur les remet dans l'ordre. |

`wrap` lève une exception quand l'élément ne peut pas héberger de shadow root (par exemple `<input>`) ou en a déjà un fermé. `ready` ne rejette jamais. jsdom ne déclenche jamais `load` sur les liens : n'attendez donc pas `ready` dans les tests jsdom. Quand vous appelez `removeStyle` ou `adopted.remove()` pendant que le conteneur est désenveloppé, cette feuille de style ne revient pas au `wrap` suivant.

## JsSandbox {#jssandbox}

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

- Les écritures et les `Object.defineProperty` faits via le proxy vont dans un stockage propre à la sandbox. Les lectures consultent ce stockage, puis le vrai `window`.
- Avec `strict: true`, affecter, déclarer avec un `var` de premier niveau ou définir avec `Object.defineProperty` un global absent de la liste autorisée intégrée et de `allowedGlobals` lève une `TypeError` et ne stocke rien.
- `execScript(code)` exécute `code` dans `with (scope)`, avec `window`, `self`, `globalThis` et `this` liés au proxy. Les affectations nues (`x = 1`), les `var x` de premier niveau et `window.x = 1` arrivent tous sur le proxy ; `let` et `const` restent locaux au script.
- Dans `execScript`, lire un identifiant non déclaré renvoie `undefined` au lieu de lever une `ReferenceError`, et une directive `"use strict"` n'a aucun effet, car `with` exige le mode non strict. `execScript` utilise `new Function` : votre Content Security Policy doit donc autoriser `unsafe-eval`.
- `activate()` et `deactivate()` positionnent l'indicateur `active`. Le proxy stocke les écritures dans les deux états.

`JsSandbox` ne couvre que le code qui accède aux globaux via `proxyWindow`. Un script chargé par une balise `<script>`, un module bundlé, les timers et les event listeners utilisent tous le vrai `window`. Considérez-la comme une protection contre les écritures globales accidentelles dans les extraits que vous exécutez, pas comme une frontière de sécurité.

## Sandbox combinée {#combined-sandbox}

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });

const shadow = sandbox.activate(container); // ShadowRoot | null
if (shadow) sandbox.css.addStyle(shadow, '.box { padding: 8px; }');

sandbox.deactivate(container); // unwrap
sandbox.destroy(container); // deactivate + reset the JS store
```

`activate` renvoie `null` quand `css` vaut `false` ; dans ce cas, il n'attache rien.

## L'utiliser dans une micro app {#use-it-inside-a-micro-app}

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

Préférez `sandbox: true` sur `register` quand l'orchestrateur monte l'app : il fait le même travail et réutilise le shadow root d'un montage à l'autre.

## Quand ne pas isoler {#when-not-to-sandbox}

- L'app utilise des portals vers `document.body` et a besoin de ses styles à cet endroit.
- Le design system de la page doit styliser l'app.
- Vous avez besoin d'une vraie isolation JavaScript. Utilisez une `<iframe>`.
