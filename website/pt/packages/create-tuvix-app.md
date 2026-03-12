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

## Prompts Interativos

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

## Modelos

| Template | Description |
|----------|-------------|
| `shell-react` | Shell app with React host |
| `shell-vue` | Shell app with Vue host |
| `micro-react` | React micro app |
| `micro-vue` | Vue micro app |
| `micro-svelte` | Svelte micro app |
| `micro-angular` | Angular micro app |
| `micro-vanilla` | Vanilla JS/TS micro app |
| `monorepo` | Full monorepo with shell + 2 micro apps |

## Especificar modelo diretamente

```bash
npx create-tuvix-app my-app --template monorepo
npx create-tuvix-app my-micro --template micro-react
```
