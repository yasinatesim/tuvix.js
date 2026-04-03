---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="CLI scaffolding tool. Instantly bootstrap a Tuvix.js project with your choice of framework and tooling."
  icon="🚀"
  github="create-tuvix-app"
/>

## Utilisation

```bash
npx create-tuvix-app my-app
```

Or with a specific package manager:

```bash
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
```

## Invites Interactives

The CLI guides you through project setup:

```
✔ Project name: › my-app
✔ Template: › shell (React + Vite)
✔ Add example micro app? › Yes
✔ Package manager: › pnpm
✔ Git init? › Yes

Scaffolding project...
Done! 🎉

  cd my-app
  pnpm install
  pnpm dev
```

## Modèles

| Modèle | Description |
|--------|-------------|
| `shell` | Orchestrateur shell pour les microfrontends |
| `react-app` | Application micro React |
| `vue-app` | Application micro Vue |
| `vanilla-app` | Application micro Vanilla JS/TS |

## Spécifier le modèle directement

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-react --template react-app
npx create-tuvix-app my-vue --template vue-app
npx create-tuvix-app my-vanilla --template vanilla-app
```

## Exemples

Les applications d'exemple prédéfinies peuvent être créées en utilisant le flag `--example`:

| Exemple | Description |
|---------|-------------|
| `with-react` | Exemple de microfrontend React |
| `with-vue` | Exemple de microfrontend Vue |
| `with-svelte` | Exemple de microfrontend Svelte |
| `with-angular` | Exemple de microfrontend Angular |
| `with-ssr-react` | Rendu côté serveur avec React |
| `with-react-devtools` | Intégration React avec DevTools |
| `with-react-event-bus` | Exemple d'intégration Event-Bus |
| `with-react-router` | Exemple d'intégration Router |
| `with-react-sandbox` | Exemple d'isolation Sandbox/CSS |
| `with-module-federation-react` | Module Federation avec React |
| `with-vanilla` | Exemple de microfrontend Vanilla JS |
| `with-ssr-vanilla` | Rendu côté serveur avec Vanilla JS |
| `with-multiple-frameworks` | Intégration de plusieurs frameworks |

## Créer un exemple

```bash
npx create-tuvix-app my-app --example with-react
npx create-tuvix-app my-app --example with-vue
npx create-tuvix-app my-app --example with-multiple-frameworks
```
