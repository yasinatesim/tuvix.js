# Avec Svelte

`@tuvix.js/svelte` transforme un composant Svelte en micro app. Il prend en charge Svelte 5 et Svelte 3/4, hydrate le balisage serveur et rend les composants en HTML sur le serveur.

## Installation {#install}

```bash
pnpm add @tuvix.js/svelte svelte
```

## Transformer un composant en micro app {#turn-a-component-into-a-micro-app}

```ts
// src/main.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

// SvelteMap (Svelte 5 only) lets update() re-render in place; drop it for Svelte 3/4.
export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

Au premier montage, l'adaptateur importe `svelte` et vérifie quelle API il expose :

| Svelte | Montage | Hydratation | Mise à jour | Démontage |
| --- | --- | --- | --- | --- |
| 5 | `mount(App, { target, props })` | `hydrate(...)` | sur place avec `SvelteMap`, sinon remontage | `unmount(instance)` |
| 3 / 4 | `new App({ target, props })` | `new App({ hydrate: true })` | `instance.$set(props)` | `instance.$destroy()` |

Votre bundler doit résoudre `svelte` vers son build navigateur. S'il choisit le build serveur, `mount()` de Svelte 5 lève `lifecycle_function_unavailable`, ou les callbacks `onMount` ne s'exécutent jamais. Voir [Dépannage](/fr/guide/troubleshooting).

Chaque conteneur reçoit sa propre instance de composant. `mount` émet `tuvix:mounted` après l'exécution des callbacks `onMount` et des effets. Sans `ssr`, `mount` vide le conteneur avant de rendre. `unmount` sur un conteneur que ce module n'a jamais monté, ou dont le montage a échoué, ne fait rien.

## Props {#props}

Svelte 5 avec les runes :

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { userId, theme = 'light' }: { userId: string; theme?: string } = $props();
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 3/4, ou Svelte 5 en mode legacy :

```svelte
<script lang="ts">
  export let userId: string;
  export let theme = 'light';
</script>

<div class="theme-{theme}">User {userId}</div>
```

Avec Svelte 5, passez `SvelteMap` depuis `svelte/reactivity` dans la configuration. L'adaptateur fournit alors au composant un objet de props adossé à une `SvelteMap`, et `update({ props })` y écrit les nouvelles valeurs : seules les parties qui lisent une prop modifiée se rendent à nouveau, et les nœuds DOM ainsi que l'état du composant sont conservés. Cela fonctionne pour `$props()` et pour `export let`. Sans `SvelteMap`, un `update()` sous Svelte 5 démonte l'instance, en monte une nouvelle avec les nouvelles props et émet à nouveau `tuvix:mounted`, donc l'état local est réinitialisé. L'adaptateur n'importe pas `svelte/reactivity` lui-même, car ce module n'existe pas dans Svelte 3/4 et leurs builds échoueraient.

Avec Svelte 3/4, `update` appelle `$set` et ignore `SvelteMap`.

Chaque mise à jour remplace l'ensemble des props. Une clé absente des nouvelles props reprend la valeur par défaut de la prop sous Svelte 5 et devient `undefined` sous Svelte 3/4. L'orchestrateur envoie toujours les props fusionnées, donc cela ne compte que lorsque vous appelez `update` vous-même.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

## Rendu côté serveur et hydratation {#server-rendering-and-hydration}

```ts
// server-only module
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooter(): Promise<string> {
  return renderSvelteToString(Footer, { year: 2026 }, { render });
}
```

```ts
// client
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

- `renderSvelteToString(App, props?, { render? })` renvoie les balises `<style>` du composant suivies de son balisage. Appelez-la depuis du code serveur ; dans le navigateur, elle renvoie `''`.
- Passez `render` depuis `svelte/server` quand votre bundle serveur inclut Svelte (Nitro, Vinxi, un build SSR Vite en `noExternal`). Sans cela, l'adaptateur importe `svelte/server` à l'exécution, ce qui peut charger une seconde copie de Svelte, et le moteur de rendu serveur de Svelte échoue d'une copie à l'autre.
- `renderSvelte(App, props?, { render? })` renvoie `{ html, head, css }` quand vous avez besoin de la sortie de `<svelte:head>`. Placez `head` vous-même dans le `<head>` du document ; l'îlot ne doit pas contenir de `<title>` ni de `<meta>`.
- `createSsrSvelteMicroApp` hydrate quand le conteneur contient des éléments ou du texte autre que des espaces, et effectue un nouveau rendu sinon. Les composants Svelte 3/4 doivent être compilés avec `hydratable: true`.

### CSS au premier affichage {#css-on-first-paint}

Choisissez une option :

- **CSS dans le HTML.** Compilez avec `compilerOptions: { css: 'injected' }`. Svelte 5 place alors le CSS du composant dans la sortie serveur, et `renderSvelteToString` l'inclut sous forme de balises `<style>` dans l'îlot.
- **CSS sous forme de fichiers.** Gardez la valeur par défaut `emitCss: true` et liez les feuilles de style de l'îlot dans `<head>` avec `@tuvix.js/vite`. Voir [Îlots SSR](/fr/guide/ssr-islands).

Avec `css: 'injected'`, il n'y a aucun fichier de feuille de style, donc `@tuvix.js/vite` ne trouve rien à lier. Ne combinez pas les deux.

## Event bus {#event-bus}

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getGlobalBus } from '@tuvix.js/event-bus';

  let count = $state(0);
  const off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
    count = itemCount;
  });
  onDestroy(off);
</script>

<span class="badge">{count}</span>
```

## Ce que l'adaptateur ne fait pas {#what-the-adapter-does-not-do}

- Il ne compile pas les fichiers `.svelte` ; c'est le rôle de `@sveltejs/vite-plugin-svelte`.
- Il ne transmet que des props. Aucun slot, snippet ni événement de composant ne traverse depuis l'hôte.
- Il ne vérifie pas quel build de Svelte votre bundler a choisi.

## API {#api}

| Export | Rôle |
| --- | --- |
| `createSvelteMicroApp({ name, App, bootstrap?, ssr?, SvelteMap? })` | Module de micro app Svelte |
| `createSsrSvelteMicroApp({ name, App, bootstrap?, SvelteMap? })` | Identique avec `ssr: true` |
| `renderSvelteToString(App, props?, options?)` depuis `@tuvix.js/svelte/server` | Styles + balisage |
| `renderSvelte(App, props?, options?)` depuis `@tuvix.js/svelte/server` | `{ html, head, css }` |
