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

## Uso

```bash
npx create-tuvix-app my-app
```

Or with a specific package manager:

```bash
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
```

## Indicaciones Interactivas

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

## Plantillas

| Plantilla | Descripción |
|-----------|-------------|
| `shell` | Orquestador shell para microfrontends |
| `react-app` | Aplicación micro React |
| `vue-app` | Aplicación micro Vue |
| `vanilla-app` | Aplicación micro Vanilla JS/TS |

## Especificar Plantilla Directamente

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-react --template react-app
npx create-tuvix-app my-vue --template vue-app
npx create-tuvix-app my-vanilla --template vanilla-app
```

## Ejemplos

Las aplicaciones de ejemplo preconstruidas se pueden crear usando la bandera `--example`:

| Ejemplo | Descripción |
|---------|-------------|
| `with-react` | Ejemplo de microfrontend React |
| `with-vue` | Ejemplo de microfrontend Vue |
| `with-svelte` | Ejemplo de microfrontend Svelte |
| `with-angular` | Ejemplo de microfrontend Angular |
| `with-ssr-react` | Renderizado del lado del servidor con React |
| `with-react-devtools` | Integración de React con DevTools |
| `with-react-event-bus` | Ejemplo de integración Event-Bus |
| `with-react-router` | Ejemplo de integración Router |
| `with-react-sandbox` | Ejemplo de aislamiento Sandbox/CSS |
| `with-module-federation-react` | Module Federation con React |
| `with-multiple-frameworks` | Integración de múltiples frameworks |

## Crear un Ejemplo

```bash
npx create-tuvix-app my-app --example with-react
npx create-tuvix-app my-app --example with-vue
npx create-tuvix-app my-app --example with-multiple-frameworks
```
