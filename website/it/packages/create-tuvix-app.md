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

## Utilizzo

```bash
npx create-tuvix-app my-app
```

Or with a specific package manager:

```bash
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
```

## Template

| Template | Descrizione |
|----------|-------------|
| `shell` | Orchestratore shell per microfrontend |
| `react-app` | App micro React |
| `vue-app` | App micro Vue |
| `vanilla-app` | App micro Vanilla JS/TS |

## Specificare il template direttamente

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-react --template react-app
npx create-tuvix-app my-vue --template vue-app
npx create-tuvix-app my-vanilla --template vanilla-app
```

## Esempi

Le applicazioni di esempio precostruite possono essere create utilizzando il flag `--example`:

| Esempio | Descrizione |
|---------|-------------|
| `with-react` | Esempio di microfrontend React |
| `with-vue` | Esempio di microfrontend Vue |
| `with-svelte` | Esempio di microfrontend Svelte |
| `with-angular` | Esempio di microfrontend Angular |
| `with-ssr-react` | Rendering lato server con React |
| `with-react-devtools` | Integrazione React con DevTools |
| `with-react-event-bus` | Esempio di integrazione Event-Bus |
| `with-react-router` | Esempio di integrazione Router |
| `with-react-sandbox` | Esempio di isolamento Sandbox/CSS |
| `with-module-federation-react` | Module Federation con React |
| `with-vanilla` | Esempio di microfrontend Vanilla JS |
| `with-ssr-vanilla` | Rendering lato server con Vanilla JS |
| `with-multiple-frameworks` | Integrazione di più framework |

## Crea un esempio

```bash
npx create-tuvix-app my-app --example with-react
npx create-tuvix-app my-app --example with-vue
npx create-tuvix-app my-app --example with-multiple-frameworks
```
