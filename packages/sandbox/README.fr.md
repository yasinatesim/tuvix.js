# @tuvix.js/sandbox

> Isolation CSS par shadow DOM qui survit aux remontages, adoption de feuilles de style et window Proxy pour les globales des scripts

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentation complète : [tuvix.js.org/packages/sandbox](https://tuvix.js.org/packages/sandbox).

`CssSandbox` déplace le DOM d'une micro app dans un shadow root ouvert, pour que son CSS et celui de la page restent séparés. L'orchestrateur de `@tuvix.js/core` l'utilise quand vous enregistrez une app avec `sandbox: true`. `JsSandbox` garde hors du vrai `window` les écritures `window.x = ...` du code que vous exécutez à travers elle. C'est un Proxy, pas une frontière de sécurité ; utilisez un `<iframe sandbox>` pour du code non fiable.

## Installation

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Démarrage rapide

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

### `createSandbox(options?)` et `Sandbox`

`createSandbox(options)` renvoie `new Sandbox(options)` typé comme `ISandbox`.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` enveloppe le conteneur dans un shadow root. `false` : `activate` renvoie `null` et n'attache rien. |
| `js` | `boolean` | `true` | `activate`/`deactivate` basculent `js.active`. Le proxy garde les écritures hors de `window` dans les deux cas. |
| `allowedGlobals` | `string[]` | `[]` | Noms que le mode strict autorise le code isolé à affecter (toujours stockés sur le proxy). |
| `strict` | `boolean` | `false` | Lève une `TypeError` sur les écritures ou les `defineProperty` de globales hors de la liste autorisée et de `allowedGlobals`. |

Membres : `css` (`CssSandbox`), `js` (`JsSandbox`), `activate(container): ShadowRoot | null`, `deactivate(container)`, `destroy(container)` (désactive, puis efface les globales stockées).

### `CssSandbox`

| Méthode | Comportement |
| --- | --- |
| `wrap(container)` | Déplace les enfants dans un shadow root ouvert. Réutilise `container.shadowRoot` s'il existe (`wrap` précédent, `unwrap`, autre instance), retire le slot laissé par `unwrap` et remet dans l'ordre les feuilles de style mises de côté. Ne lève une erreur que si `attachShadow` échoue. |
| `unwrap(container)` | Remet les enfants dans le light DOM, sort du DOM les `<style>` et `<link rel="stylesheet">` (issus de `addStyle`, `adoptStyles` ou de l'app) et les conserve pour le prochain `wrap`, laisse un `<slot>` pour que les enfants s'affichent. Aucune action pour les conteneurs que cette instance n'a pas enveloppés. |
| `addStyle(shadowRoot, css)` | Ajoute un `<style>` à la fin, le renvoie. |
| `removeStyle(shadowRoot, styleEl)` | Retire `styleEl`. Si le conteneur est déballé, le prochain `wrap` ne le restaure pas. |
| `adoptStyles(shadowRoot, { urls?, cssText? })` | Insère des `<link>` puis des `<style>` au début du shadow root, après les styles adoptés précédemment. Ignore les URL déjà adoptées, y compris les liens mis de côté. Renvoie `{ elements, ready, remove }`. |

`ready` se résout dès que chaque lien déclenche `load` ou `error`, et n'est jamais rejeté. jsdom ne déclenche ni l'un ni l'autre, donc ne l'attendez pas dans les tests jsdom. `remove()` ne retire que les éléments de cet appel ; si le conteneur est déballé, ils ne reviennent pas au prochain `wrap`.

### `JsSandbox`

`new JsSandbox(allowedGlobals = [], strict = false)`.

| Membre | Comportement |
| --- | --- |
| `proxyWindow` | Proxy sur `window`. Les lectures consultent le stockage de la sandbox, puis le vrai `window` (fonctions liées une seule fois). `window`, `self`, `globalThis`, ainsi que `top`/`parent`/`frames` hors d'une iframe, renvoient le proxy. Les écritures et `Object.defineProperty` vont dans le stockage ; un descripteur sans `value` conserve la valeur stockée. Les descripteurs d'accesseur et les descripteurs non configurables lèvent une `TypeError`. |
| `execScript(code)` | Exécute `code` comme un script en mode non strict dans `with (scope)`. `window`, `self`, `globalThis` et le `this` de premier niveau sont le proxy, et les identifiants libres se résolvent à travers lui. `eval("...")` reste un eval direct à l'intérieur de cette portée. |
| `activate()`, `deactivate()`, `active` | Un indicateur. Il ne change pas le comportement du proxy. |
| `reset()` | Efface les globales stockées, met `active` à `false`. |

Le mode strict lève `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "x". Add it to allowedGlobals to permit it.` pour une affectation, un `var x = 1` de premier niveau ou un `defineProperty` d'un nom hors de la liste autorisée, et ne stocke rien, que la sandbox soit active ou non.

### Types

`SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles`.

## Cas particuliers

- Dans `execScript`, `x = 1`, `var x = 1`, `window.x = 1`, `window.window.x = 1`, `top.x = 1` et les mêmes instructions dans `eval("...")` stockent `x` sur le proxy, jamais sur le vrai `window`. `let`/`const` restent locaux.
- Lire un identifiant non déclaré dans `execScript` renvoie `undefined` au lieu de lever une erreur, et `"use strict"` dans `code` n'a aucun effet.
- Dans un simple appel de fonction comme `f()`, `this` est le vrai objet global, comme le définit JavaScript en mode non strict. Là, `this.x = 1` écrit sur le vrai `window` ; écrivez plutôt `window.x = 1`.
- `execScript` utilise `new Function` ; votre CSP doit autoriser `'unsafe-eval'`.
- `JsSandbox`, `Sandbox` et `createSandbox()` lisent `window` dans le constructeur et lèvent une erreur sur le serveur.
- Les enfants du light DOM ajoutés pendant que le conteneur est enveloppé ne s'affichent pas. Ajoutez-les dans le shadow root.

## Ce qu'il ne fait pas

- Il ne modifie pas les timers, les écouteurs d'événements, `document` ni les balises `<script>`, et il ne nettoie pas ce qu'une app laisse derrière elle.
- Il ne donne pas au code sa propre origine ni son propre objet global.
- Il n'empêche pas les styles hérités (`color`, polices, propriétés personnalisées) d'atteindre le shadow root.

## Migrer depuis la 0.4

- `Sandbox({ css: false }).activate()` renvoie `null` et n'attache aucun shadow root. `ISandbox.activate` renvoie `ShadowRoot | null`.
- `strict: true` lève une erreur sur les écritures bloquées au lieu d'afficher un avertissement.
- `execScript` exécute le code dans un bloc `with` : pas de code en mode strict, les lectures non déclarées renvoient `undefined`, un simple `x = 1` reste sur le proxy.
- `unwrap` conserve les feuilles de style pour le prochain `wrap` au lieu de les supprimer.

## Licence

MIT
