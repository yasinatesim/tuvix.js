# @tuvix.js/react

> Transformez des composants React en micro apps Tuvix.js, et hébergez n'importe quelle micro app dans un arbre React avec hydratation SSR.

Fait partie du framework microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Installation

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

Nécessite React 18 ou plus récent.

## Démarrage rapide

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Le module s'enregistre sous `'dashboard'` via `registerModule` de `@tuvix.js/loader`, donc l'orchestrateur le trouve une fois le script chargé. Donnez à l'orchestrateur une `entry` comme `() => import('./dashboard')`, un `container` et des `props`.

## API

### `createReactMicroApp(config)`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Option | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Nom dans le registre ; les événements de cycle de vie le portent. |
| `App` | `ComponentType<P>` | requis | Composant racine. Reçoit les props de montage ; les props requises sont vérifiées par le typage. |
| `bootstrap` | `() => void \| Promise<void>` | aucun | Initialisation unique. |
| `ssr` | `boolean` | `false` | Hydrate avec `hydrateRoot` quand le conteneur contient du markup serveur (des éléments ou du texte non blanc). |

- Chaque conteneur reçoit sa propre racine React, donc un même module peut se monter à plusieurs endroits.
- `mount({ container, props })` se résout après le premier commit et émet `tuvix:mounted` avec `hydrated`.
- `update({ props, container })` refait le rendu d'un conteneur, ou de tous sans `container`. L'état des composants est conservé.
- `unmount({ container })` démonte la racine, vide le conteneur et émet `tuvix:unmounted`.
- `react-dom/client` se charge à la demande dans `mount`, donc les bundles serveur peuvent importer le module.

### `createSsrReactMicroApp(config)`

`createReactMicroApp({ ...config, ssr: true })`. Options : `name`, `App`, `bootstrap`. Il rend le même arbre que `TuvixReactApp`, donc il hydrate le markup de `TuvixReactApp` sans décalage (mismatch).

### `TuvixIsland`

Héberge n'importe quel module de micro app (Vue, Svelte, Angular, React ou un `{ mount, unmount, update? }` écrit à la main) dans un arbre React.

| Prop | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Écrit dans `data-tuvix-app`, passé à `mount`. |
| `app` | `MicroAppModule` | requis | Le module à monter. |
| `props` | `Record<string, unknown>` | `{}` | Comparées superficiellement ; un changement appelle `app.update({ props, container })`, ou remonte quand le module n'a pas d'`update`. |
| `ssrHtml` | `string` | aucun | HTML de l'îlot rendu côté serveur. Passez-le uniquement sur le serveur. |
| `fallback` | `ReactNode` | `null` | Rendu quand `mount` ou `update` est rejeté. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Balise englobante. |
| `className` | `string` | aucun | Classe de l'élément englobant. |

Un pont écrit à la main `<div dangerouslySetInnerHTML={{ __html }} />` perd le DOM et les écouteurs de la micro app au prochain rendu du parent, car React réaffecte `innerHTML` pour chaque nouvel objet `{ __html }`. `TuvixIsland` crée cet objet une seule fois. Pendant l'hydratation, il retrouve son élément grâce à un attribut `data-tuvix-island` (issu de `useId`) et relit le HTML depuis la page, donc le client n'a pas besoin de `ssrHtml`. Un nouveau `name` ou `app` provoque un remontage ; la suppression appelle `app.unmount`. Les appels s'exécutent dans l'ordre, donc un démontage attend un montage en cours.

```tsx
// Layout.tsx, rendered on the server with footerHtml and on the client without it
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <TuvixIsland name="footer" app={footer} props={{ year }} ssrHtml={footerHtml} fallback={<footer>© {year}</footer>} />
  );
}
```

```tsx
// entry-server.tsx
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const footerHtml = await renderVueToString(Footer, { year: 2026 });
  return renderToString(<Layout year={2026} footerHtml={footerHtml} />);
}
```

```tsx
// entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

### `TuvixReactApp`

Rend une micro app React directement dans l'arbre hôte, à l'intérieur de `<div data-tuvix-app={name}>`.

| Prop | Type | Défaut | Signification |
| --- | --- | --- | --- |
| `name` | `string` | requis | Doit correspondre au `name` du module. |
| `App` | `ComponentType<P>` | requis | Composant à rendre. |
| `fallback` | `ReactNode` | `null` | Affiché pendant que `App` est suspendu ou après une erreur levée. |
| autres props | `P` | requises par `P` | Passées à `App`. |

`App` se trouve dans un error boundary et un `<Suspense fallback>`. Une erreur de rendu côté serveur remplace uniquement cette app par `fallback`, et React la retente côté client. Une erreur de rendu côté client affiche `fallback` et émet `tuvix:error`. Il émet `tuvix:mounted` (avec `hydrated`) et `tuvix:unmounted`.

### `useTuvixBus(bus, event, handler)`

S'abonne dans un effet et se désabonne au démontage. Le dernier `handler` est conservé dans une ref, donc il ne se réabonne pas à chaque rendu. Passez `getGlobalBus()` de `@tuvix.js/event-bus` ; l'adaptateur ne transmet pas le bus de l'orchestrateur à `App`.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Renvoie des props qui fusionnent chaque payload de `updateEvent` (par défaut `'tuvix:props:update'`) sur `bus`. Rien dans Tuvix n'émet cet événement ; c'est vous qui l'émettez. Les modules issus de `createReactMicroApp` reçoivent les nouvelles props via `update` sans ce hook.

### Types

`ReactMicroAppConfig<P>`, `TuvixIslandProps`, `TuvixReactAppProps<P>`.

## Cas particuliers

- Une erreur levée au premier rendu rejette `mount`, vide le conteneur et émet `tuvix:error`. Une erreur ultérieure laisse l'app vide jusqu'à ce que vous la remontiez.
- `unmount` pendant un `mount` en cours attend celui-ci et laisse le conteneur vide.
- `mount` sur un conteneur que le module occupe déjà démonte l'ancienne racine (en émettant `tuvix:unmounted`) et refait un rendu neuf avec les nouvelles props, comme les adaptateurs Vue, Svelte et Angular.
- `unmount` et `update` sur un conteneur inconnu ne font rien.
- Quand React supprime un `TuvixIsland`, le module signale `tuvix:unmounted` après le détachement de l'élément. L'événement part vers `document` (avec `detail.container` renseigné), donc les écouteurs sur `document` et `onLifecycle` le reçoivent ; les écouteurs sur le conteneur ou ses ancêtres, non. `isMounted(name)` passe à `false` dès qu'aucun conteneur de l'app n'est monté.
- Sous `<StrictMode>` en développement, React exécute deux fois l'effet de montage de l'îlot, mais l'îlot ignore la première exécution abandonnée : le module se monte une seule fois et adopte le markup serveur.
- Après un montage échoué, un nouvel `app` ou `name` se monte dans un élément vide. Il ne reçoit jamais le HTML serveur de l'app en échec.

## Ce qu'il ne fait pas

- Charger des modules par URL. Utilisez `@tuvix.js/core` ou `@tuvix.js/loader`.
- Rendre en chaîne de caractères. Utilisez `react-dom/server`, ou `renderVueToString` et ses équivalents pour `ssrHtml`.
- Charger le CSS des îlots. Utilisez `@tuvix.js/vite`.

## Changements cassants en 0.5

- Le HTML serveur de `TuvixReactApp` contient désormais des marqueurs de commentaire Suspense ; mettez à jour le serveur et le client ensemble.
- `mount` est rejeté quand le premier rendu lève une erreur.
- `unmount` sur un conteneur que le module n'a jamais monté ne fait rien.

Documentation complète : [tuvix.js.org/packages/react](https://tuvix.js.org/packages/react)

## Licence

MIT
