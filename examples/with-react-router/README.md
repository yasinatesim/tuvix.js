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

# with-react-router

Demonstrates **URL-based micro app routing** powered by `@tuvix.js/router`. Three independent React micro apps - Dashboard, Profile, and Settings - are registered to specific routes and mounted/unmounted automatically as the user navigates.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator (embeds router engine) |
| `@tuvix.js/router` | History/hash mode routing |
| `@tuvix.js/react` | `createReactMicroApp` factory |

## What's inside

```
with-react-router/
├── index.html          ← nav bar with active-link highlight
├── vite.config.ts
├── src/
│   ├── shell.ts        ← registers 3 routes, syncs active nav class
│   └── apps/
│       ├── dashboard/  ← active at /dashboard
│       ├── profile/    ← active at /profile
│       └── settings/   ← active at /settings
```

## Get started

### Via npx (recommended)

```bash
npx create-tuvix-app@latest --example with-react-router my-app
cd my-app
npm install
npm run dev
```

### Manual clone

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-router
npm install
npm run dev
```

Open [http://localhost:5173/dashboard](http://localhost:5173/dashboard) and use the nav links.

## Key concepts

- **Route matching** - each `activeWhen` pattern is matched against `window.location.pathname`. Glob patterns (`/dashboard/*`) let micro apps control their own sub-routes.
- **History mode** - uses the HTML5 History API for clean URLs without `#`.
- **Zero bundle duplication** - only the active micro app's code runs at any given time.
