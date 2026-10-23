# Avec React

`@tuvix.js/react` remplit trois rôles. `createReactMicroApp` transforme un composant React en une micro app que n'importe quel shell peut monter. `TuvixReactApp` rend une micro app React dans une page hôte React, avec rendu côté serveur. `TuvixIsland` héberge une micro app Vue, Svelte, Angular, React ou écrite à la main dans une page React.

Nécessite React 18 ou 19.

## Installation {#install}

```bash
pnpm add @tuvix.js/react react react-dom
```

## Transformer un composant en micro app {#turn-a-component-into-a-micro-app}

```tsx
// src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile ${theme}`}>User {userId}</div>;
}

export default createReactMicroApp({ name: 'profile', App: Profile });
```

Le module :

- s'enregistre sous `name`, pour qu'une entrée par URL le trouve ;
- crée une racine React par conteneur, pour qu'un même module puisse être monté à plusieurs endroits ;
- résout `mount` après que React a validé le premier rendu, puis émet `tuvix:mounted` sur le conteneur ;
- transmet les props du shell à `App` comme ses props. `App` peut déclarer des props obligatoires ; l'adaptateur ne les vérifie pas à l'exécution.

| Option | Type | Description |
| --- | --- | --- |
| `name` | `string` | Obligatoire. Doit correspondre au nom de l'app enregistrée. |
| `App` | `ComponentType<P>` | Obligatoire. Composant racine. |
| `bootstrap` | `() => void \| Promise<void>` | S'exécute une fois avant le premier montage. |
| `ssr` | `boolean` | Hydrate quand le conteneur contient du balisage serveur. `createSsrReactMicroApp` l'active. |

## Props et mises à jour {#props-and-updates}

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'light' });
```

`update({ props, container })` rend à nouveau la racine de ce conteneur avec les props fusionnées. L'état des composants est conservé. Sans `container`, il rend à nouveau toutes les racines du module. Appeler `mount` sur un conteneur dans lequel ce module a déjà rendu provoque un nouveau rendu au lieu de créer une seconde racine.

## Erreurs {#errors}

L'adaptateur enveloppe `App` dans un error boundary :

- Une exception pendant le premier rendu rejette `mount`, vide le conteneur et émet `tuvix:error`. L'orchestrateur affiche alors le HTML `fallback` de l'app.
- Une exception après ce rendu vide l'app et émet `tuvix:error`. Le reste de la page continue de fonctionner.

## Apps React rendues côté serveur {#server-rendered-react-apps}

Quand la page hôte est en React et se rend côté serveur (TanStack Start, Next.js, Remix ou votre propre `renderToString`), rendez la micro app en ligne avec `TuvixReactApp` :

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

- Il rend `<div data-tuvix-app="legal">` autour de `App`, donc le HTML provient du rendu serveur de l'hôte lui-même.
- Toutes les props sauf `name`, `App` et `fallback` vont à `App`.
- `App` se trouve dans son propre `<Suspense fallback>`. S'il lève une exception sur le serveur, React envoie le fallback pour cette app uniquement et réessaie l'app côté client.
- Côté client, un error boundary affiche `fallback` et émet `tuvix:error`.
- Après le premier commit, il émet `tuvix:mounted` avec `hydrated: true` lorsqu'il a hydraté du HTML serveur, et `tuvix:unmounted` lorsqu'il quitte l'arbre.

Quand un bundle séparé doit hydrater ce balisage (par exemple une page composée par `@tuvix.js/server`), exportez le même composant avec `createSsrReactMicroApp`. Il rend le même arbre Suspense, donc l'hydratation correspond :

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export default createSsrReactMicroApp({ name: 'legal', App: LegalPage });
```

Avec `ssr: true`, un conteneur qui ne contient que des espaces ou des commentaires reçoit un nouveau rendu au lieu d'une hydratation.

## Héberger d'autres micro apps avec TuvixIsland {#host-other-micro-apps-with-tuvixisland}

`TuvixIsland` monte n'importe quel module de micro app dans un arbre React :

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });

export function Footer({ newsletterHtml }: { newsletterHtml?: string }) {
  return (
    <TuvixIsland
      name="newsletter"
      app={newsletter}
      props={{ list: 'weekly' }}
      ssrHtml={newsletterHtml}
      fallback={<p>Subscribe at example.com/newsletter</p>}
    />
  );
}
```

| Prop | Description |
| --- | --- |
| `name` | Écrit dans `data-tuvix-app` et transmis à `mount`. |
| `app` | Le module à monter. |
| `props` | Comparées superficiellement à chaque rendu. Un changement appelle `app.update`, ou un démontage + montage quand le module n'a pas d'`update`. |
| `ssrHtml` | HTML serveur de l'îlot. Nécessaire uniquement sur le serveur. |
| `fallback` | Rendu à la place de l'îlot quand `mount` ou `update` est rejeté. |
| `as`, `className` | Balise de l'enveloppe (`div` par défaut) et classe. |

React ne réécrit jamais le HTML interne de l'îlot après le premier rendu, donc les nouveaux rendus du parent conservent le DOM et les écouteurs attachés par le module. Un nouveau `name` ou `app` provoque un remontage ; retirer l'îlot appelle `app.unmount`. Le montage, la mise à jour et le démontage s'exécutent l'un après l'autre, donc un démontage qui arrive pendant `mount` attend sa fin.

`TuvixIsland` ne charge pas les modules par URL. Importez le module, ou laissez l'orchestrateur gérer les entrées par URL. La configuration serveur complète se trouve dans [Îlots SSR](/fr/guide/ssr-islands).

## Hooks {#hooks}

### useTuvixBus

S'abonne au montage et se désabonne au démontage. Il lit le `handler` le plus récent via une ref, donc un handler en ligne ne se réabonne pas à chaque rendu :

```tsx
import { useState } from 'react';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/react';

const bus = getGlobalBus();

export function CartBadge() {
  const [count, setCount] = useState(0);
  useTuvixBus<{ itemCount: number }>(bus, 'cart:updated', ({ itemCount }) => setCount(itemCount));
  return <span className="badge">{count}</span>;
}
```

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` renvoie un état qui fusionne chaque payload émis sur `updateEvent`. Rien dans Tuvix.js n'émet cet événement ; émettez-le vous-même quand vous voulez transmettre des props via le bus plutôt que via `updateAppProps`.

```tsx
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixProps } from '@tuvix.js/react';

const bus = getGlobalBus();

export function Theme() {
  const props = useTuvixProps({ theme: 'light' }, bus);
  return <p>Theme: {props.theme}</p>;
}

bus.emit('tuvix:props:update', { theme: 'dark' });
```

## Ce que l'adaptateur ne fait pas {#what-the-adapter-does-not-do}

- Il ne partage pas une racine React entre les micro apps. Chaque app, et chaque conteneur, a la sienne.
- Il ne déduplique pas React. Deux micro apps React empaquetées séparément embarquent deux copies de React.
- Il ne rend pas le `<head>` de la page hôte. Les titres et les balises meta relèvent de l'hôte.

## API {#api}

| Export | Rôle |
| --- | --- |
| `createReactMicroApp({ name, App, bootstrap?, ssr? })` | Module de micro app React |
| `createSsrReactMicroApp({ name, App, bootstrap? })` | Identique avec `ssr: true` |
| `TuvixReactApp` | Micro app React en ligne dans un hôte React, avec SSR |
| `TuvixIsland` | Héberge n'importe quel module de micro app dans un arbre React, avec SSR |
| `useTuvixBus(bus, event, handler)` | Abonnement à l'event bus lié au composant |
| `useTuvixProps(initial, bus?, event?)` | Props fusionnées à partir des événements du bus |
