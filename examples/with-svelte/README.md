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

Demonstrates basic **Svelte 4 integration** using `@tuvix.js/svelte`.

Two Svelte components (`.svelte`) are compiled by Vite, exported as Tuvix.js compatible modules via `createSvelteMicroApp`, and mounted by the core shell orchestrator. 

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
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Key concepts

- **`createSvelteMicroApp(App, config)`** — Wraps a Svelte component into the Tuvix lifecycle.
- **Props injection** — `@tuvix.js/svelte` utilizes the Svelte Context API to inject `props` passed from the shell. Inside the component, use `getContext('propName')` to retrieve them.
