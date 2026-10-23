---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="Liaisons React"
  description="Transformez un composant React en micro app Tuvix.js et hébergez n'importe quelle micro app (Vue, Svelte, Angular, React, vanilla) dans un arbre React, avec rendu côté serveur et hydratation."
  icon="⚛️"
  npm="true"
/>

## Installation {#installation}

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

Le paquet nécessite React 18 ou plus récent (plage de peer `>=18.0.0` pour `react` et `react-dom`). Il dépend de `@tuvix.js/loader` et de `@tuvix.js/event-bus`.

## Quand l'utiliser {#when-to-use-it}

Le paquet couvre deux directions :

- **React comme micro app.** `createReactMicroApp` et `createSsrReactMicroApp` enveloppent un composant React dans le module `{ bootstrap, mount, unmount, update }` qu'attendent l'orchestrateur et le loader. Utilisez-les quand une app React fait partie des micro apps qu'un shell Tuvix charge.
- **React comme hôte.** `TuvixIsland` monte n'importe quel module de micro app dans une page React et garde son DOM intact entre les re-rendus. `TuvixReactApp` rend une micro app React en ligne dans l'arbre de l'hôte. Utilisez-les quand votre shell est un framework React SSR comme TanStack Start, Next.js ou Remix.

Si votre shell est du HTML simple sans React, seule la première paire vous sert, avec [`@tuvix.js/core`](/fr/packages/core). Pour une micro app Vue, Svelte ou Angular, utilisez [`@tuvix.js/vue`](/fr/packages/vue), [`@tuvix.js/svelte`](/fr/packages/svelte) ou [`@tuvix.js/angular`](/fr/packages/angular) pour créer le module ; `TuvixIsland` peut héberger chacune d'elles.

## Démarrage rapide {#quick-start}

Créez le module de la micro app :

```tsx
// src/dashboard.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Enregistrez-le dans le shell. L'orchestrateur appelle `mount` quand la route correspond et `update` quand vous changez les props :

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { userId: 'u_42' },
});

await orchestrator.start();

// Re-renders <Dashboard userId="u_43" />; component state survives.
await orchestrator.updateAppProps('dashboard', { userId: 'u_43' });
```

## API {#api}

### `createReactMicroApp`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Nom sous lequel le module s'enregistre via `registerModule` de `@tuvix.js/loader`. Les événements de cycle de vie le portent. |
| `App` | `ComponentType<P>` | requis | Composant racine. Il reçoit les props de montage comme ses propres props, donc un composant aux props requises comme `{ page: 'privacy' \| 'terms' }` passe la vérification de types. |
| `bootstrap` | `() => void \| Promise<void>` | aucun | Initialisation unique. Le `bootstrap()` du module l'attend. |
| `ssr` | `boolean` | `false` | Hydrate le balisage serveur avec `hydrateRoot` quand le conteneur contient des éléments ou du texte autre que des espaces. Un conteneur qui ne contient que des espaces ou des commentaires reçoit un nouveau rendu `createRoot`. |

Le module retourné a quatre méthodes :

- `mount({ container, props })` crée une racine React pour ce conteneur. Il se résout après que React a validé le premier rendu, puis émet `tuvix:mounted` sur le conteneur avec `hydrated: true` ou `false`. Si `App` se suspend au premier rendu, `mount` attend que le contenu soit validé.
- `update({ props, container })` rend de nouveau `App` avec `props` dans ce conteneur. Sans `container`, il rend de nouveau chaque conteneur que le module a monté. React conserve l'état des composants, car l'arbre garde sa forme.
- `unmount({ container })` démonte la racine, vide le conteneur avec `replaceChildren()` et émet `tuvix:unmounted`.
- `bootstrap()` exécute `config.bootstrap`.

Chaque conteneur reçoit sa propre racine, donc un module peut se monter à plusieurs endroits en même temps :

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

const badge = createReactMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

Le module importe `react-dom/client` de manière paresseuse dans `mount`. Un bundle serveur peut importer le module (par exemple pour partager `App` avec `TuvixReactApp`) sans embarquer le moteur de rendu client.

### `createSsrReactMicroApp`

```ts no-check
function createSsrReactMicroApp<P extends object = Record<string, unknown>>(
  config: Omit<ReactMicroAppConfig<P>, 'ssr'>
): MicroAppModule;
```

Équivaut à `createReactMicroApp({ ...config, ssr: true })`. Options : `name`, `App`, `bootstrap`, comme dans le tableau ci-dessus.

Utilisez-le côté client quand le conteneur contient déjà le HTML que le serveur a rendu pour le même composant. L'arbre qu'il rend correspond à celui que rend `TuvixReactApp` (error boundary plus `<Suspense>`), donc il hydrate le balisage de `TuvixReactApp` sans écart :

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export default createSsrReactMicroApp({ name: 'legal-app', App: LegalPage });
```

### `TuvixIsland`

```ts no-check
function TuvixIsland(props: TuvixIslandProps): ReactElement;
```

| Prop | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Nom de la micro app. L'îlot l'écrit dans `data-tuvix-app` et le passe à `app.mount`. |
| `app` | `MicroAppModule` | requis | Le module à monter : le résultat de `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp`, `createReactMicroApp`, de leurs variantes `createSsr*`, ou un objet `{ mount, unmount, update? }` écrit à la main. |
| `props` | `Record<string, unknown>` | `{}` | Props du module. L'îlot les compare superficiellement à chaque rendu. |
| `ssrHtml` | `string` | aucun | Le HTML de l'îlot rendu côté serveur, par exemple avec `renderVueToString`. Passez-le côté serveur uniquement. |
| `fallback` | `ReactNode` | `null` | Rendu à la place de l'îlot quand `mount` ou `update` est rejeté. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Balise de l'élément enveloppe. |
| `className` | `string` | aucun | Nom de classe de l'élément enveloppe. |

`TuvixIsland` héberge une micro app non React (ou une micro app React empaquetée séparément) dans une page React. Un pont écrit à la main qui rend <span v-pre>`<div dangerouslySetInnerHTML={{ __html: html }} />`</span> casse au premier re-rendu du parent : React voit un nouvel objet `{ __html }`, réassigne `innerHTML` et détruit le DOM et les écouteurs que la micro app avait attachés. `TuvixIsland` évite cela :

- **Rendu serveur.** Il rend `<div data-tuvix-app={name} data-tuvix-island={id}>` avec `ssrHtml` comme HTML interne. `id` vient de `useId` de React, donc le serveur et le client calculent la même valeur.
- **Hydratation.** Au premier rendu client, il retrouve son propre élément dans la page grâce à `data-tuvix-island` et relit le HTML interne depuis le DOM. Vous n'envoyez pas `ssrHtml` une seconde fois au client, et le rendu client correspond au rendu serveur.
- **DOM stable.** L'îlot crée son objet `{ __html }` une seule fois, dans `useState`. Les rendus suivants réutilisent cet objet, donc React ne réécrit jamais les enfants de l'îlot. Les re-rendus du parent conservent les nœuds et les écouteurs de la micro app.
- **Montage.** Après le premier commit, l'îlot appelle `app.mount({ container, props, name })`. Un module créé avec `ssr: true` (`createSsrVueMicroApp` et ses équivalents) y adopte le DOM serveur. Un module sans SSR fait un nouveau rendu dans le conteneur.
- **Props.** Quand `props` change superficiellement (clés différentes, ou une valeur qui échoue à `Object.is`), l'îlot appelle `app.update({ props, container })`. Un module sans `update` reçoit `unmount`, un conteneur vidé, puis un nouveau `mount`. Un littéral d'objet en ligne avec les mêmes valeurs ne déclenche pas de mise à jour.
- **Identité.** Un nouveau `name` ou `app` démonte l'ancien module et monte le nouveau.
- **Retrait.** Quand l'îlot quitte l'arbre, il appelle `app.unmount({ container })` et vide le conteneur.
- **Ordre.** Les appels à mount, update et unmount s'exécutent les uns après les autres. Un unmount qui arrive pendant qu'un `mount` est en cours l'attend.
- **Erreurs.** Si `mount` ou `update` est rejeté, l'îlot rend `fallback` à la place de l'enveloppe. Les adaptateurs émettent `tuvix:error` eux-mêmes ; l'îlot n'ajoute aucun événement. Un changement ultérieur de `name` ou de `app` fait une nouvelle tentative.

Une configuration serveur et client complète avec un pied de page Vue dans une mise en page React :

```tsx
// src/Layout.tsx (shared by server and client)
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <main>
      <h1>Home</h1>
      <TuvixIsland
        name="footer"
        app={footer}
        props={{ year }}
        ssrHtml={footerHtml}
        fallback={<footer>© {year}</footer>}
        as="section"
        className="site-footer"
      />
    </main>
  );
}
```

```tsx
// src/entry-server.tsx (runs on the server only)
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const year = 2026;
  const footerHtml = await renderVueToString(Footer, { year });
  const body = renderToString(<Layout year={year} footerHtml={footerHtml} />);
  return `<!doctype html><html><body><div id="root">${body}</div><script type="module" src="/src/entry-client.tsx"></script></body></html>`;
}
```

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

// No footerHtml here: the island reads the footer HTML from the page.
hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

Le HTML serveur atteint le navigateur avant tout JavaScript, donc le pied de page est visible et stylé dès le premier affichage (first paint), à condition d'imprimer ses feuilles de style dans `<head>`. [`@tuvix.js/vite`](/fr/packages/vite) vous fournit ces balises `<link>`.

### `TuvixReactApp`

```ts no-check
function TuvixReactApp<P extends object>(props: TuvixReactAppProps<P>): ReactElement;
```

| Prop | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Nom de la micro app, écrit dans `data-tuvix-app`. Utilisez le même `name` que celui passé à `createSsrReactMicroApp`. |
| `App` | `ComponentType<P>` | requis | Composant à rendre. |
| `fallback` | `ReactNode` | `null` | Affiché pendant que `App` est suspendu et après qu'il a levé une erreur. |
| autres props | `P` | requises par `P` | Passées à `App`. |

`TuvixReactApp` rend une micro app React en ligne, comme partie de l'arbre React de l'hôte, donc votre framework SSR rend son HTML. Il produit `<div data-tuvix-app={name}>` et enveloppe `App` dans une error boundary et un `<Suspense fallback>` :

- **Les erreurs serveur restent locales.** Une erreur levée dans `App` pendant le rendu côté serveur fait rendre `fallback` par React pour cette app uniquement. Le reste de la page se rend, et React retente `App` côté client.
- **Les erreurs client restent locales.** L'error boundary intercepte les erreurs de rendu côté client, affiche `fallback` et émet `tuvix:error` sur l'enveloppe.
- **Événements de cycle de vie.** Après le premier commit, il émet `tuvix:mounted`. `hydrated` vaut `true` quand l'enveloppe provient du HTML serveur. Quand le composant quitte l'arbre, il émet `tuvix:unmounted` avant que React détache l'enveloppe, donc un écouteur sur `document` le reçoit. Si une boundary `<Suspense>` affichée se suspend de nouveau, l'app signale `unmounted`, puis `mounted` une fois le contenu revenu.

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal-app"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

Pour héberger une micro app Vue, Svelte, Angular ou vanilla, utilisez `TuvixIsland`.

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): void;
```

Abonne `handler` à `event` sur `bus` dans un effet et le désabonne au démontage. Le hook conserve le dernier `handler` dans une ref, donc un handler qui lit un état récent ne se réabonne pas à chaque rendu. Un nouveau `bus` ou `event` provoque un réabonnement. L'abonnement n'existe que côté client ; les effets ne s'exécutent pas pendant le rendu côté serveur.

Les adaptateurs ne passent pas le bus de l'orchestrateur à `App`. L'orchestrateur utilise `getGlobalBus()` sauf si vous lui avez donné des options `eventBus`, donc lisez le bus depuis là :

```tsx
import { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function CartIcon() {
  const [count, setCount] = useState(0);

  useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
    setCount(items.length);
  });

  return <span>{count}</span>;
}
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): T;
```

| Argument | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `initialProps` | `T` | requis | Valeur de départ. Le hook la lit au premier rendu et ignore les changements ultérieurs. |
| `bus` | `IEventBus` | aucun | Bus à écouter. Sans lui, le hook retourne `initialProps` inchangé. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Événement dont le hook fusionne le payload dans les props courantes (`{ ...prev, ...payload }`). |

Ni l'orchestrateur ni les adaptateurs n'émettent `tuvix:props:update`. Vous l'émettez vous-même. Un module issu de `createReactMicroApp` n'a pas besoin de ce hook pour les props de l'orchestrateur : `update({ props })` rend de nouveau `App` avec les nouvelles props.

```tsx
import { useTuvixProps } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function ThemeLabel() {
  const props = useTuvixProps({ theme: 'light' }, getGlobalBus());
  return <p>Theme: {props.theme}</p>;
}

// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
```

### Types {#types}

| Type | Signification |
| --- | --- |
| `ReactMicroAppConfig<P>` | Configuration de `createReactMicroApp` : `name`, `App`, `bootstrap?`, `ssr?`. |
| `TuvixIslandProps` | Props de `TuvixIsland` : `name`, `app`, `props?`, `ssrHtml?`, `fallback?`, `as?`, `className?`. |
| `TuvixReactAppProps<P>` | Props de `TuvixReactApp` : `name`, `App`, `fallback?`, plus les props de `App`. |

## Cas limites {#edge-cases}

- **Le premier rendu lève une erreur.** `mount` est rejeté avec l'erreur, démonte la racine, vide le conteneur et émet `tuvix:error`. En 0.4, `mount` se résolvait et l'erreur atteignait le gestionnaire d'erreurs racine de React.
- **Un rendu ultérieur lève une erreur.** L'error boundary vide l'app et émet `tuvix:error`. La page hôte continue de fonctionner. L'app reste vide jusqu'à ce que vous la démontiez et la remontiez ; `update` ne la rétablit pas.
- **Démontage pendant le montage.** Un `unmount` qui arrive pendant que `mount` charge encore `react-dom/client` ou attend le premier commit l'attend, laisse le conteneur vide et n'émet aucun événement `mounted`.
- **Deux montages dans un même conteneur.** Un second `mount` sur un conteneur que le module détient déjà démonte l'ancienne racine, émet `tuvix:unmounted`, puis fait un nouveau rendu avec les nouvelles props et émet `tuvix:mounted`. L'état des composants est réinitialisé. Les adaptateurs Vue, Svelte et Angular font de même. Appelez `update` pour conserver l'état.
- **Conteneur inconnu.** `unmount` et `update` sur un conteneur que le module n'a jamais monté ne font rien.
- **Les props remplacent.** Le `update` du module rend `App` avec les props que vous passez et rien d'autre. `orchestrator.updateAppProps` fusionne les nouvelles props par-dessus celles enregistrées avant d'appeler `update`.
- **Conteneur ne contenant que des espaces avec `ssr: true`.** Le module fait un nouveau rendu, car `hasServerMarkup` ignore le texte composé d'espaces et les commentaires.
- **Îlot retiré par React.** React détache l'élément de l'îlot avant que le module signale `tuvix:unmounted`. `emitLifecycle` émet alors l'événement sur `document` au lieu de l'élément détaché, donc un écouteur sur `document` (ou `onLifecycle` de `@tuvix.js/loader`) le reçoit quand même, avec `detail.container` désignant l'élément retiré. Un écouteur sur le conteneur lui-même ou sur un ancêtre ne le reçoit pas. `isMounted(name)` reste `true` tant que l'app est montée dans un autre conteneur et passe à `false` après le démontage du dernier.
- **Îlot sous `<StrictMode>` en développement.** React exécute l'effet de montage, son nettoyage, puis de nouveau l'effet. L'îlot met en file d'attente les appels au module et ignore la première exécution, car son nettoyage a déjà eu lieu : le module se monte donc une seule fois et adopte le DOM serveur.
- **Nouvelle app après un montage échoué.** Quand `mount` est rejeté, l'îlot abandonne son HTML serveur. Si vous passez ensuite un autre `app` ou `name`, le nouveau module se monte dans un élément vide au lieu d'adopter le balisage de l'app en échec.
- **Modification de `ssrHtml` sur l'îlot.** L'îlot lit `ssrHtml` uniquement à son premier rendu. Passez le nouveau contenu via `props`.
- **Même nom deux fois.** `registerModule` conserve le dernier module créé sous un nom donné.

## Ce qu'il ne fait pas {#what-it-does-not-do}

- Il ne charge pas de modules par URL. Importez le module, ou laissez [`@tuvix.js/core`](/fr/packages/core) le charger via une `entry`.
- Il ne rend pas une micro app en chaîne de caractères. Côté serveur, utilisez `renderToString` de `react-dom/server` avec `TuvixReactApp`, ou le moteur de rendu propre au framework (`renderVueToString` de [`@tuvix.js/vue/server`](/fr/packages/vue), les équivalents Svelte et Angular), puis passez le résultat à `TuvixIsland` comme `ssrHtml`.
- Il ne passe pas `MountContext.bus` ni `MountContext.name` à `App`. Utilisez `getGlobalBus()` de `@tuvix.js/event-bus`.
- Il ne charge pas le CSS de l'îlot. Utilisez [`@tuvix.js/vite`](/fr/packages/vite) pour imprimer les liens de feuilles de style des îlots rendus côté serveur.
- Il ne prend pas en charge React 17 ni les versions antérieures.

## Migrer depuis la 0.4 {#migrating-from-0-4}

**Le HTML serveur de `TuvixReactApp` contient des marqueurs Suspense.** L'enveloppe contient désormais `<!--$-->…<!--/$-->` autour de l'app. Mettez à jour `@tuvix.js/react` côté serveur et côté client en même temps, sinon l'hydratation échoue avec un écart.

**`mount` est rejeté quand le premier rendu lève une erreur.** Si vous attendiez `mount` en comptant sur sa résolution, interceptez l'erreur :

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Broken(): never {
  throw new Error('boom');
}

const app = createReactMicroApp({ name: 'broken', App: Broken });
const container = document.createElement('div');

try {
  await app.mount({ container });
} catch (error) {
  // 0.4: never reached. 0.5: the render error; the container is empty.
  container.textContent = 'This section failed to load.';
}
```

**`unmount` sur un conteneur inconnu ne fait rien.** En 0.4, il vidait le conteneur. Appelez `container.replaceChildren()` vous-même si vous en dépendiez.

**Objet de configuration.** Les versions précédentes de cette page montraient `createReactMicroApp(App)`. La fonction prend un objet de configuration : `createReactMicroApp({ name: 'dashboard', App })`.

Consultez le [guide React](/fr/guide/react) pour d'autres tutoriels.
