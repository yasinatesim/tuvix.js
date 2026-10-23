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

# with-module-federation-react

A Vite shell that loads two React apps from webpack 5 Module Federation remotes at runtime.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/module-federation` | `createFederatedLoader` and `createFederatedEntry` |
| `@tuvix.js/react` | `createReactMicroApp` inside each remote |

## Get started

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js
pnpm install
pnpm --filter "@tuvix.js/*" build
cd examples/with-module-federation-react
pnpm start
```

`pnpm start` runs three dev servers in parallel:

1. `remote1` (webpack dev server) on port 3001
2. `remote2` (webpack dev server) on port 3002
3. `shell` (Vite) on port 3000

Open [http://localhost:3000](http://localhost:3000).

## What's inside

```text
with-module-federation-react/
├── remote1/                 ← webpack 5, exposes './App' as remoteEntry.js on :3001
│   └── src/App.jsx          ← default export: createReactMicroApp({ name: 'remote1', App })
├── remote2/                 ← same shape on :3002
└── shell/
    └── src/shell.ts         ← registers both remotes with createFederatedEntry
```

## Key concepts

- **`createFederatedLoader({ remotes })`** knows each remote's name and `remoteEntry.js` URL.
- **`loader.createFederatedEntry('remote1', './App')`** returns a loader function you pass as `entry`. On the first mount it loads `remoteEntry.js` once, initialises the container once, calls `get('./App')` and returns the remote's default export.
- **Failure isolation:** each app has a `fallback` string. If a remote is down, the loader retries, then the shell shows that app's fallback and the other remote keeps running.
- **No shared React:** the shell is built with Vite, which has no webpack share scope, so each remote bundles its own React. Both remotes still share one Tuvix runtime, because `registerModule` and the lifecycle state live on `window`.
