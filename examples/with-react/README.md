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

A Vite shell with two React 18 apps on two routes. Nav links switch apps without a page load, and the home app receives props from the shell.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator, router config, `interceptLinks` |
| `@tuvix.js/react` | `createReactMicroApp` |

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
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). The shell redirects `/` to `/home`.

## What's inside

```text
with-react/
├── index.html
└── src/
    ├── shell.ts          ← routes, app registration, interceptLinks
    └── apps/
        ├── home/         ← receives { theme, user } from the shell
        └── about/
```

## Key concepts

- **`createReactMicroApp({ name, App })`** returns a module with `mount`, `update` and `unmount`, and registers it under `name`. Each container gets its own React root.
- **Props:** the shell passes `{ theme: 'dark', user: 'Alice' }`; `HomeApp` receives them as ordinary React props.
- **Routing:** `{ path: '/home/*', app: 'home' }` mounts `home` on `/home` and below and unmounts it when you leave.
- **Entries:** `entry: () => import('./apps/home/main')` lets Vite split each app into its own chunk. An app deployed on its own would use a URL instead, such as `entry: 'https://cdn.example.com/home/main.js'`.
