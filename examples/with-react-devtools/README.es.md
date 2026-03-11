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

# with-react-devtools

Demonstrates the **In-page DevTools panel** (`@tuvix.js/devtools`). 

The DevTools panel provides real-time visibility into the Tuvix.js orchestrator instance, allowing developers to inspect registered applications, view active mounted apps, track lifecycle events, and monitor the event bus.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/devtools` | `initDevtools` function |
| `@tuvix.js/react` | React bindings |

## Get started

### Via npx (recommended)

```bash
npx create-tuvix-app@latest --example with-react-devtools my-app
cd my-app
npm install
npm run dev
```

### Manual clone

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-devtools
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You will see a floating **Tuvix logo** in the bottom right corner. Click it to open the debug panel.

## Key concepts

- **`initDevtools(orchestrator)`** - Imports the devtools bundle and injects a floating UI onto the page. Safe to leave in code (it is typically tree-shaken away in production builds if wrapped in `process.env.NODE_ENV !== 'production'`).
- **Simulate Error button** - App 2 has a button that throws an error. Click it and check the DevTools "Errors" tab to see how the orchestrator catches and logs it.
