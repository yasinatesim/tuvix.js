---
title: '@tuvix.js/vue'
---

<PackageHeader
  name="@tuvix.js/vue"
  title="Liaisons Vue"
  description="Transformez un composant Vue 3 en micro app Tuvix.js avec des props réactives, une app Vue par conteneur et l'hydratation SSR. Rendez-le côté serveur avec renderVueToString."
  icon="💚"
  npm="true"
/>

## Installation {#installation}

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

Pour le rendu côté serveur, installez aussi le moteur de rendu serveur de Vue, une peer dependency optionnelle :

```bash
npm install @vue/server-renderer
# or pnpm add @vue/server-renderer
```

Le paquet nécessite Vue 3 (plage de peer `>=3.0.0`). Il dépend de `@tuvix.js/loader` et de `@tuvix.js/event-bus`.

## Quand l'utiliser {#when-to-use-it}

Utilisez `@tuvix.js/vue` quand l'une des micro apps de votre shell Tuvix est une app Vue 3. `createVueMicroApp` enveloppe le composant racine dans le module `{ bootstrap, mount, unmount, update }` qu'appellent l'orchestrateur et le loader. L'orchestrateur le monte ensuite dans un conteneur, transmet les nouvelles props avec `updateAppProps` et le démonte au changement de route.

Ajoutez le rendu côté serveur quand l'app Vue doit apparaître dans la première réponse HTML, pour le SEO ou pour éviter une zone vide avant l'exécution du JavaScript. Rendez le HTML avec `renderVueToString` de `@tuvix.js/vue/server` dans une fonction serveur, placez-le dans le conteneur et hydratez-le avec `createSsrVueMicroApp`. Dans une page hôte React, passez ce HTML à [`TuvixIsland`](/fr/packages/react#tuvixisland).

Si toute la page est une seule app Vue, vous n'avez pas besoin de ce paquet ; utilisez le `createApp` de Vue ou Nuxt.

## Démarrage rapide {#quick-start}

Le composant racine déclare les props que le shell transmet :

```vue
<!-- src/micro-apps/settings/App.vue -->
<script setup lang="ts">
defineProps<{ userId: string; theme: 'light' | 'dark' }>();
</script>

<template>
  <section :class="`settings theme-${theme}`">Settings for {{ userId }}</section>
</template>
```

Enveloppez-le dans un module :

```ts
// src/micro-apps/settings/index.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

Enregistrez-le dans le shell :

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'settings',
  entry: () => import('./micro-apps/settings'),
  container: '#app',
  activeWhen: '/settings/*',
  props: { userId: 'u_42', theme: 'light' },
});

await orchestrator.start();

// Re-renders App with theme="dark"; local component state survives.
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## API {#api}

### `createVueMicroApp`

```ts no-check
function createVueMicroApp(config: VueMicroAppConfig): MicroAppModule;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Nom sous lequel le module s'enregistre via `registerModule` de `@tuvix.js/loader`. Les événements de cycle de vie le portent. |
| `App` | `Component` | requis | Composant Vue racine. |
| `plugins` | `VuePluginEntry[]` | aucun | Plugins à installer sur chaque app Vue. Une entrée est un plugin, ou un tuple `[plugin, ...options]` passé à `app.use(plugin, ...options)`. |
| `bootstrap` | `() => void \| Promise<void>` | aucun | Initialisation unique. Le `bootstrap()` du module l'attend. |
| `ssr` | `boolean` | `false` | Hydrate le balisage serveur avec `createSSRApp` quand le conteneur contient des éléments ou du texte autre que des espaces. Un conteneur vide reçoit un rendu `createApp`. |

Le module retourné :

- `mount({ container, props })` crée une app Vue pour ce conteneur, installe les plugins et la monte. Il émet `tuvix:mounted` sur le conteneur avec `hydrated: true` quand Vue a adopté le balisage serveur.
- `update({ props, container })` écrit `props` dans l'objet de props réactif de ce conteneur et se résout après que Vue a appliqué le nouveau rendu (`nextTick`). Les clés absentes des nouvelles props sont supprimées. Sans `container`, il met à jour chaque conteneur que le module a monté.
- `unmount({ container })` démonte l'app Vue, vide le conteneur avec `replaceChildren()` et émet `tuvix:unmounted`.
- `bootstrap()` exécute `config.bootstrap`.

Chaque conteneur reçoit sa propre app Vue et ses propres props, donc un module peut se monter à plusieurs endroits en même temps :

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Badge from './Badge.vue';

const badge = createVueMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

#### Lire les props dans les composants {#reading-props-in-components}

L'adaptateur conserve les props dans un objet `shallowReactive` et rend `App` via une enveloppe racine qui les passe comme props de composant. L'enveloppe ne rend aucun DOM propre. Vous lisez les props de deux façons :

- **`defineProps`** dans le composant racine. `update` le rend de nouveau avec les nouvelles valeurs.
- **`inject('tuvixProps')`** (ou `inject(TUVIX_PROPS_KEY)`) dans n'importe quel composant de l'arbre. Vous obtenez le même objet réactif, donc un `computed` qui le lit se met à jour après `update`. Utilisez-le dans les enfants profonds au lieu de transmettre les props de niveau en niveau.

```vue
<!-- src/micro-apps/settings/ThemeLabel.vue -->
<script setup lang="ts">
import { computed, inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

const tuvixProps = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
const theme = computed(() => String(tuvixProps.theme ?? 'light'));
</script>

<template>
  <span>Theme: {{ theme }}</span>
</template>
```

#### Plugins avec options {#plugins-with-options}

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import type { VuePluginEntry } from '@tuvix.js/vue';
import type { App as VueApp } from 'vue';
import App from './App.vue';

const analytics = {
  install(app: VueApp, options: { siteId: string }) {
    app.provide('analyticsSiteId', options.siteId);
  },
};

const plugins: VuePluginEntry[] = [[analytics, { siteId: 'site-42' }]];

export default createVueMicroApp({ name: 'checkout', App, plugins });
```

Chaque conteneur reçoit sa propre app Vue, donc chaque montage appelle de nouveau `app.use` pour chaque plugin. Un objet plugin avec état, comme un résultat de `createPinia()`, est partagé par tous les conteneurs du module.

### `createSsrVueMicroApp`

```ts no-check
function createSsrVueMicroApp(config: VueSsrMicroAppConfig): MicroAppModule;
```

Équivaut à `createVueMicroApp({ ...config, ssr: true })`. Options : `name`, `App`, `plugins`, `bootstrap`, comme dans le tableau ci-dessus.

Quand le conteneur contient le balisage de `renderVueToString`, Vue adopte ces nœuds DOM via `createSSRApp` et y attache les écouteurs. Le serveur et le client utilisent la même enveloppe racine, donc les arbres de composants correspondent. Montez avec les mêmes props que celles du rendu serveur :

```ts
// src/micro-apps/contact/client.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString`

Importez-le depuis le sous-chemin `@tuvix.js/vue/server`.

```ts no-check
function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: VuePluginEntry[],
  ssrContext?: VueSsrContext
): Promise<string>;
```

| Argument | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `App` | `Component` | requis | Composant racine, le même que celui passé à `createSsrVueMicroApp`. |
| `props` | `Record<string, unknown>` | `{}` | Props de `App`. `inject('tuvixProps')` les voit aussi pendant le SSR. |
| `plugins` | `VuePluginEntry[]` | aucun | Plugins à installer, avec la même forme de tuple que `createVueMicroApp`. |
| `ssrContext` | `VueSsrContext` | `{}` | Objet dans lequel Vue écrit pendant le rendu. Lisez `teleports` et `modules` une fois la promesse résolue. |

Il crée une app SSR avec l'enveloppe racine partagée, installe les plugins et retourne le HTML produit par `renderToString` de `@vue/server-renderer`. Installez ce paquet ; `renderVueToString` l'importe au premier appel.

`renderVueToString` est réservé au serveur. Appelez-le depuis une fonction serveur (un handler `createServerFn` de TanStack Start, une route d'API, votre handler Express), pas depuis un loader de route isomorphe. Un loader s'exécute aussi dans le navigateur pendant la navigation côté client, où la fonction retourne `''`, et votre bundler livre le moteur de rendu serveur de Vue au client, car le loader l'importe.

```ts
// src/server/contact.ts
import { createServerFn } from '@tanstack/react-start';
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from '../micro-apps/contact/App.vue';

export const renderContact = createServerFn().handler(async () => {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return { html, teleports: ssrContext.teleports ?? {} };
});
```

Placez `html` dans l'élément conteneur (`<div id="contact">…</div>`) de votre page, puis montez `createSsrVueMicroApp` côté client comme ci-dessus. Le HTML d'une cible `<Teleport>` se trouve dans `ssrContext.teleports['#target']`, pas dans la chaîne retournée ; imprimez-le là où se trouve la cible.

### `TUVIX_PROPS_KEY`

```ts no-check
const TUVIX_PROPS_KEY = 'tuvixProps';
```

Clé d'injection de l'objet de props réactif. `inject(TUVIX_PROPS_KEY)` et `inject('tuvixProps')` retournent le même objet, côté client et pendant `renderVueToString`.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): Unsubscribe;
```

Abonne `handler` à `event` dans `onMounted` et le désabonne dans `onUnmounted`. La fonction retournée désabonne plus tôt. Appelez-le pendant `setup`. `onMounted` ne s'exécute pas pendant le rendu côté serveur, donc l'abonnement n'existe que côté client.

L'adaptateur ne passe pas le bus de l'orchestrateur à `App`. L'orchestrateur utilise `getGlobalBus()` sauf si vous lui avez donné des options `eventBus` :

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const count = ref(0);

useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
  count.value = items.length;
});
</script>

<template>
  <span>{{ count }}</span>
</template>
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): ShallowRef<T>;
```

| Argument | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `initialProps` | `T` | requis | Valeur de départ, copiée une fois. |
| `bus` | `IEventBus` | aucun | Bus à écouter. Sans lui, la ref garde `initialProps`. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Événement dont le composable fusionne le payload dans la ref (`{ ...prev, ...payload }`). |

Ni l'orchestrateur ni l'adaptateur n'émettent `tuvix:props:update` ; vous l'émettez vous-même. Pour les props venant de l'orchestrateur, utilisez `defineProps` ou `inject(TUVIX_PROPS_KEY)`, qui suivent `update` sans bus.

```vue
<script setup lang="ts">
import { useTuvixProps } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const settings = useTuvixProps({ theme: 'light' }, getGlobalBus());
// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
</script>

<template>
  <p>Theme: {{ settings.theme }}</p>
</template>
```

### Types {#types}

| Type | Exporté depuis | Signification |
| --- | --- | --- |
| `VueMicroAppConfig` | `@tuvix.js/vue` | Configuration de `createVueMicroApp` : `name`, `App`, `plugins?`, `bootstrap?`, `ssr?`. |
| `VueSsrMicroAppConfig` | `@tuvix.js/vue` | `VueMicroAppConfig` sans `ssr` ; configuration de `createSsrVueMicroApp`. |
| `VuePluginEntry` | `@tuvix.js/vue` | `Plugin \| [Plugin, ...any[]]` : un plugin, ou un plugin avec ses options pour `app.use`. |
| `VueSsrContext` | `@tuvix.js/vue/server` | `{ teleports?: Record<string, string>; modules?: Set<string>; [key: string]: unknown }`, rempli par Vue et ses plugins pendant `renderVueToString`. `@vitejs/plugin-vue` enregistre les modules de composants rendus dans `modules`. |

## Cas limites {#edge-cases}

- **Erreurs de montage.** Les erreurs de setup, de rendu et de hooks de cycle de vie pendant `mount` rejettent la promesse, en build de développement comme de production. L'adaptateur démonte l'app en échec et émet `tuvix:error`. Le `app.config.errorHandler` d'un plugin reçoit toujours l'erreur.
- **Deux montages dans un même conteneur.** Un second `mount` sur un conteneur que le module détient déjà démonte d'abord l'ancienne app (en émettant `tuvix:unmounted` et en vidant le conteneur), puis en monte une nouvelle. Avec `ssr: true`, ce second montage fait un nouveau rendu, car le conteneur est vide.
- **Conteneur inconnu.** `unmount` sur un conteneur que le module n'a jamais monté ne fait rien. `update` avec un tel `container` ne change rien.
- **Les props remplacent.** Le `update` du module fixe les props à l'objet que vous passez et supprime les clés absentes. `orchestrator.updateAppProps` fusionne les nouvelles props par-dessus celles enregistrées avant d'appeler `update`.
- **Props non déclarées.** Les props que le composant racine ne déclare pas avec `defineProps` lui arrivent comme attributs et retombent sur son élément racine, comme Vue le fait pour tout composant. `{ lang: 'en' }` rend `lang="en"` sur l'élément racine, sauf si vous déclarez `lang` ou définissez `inheritAttrs: false`.
- **Conteneur ne contenant que des espaces avec `ssr: true`.** L'adaptateur rend avec `createApp`, car `hasServerMarkup` ignore le texte composé d'espaces et les commentaires. Vue n'avertit pas d'une hydratation dans un conteneur vide.
- **`renderVueToString` dans le navigateur.** Il retourne `''` quand `window` existe.
- **Erreur de démontage.** Si `app.unmount()` lève une erreur, l'adaptateur vide le conteneur, émet `tuvix:error` et relance l'erreur.
- **Même nom deux fois.** `registerModule` conserve le dernier module créé sous un nom donné.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il ne prend pas en charge Vue 2.
- Il ne charge pas de modules par URL. Importez le module, ou laissez [`@tuvix.js/core`](/fr/packages/core) le charger via une `entry`.
- Il ne passe pas `MountContext.bus` ni `MountContext.name` à vos composants. Utilisez `getGlobalBus()` de `@tuvix.js/event-bus`.
- `renderVueToString` ne fait pas de streaming et ne collecte pas le CSS. Utilisez [`@tuvix.js/vite`](/fr/packages/vite) pour imprimer les liens de feuilles de style des îlots rendus côté serveur.
- Il ne place pas le HTML téléporté pour vous. Lisez `ssrContext.teleports` et imprimez-le.

## Migrer depuis la 0.4 {#migrating-from-0-4}

**`$tuvixProps` a disparu.** `update()` n'écrit plus `app.config.globalProperties.$tuvixProps`. Lisez les props avec `defineProps` ou `inject` :

```vue
<!-- Before (0.4) -->
<template>
  <span>{{ $tuvixProps.theme }}</span>
</template>
```

```vue
<!-- After (0.5) -->
<script setup lang="ts">
defineProps<{ theme: string }>();
</script>

<template>
  <span>{{ theme }}</span>
</template>
```

**`unmount` sur un conteneur inconnu ne fait rien.** En 0.4, il vidait le conteneur. Appelez `container.replaceChildren()` vous-même si vous en dépendiez.

**`VueSsrMicroAppConfig` n'a pas de champ `ssr`.** Retirez `ssr` de la configuration que vous passez à `createSsrVueMicroApp`.

**Objet de configuration.** Les versions précédentes de cette page montraient `createVueMicroApp(App)`. La fonction prend un objet de configuration : `createVueMicroApp({ name: 'settings', App })`.

Consultez le [guide Vue](/fr/guide/vue) pour d'autres tutoriels.
