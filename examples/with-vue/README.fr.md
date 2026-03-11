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

Demonstrates basic **Vue 3 integration** using `@tuvix.js/vue`.

Two Vue Single-File Components (`.vue`) are compiled by Vite, exported as Tuvix.js compatible modules via `createVueMicroApp`, and loaded dynamically by the central orchestrator.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/vue` | `createVueMicroApp` wrapper, `useTuvixProps` composable |

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
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Key concepts

- **`createVueMicroApp(App, config)`** - Wraps a root Vue component automatically hooking into the Tuvix mount/unmount lifecycle.
- **`useTuvixProps()`** - A Vue composable that makes shell-provided properties available as reactivity wrapped Vue refs inside your component setup.
