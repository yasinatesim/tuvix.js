<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Exemples Tuvix.js

Des projets exécutables, un par fonctionnalité ou par framework. Chaque exemple a une spec Playwright dans son dossier `e2e/`, exécutée en CI.

## Démarrage rapide

Lancez n'importe quel exemple avec la CLI `create-tuvix-app` :

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

Dans un clone de ce dépôt, lancez `pnpm install` à la racine, puis `pnpm dev` (ou `pnpm start` pour les exemples serveur) dans le dossier de l'exemple.

## Exemples disponibles

| Exemple | Framework | Ce qu'il montre |
|---------|-----------|---------------|
| [`with-vanilla`](./with-vanilla/) | JS pur | `defineMicroApp`, routage et `interceptLinks` sans framework |
| [`with-react`](./with-react/) | React 18 | Shell, routes, props via `@tuvix.js/react` |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | Apps qui publient et reçoivent des événements sur `getGlobalBus()` |
| [`with-react-router`](./with-react-router/) | React 18 | Association route-app et navigation par liens côté client |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | Isolation CSS par shadow root avec `sandbox: true`, et une app témoin sans sandbox |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | Panneau de débogage intégré à la page de `@tuvix.js/devtools` |
| [`with-module-federation-react`](./with-module-federation-react/) | React (webpack 5) | Apps distantes chargées avec `createFederatedEntry` |
| [`with-ssr-vanilla`](./with-ssr-vanilla/) | Express | Composition de fragments côté serveur avec `composeHTML` |
| [`with-ssr-react`](./with-ssr-react/) | React (Express) | Fragments React `renderToString` composés avec `composeHTML` |
| [`with-ssr-islands`](./with-ssr-islands/) | Shell React 19, Vue 3, Svelte 5, Angular 20 (Express + Vite) | Îlots rendus côté serveur qui s'hydratent côté client, un `TuvixReactApp` inline, et un îlot en échec qui se rabat sur son fallback sans casser la page |
| [`with-vue`](./with-vue/) | Vue 3 | `createVueMicroApp` avec des props via `defineProps` |
| [`with-svelte`](./with-svelte/) | Svelte 4 | `createSvelteMicroApp` avec des props `export let` |
| [`with-angular`](./with-angular/) | Angular 16 | Composants standalone, sans zone.js, `createAngularMicroApp` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React et Vue 3 | Deux frameworks sur une même page qui partagent l'event bus |

## Traductions

Les exemples qui ont un `README.md` le fournissent aussi en turc, espagnol, allemand, français, japonais, chinois, italien, portugais et hindi. Le README anglais fait référence en cas de divergence.
