# Micro apps

Une micro app est un module doté des fonctions `mount` et `unmount`. Le shell appelle `mount` avec un élément conteneur et des props ; l'app se rend dans cet élément. Le shell appelle `unmount` quand l'app doit quitter la page ; l'app retire ce qu'elle a rendu.

## La forme du module {#the-module-shape}

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

| Hook | Obligatoire | Appelé |
| --- | --- | --- |
| `bootstrap()` | non | Une fois, après le premier chargement, avant le premier `mount`. |
| `mount({ container, props, name, bus })` | oui | Chaque fois que l'app devient active. |
| `update({ props, container })` | non | Quand le shell appelle `updateAppProps` pendant que l'app est montée. |
| `unmount({ container })` | oui | Chaque fois que l'app devient inactive. |

Chaque hook peut renvoyer une promesse. L'orchestrateur l'attend avant l'étape suivante.

## En écrire une à la main {#write-one-by-hand}

`defineMicroApp` valide les hooks, enregistre le module sous `name`, émet `tuvix:mounted`, `tuvix:unmounted` et `tuvix:error` sur le conteneur, et renvoie le module :

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

Utilisez le `bus` du contexte de montage. C'est le bus de l'orchestrateur, c'est-à-dire `getGlobalBus()` sauf si le shell a passé des options `eventBus`.

## Utiliser un adaptateur {#use-an-adapter}

Les adaptateurs construisent le module à partir d'un composant et gèrent des détails que vous devriez sinon écrire vous-même :

- une instance de framework par conteneur, pour qu'un module puisse se monter à plusieurs endroits ;
- `update` rend à nouveau avec les nouvelles props sans remontage ;
- un `unmount` qui arrive pendant que `mount` charge encore attend et laisse un conteneur vide ;
- les événements `tuvix:mounted`, `tuvix:unmounted` et `tuvix:error` sur le conteneur ;
- l'hydratation du balisage rendu côté serveur quand vous passez `ssr: true`.

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Cart({ items }: { items: number }) {
  return <p>{items} items</p>;
}

export default createReactMicroApp({ name: 'cart', App: Cart });
```

## Exposer le module au loader {#expose-the-module-to-the-loader}

L'orchestrateur obtient un module via l'`entry` de l'app :

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

Pour une entrée sous forme d'URL, le module doit appeler `registerModule(name, module)` (les adaptateurs et `defineMicroApp` le font) ou exposer une variable globale UMD avec une fonction `mount`. Une fonction de chargement doit seulement se résoudre vers le module ou vers `{ default: module }`.

## Passer des props {#pass-props}

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

- Les props fusionnent de façon superficielle. Pour retirer une clé, définissez-la à `undefined`.
- Quand l'app est montée et possède `update`, l'orchestrateur l'appelle et se résout une fois qu'elle a abouti. Un `update` rejeté place l'app en statut `error` et appelle `onError`.
- Quand l'app n'est pas montée, ou n'a pas de `update`, l'orchestrateur conserve les props fusionnées pour le prochain montage. Il ne remonte pas l'app.

## Monter un module à plusieurs endroits {#mount-one-module-in-several-places}

Les adaptateurs gardent une instance distincte par conteneur. `TuvixIsland` et votre propre code peuvent appeler `mount` sur deux conteneurs avec le même module :

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

Sans `container`, `update` met à jour chaque montage de ce module. L'orchestrateur passe toujours `container`.

## Construire et déployer {#build-and-deploy}

Construisez chaque app sous forme de bundle de module ES et enregistrez-la avec `type: 'module'`, ou sous forme de bundle IIFE/UMD et enregistrez son URL comme script classique. Avec Vite :

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', formats: ['es'], fileName: 'main' },
    // Leave dependencies bundled unless the shell provides them.
  },
});
```

Pensez aux copies de framework : deux micro apps qui embarquent chacune React livrent React deux fois. La page fonctionne quand même, car chaque app rend sa propre racine. Pour partager une seule copie, utilisez des import maps, Module Federation (`@tuvix.js/module-federation`), ou laissez le shell embarquer les apps via des entrées sous forme de fonction de chargement.

## Ce qu'une micro app ne doit pas faire {#what-a-micro-app-must-not-do}

- Écrire en dehors de son conteneur. Tuvix.js ne l'en empêche pas, et la prochaine app dans ce conteneur ne s'y attendra pas.
- Laisser des listeners, des timers ou des abonnements après `unmount`.
- Compter sur une exécution répétée de `bootstrap`. Il s'exécute une fois par module chargé.
