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

# with-react

A complete micro-frontend shell built with **React 18** and **Vite**, demonstrating how the Tuvix.js orchestrator loads, mounts, and unmounts independent React micro apps - each with their own lifecycle and prop passing.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/react` | `createReactMicroApp` factory |
| `@tuvix.js/event-bus` | Shared event bus (peer dep) |

## What's inside

```
with-react/
├── index.html
├── vite.config.ts
├── src/
│   ├── shell.ts          ← boots orchestrator, registers micro apps
│   └── apps/
│       ├── home/         ← Home micro app (React)
│       └── about/        ← About micro app (React)
```

## Get started

### Via npx (recommended)

```bash
npx create-tuvix-app@latest --example with-react my-app
cd my-app
npm install
npm run dev
```

### Manual clone

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react
npm install
npm run dev
```

Open [http://localhost:5173/home](http://localhost:5173/home)

## Key concepts

- **`createReactMicroApp`** - wraps a React component into a Tuvix.js-compatible module with `bootstrap`, `mount`, `unmount`, and `update` hooks.
- **Prop passing** - the shell passes `{ theme, user }` props to the `home` app; the component receives them as standard React props.
- **Lifecycle** - each app is only mounted when its route is active and cleanly unmounted when navigating away.
