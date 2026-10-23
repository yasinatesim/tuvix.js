# @tuvix.js/svelte

> Liaisons Svelte 3/4/5 pour le framework microfrontend Tuvix.js

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Installation

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

## Démarrage rapide

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App });
```

L'adaptateur enregistre le module avec `registerModule` de `@tuvix.js/loader`, donc l'orchestrateur le trouve par son nom. Au premier montage, il importe `svelte` et cherche un export `mount` :

- **Svelte 5** : `mount()` / `hydrate()` / `unmount()` de `svelte`.
- **Svelte 3/4** : `new App({ target, props })`, `$set()` et `$destroy()`.

Votre bundler doit résoudre `svelte` vers son build client (la condition d'export `browser` ; `@sveltejs/vite-plugin-svelte` la définit). S'il choisit le build serveur, `mount()` de Svelte 5 lève `lifecycle_function_unavailable`.

## API

### `createSvelteMicroApp(config)`

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Nom de l'app, enregistré avec `registerModule` |
| `App` | `unknown` | requis | Composant Svelte 5 ou classe de composant Svelte 3/4 |
| `bootstrap` | `() => void \| Promise<void>` | aucun | Initialisation unique |
| `ssr` | `boolean` | `false` | Hydrate le markup serveur quand le conteneur en contient |
| `SvelteMap` | classe `SvelteMap` | aucun | Svelte 5 uniquement : `SvelteMap` de `svelte/reactivity`, pour que `update()` refasse le rendu sur place au lieu de remonter |

- Chaque conteneur reçoit sa propre instance, donc un même module peut se monter dans plusieurs conteneurs.
- `mount` vide le conteneur (sauf s'il hydrate), fait le rendu, puis émet `tuvix:mounted` une fois les callbacks `onMount` et les effets exécutés. Un montage en échec émet `tuvix:error` et est rejeté.
- `unmount` détruit l'instance, vide le conteneur et émet `tuvix:unmounted`. S'il est appelé pendant que `mount` charge encore, il attend le montage puis le défait.
- `update({ props, container? })` met à jour un conteneur, ou toutes les instances sans `container`. Svelte 3/4 utilise `$set()`. Svelte 5 remonte par défaut : il démonte l'instance, en monte une nouvelle avec les nouvelles props et émet à nouveau `tuvix:mounted`, donc les nœuds DOM et l'état des composants sont perdus. Passez `SvelteMap` pour mettre à jour sur place à la place (fonctionne pour `$props()` et `export let`) :

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App, SvelteMap });
```

L'adaptateur n'importe pas lui-même `svelte/reactivity` : Svelte 3/4 n'a pas ce module, et cet import casserait le build des apps Svelte 3/4.

L'hôte envoie les nouvelles props via l'orchestrateur :

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
});
await orchestrator.start();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

### `createSsrSvelteMicroApp(config)`

Identique à `createSvelteMicroApp({ ...config, ssr: true })`. Il hydrate quand le conteneur contient des éléments ou du texte non blanc, et fait un rendu neuf sinon. L'hydratation Svelte 5 a besoin des marqueurs de commentaire qu'écrit `svelte/server`. Compilez les composants Svelte 3/4 avec `hydratable: true`.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString(App, props?, options?)` de `@tuvix.js/svelte/server`

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | aucun | `render` de `svelte/server` ; sans lui, l'adaptateur importe `svelte/server` à l'exécution |

Renvoie les balises `<style>` du composant suivies de son markup. Si `render` est passé, il utilise toujours le `render` de Svelte 5. Sinon, l'adaptateur importe `svelte` : si ce module exporte `mount`, il charge `svelte/server` (Svelte 5), sinon il appelle `App.render(props)` (Svelte 3/4) et enveloppe `css.code` dans `<style>`. Les composants Svelte 5 compilés avec `dev: true` (vite-plugin-svelte en mode serve) portent un `App.render` qui lève une erreur, donc l'adaptateur ne décide jamais en fonction de `App.render`. Appelez-le depuis une fonction serveur ; dans un navigateur, il renvoie `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const footerHtml = await renderSvelteToString(
  Footer,
  { year: 2026 },
  { render }
);
```

### `renderSvelte(App, props?, options?)` de `@tuvix.js/svelte/server`

Mêmes options. Renvoie `{ html, head, css }`, pour que vous puissiez placer le contenu de `<svelte:head>` dans le head du document.

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const { html, head, css } = await renderSvelte(
  Footer,
  { year: 2026 },
  { render }
);
```

### Types

`SvelteMicroAppConfig`, `SvelteProps` (de `@tuvix.js/svelte`) ; `RenderSvelteOptions`, `SvelteServerRender`, `SvelteRenderResult` (de `@tuvix.js/svelte/server`).

## Cas particuliers

- Svelte 5 n'émet le CSS dans la sortie serveur que si vous compilez avec `css: 'injected'` (Vite : `svelte({ compilerOptions: { css: 'injected' } })`). Avec la valeur par défaut `css: 'external'`, votre bundler écrit le CSS dans un fichier.
- Passez `render` de `svelte/server` quand votre bundle serveur inclut Svelte (Nitro, Vinxi, un build SSR Vite `noExternal`). Le renderer serveur de Svelte échoue quand le composant et le renderer proviennent de deux copies de Svelte.
- Chaque mise à jour remplace l'ensemble des props. Une clé absente des nouvelles props est supprimée sous Svelte 5 (la valeur par défaut s'applique) et mise à `undefined` sous Svelte 3/4.
- `mount` sur un conteneur monté démonte d'abord l'ancienne instance. `unmount` sur un conteneur que le module n'a jamais monté ne fait rien : il laisse les enfants du conteneur en place et n'émet aucun événement.
- Une erreur d'import ou de rendu Svelte 5 côté serveur est rejetée ; il n'y a pas de repli sur `App.render`.

## Ce qu'il ne fait pas

- Il ne compile pas les fichiers `.svelte` et ne vérifie pas quel build de Svelte votre bundler a choisi.
- Il ne passe que des props : pas de slots, de snippets ni d'événements de composant depuis l'hôte.
- Il n'écrit pas le contenu de `<svelte:head>` dans le document et ne lie pas les feuilles de style `css: 'external'`.

Documentation complète : [tuvix.js.org/packages/svelte](https://tuvix.js.org/packages/svelte)

## Licence

MIT
