<p align="center">
  <a href="./README.md">🇬🇧 English</a> ·
  <a href="./README.tr.md">🇹🇷 Türkçe</a> ·
  <a href="./README.es.md">🇪🇸 Español</a> ·
  <a href="./README.de.md">🇩🇪 Deutsch</a> ·
  <a href="./README.fr.md">🇫🇷 Français</a> ·
  <a href="./README.ja.md">🇯🇵 日本語</a> ·
  <a href="./README.zh.md">🇨🇳 中文</a> ·
  <a href="./README.it.md">🇮🇹 Italiano</a> ·
  <a href="./README.pt.md">🇧🇷 Português</a> ·
  <a href="./README.hi.md">🇮🇳 हिंदी</a>
</p>

# with-vue

Two Vue 3 single-file components mounted by one Tuvix.js shell, each receiving props from the shell.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/vue` | `createVueMicroApp` wrapper |

## Get started

### Via npx (recommended)

```bash
npx create-tuvix-app@latest --example with-vue my-app
cd my-app
npm install
npm run dev
```

### Manual clone

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-vue
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## Key concepts

- **`createVueMicroApp({ name, App })`** creates one Vue app per container and renders `App` with the shell's props.
- **Props are component props:** declare them with `defineProps` (`HomeApp.vue` reads `name`, `ProfileApp.vue` reads `theme`). When the shell calls `orchestrator.updateAppProps(name, props)`, the adapter writes the new values into a reactive object and the component re-renders without losing local state.
- **`inject('tuvixProps')`** returns the same reactive props object, for components deep in the tree.
- **Code splitting:** each `entry` is `() => import('./apps/home/main')`, so Vite emits one chunk per app.
