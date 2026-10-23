# Qu'est-ce que Tuvix.js ?

Tuvix.js est une boîte à outils microfrontend pour le navigateur. Une page hôte (le shell) enregistre des micro apps, et Tuvix.js charge le code de chaque app, la monte dans un conteneur, lui transmet des props et la démonte quand l'URL ou votre code le demande. Chaque micro app peut utiliser React, Vue, Svelte, Angular ou aucun framework, et chaque équipe peut construire et déployer son app à son propre rythme.

## Ce que fait Tuvix.js {#what-it-does}

- **Orchestre les micro apps.** `createOrchestrator()` tient un registre des apps. Pour chacune, il décide à partir du chemin courant si l'app doit être montée, et il exécute une seule réconciliation à la fois, de sorte que deux apps qui partagent un conteneur ne se chevauchent jamais.
- **Charge le code à la demande.** L'`entry` d'une app peut être une URL de script, une liste de scripts et de feuilles de style, ou une fonction comme `() => import('./dashboard')`. Le loader relance les chargements échoués et abandonne ceux qui sont trop lents.
- **Route selon l'URL.** `activeWhen: '/dashboard/*'` monte une app sur `/dashboard` et sur chaque chemin en dessous. Vous pouvez utiliser le routeur intégré ou suivre TanStack Router ou React Router avec `connectRouter()`.
- **Adapte les frameworks.** `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp` et `createAngularMicroApp` transforment un composant racine en module doté de `mount`, `update` et `unmount`.
- **Héberge des îlots dans une page React.** `TuvixIsland` monte une micro app Vue, Svelte, Angular ou React dans un arbre React rendu côté serveur et hydrate le HTML du serveur sans l'envoyer deux fois. Voir [Îlots SSR](/fr/guide/ssr-islands).
- **Signale le cycle de vie.** Les adaptateurs et `defineMicroApp` émettent les événements DOM `tuvix:mounted`, `tuvix:unmounted` et `tuvix:error`, et `whenMounted(name)` se résout dès qu'une app est sur la page. Voir [Événements de cycle de vie](/fr/guide/lifecycle-events).
- **Relie les apps.** Toutes les apps d'une page partagent un même event bus via `getGlobalBus()`, même quand chaque app embarque sa propre copie de `@tuvix.js/event-bus`.
- **Isole le CSS à la demande.** `sandbox: true` rend une app dans un shadow root, ce qui sépare le CSS de la page de celui de l'app.

## Quand l'utiliser {#when-to-use-it}

Choisissez Tuvix.js quand plusieurs équipes livrent des parties d'une même page et doivent les déployer séparément, ou quand vous voulez garder une app legacy en service à côté d'une réécriture dans un autre framework. Il convient aussi à une seule équipe qui veut des widgets Vue ou Svelte dans un site React avec rendu côté serveur.

## Quand ne pas l'utiliser {#when-not-to-use-it}

- Une équipe, un framework, un déploiement : une application monopage classique est plus simple.
- Vous avez besoin d'une isolation de sécurité stricte entre les apps. Tuvix.js exécute chaque app dans le même realm JavaScript. `JsSandbox` de `@tuvix.js/sandbox` masque les écritures globales faites via son proxy, mais il n'empêche pas une app d'atteindre `window`. Utilisez une `<iframe>` pour du code non fiable.
- Vous voulez un seul bundle avec un état partagé entre toutes les apps. Les micro apps communiquent par des événements et des props, par conception.

## Paquets {#packages}

| Paquet | À utiliser pour |
| --- | --- |
| `tuvix.js` | Une seule installation avec core, router, event bus, loader et sandbox |
| `@tuvix.js/core` | `createOrchestrator`, `defineMicroApp` |
| `@tuvix.js/router` | `createRouter`, `matchPath`, `interceptLinks` |
| `@tuvix.js/loader` | Le chargement des entrées et le runtime du cycle de vie (`whenMounted`, `onLifecycle`) |
| `@tuvix.js/event-bus` | `createEventBus`, `getGlobalBus` |
| `@tuvix.js/sandbox` | `CssSandbox`, `JsSandbox` |
| `@tuvix.js/react`, `vue`, `svelte`, `angular` | Adaptateurs de framework, `TuvixIsland` (React) |
| `@tuvix.js/vite` | Les liens de feuilles de style des îlots pour le `<head>` rendu côté serveur |
| `@tuvix.js/server` | La composition côté serveur de fragments HTML |
| `@tuvix.js/module-federation` | Des entrées chargées depuis des remotes webpack Module Federation |
| `@tuvix.js/devtools` | Un panneau de débogage dans la page |
| `create-tuvix-app` | La génération de projets |

## Concepts clés {#key-concepts}

| Terme | Signification |
| --- | --- |
| Shell | La page hôte qui crée l'orchestrateur et possède la mise en page |
| Micro app | Un module avec `mount` et `unmount` (et, en option, `bootstrap` et `update`) |
| Entrée | L'endroit où le loader récupère une micro app : URL, `{ scripts, styles }` ou fonction de chargement |
| Conteneur | L'élément dans lequel une micro app se rend |
| Îlot | Une micro app que l'hôte rend côté serveur et que le client hydrate sur place |
| Event bus | Un canal pub/sub que toutes les apps de la page partagent |

## Étapes suivantes {#next-steps}

- [Démarrage rapide](/fr/guide/getting-started) construit un shell et deux micro apps.
- [Architecture](/fr/guide/architecture) montre comment une navigation devient un montage.
- Vous venez de la 0.4 ? Lisez [Migrer vers la 0.5](/fr/guide/migration-0-5).
