# @tuvix.js/vue

> Transformez des composants Vue 3 en micro apps Tuvix.js avec des props réactives, une app Vue par conteneur et l'hydratation SSR.

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Installation

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

Pour le rendu côté serveur, installez aussi la dépendance peer optionnelle `@vue/server-renderer`.

## Démarrage rapide

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

Le module s'enregistre sous `'settings'` via `registerModule` de `@tuvix.js/loader`, donc l'orchestrateur le trouve une fois le script chargé. `App` reçoit les props de l'orchestrateur comme props de composant ; déclarez-les avec `defineProps`.

## API

### `createVueMicroApp(config)`

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Nom dans le registre ; les événements de cycle de vie le portent. |
| `App` | `Component` | requis | Composant Vue racine. |
| `plugins` | `VuePluginEntry[]` | aucun | Plugins, ou tuples `[plugin, ...options]` passés à `app.use(plugin, ...options)`. |
| `bootstrap` | `() => void \| Promise<void>` | aucun | Initialisation unique. |
| `ssr` | `boolean` | `false` | Hydrate le markup serveur avec `createSSRApp` quand le conteneur contient des éléments ou du texte non blanc. |

- Chaque conteneur reçoit sa propre app Vue et ses propres props, donc un même module peut se monter à plusieurs endroits. Chaque montage réinstalle les plugins.
- `mount({ container, props })` émet `tuvix:mounted` avec `hydrated`.
- `update({ props, container })` remplace les clés d'un objet de props `shallowReactive` (les clés absentes sont supprimées) et se résout après `nextTick`. Sans `container`, il met à jour chaque montage. L'état des composants est conservé.
- `unmount({ container })` démonte l'app, vide le conteneur et émet `tuvix:unmounted`.

### `createSsrVueMicroApp(config)`

`createVueMicroApp({ ...config, ssr: true })`. Options : `name`, `App`, `plugins`, `bootstrap`. Vue reprend le markup produit par `renderVueToString` ; un conteneur vide reçoit un rendu normal.

```ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString(App, props?, plugins?, ssrContext?)`

Depuis `@tuvix.js/vue/server`. Renvoie le HTML de `App` rendu avec le même wrapper racine que celui du client, donc l'hydratation correspond et `inject('tuvixProps')` fonctionne sur le serveur. Vue écrit `teleports` et `modules` dans `ssrContext`.

Serveur uniquement : appelez-le depuis une fonction serveur, pas depuis un loader de route isomorphe. Dans le navigateur, il renvoie `''`, et un loader qui l'importe envoie le renderer serveur de Vue au client.

```ts
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from './App.vue';

export async function renderContact(): Promise<string> {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return `<div id="contact">${html}</div>`;
}
```

### `TUVIX_PROPS_KEY`

`'tuvixProps'`. `inject(TUVIX_PROPS_KEY)` renvoie l'objet de props réactif dans lequel écrit `update`, dans n'importe quel composant de l'arbre.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus(bus, event, handler)`

S'abonne dans `onMounted`, se désabonne dans `onUnmounted`, et renvoie une fonction pour se désabonner plus tôt. Passez `getGlobalBus()` de `@tuvix.js/event-bus` ; l'adaptateur ne transmet pas le bus de l'orchestrateur à `App`.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Renvoie un `ShallowRef<T>` qui fusionne chaque payload de `updateEvent` (par défaut `'tuvix:props:update'`) sur `bus`. Rien dans Tuvix n'émet cet événement ; c'est vous qui l'émettez. Pour les props de l'orchestrateur, utilisez `defineProps` ou `inject(TUVIX_PROPS_KEY)`.

### Types

`VueMicroAppConfig`, `VueSsrMicroAppConfig`, `VuePluginEntry` de `@tuvix.js/vue` ; `VueSsrContext` de `@tuvix.js/vue/server`.

## Cas particuliers

- Les erreurs de setup, de rendu et de hooks pendant `mount` provoquent un rejet en développement comme en production ; l'adaptateur démonte l'app en échec et émet `tuvix:error`. Le `app.config.errorHandler` d'un plugin s'exécute quand même.
- `mount` sur un conteneur que le module occupe déjà démonte d'abord l'ancienne app.
- `unmount` sur un conteneur que le module n'a jamais monté ne fait rien.
- Les props que le composant racine ne déclare pas retombent comme attributs sur son élément racine.
- Avec `ssr: true`, un conteneur qui ne contient que des espaces ou des commentaires reçoit un rendu neuf.

## Ce qu'il ne fait pas

- Prendre en charge Vue 2.
- Charger des modules par URL. Utilisez `@tuvix.js/core` ou `@tuvix.js/loader`.
- Collecter le CSS ou diffuser le HTML en flux sur le serveur. Utilisez `@tuvix.js/vite` pour les liens de feuilles de style.

## Changements cassants en 0.5

- `update()` n'écrit plus `app.config.globalProperties.$tuvixProps`. Utilisez `defineProps` ou `inject('tuvixProps')`.
- `unmount()` sur un conteneur que le module n'a jamais monté ne fait rien ; avant, il vidait le conteneur.
- `VueSsrMicroAppConfig` n'accepte plus `ssr`.

Documentation complète : [tuvix.js.org/packages/vue](https://tuvix.js.org/packages/vue)

## Licence

MIT
