---
title: '@tuvix.js/svelte'
---

<PackageHeader
  name="@tuvix.js/svelte"
  title="Liaisons Svelte"
  description="Transforme un composant Svelte 3, 4 ou 5 en micro app Tuvix.js : une instance par conteneur, mise à jour des props sur place, hydratation du balisage serveur, et rendu côté serveur avec le CSS."
  icon="🔥"
  npm="true"
/>

## Installation {#installation}

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

La plage de peer dependencies couvre Svelte 3, 4 et 5. Le paquet a deux points d'entrée : `@tuvix.js/svelte` pour le navigateur et `@tuvix.js/svelte/server` pour le rendu côté serveur.

## Quand l'utiliser {#when-to-use-it}

Utilisez ce paquet lorsqu'un composant Svelte doit fonctionner comme une micro app Tuvix.js : l'orchestrateur le monte dans un conteneur sur une route, lui passe des props, les met à jour et le démonte lorsque la route change. Il couvre aussi les îlots : vous rendez le composant côté serveur, placez le HTML dans la page, et le client l'hydrate.

Vous n'en avez pas besoin pour une page que Svelte possède de haut en bas (SvelteKit). Dans ce cas, Svelte se monte lui-même et il n'y a pas d'orchestrateur avec qui communiquer.

## Démarrage rapide {#quick-start}

Un composant Svelte 5 avec des props :

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { name, theme = 'light' }: { name: string; theme?: string } = $props();
</script>

<p class={theme}>Hello {name}</p>
```

L'entrée de la micro app l'enveloppe. Passer `SvelteMap` permet aux mises à jour des props de relancer le rendu du composant sur place :

```ts
// profile-app.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

Le shell enregistre l'app et démarre l'orchestrateur :

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Later: the component re-renders in place, no remount.
await orchestrator.updateAppProps('profile', { name: 'Grace', theme: 'dark' });
```

Le bundle client doit résoudre `svelte` vers son build navigateur. `@sveltejs/vite-plugin-svelte` s'en charge pour vous. Si votre configuration abandonne la condition d'export `browser`, `mount()` de Svelte 5 lève `lifecycle_function_unavailable` et `onMount` ne s'exécute jamais.

## API {#api}

### `createSvelteMicroApp`

```ts no-check
function createSvelteMicroApp(config: SvelteMicroAppConfig): MicroAppModule;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Nom de l'app. L'adaptateur enregistre le module sous ce nom avec `registerModule` de `@tuvix.js/loader`. |
| `App` | `unknown` | requis | Composant racine : un composant Svelte 5 compilé (une fonction) ou une classe de composant Svelte 3/4. |
| `bootstrap` | `() => void \| Promise<void>` | aucun | Initialisation unique. Le `bootstrap()` du module l'attend. |
| `ssr` | `boolean` | `false` | Hydrate le balisage serveur lorsque le conteneur contient des éléments ou du texte autre que des espaces. Sinon, effectue un nouveau rendu. |
| `SvelteMap` | classe `SvelteMap` de `svelte/reactivity` | aucun | Svelte 5 uniquement. Avec elle, `update()` relance le rendu sur place ; sans elle, un `update()` Svelte 5 remonte le composant. Svelte 3/4 l'ignorent. |

Au premier montage, l'adaptateur importe `svelte` et vérifie la présence d'un export `mount`. Il met le résultat en cache pour la page.

- **Svelte 5** (`mount` existe) : rend avec `mount()`, hydrate avec `hydrate()`, détruit avec `unmount()`. Le fonctionnement de `update()` dépend de `SvelteMap` :
  - Avec `SvelteMap`, le composant reçoit un objet de props adossé à une `SvelteMap`. `update()` écrit les nouvelles valeurs dans cette map, donc les parties du template qui lisent une prop modifiée refont leur rendu et le composant conserve ses nœuds DOM et son état. Cela fonctionne pour les composants `$props()` et pour les composants hérités `export let` compilés par Svelte 5.
  - Sans elle, `update()` démonte l'instance, vide le conteneur, monte une nouvelle instance avec les nouvelles props et émet de nouveau `tuvix:mounted` avec `hydrated: false`. Les nœuds DOM, le focus et l'état du composant sont perdus.
- **Svelte 3/4** (pas de `mount`) : `new App({ target, props, hydrate })`, `$set()` et `$destroy()`.

Le module renvoyé fonctionne par conteneur. Chaque conteneur obtient sa propre instance, donc un même module peut effectuer son rendu dans trois conteneurs à la fois.

- `mount({ container, props })` vide le conteneur (sauf s'il hydrate), effectue le rendu, exécute les callbacks `onMount` et les effets, puis émet `tuvix:mounted` sur le conteneur avec `hydrated: true | false`. Un échec émet `tuvix:error` et rejette avec l'erreur d'origine.
- `update({ props, container? })` met à jour l'instance dans `container`, ou chaque instance si vous omettez `container`. Chaque mise à jour remplace l'ensemble des props : une clé absente des nouvelles props revient à la valeur par défaut du composant sur Svelte 5 et devient `undefined` sur Svelte 3/4.
- `unmount({ container })` détruit l'instance, vide le conteneur et émet `tuvix:unmounted`.

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import { onLifecycle } from '@tuvix.js/loader';
import Cart from './Cart.svelte';

const cart = createSvelteMicroApp({ name: 'cart', App: Cart, SvelteMap });

onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} mounted`, { hydrated });
});

const header = document.querySelector<HTMLElement>('#cart-header')!;
const sidebar = document.querySelector<HTMLElement>('#cart-sidebar')!;

await cart.mount({ container: header, props: { compact: true } });
await cart.mount({ container: sidebar, props: { compact: false } });

// Updates the sidebar instance only.
await cart.update?.({ props: { compact: true }, container: sidebar });
```

### `createSsrSvelteMicroApp`

```ts no-check
function createSsrSvelteMicroApp(config: Omit<SvelteMicroAppConfig, 'ssr'>): MicroAppModule;
```

Identique à `createSvelteMicroApp({ ...config, ssr: true })`. Utilisez-la côté client pour les îlots que le serveur a rendus avec `renderSvelteToString` ou `renderSvelte`.

- **Svelte 5** : `hydrate(App, { target, props })`. Le balisage doit provenir de `svelte/server`, car l'hydratation lit les commentaires marqueurs (`<!--[-->`) qu'il écrit.
- **Svelte 3/4** : `new App({ target, props, hydrate: true })`. Compilez le composant avec `hydratable: true`.

L'hydratation conserve les nœuds DOM du serveur et leur attache les gestionnaires d'événements. Un conteneur qui ne contient que des espaces ou des commentaires reçoit un nouveau rendu.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelteToString(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<string>;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | aucun | `render` de `svelte/server`. Sans elle, l'adaptateur importe `svelte/server` à l'exécution. |

Rend le composant côté serveur et renvoie ses balises `<style>` suivies de son balisage. Placez la chaîne dans le conteneur de l'îlot et montez-le avec `createSsrSvelteMicroApp`. La chaîne n'inclut pas le contenu de `<svelte:head>` ; utilisez `renderSvelte` si vous en avez besoin.

La fonction choisit la version de Svelte à l'exécution. Lorsque `render` est passé, elle prend toujours le chemin Svelte 5 et appelle `render(App, { props })`. Sans lui, l'adaptateur importe `svelte` : si ce module exporte `mount`, il charge `svelte/server` et effectue le rendu avec Svelte 5. Sinon, il appelle `App.render(props)` (Svelte 3/4, compilé avec `generate: 'ssr'`) et enveloppe `css.code` dans une balise `<style>`. L'adaptateur ne décide jamais en vérifiant `App.render`, car les composants Svelte 5 compilés avec `dev: true` (vite-plugin-svelte en mode serve) portent un stub `App.render` qui lève une erreur.

Appelez-la depuis une fonction serveur, pas depuis du code qui s'exécute aussi dans le navigateur. Dans un navigateur, elle renvoie `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooterIsland(): Promise<string> {
  const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
  return `<footer id="footer" data-tuvix-app="footer">${html}</footer>`;
}
```

### `renderSvelte`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelte(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<SvelteRenderResult>;
```

Prend les mêmes arguments et options que `renderSvelteToString` et renvoie les parties séparément :

| Champ | Signification |
| --- | --- |
| `html` | Balisage du composant. La sortie Svelte 5 contient les commentaires d'hydratation. |
| `head` | Contenu de `<svelte:head>` sans les balises `<style>` du composant. Placez-le dans le `<head>` du document. |
| `css` | CSS du composant sous forme de balises `<style>`, ou `''` lorsque le compilateur n'en a émis aucune. |

Dans un navigateur, les trois champs valent `''`.

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Article from './Article.svelte';

export async function renderArticlePage(slug: string): Promise<string> {
  const { html, head, css } = await renderSvelte(Article, { slug }, { render });
  return `<!doctype html>
<html>
  <head>${head}${css}</head>
  <body>
    <main id="article" data-tuvix-app="article">${html}</main>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}
```

### Types {#types}

| Type | Entrée | Signification |
| --- | --- | --- |
| `SvelteMicroAppConfig` | `@tuvix.js/svelte` | Options de `createSvelteMicroApp`. |
| `SvelteProps` | `@tuvix.js/svelte` | `Record<string, unknown>` : les props que l'orchestrateur passe au composant. |
| `RenderSvelteOptions` | `@tuvix.js/svelte/server` | `{ render?: SvelteServerRender }`. |
| `SvelteServerRender` | `@tuvix.js/svelte/server` | Forme de `render` de Svelte 5 issu de `svelte/server`. |
| `SvelteRenderResult` | `@tuvix.js/svelte/server` | `{ html, head, css }`, renvoyé par `renderSvelte`. |

## Rendu côté serveur {#server-rendering}

Un îlot passe par trois étapes : rendu côté serveur, envoi du HTML dans le conteneur, hydratation côté client.

1. Appelez `renderSvelteToString` (ou `renderSvelte`) dans une fonction serveur et placez le résultat dans l'élément conteneur.
2. Chargez l'entrée client, qui exporte `createSsrSvelteMicroApp({ name, App })`.
3. L'orchestrateur monte l'app dans le même conteneur. L'adaptateur détecte le balisage et l'hydrate.

**CSS.** Svelte 5 place le CSS des composants dans la sortie du rendu uniquement lorsque vous compilez avec `css: 'injected'`. Avec la valeur par défaut `css: 'external'`, votre bundler écrit le CSS dans un fichier et la chaîne ne contient aucune balise `<style>`. Avec Vite :

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { css: 'injected' } })],
});
```

Si vous conservez `css: 'external'`, liez la feuille de style générée depuis le head de la page. [`@tuvix.js/vite`](/fr/packages/vite) indique à votre serveur de quelles feuilles de style une entrée d'îlot a besoin.

**Une seule copie de Svelte.** Passez `render` de `svelte/server` lorsque votre bundle serveur inclut Svelte (Nitro, Vinxi, un build SSR Vite avec `noExternal`). Le composant et le moteur de rendu partagent alors une seule copie de Svelte. Sans cette option, l'adaptateur importe `svelte/server` à l'exécution, ce qui peut charger une seconde copie depuis `node_modules`. Le moteur de rendu serveur de Svelte utilise des vérifications `instanceof` et échoue lorsque le composant et le moteur de rendu proviennent de copies différentes.

## Cas particuliers {#edge-cases}

- Un `mount` sur un conteneur qui contient déjà une instance du même module démonte d'abord l'ancienne instance.
- Un `unmount` appelé pendant que `mount` charge encore `svelte` attend la fin du montage, puis détruit l'instance. Aucun composant orphelin ne subsiste.
- `unmount` sur un conteneur que ce module n'a jamais monté, ou dont le montage a échoué, ne fait rien : le conteneur garde ses enfants et aucun événement n'est émis.
- Un `update` appelé pendant qu'un montage est en attente attend celui-ci, puis applique les props. Une mise à jour pour un montage qui a échoué ne fait rien.
- Sur Svelte 3/4, une prop absente des nouvelles props devient `undefined`. La valeur par défaut `export let name = 'x'` ne revient pas. Sur Svelte 5, la valeur par défaut s'applique, avec ou sans `SvelteMap`.
- L'adaptateur n'importe pas `svelte/reactivity` lui-même. Svelte 3/4 n'ont pas ce module, et un bundler échouerait à construire une app Svelte 3/4 qui y ferait référence, donc l'import se trouve dans votre entrée Svelte 5.
- Un remontage Svelte 5 (sans `SvelteMap`) émet de nouveau `tuvix:mounted`, mais aucun `tuvix:unmounted` entre les deux. Si le nouveau rendu lève une erreur, `update()` rejette avec cette erreur et l'ancienne instance a déjà disparu.
- Sans `ssr`, `mount` vide le conteneur avant le rendu, donc les placeholders de chargement disparaissent.
- Avec `ssr`, l'adaptateur hydrate lorsque le conteneur contient un élément ou du texte autre que des espaces. Des commentaires et des espaces seuls déclenchent un nouveau rendu.
- L'adaptateur détecte la version de Svelte une fois par page. Si `import('svelte')` échoue, le montage suivant réessaie.
- Une erreur d'import ou de rendu Svelte 5 côté serveur vous parvient sous forme de promesse rejetée. L'adaptateur ne se rabat pas sur `App.render`.
- Le `render` de Svelte 5 peut renvoyer une promesse (rendu serveur asynchrone). Les deux fonctions serveur l'attendent.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il ne compile pas les fichiers `.svelte`. Votre bundler s'en charge avec `@sveltejs/vite-plugin-svelte` ou `svelte/compiler`.
- Il ne vérifie pas quel build de Svelte votre bundler a choisi. Un bundle client qui résout `svelte` vers le build serveur échoue au montage.
- Il ne transmet que des props. Les slots, snippets et événements de composant n'ont aucun canal depuis l'hôte. Utilisez [`@tuvix.js/event-bus`](/fr/packages/event-bus) pour communiquer entre apps.
- Il n'écrit pas le contenu de `<svelte:head>` dans le document. `renderSvelte` le renvoie ; votre serveur le place dans `<head>`.
- Il ne lie pas le CSS compilé avec `css: 'external'`. Voir [`@tuvix.js/vite`](/fr/packages/vite).
- Il n'attend pas les données côté serveur. Chargez-les d'abord et passez-les comme props.

## Migration depuis la 0.4 {#migrating-from-0-4}

- **Svelte 5 fonctionne.** En 0.4, l'adaptateur appelait `new App()` sur chaque composant, donc les composants Svelte 5 échouaient, et `createSsrSvelteMicroApp` rendait une seconde copie au lieu d'hydrater. Le montage ne demande aucun changement de code. Pour mettre à jour les props sur place, passez `SvelteMap` de `svelte/reactivity` dans la configuration ; sans elle, chaque mise à jour Svelte 5 remonte le composant.
- **Le conteneur est vidé au montage.** Sans `ssr`, Svelte 3/4 ajoutait auparavant le composant après le balisage déjà présent dans le conteneur. Désormais, l'adaptateur vide d'abord le conteneur. Si vous comptiez sur un balisage conservé à côté du composant, déplacez-le hors du conteneur.
- **Pas de repli silencieux côté serveur.** `renderSvelteToString` se rabattait auparavant sur `App.render` lorsque `svelte/server` ne se chargeait pas. Il prend désormais le chemin Svelte 5 lorsque vous passez `render` ou lorsque `svelte` exporte `mount`, n'appelle `App.render` que sur Svelte 3/4, et rejette sur une erreur d'import ou de rendu Svelte 5. Les builds de développement Svelte 5 dans le SSR de développement de Vite prennent le chemin Svelte 5 même s'ils portent un stub `App.render`.
- **`unmount` sur un conteneur inconnu ne fait rien.** `unmount({ container })` sur un conteneur que le module n'a jamais monté le vidait auparavant. Il laisse désormais le conteneur intact, comme les adaptateurs React, Vue et Angular.
- **Passez `render`.** Ajoutez `{ render }` de `svelte/server` comme troisième argument lorsque votre bundle serveur inclut Svelte :

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

// 0.4: await renderSvelteToString(Footer, { year: 2026 });
const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
```

Consultez le [guide Svelte](/fr/guide/svelte) pour une app complète.
