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

Demonstrates how to use Tuvix.js orchestrator with **Webpack 5 Module Federation**.

The `@tuvix.js/module-federation` package allows a modern Vite shell to dynamically load modules from legacy or pure Webpack 5 remotes at runtime, sharing dependencies like React across the boundary.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/module-federation` | `createFederatedLoader` to fetch Webpack remotes |
| `@tuvix.js/react` | Used in the React remotes to export Tuvix modules |

## Get started

### Requirements
You must have `webpack-cli` and `serve` installed (included in devDependencies, so `pnpm install` handles this).

### Via npx (recommended)

```bash
npx create-tuvix-app@latest --example with-module-federation-react my-app
cd my-app
pnpm install
pnpm start
```

### Manual clone

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-module-federation-react
pnpm install
pnpm start
```

This will concurrently:
1. Start `remote1` server on port 3001
2. Start `remote2` server on port 3002
3. Start the `shell` Vite server on port 3000

Open [http://localhost:3000](http://localhost:3000).

## Key concepts

- **`createFederatedLoader`** — Creates a loader configured with your Webpack remote URLs.
- **Custom `load` hook** — Instead of a standard URL entry, the orchestrator app config overrides the `load` phase: `load: () => loader.createFederatedApp('remote1', './App')`.
- **Shared Dependencies** — The Webpack remotes are configured to share `react` and `react-dom` as singletons, reducing network payload and preventing duplicate React context crashes.
