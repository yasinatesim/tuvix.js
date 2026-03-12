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

## Usage

```bash
npx create-tuvix-app my-app
```

Or with a specific package manager:

```bash
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
```

## Interactive Prompts

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

## Templates

| Template | Description |
|----------|-------------|
| `shell` | Shell orchestrator for microfrontends |
| `react-app` | React micro app |
| `vue-app` | Vue micro app |
| `vanilla-app` | Vanilla JS/TS micro app |

## Specify Template Directly

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-react --template react-app
npx create-tuvix-app my-vue --template vue-app
npx create-tuvix-app my-vanilla --template vanilla-app
```

## Examples

Pre-built example applications can be scaffolded using the `--example` flag:

| Example | Description |
|---------|-------------|
| `with-react` | React microfrontend example |
| `with-vue` | Vue microfrontend example |
| `with-svelte` | Svelte microfrontend example |
| `with-angular` | Angular microfrontend example |
| `with-ssr-react` | Server-side rendering with React |
| `with-react-devtools` | React integration with DevTools |
| `with-react-event-bus` | Event-Bus integration example |
| `with-react-router` | Router integration example |
| `with-react-sandbox` | Sandbox/CSS isolation example |
| `with-module-federation-react` | Module Federation with React |
| `with-multiple-frameworks` | Multiple frameworks integration |

## Scaffold an Example

```bash
npx create-tuvix-app my-app --example with-react
npx create-tuvix-app my-app --example with-vue
npx create-tuvix-app my-app --example with-multiple-frameworks
```
