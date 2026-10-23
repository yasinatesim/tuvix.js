# Avec Vue

`@tuvix.js/vue` transforme un composant racine Vue 3 en micro app, hydrate le balisage rendu côté serveur et rend les composants en HTML sur le serveur.

## Installation {#install}

```bash
pnpm add @tuvix.js/vue vue
# for renderVueToString on the server
pnpm add @vue/server-renderer
```

## Transformer un composant en micro app {#turn-a-component-into-a-micro-app}

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import { createPinia } from 'pinia';
import { analytics } from './analytics-plugin';
import App from './App.vue';

export default createVueMicroApp({
  name: 'settings',
  App,
  plugins: [createPinia(), [analytics, { id: 'G-123' }]],
});
```

| Option | Type | Description |
| --- | --- | --- |
| `name` | `string` | Obligatoire. Doit correspondre au nom de l'app enregistrée. |
| `App` | `Component` | Obligatoire. Composant racine. |
| `plugins` | `Array<Plugin \| [Plugin, ...options]>` | Installés avec `app.use(plugin, ...options)` à chaque montage. |
| `bootstrap` | `() => void \| Promise<void>` | S'exécute une fois avant le premier montage. |
| `ssr` | `boolean` | Hydrate le balisage serveur. `createSsrVueMicroApp` l'active. |

Chaque conteneur reçoit sa propre app Vue, donc chaque montage exécute à nouveau l'`install` de chaque plugin. Une instance de plugin comme `createPinia()` est partagée par tous les montages du module. Créez-la dans une fonction de plugin quand chaque montage a besoin de son propre store.

Monter dans un conteneur qui contient déjà cette app démonte d'abord l'ancienne instance. `unmount` détruit l'app, vide le conteneur et émet `tuvix:unmounted`.

## Props {#props}

L'adaptateur transmet les props au composant racine, et les fournit aussi sous `'tuvixProps'` (`TUVIX_PROPS_KEY`) à tout descendant :

```vue
<!-- App.vue -->
<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

defineProps<{ userId: string; theme?: 'light' | 'dark' }>();

const all = inject<Record<string, unknown>>(TUVIX_PROPS_KEY);
</script>

<template>
  <div :class="theme">User {{ userId }} ({{ Object.keys(all ?? {}).length }} props)</div>
</template>
```

`update({ props })` remplace les props dans un objet `shallowReactive` et attend le prochain tick de Vue. Le composant racine se rend à nouveau avec les nouvelles valeurs et conserve son état local. Les clés absentes des nouvelles props sont supprimées. Sans `container`, `update` met à jour tous les montages du module.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## Rendu côté serveur et hydratation {#server-rendering-and-hydration}

Rendez sur le serveur avec `renderVueToString`, et hydratez côté client avec `createSsrVueMicroApp` :

```ts
// server-only module
import { renderVueToString } from '@tuvix.js/vue/server';
import Newsletter from './Newsletter.vue';

export async function renderNewsletter(list: string): Promise<string> {
  const ssrContext: { teleports?: Record<string, string> } = {};
  const html = await renderVueToString(Newsletter, { list }, [], ssrContext);
  return html; // ssrContext.teleports holds <Teleport> output
}
```

```ts
// client
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

export const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });
```

- `renderVueToString(App, props?, plugins?, ssrContext?)` enveloppe `App` dans la même racine que celle utilisée côté client, donc `inject('tuvixProps')` fonctionne sur le serveur et l'hydratation correspond.
- Appelez-la uniquement depuis du code serveur : une fonction serveur, une route d'API ou votre entrée serveur. Dans le navigateur, elle renvoie `''`. Un loader de route isomorphe s'exécute aussi dans le navigateur, et le bundler embarque alors le moteur de rendu serveur de Vue côté client.
- Avec `ssr: true` et du balisage serveur dans le conteneur, l'adaptateur appelle `createSSRApp` et conserve les nœuds DOM du serveur. Un conteneur vide reçoit un nouveau rendu `createApp`.
- Le HTML ne contient aucun CSS. Vite injecte les blocs `<style>` des SFC depuis JavaScript, après le début de l'hydratation. Liez les feuilles de style dans `<head>` avec `@tuvix.js/vite` ; voir [Îlots SSR](/fr/guide/ssr-islands).

Dans un hôte React, montez le module avec `TuvixIsland`.

## Composables {#composables}

### useTuvixBus

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/vue';

const count = ref(0);
useTuvixBus<{ itemCount: number }>(getGlobalBus(), 'cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

Il s'abonne dans `onMounted`, se désabonne dans `onUnmounted`, et renvoie une fonction pour un nettoyage anticipé.

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` renvoie un `ShallowRef` qui fusionne chaque payload émis sur `updateEvent`. Rien dans Tuvix.js n'émet cet événement. Avec l'adaptateur, les props transmises via `updateAppProps` provoquent déjà un nouveau rendu du composant, donc vous en avez rarement besoin.

## Cas particuliers {#edge-cases}

- Les alias de chemin comme `~/utils` doivent aussi se résoudre dans les fichiers `.vue`. Si votre alias vient de `vite-tsconfig-paths`, ajoutez `**/*.vue` à l'`include` de ce tsconfig, ou définissez `resolve.alias` dans la configuration Vite. Voir [Dépannage](/fr/guide/troubleshooting).
- Une erreur de setup, de rendu ou de hook de cycle de vie pendant le montage rejette `mount` et émet `tuvix:error`, y compris dans les builds de production. Le `app.config.errorHandler` d'un plugin s'exécute quand même.
- `unmount` sur un conteneur que ce module n'a jamais monté ne fait rien.

## API {#api}

| Export | Rôle |
| --- | --- |
| `createVueMicroApp({ name, App, plugins?, bootstrap?, ssr? })` | Module de micro app Vue |
| `createSsrVueMicroApp({ name, App, plugins?, bootstrap? })` | Identique avec `ssr: true` |
| `TUVIX_PROPS_KEY` | Clé d'injection (`'tuvixProps'`) pour les props réactives |
| `useTuvixBus(bus, event, handler)` | Abonnement à l'event bus lié au composant |
| `useTuvixProps(initial, bus?, event?)` | `ShallowRef` fusionné à partir des événements du bus |
| `renderVueToString(App, props?, plugins?, ssrContext?)` depuis `@tuvix.js/vue/server` | HTML serveur |
