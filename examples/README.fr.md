<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Exemples Tuvix.js

Ce répertoire contient des exemples de projets autonomes et entièrement fonctionnels démontrant diverses fonctionnalités et intégrations de frameworks de l'orchestrateur **Tuvix.js**.

## Démarrage Rapide

La façon la plus simple de commencer un exemple est d'utiliser le CLI `create-tuvix-app` avec le drapeau `--example`:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

*(Vous pouvez également cloner ce référentiel et exécuter manuellement `npm install` et `npm run dev` dans le dossier de n'importe quel exemple).*

## Exemples Disponibles

| Nom de l'Exemple | Framework | Fonctionnalité Clé Démontrée |
|--------------|-----------|--------------------------|
| [`with-react`](./with-react/) | React 18 | Basic Shell, Routing, and Prop passing via `@tuvix.js/react` |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | Cross-app pub/sub communication using `@tuvix.js/event-bus` |
| [`with-react-router`](./with-react-router/) | React 18 | URL-based active routing using `@tuvix.js/router` |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | Strict Shadow DOM CSS isolation via `@tuvix.js/sandbox` |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | In-page orchestrator debugging via `@tuvix.js/devtools` |
| [`with-module-federation-react`](./with-module-federation-react/) | React (Webpack 5) | Dynamic remote module loading via `@tuvix.js/module-federation` |
| [`with-ssr-react`](./with-ssr-react/) | React (Express) | Asynchronous SSR HTML fragment composition via `@tuvix.js/server` |
| [`with-vue`](./with-vue/) | Vue 3 | Vue 3 composition API integration via `@tuvix.js/vue` |
| [`with-svelte`](./with-svelte/) | Svelte 4 | Svelte integration and Context API props via `@tuvix.js/svelte` |
| [`with-angular`](./with-angular/) | Angular 15+ | Angular CLI setup and `@Input()` injection via `@tuvix.js/angular` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React & Vue 3 | Polyglot architecture (sharing a single shell across frameworks) |

## Support Multilingue

Chaque exemple fournit une documentation en **10 langues** (anglais, turc, espagnol, allemand, français, japonais, chinois, italien, portugais et hindi). Ouvrez le répertoire de n'importe quel exemple pour voir les fichiers README localisés.
