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

## Verwendung

```bash
npx create-tuvix-app my-app
```

Or with a specific package manager:

```bash
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
```

## Vorlagen

| Vorlage | Beschreibung |
|---------|-------------|
| `shell` | Shell-Orchestrator für Mikro-Frontends |
| `react-app` | React-Mikro-App |
| `vue-app` | Vue-Mikro-App |
| `vanilla-app` | Vanilla JS/TS-Mikro-App |

## Vorlage direkt angeben

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-react --template react-app
npx create-tuvix-app my-vue --template vue-app
npx create-tuvix-app my-vanilla --template vanilla-app
```

## Beispiele

Vordefinierte Beispielanwendungen können mit der Flag `--example` erstellt werden:

| Beispiel | Beschreibung |
|----------|-------------|
| `with-react` | React-Mikro-Frontend-Beispiel |
| `with-vue` | Vue-Mikro-Frontend-Beispiel |
| `with-svelte` | Svelte-Mikro-Frontend-Beispiel |
| `with-angular` | Angular-Mikro-Frontend-Beispiel |
| `with-ssr-react` | Server-seitiges Rendering mit React |
| `with-react-devtools` | React-Integration mit DevTools |
| `with-react-event-bus` | Event-Bus-Integrationsbeispiel |
| `with-react-router` | Router-Integrationsbeispiel |
| `with-react-sandbox` | Sandbox/CSS-Isolationsbeispiel |
| `with-module-federation-react` | Module Federation mit React |
| `with-vanilla` | Vanilla JS-Mikro-Frontend-Beispiel |
| `with-ssr-vanilla` | Server-seitiges Rendering mit Vanilla JS |
| `with-multiple-frameworks` | Integration mehrerer Frameworks |

## Ein Beispiel erstellen

```bash
npx create-tuvix-app my-app --example with-react
npx create-tuvix-app my-app --example with-vue
npx create-tuvix-app my-app --example with-multiple-frameworks
```
