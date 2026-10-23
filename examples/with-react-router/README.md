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

Three React apps on three routes. Nav links switch apps on the client, without a page load.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator; builds the router from `router` config and re-exports `interceptLinks` |
| `@tuvix.js/router` | History-mode router, `interceptLinks` |
| `@tuvix.js/react` | `createReactMicroApp` |

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
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). The shell redirects `/` to `/dashboard`.

## What's inside

```text
with-react-router/
├── index.html          ← nav with plain <a href> links
└── src/
    ├── shell.ts        ← routes, interceptLinks, aria-current sync
    └── apps/
        ├── dashboard/  ← /dashboard/*
        ├── profile/    ← /profile/*
        └── settings/   ← /settings/* (local state)
```

## Key concepts

- **Routes name their app:** `{ path: '/dashboard/*', app: 'dashboard' }`. The apps need no `activeWhen`; the orchestrator mounts the app the current route names.
- **`interceptLinks({ navigate })`** turns same-origin left clicks on `<a href>` into `router.push(path)`. It leaves modified clicks, `target="_blank"`, `download`, `rel="external"`, `data-tuvix-reload` and other origins to the browser.
- **One container, one app:** all three apps render into `#app`. The orchestrator unmounts the old app before it mounts the new one, and only the newest route runs when you click fast.
- **Back and forward** go through the router's `popstate` listener and re-mount the previous app.
- **Code splitting:** each `entry` is a loader function such as `() => import('./apps/dashboard/main')`, so Vite emits one chunk per app.
