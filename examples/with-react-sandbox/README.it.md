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

# with-react-sandbox

Demonstrates **CSS and JavaScript isolation** using `@tuvix.js/sandbox`.

Two React micro apps run side-by-side:
1. **App 1 (Sandboxed)** is wrapped in a Shadow DOM. Its CSS is strictly scoped and cannot break the shell or other apps.
2. **App 2 (Unsandboxed)** is injected normally. Its CSS bleeds out and overwrites the shell's global styles.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/sandbox` | `createSandbox` isolation factory |
| `@tuvix.js/react` | React bindings |

## Get started

### Via npx (recommended)

```bash
npx create-tuvix-app@latest --example with-react-sandbox my-app
cd my-app
npm install
npm run dev
```

### Manual clone

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-sandbox
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You will see App 2's CSS breaking the global shell styling!

## Key concepts

- **Shadow DOM** (`cssIsolation: true`) — attaches the micro app to an open ShadowRoot instead of a normal div, ensuring full CSS encapsulation.
- **Proxy Sandbox** (`jsIsolation`) — (optional) proxies the global `window` object to prevent globals leaks.
