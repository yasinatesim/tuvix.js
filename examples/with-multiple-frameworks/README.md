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

A React 18 app and a Vue 3 app on the same page, talking to each other over the shared event bus.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator, `getGlobalBus` |
| `@tuvix.js/react` | `createReactMicroApp` |
| `@tuvix.js/vue` | `createVueMicroApp` |

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
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) and click **Send click to Vue** in the React app.

## Key concepts

- **The shell knows no framework:** it registers two entries and calls `mount`/`unmount` on whatever module each returns.
- **Adapters do the rendering:** `@tuvix.js/react` creates a React root per container, `@tuvix.js/vue` a Vue app per container.
- **Cross-framework events:** the React app calls `getGlobalBus().emit('react:clicked', { count })`; the Vue app subscribes with `getGlobalBus().on(...)` and unsubscribes in `onBeforeUnmount`.
