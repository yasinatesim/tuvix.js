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

# with-multiple-frameworks

Demonstrates a **Polyglot Micro-Frontend** architecture where multiple UI frameworks coexist on the same page.

A single Tuvix.js orchestrator dynamically loads and mounts a **React 18** application and a **Vue 3** application side-by-side.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/react` | Wraps the React component into a standard Tuvix module |
| `@tuvix.js/vue` | Wraps the Vue component into a standard Tuvix module |

## Get started

### Via npx (recommended)

```bash
npx create-tuvix-app@latest --example with-multiple-frameworks my-app
cd my-app
npm install
npm run dev
```

### Manual clone

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-multiple-frameworks
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Key concepts

- **Framework Agnostic Shell** - The `@tuvix.js/core` orchestrator doesn't know or care about React or Vue. It only deals with standard lifecycle functions (`bootstrap`, `mount`, `unmount`, `update`).
- **Adapter Packages** - The framework-specific Tuvix packages (`@tuvix.js/react`, `@tuvix.js/vue`, etc.) handle the heavy lifting of translating standard Tuvix lifecycle events into framework-native render trees.
