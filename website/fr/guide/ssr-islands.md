# Îlots SSR

Un îlot est une micro app que le serveur rend en HTML dans une page React, et que le navigateur hydrate avec son propre framework. Avec `TuvixIsland` de `@tuvix.js/react`, un seul hôte React peut porter des îlots Vue, Svelte, Angular et React. L'utilisateur voit du contenu stylé avant l'exécution de tout JavaScript, et chaque îlot devient interactif dès que son framework est chargé.

## Ce qu'il vous faut {#what-you-need}

| Élément | Paquet | S'exécute sur |
| --- | --- | --- |
| Page hôte React avec rendu côté serveur | votre app (`react-dom/server`, TanStack Start, ...) | serveur + client |
| `TuvixIsland`, `TuvixReactApp` | `@tuvix.js/react` | serveur + client |
| Modules d'îlots : `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`, `createSsrReactMicroApp` | adaptateurs | client |
| `renderVueToString`, `renderSvelteToString`, `renderAngularToString` | `@tuvix.js/<adapter>/server` | serveur uniquement |
| `getAssets`, `renderAssetTags` | `@tuvix.js/vite` | serveur uniquement |

Aucun orchestrateur n'intervient. `TuvixIsland` appelle lui-même les `mount`, `update` et `unmount` du module d'îlot.

## Déroulement d'une requête {#how-a-request-flows}

```text
server                                         browser
──────                                         ───────
renderVueToString(Card, props) ─┐
                                ▼
<TuvixIsland ssrHtml={html}> renders           HTML arrives, CSS links in <head>
<div data-tuvix-app="card">…html…</div>   ──►  apply → styled first paint
getAssets([...]) → <link rel=stylesheet>
                                               hydrateRoot(host)
                                               TuvixIsland reads its innerHTML from the DOM
                                               React leaves the island's children alone
                                               useEffect → card.mount({ container, props })
                                               Vue adapter: createSSRApp → hydrates in place
                                               tuvix:mounted { hydrated: true }
```

## 1. Configurer Vite {#_1-configure-vite}

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [react(), vue(), svelte(), tuvix()],
});
```

Ajoutez `"@tuvix.js/vite/client"` à `compilerOptions.types` pour que TypeScript connaisse `virtual:tuvix/assets`.

## 2. Créer les modules d'îlots {#_2-create-the-island-modules}

Chaque îlot exporte un module construit avec la variante `Ssr` de son adaptateur. Ces fichiers s'exécutent dans le navigateur et ne doivent pas importer de moteurs de rendu serveur.

```ts
// src/islands/vue-card/index.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import VueCard from './VueCard.vue';

export const vueCard = createSsrVueMicroApp({ name: 'vue-card', App: VueCard });
```

```ts
// src/islands/svelte-counter/index.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Counter from './Counter.svelte';

// SvelteMap makes TuvixIsland prop changes update in place instead of remounting.
export const svelteCounter = createSsrSvelteMicroApp({ name: 'svelte-counter', App: Counter, SvelteMap });
```

```ts
// src/islands/angular-contact/index.ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { ContactComponent } from './contact.component';

export const angularContact = createSsrAngularMicroApp({ name: 'angular-contact', component: ContactComponent });
```

## 3. Rendre le HTML des îlots sur le serveur {#_3-render-island-html-on-the-server}

Gardez les moteurs de rendu serveur dans un module que seul le code serveur importe :

```ts
// src/server/render-islands.ts (server only)
import { renderVueToString } from '@tuvix.js/vue/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import { renderAngularToString } from '@tuvix.js/angular/server';
import { render } from 'svelte/server';
import VueCard from '../islands/vue-card/VueCard.vue';
import Counter from '../islands/svelte-counter/Counter.svelte';
import { ContactComponent } from '../islands/angular-contact/contact.component';

export async function renderIslands(): Promise<Record<string, string>> {
  const [card, counter, contact] = await Promise.all([
    renderVueToString(VueCard, { title: 'Hello' }),
    renderSvelteToString(Counter, { start: 3 }, { render }),
    renderAngularToString(ContactComponent, { appId: 'contact', props: { heading: 'Write to us' } }),
  ]);
  return { 'vue-card': card, 'svelte-counter': counter, 'angular-contact': contact };
}
```

Les fonctions `render*ToString` sont réservées au serveur. Dans le navigateur, elles renvoient `''`. Appelez-les depuis du code qui ne s'exécute jamais dans le navigateur : votre entrée serveur, une route d'API, ou une fonction serveur de framework comme `createServerFn` de TanStack Start. Ne les appelez pas depuis un loader de route isomorphe. Ce loader s'exécute aussi dans le navigateur lors d'une navigation côté client, où il obtient `''`, et votre bundler livre au client le moteur de rendu serveur de Vue, Svelte ou Angular, parce que le loader l'importe.

## 4. Placer les îlots dans la page {#_4-put-the-islands-in-the-page}

```tsx
// src/pages/Home.tsx
import { createContext, useContext } from 'react';
import { TuvixIsland } from '@tuvix.js/react';
import { vueCard } from '../islands/vue-card';
import { svelteCounter } from '../islands/svelte-counter';

// Filled by the server entry; empty on the client.
export const IslandHtml = createContext<Record<string, string>>({});

export function Home() {
  const html = useContext(IslandHtml);
  return (
    <main>
      <TuvixIsland
        name="vue-card"
        app={vueCard}
        props={{ title: 'Hello' }}
        ssrHtml={html['vue-card']}
        fallback={<p>The card failed to load.</p>}
      />
      <TuvixIsland name="svelte-counter" app={svelteCounter} props={{ start: 3 }} ssrHtml={html['svelte-counter']} />
    </main>
  );
}
```

Passez les mêmes props sur le serveur et sur le client. Si le serveur a rendu `{ start: 3 }` et que le client monte avec `{ start: 4 }`, le framework constate une incohérence d'hydratation.

## 5. Lier le CSS des îlots dans le head {#_5-link-island-css-in-the-head}

Vite injecte les CSS Modules, les blocs `<style>` de Vue et les styles Svelte depuis JavaScript. Sans aide, le HTML serveur atteint le navigateur avant ce JavaScript, et le premier affichage (first paint) n'est pas stylé (FOUC). `getAssets` renvoie les URL des feuilles de style dont une entrée a besoin, pour que le serveur puisse les lier dans `<head>` :

```tsx
// src/entry-server.tsx
import { renderToString } from 'react-dom/server';
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { Home, IslandHtml } from './pages/Home';
import { renderIslands } from './server/render-islands';

export async function render(): Promise<string> {
  const [islandHtml, assets] = await Promise.all([
    renderIslands(),
    getAssets(['src/entry-client.tsx', 'src/pages/Home.tsx']),
  ]);

  const body = renderToString(
    <IslandHtml.Provider value={islandHtml}>
      <Home />
    </IslandHtml.Provider>,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <title>Home</title>
    ${renderAssetTags(assets)}
  </head>
  <body>
    <div id="app">${body}</div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>`;
}
```

- Passez des chemins de modules relatifs à la racine Vite. Dans un build de production, chaque chemin doit être une entrée du build ou la cible d'un `import()` dans le build client ; tout autre chemin est rejeté.
- Si Rollup fusionne deux cibles d'`import()` en un seul chunk, le manifest liste ce chunk sous son nom hashé au lieu du chemin de votre module, et `getAssets` rejette ce chemin. L'exemple rencontre ce cas quand `@angular/core` atterrit dans un chunk de page, et le corrige avec des `manualChunks` qui donnent à `@angular/core` son propre chunk.
- `getAssets` suit les imports statiques et ignore les cibles d'`import()`. Une page ou un îlot importé en différé et rendu sur le serveur a besoin de sa propre entrée dans la liste.
- En dev, il renvoie des URL CSS `?direct`, et dès que Vite injecte son propre `<style>`, il désactive le `<link>` correspondant, pour que les modifications HMR s'appliquent.
- Les îlots Angular portent leurs styles en ligne : `renderAngularToString` place les balises `<style>` du composant devant le markup.
- Svelte : compilez avec `css: 'injected'` (styles en ligne dans le HTML de l'îlot) ou gardez `emitCss` et liez-les avec `getAssets`. Pas les deux.

## 6. Hydrater sur le client {#_6-hydrate-on-the-client}

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Home } from './pages/Home';

hydrateRoot(document.getElementById('app')!, <Home />);
```

Le client rend sans le HTML des îlots. Chaque `TuvixIsland` lit son markup dans la page pendant l'hydratation, React conserve ces nœuds, et le module d'îlot les hydrate.

## Pourquoi le HTML n'est pas envoyé deux fois {#why-the-html-is-not-sent-twice}

Un îlot naïf passe le HTML serveur en prop des deux côtés. React a alors besoin de la chaîne sur le client pour hydrater `dangerouslySetInnerHTML` : le HTML voyage une fois dans le document et une seconde fois dans les données d'hydratation. Chaque nouveau rendu du parent avec un nouvel objet `{ __html }` pousse aussi React à réaffecter `innerHTML`, ce qui efface le DOM et les listeners que le framework de l'îlot avait attachés.

`TuvixIsland` évite les deux problèmes :

- Sur le serveur, il écrit `ssrHtml` dans `<div data-tuvix-app={name} data-tuvix-island={id}>`.
- Pendant l'hydratation, il trouve cet élément grâce à son attribut `data-tuvix-island` basé sur `useId` et lit `innerHTML` une seule fois. Le client n'a jamais besoin de `ssrHtml`.
- Il garde l'objet `{ __html }` dans son state : les rendus suivants transmettent à React le même objet, et React ne réécrit jamais les enfants de l'îlot.

Ce que votre framework fait des données de loader est une autre question. Si vous renvoyez le HTML d'un îlot depuis un loader TanStack Start ou Remix, le framework sérialise aussi ce résultat de loader dans la page. Transmettez le HTML à l'îlot par un canal que le framework ne sérialise pas, comme un contexte React rempli par votre entrée serveur, comme à l'étape 4.

## État par requête {#per-request-state}

Le code serveur traite de nombreuses requêtes dans un seul processus. Tout ce que vous créez au niveau du module survit à toutes ces requêtes.

- Créez un cache de données comme le `QueryClient` de TanStack Query par requête, pas au niveau du module. Sur le serveur, un client au niveau du module mélange les données entre requêtes et entre utilisateurs, et ses entrées périmées provoquent des incohérences d'hydratation.
- Passez en props les données dont un îlot a besoin, depuis le cache propre à la requête. Le module d'îlot crée son propre état côté client au montage.
- Formatez les dates et les nombres avec un `timeZone` et une locale explicites. Le serveur tourne en général en UTC et le navigateur dans le fuseau de l'utilisateur ; `Intl.DateTimeFormat` sans `timeZone` affiche un jour différent autour de minuit et casse l'hydratation.

```tsx
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

declare function createRequestCache(): { dehydrate(): unknown };
declare function Page(props: { data: unknown }): ReactElement;

export function renderRequest(): string {
  const cache = createRequestCache(); // one per request
  return renderToString(<Page data={cache.dehydrate()} />);
}
```

## Les balises head et meta appartiennent à l'hôte {#head-and-meta-tags-belong-to-the-host}

Les îlots se rendent dans un `<div>` du body. Ils ne doivent pas émettre de `<title>`, de `<meta>` ni de `<link rel=canonical>`. Définissez-les dans l'hôte (l'API head de votre framework, ou le template HTML). Pour les composants Svelte qui utilisent `<svelte:head>`, appelez `renderSvelte` au lieu de `renderSvelteToString` et placez vous-même sa sortie `head` dans le head du document.

## Erreurs {#errors}

- Si le `mount` ou l'`update` de l'îlot rejette, `TuvixIsland` rend `fallback` à la place. L'adaptateur a déjà émis `tuvix:error`.
- Si un moteur de rendu serveur lève une exception, votre code serveur décide : interceptez-la et ne passez pas de `ssrHtml`, l'îlot démarre alors vide et se rend sur le client.
- `TuvixReactApp` enveloppe son composant dans `<Suspense>` : une erreur de rendu serveur ne remplace donc que cette app par son `fallback`, et React la retente sur le client.

Surveillez les îlots depuis le code de la page avec `onLifecycle('mounted', ...)` et `onLifecycle('error', ...)` ; voir [Événements de cycle de vie](/fr/guide/lifecycle-events).

## Projet d'exemple {#example-project}

`examples/with-ssr-islands` dans le dépôt rassemble tout cela : un serveur Express + Vite avec un hôte React 19, une carte Vue 3, un compteur Svelte 5, un formulaire de contact Angular 20 zoneless (JIT ; le compilateur se charge en chunk différé), une newsletter `TuvixReactApp`, et un îlot qui échoue volontairement pour montrer son fallback. `src/server/render-islands.ts` contient les moteurs de rendu serveur, `src/entry-server.tsx` lie les assets avec `getAssets`, et `src/runtime/islands.ts` réagit aux événements de cycle de vie. L'îlot Angular reçoit son input `heading` de l'option `props` sur le serveur, et du même objet sur le client. Depuis la racine du dépôt, lancez `pnpm --filter with-ssr-islands dev` (port 5186), ou `build` puis `start` (port 5185 ; `PORT` le remplace). Le README de l'exemple explique chaque élément et les vérifications que lance sa spec Playwright.

## Ce que les îlots ne font pas {#what-islands-do-not-do}

- `TuvixIsland` ne charge pas de modules par URL. Importez le module d'îlot dans le bundle hôte.
- Il ne partage pas d'état entre îlots. Utilisez les props, l'event bus ou votre propre store.
- Les îlots Angular refont leur rendu par-dessus le DOM serveur au lieu de l'hydrater sans le détruire ; voir [Angular](/fr/guide/angular).
- Rien de tout cela ne fonctionne sans étape de rendu serveur. Pour des îlots uniquement côté client, omettez `ssrHtml` et utilisez les adaptateurs non `Ssr`.
