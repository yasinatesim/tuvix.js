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

# with-svelte

Two Svelte 4 components mounted by one Tuvix.js shell. This example is the bundled Svelte 4 check for `@tuvix.js/svelte`, which also supports Svelte 5.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/svelte` | `createSvelteMicroApp` wrapper |

## Get started

### Via npx (recommended)

```bash
npx create-tuvix-app@latest --example with-svelte my-app
cd my-app
npm install
npm run dev
```

### Manual clone

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-svelte
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## Key concepts

- **`createSvelteMicroApp({ name, App })`** wraps a compiled Svelte component. On first mount it checks the installed Svelte: with Svelte 5 it uses `mount`/`hydrate`, with Svelte 3/4 the class API (`new App({ target, props })`).
- **Props are component props:** the shell's `props` arrive as `export let name` / `export let theme`. On Svelte 3/4 an orchestrator `updateAppProps` call goes through `$set`; on Svelte 5 the component updates in place.
- **Local state:** the Home app's counter is ordinary Svelte state; the adapter does not touch it.
- **One instance per container:** mounting the same module into two containers creates two independent components.
