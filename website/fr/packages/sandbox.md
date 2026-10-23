---
title: '@tuvix.js/sandbox'
---

<PackageHeader
  name="@tuvix.js/sandbox"
  title="Sandbox"
  description="Isolation CSS dans un shadow root Shadow DOM réutilisable, adoption de feuilles de style dans ce root, et un window Proxy qui tient les globales des scripts à l'écart du vrai window."
  icon="🔒"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Quand l'utiliser {#when-to-use-it}

Utilisez `CssSandbox` quand le CSS d'une micro app et celui de la page ne doivent pas s'influencer. Il déplace le DOM de l'app dans un shadow root ouvert sur le conteneur, pour que les sélecteurs de l'app restent à l'intérieur et que ceux de la page restent à l'extérieur. L'orchestrateur de `@tuvix.js/core` le fait pour vous quand vous enregistrez une app avec `sandbox: true`. Appelez ce paquet vous-même quand vous montez des apps sans l'orchestrateur.

Utilisez `JsSandbox` quand vous exécutez le texte d'un script tiers et voulez tenir ses écritures globales à l'écart du vrai `window`. Vous exécutez le code via `execScript`, qui résout `window`, `this` et les identifiants libres à travers un Proxy. L'orchestrateur ne l'applique pas.

Choisissez autre chose quand vous avez besoin d'une isolation forte pour du code non fiable. Une `<iframe>` avec l'attribut `sandbox` donne au code son propre objet global et sa propre origine ; ce paquet ne le fait pas.

## Démarrage rapide {#quick-start}

Via l'orchestrateur (CSS uniquement) :

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

L'orchestrateur enveloppe `#cart` dans un shadow root, rend l'app dans un `<div data-tuvix-sandbox-root="cart">` à l'intérieur, et charge `style.css` dans le shadow root au lieu du `<head>`. Le montage attend ces feuilles de style, dans la limite du `timeout` du loader (10000 ms par défaut). L'orchestrateur réutilise le shadow root quand l'app est montée à nouveau.

À la main :

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

Renvoie `new Sandbox(options)`.

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` enveloppe le conteneur dans un shadow root. Avec `false`, `activate` renvoie `null` et n'attache rien. |
| `js` | `boolean` | `true` | `activate`/`deactivate` basculent `sandbox.js.active`. Le proxy de `sandbox.js.proxyWindow` tient les écritures à l'écart du vrai `window` dans tous les cas. |
| `allowedGlobals` | `string[]` | `[]` | Noms globaux supplémentaires que le mode strict autorise le code isolé à assigner. Les écritures sur ces noms atterrissent quand même sur le proxy. |
| `strict` | `boolean` | `false` | Lève une `TypeError` quand le code isolé assigne ou définit une globale hors de la liste d'autorisation intégrée et de `allowedGlobals`. |

### `Sandbox`

```ts
import { Sandbox } from '@tuvix.js/sandbox';

const sandbox = new Sandbox({ css: false, js: true });
console.log(sandbox.activate(document.body)); // null
```

La classe derrière `createSandbox`. Elle implémente `ISandbox` :

| Membre | Signature | Comportement |
| --- | --- | --- |
| `css` | `readonly ICssSandbox` | L'instance `CssSandbox` qu'elle utilise. |
| `js` | `readonly IJsSandbox` | L'instance `JsSandbox` qu'elle utilise. |
| `activate` | `(container: HTMLElement) => ShadowRoot \| null` | `css.wrap(container)` quand `css` est activé, puis `js.activate()` quand `js` est activé. Renvoie le shadow root ou `null`. |
| `deactivate` | `(container: HTMLElement) => void` | `js.deactivate()`, puis `css.unwrap(container)`. |
| `destroy` | `(container: HTMLElement) => void` | `deactivate(container)`, puis `js.reset()`, qui efface toutes les globales stockées. |

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

| Méthode | Signature | Comportement |
| --- | --- | --- |
| `wrap` | `(container: HTMLElement) => ShadowRoot` | Déplace les enfants du conteneur dans un shadow root ouvert et le renvoie. |
| `unwrap` | `(container: HTMLElement) => void` | Ramène les enfants dans le light DOM, met de côté les feuilles de style du shadow root et laisse un `<slot>` dans le shadow root. |
| `addStyle` | `(shadowRoot: ShadowRoot, css: string) => HTMLStyleElement` | Ajoute un `<style>` contenant `css` à la fin du shadow root. |
| `removeStyle` | `(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement) => void` | Supprime `styleEl`. Quand l'hôte n'est plus enveloppé, retire aussi `styleEl` de la liste mise de côté, pour que le prochain `wrap` ne le restaure pas. |
| `adoptStyles` | `(shadowRoot: ShadowRoot, styles: AdoptStylesOptions) => AdoptedStyles` | Insère des éléments `<link>` et `<style>` au début du shadow root. |

#### `wrap` et les remontages {#wrap-and-remounts}

Un élément DOM ne peut pas perdre son shadow root une fois qu'il est attaché. `wrap` gère ce cas :

1. Si cette instance de `CssSandbox` a déjà enveloppé le conteneur sans l'avoir désenveloppé, `wrap` renvoie le même shadow root et ne déplace rien.
2. Si le conteneur possède un `shadowRoot` ouvert (issu d'un `wrap` précédent, d'un `unwrap` ou d'une autre instance de `CssSandbox`), `wrap` supprime le `<slot>` laissé par `unwrap`, remet les feuilles de style que `unwrap` a mises de côté (au début, dans leur ordre d'origine) et réutilise le root.
3. Sinon, il appelle `container.attachShadow({ mode: 'open' })`.

Il déplace ensuite chaque enfant du light DOM dans le shadow root. `wrap` ne lève une exception que si `attachShadow` échoue, par exemple sur un élément qui ne peut pas héberger de shadow root (`<img>`, `<input>`) ou qui possède déjà un root fermé : `[Tuvix Sandbox] Cannot attach Shadow DOM to <img>: ...`.

#### `unwrap` et le slot {#unwrap-and-the-slot}

`unwrap` ramène les enfants du shadow root dans le conteneur. Il retire du DOM les nœuds `<style>` et `<link rel="stylesheet">`, qu'ils viennent de `addStyle`, de `adoptStyles` ou de l'app, pour que le CSS de l'app cesse de s'appliquer et n'atteigne jamais la page. Il les conserve avec le shadow root. Le shadow root reste et contient un seul `<slot data-tuvix-sandbox-slot>`, pour que le navigateur affiche les enfants restaurés à travers lui. `unwrap` ne fait rien pour un conteneur que cette instance n'a pas enveloppé.

Le prochain `wrap` de cet hôte, par cette instance de `CssSandbox` ou par une autre, supprime le slot, remet en ordre les feuilles de style mises de côté et ramène les enfants à l'intérieur. Vous n'avez pas besoin d'adopter à nouveau les styles après un remontage. Appeler `removeStyle(shadowRoot, el)` ou `adopted.remove()` pendant que l'hôte n'est pas enveloppé supprime définitivement ces feuilles.

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

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `urls` | `readonly string[]` | `[]` | Chaque URL devient un `<link rel="stylesheet" data-tuvix-style>`, dans l'ordre. |
| `cssText` | `string \| readonly string[]` | aucun | Chaque chaîne devient un `<style data-tuvix-style>`, placé après les liens. |

Comportement :

- Les éléments sont placés au début du shadow root, après les styles adoptés précédemment, pour que le contenu de l'app et les styles de `addStyle` viennent plus tard dans la cascade.
- Une URL déjà adoptée dans ce shadow root est ignorée et n'apparaît pas dans `elements`. Cela inclut les liens que `unwrap` a mis de côté. `ready` attend quand même ce lien existant quand un appel précédent l'a créé.
- `ready` se résout dès que chaque lien déclenche `load` ou `error`. Il ne rejette jamais, donc une feuille de style en 404 ne vous bloque pas. jsdom ne déclenche aucun de ces événements, donc n'attendez pas `ready` dans les tests jsdom.
- `remove()` supprime uniquement les éléments insérés par cet appel, y compris ceux mis de côté, pour que le prochain `wrap` ne les restaure pas.

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

Constructeur : `new JsSandbox(allowedGlobals: string[] = [], strict = false)`.

| Membre | Signature | Comportement |
| --- | --- | --- |
| `proxyWindow` | `readonly WindowProxy` | Proxy sur le vrai `window`. |
| `active` | `readonly boolean` | Indicateur défini par `activate` et effacé par `deactivate`/`reset`. |
| `activate` | `() => void` | Passe `active` à `true`. |
| `deactivate` | `() => void` | Passe `active` à `false`. Les globales stockées restent. |
| `execScript` | `(code: string) => unknown` | Exécute `code` comme un script en mode non strict (sloppy mode) dans `with (scope)` via `new Function`. `window`, `self`, `globalThis` et le `this` de premier niveau sont le proxy, et les identifiants libres sont résolus à travers lui. `eval("...")` reste un eval direct dans cette portée. Renvoie ce que le code renvoie. |
| `reset` | `() => void` | Efface toutes les globales stockées et passe `active` à `false`. |

Le proxy :

- Les lectures consultent d'abord le stockage propre de la sandbox, puis se rabattent sur le vrai `window`. Les fonctions du vrai window sans `prototype` (`fetch`, `setTimeout`) sont renvoyées liées au vrai `window`, une fois par fonction, donc `proxyWindow.fetch === proxyWindow.fetch`.
- `proxyWindow.window`, `.self`, `.globalThis`, ainsi que `.top`/`.parent`/`.frames` quand la page n'est pas dans une iframe, renvoient le proxy lui-même. Dans une iframe, `top` et `parent` restent les vrais.
- Les assignations et `Object.defineProperty` stockent la valeur sur le proxy. Le vrai `window` ne change jamais. Un descripteur sans `value` (`{ enumerable: false }`) conserve la valeur stockée. Les descripteurs d'accesseurs (`get`/`set`) et `configurable: false` font lever une `TypeError` à `Object.defineProperty`.
- `delete proxyWindow.x` supprime une valeur stockée. Pour une propriété du vrai window, il renvoie `false`, ce qui lève une `TypeError` dans du code en mode strict.
- `in` consulte le stockage et le vrai `window`.

Mode strict (`strict: true`) : une assignation (`window.x = 1` ou un simple `x = 1`), un `var x = 1` de premier niveau ou un appel à `Object.defineProperty` pour un nom hors de la liste d'autorisation intégrée et de `allowedGlobals` lève `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "tracker". Add it to allowedGlobals to permit it.` et ne stocke rien. La vérification s'exécute que la sandbox soit active ou non. Les clés symboles sont toujours considérées comme bloquées. La liste d'autorisation intégrée couvre des globales standard comme `console`, les timers, `Promise`, `Map`, `JSON`, `fetch`, `URL`, `navigator`, `document`, `location` et `history`. Les écritures autorisées, y compris sur ces noms, restent sur le proxy.

### Types {#types}

| Type | Signification |
| --- | --- |
| `SandboxOptions` | `{ css?, js?, allowedGlobals?, strict? }`, les options de `createSandbox`. |
| `ISandbox` | Interface implémentée par `Sandbox` : `css`, `js`, `activate`, `deactivate`, `destroy`. |
| `ICssSandbox` | Interface implémentée par `CssSandbox`. |
| `IJsSandbox` | Interface implémentée par `JsSandbox`. |
| `AdoptStylesOptions` | `{ urls?, cssText? }` pour `adoptStyles`. |
| `AdoptedStyles` | `{ elements, ready, remove }` renvoyé par `adoptStyles`. |

## Cas limites {#edge-cases}

- Dans `execScript`, `x = 1`, un `var x = 1` de premier niveau, `window.x = 1`, `window.window.x = 1`, `top.x = 1` et les mêmes instructions dans `eval("...")` stockent tous `x` sur le proxy, jamais sur le vrai `window`. `let` et `const` restent locaux au script.
- Lire un identifiant non déclaré dans `execScript` renvoie `undefined` au lieu de lever une `ReferenceError`, et une directive `"use strict"` dans `code` n'a aucun effet, car `with` exige le mode non strict.
- Dans un simple appel de fonction comme `f()`, `this` est le vrai objet global, comme le définit JavaScript en mode non strict. `this.x = 1` dans une telle fonction écrit sur le vrai `window`. Écrivez `window.x = 1` dans le code que vous exécutez via `execScript`.
- `execScript` utilise `new Function`, donc une Content Security Policy sans `'unsafe-eval'` le bloque.
- Construire `JsSandbox`, `Sandbox` ou `createSandbox()` lit `window`, donc ils lèvent une `ReferenceError` sur le serveur. `CssSandbox` n'a besoin de `document` que lorsque vous appelez ses méthodes.
- Deux instances de `CssSandbox` peuvent partager un hôte. Le second `wrap` réutilise le shadow root de la première instance.
- Les enfants du light DOM ajoutés pendant que le conteneur est enveloppé restent hors du shadow root et ne passent par aucun slot, donc ils ne s'affichent pas. Ajoutez-les plutôt dans le shadow root.
- `Sandbox({ css: false }).activate()` renvoie `null`. Rendez dans le conteneur.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il ne patche ni les timers, ni les écouteurs d'événements, ni `document`, ni les balises `<script>`. Le code qui ne passe pas par `proxyWindow` affecte la vraie page.
- Il ne nettoie pas les intervalles ni les écouteurs qu'une app laisse derrière elle. Supprimez-les dans le `unmount` de l'app.
- Il ne donne pas au code une origine ou un objet global séparés. Utilisez une `<iframe sandbox>` pour du code non fiable.
- Il ne détache pas un shadow root. Le DOM n'a pas d'API pour cela ; `unwrap` laisse un slot à la place.
- Il n'empêche pas l'héritage. `color`, `font-family` et les propriétés personnalisées CSS définies sur l'hôte ou ses ancêtres se propagent toujours dans le shadow root.

## Migrer depuis la 0.4 {#migrating-from-0-4}

- `Sandbox({ css: false }).activate(container)` renvoie `null` et n'attache aucun shadow root. En 0.4, il en attachait un et masquait les enfants du conteneur. `ISandbox.activate` renvoie désormais `ShadowRoot | null` :

  ```ts
  import { createSandbox } from '@tuvix.js/sandbox';

  const container = document.querySelector<HTMLElement>('#app')!;
  const sandbox = createSandbox({ css: false });

  // 0.4: const root: ShadowRoot = sandbox.activate(container);
  const root = sandbox.activate(container) ?? container;
  ```

- `strict: true` lève une `TypeError` sur une écriture bloquée. En 0.4, il journalisait un avertissement et stockait la valeur. Ajoutez à `allowedGlobals` les noms que vos scripts définissent.
- `execScript` exécute le code dans un bloc `with`. Le code ne peut pas être en mode strict, lire un identifiant non déclaré renvoie `undefined` au lieu de lever une exception, et un simple `x = 1` atterrit désormais sur le proxy au lieu du vrai `window`.
- `unwrap` conserve les feuilles de style du shadow root et le prochain `wrap` les restaure. En 0.4, `unwrap` les supprimait. Retirez le code qui ajoute à nouveau des styles `cssText` ou `addStyle` après un remontage, sinon vous obtenez des doublons.
- La documentation de la 0.4 indiquait que `js: true` interceptait `addEventListener`, les timers et `document.createElement`. Ce n'a jamais été le cas, et la 0.5 ne le fait pas non plus.
