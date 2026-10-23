# Événements de cycle de vie

Les adaptateurs et `defineMicroApp` signalent à la page quand une micro app se monte, se démonte ou échoue. Vous pouvez écouter des événements DOM, attendre `whenMounted(name)` ou interroger `isMounted(name)`. Servez-vous-en pour lancer une animation dès qu'un îlot est interactif, pour masquer un squelette de chargement ou pour signaler des erreurs, au lieu d'interroger le DOM en boucle ou de lire des éléments internes du framework comme `__vue_app__`.

## Événements {#events}

| Événement DOM | Émis |
| --- | --- |
| `tuvix:mounted` | Après que l'app a été rendue ou hydratée, et que les callbacks de montage de son framework se sont exécutés. |
| `tuvix:unmounted` | Après que l'app a été détruite et son conteneur vidé. |
| `tuvix:error` | Quand `mount` ou `unmount` lève une erreur, ou quand une app React lève une erreur pendant le rendu après le montage. |

Chaque événement est un `CustomEvent<LifecycleDetail>` émis sur le conteneur de l'app. Il remonte (bubbles) et est `composed`, donc un listener sur `document` le reçoit, même depuis l'intérieur d'un shadow root. Quand le conteneur n'est plus dans le DOM (React a retiré un îlot avant que son module signale `unmounted`), l'événement est émis sur `document` à la place, et `detail.container` pointe toujours vers l'élément.

```ts
import type { LifecycleDetail } from '@tuvix.js/loader';

const detail: LifecycleDetail = {
  name: 'footer', // the app name
  container: document.body, // the element the app rendered into
  hydrated: true, // true when the adapter adopted server markup
  error: undefined, // the thrown value, on 'error' only
};
```

## Écouter avec onLifecycle {#listen-with-onlifecycle}

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

`onLifecycle(type, handler, target = document)` renvoie une fonction qui retire le listener. Passez un conteneur comme `target` pour n'écouter qu'une seule zone. Un simple `addEventListener('tuvix:mounted', ...)` fonctionne aussi.

## Attendre avec whenMounted {#wait-with-whenmounted}

```ts
import { whenMounted } from 'tuvix.js';

const controller = new AbortController();
setTimeout(() => controller.abort(new Error('footer did not mount in 5 s')), 5000);

const { container } = await whenMounted('footer', { signal: controller.signal });
container.classList.add('is-ready');
```

- Elle se résout immédiatement quand l'app est déjà montée, donc l'ordre entre votre code et le montage n'a pas d'importance.
- Elle ne se rejette pas quand le montage échoue. Passez un `signal` avec un délai, ou écoutez aussi `tuvix:error`.
- Quand le signal est annulé, la promesse se rejette avec la raison du signal.

## Vérifier avec isMounted {#check-with-ismounted}

```ts
import { isMounted } from 'tuvix.js';

if (isMounted('footer')) {
  console.log('footer is on the page');
}
```

## Remplacer la détection du framework {#replace-framework-sniffing}

Sans événements de cycle de vie, un hôte doit deviner quand un îlot est prêt, par exemple en interrogeant en boucle les propriétés privées d'un framework :

```ts no-check
// Breaks on Svelte, Angular and any Vue release that renames the property.
const timer = setInterval(() => {
  if ((container as any).__vue_app__) {
    clearInterval(timer);
    startReveal(container);
  }
}, 50);
```

Avec les événements de cycle de vie, un seul listener fonctionne pour tous les adaptateurs :

```ts
import { onLifecycle } from 'tuvix.js';

declare function startReveal(container: HTMLElement): void;

onLifecycle('mounted', ({ name, container }) => {
  if (name === 'footer') startReveal(container);
});
```

## Qui émet les événements {#who-dispatches-the-events}

| Source | Émet |
| --- | --- |
| `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp` (et les variantes `Ssr`) | les trois |
| `TuvixReactApp` | les trois |
| `TuvixIsland` | aucun lui-même ; le module qu'il héberge les émet |
| `defineMicroApp` | les trois ; avec `ssr: true`, `hydrated` vaut `true` quand le conteneur contenait du balisage avant `mount` |
| Objets `{ mount, unmount }` simples | aucun, sauf si vous appelez `emitLifecycle` |
| L'orchestrateur | aucun ; il émet à la place des événements `tuvix:app:*` sur l'event bus |

`defineMicroApp` émet `tuvix:mounted` après la résolution de votre `mount`, `tuvix:unmounted` après la résolution de votre `unmount`, et `tuvix:error` (puis relance l'erreur) quand l'un des deux lève une erreur. Un `unmount` pour un conteneur dont le `mount` s'exécute encore l'attend :

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

Un module écrit comme un objet simple peut émettre les événements lui-même :

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

## Cas limites {#edge-cases}

- Un module peut se monter dans plusieurs conteneurs. `isMounted(name)` reste `true` tant que l'un d'eux est monté, et `whenMounted(name)` se résout avec le plus ancien conteneur encore monté. Donnez un nom distinct à chaque emplacement quand vous devez les différencier.
- Un événement `tuvix:unmounted` pour un conteneur détaché atteint une seule fois les listeners de `document`. `onLifecycle` avec un conteneur comme `target` ne le voit pas, car l'événement ne passe plus par cet élément.
- L'état réside sur `window.__TUVIX_RUNTIME__`, donc des copies de `@tuvix.js/loader` construites séparément le partagent.
- Côté serveur, il n'y a ni DOM ni événement. N'y appelez pas `whenMounted` ; elle ne se résout jamais.

## Ce que cela ne fait pas {#what-it-does-not-do}

- Cela ne signale pas la progression du chargement. Le `onStatusChange` de l'orchestrateur couvre `bootstrapping`, `mounting` et les autres statuts.
- Cela ne relance pas et ne récupère pas. Utilisez le `fallback` de l'orchestrateur, ou `fallback` sur `TuvixIsland` et `TuvixReactApp`.
