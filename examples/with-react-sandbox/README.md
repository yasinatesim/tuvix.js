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

CSS isolation with `sandbox: true`. App 1 renders inside a shadow root; App 2 renders in the page and its CSS leaks, as a control.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator; `sandbox: true` uses `CssSandbox` from `@tuvix.js/sandbox` |
| `@tuvix.js/react` | `createReactMicroApp` |

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
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## What you should see

| Element | Color | Why |
|---|---|---|
| Shell paragraph | light blue | page rule `p { color: #93c5fd }`; App 1's red `p` rule stays in its shadow root |
| App 1 paragraphs | red | App 1's own `<style>` inside the shadow root |
| App 1 `.global-card` box | no shell background | the page's `.global-card` rule cannot select elements in the shadow root |
| Shell note | orange | App 2 has no sandbox, so its `.shell-note` rule applies to the whole page |

## Key concepts

- **`sandbox: true`** (or `{ css: true }`) attaches an open shadow root to the container and mounts the app into an element inside it. A remount reuses the same shadow root.
- **Styles that stay inside:** `<style>` elements the app renders, and stylesheets listed in an `entry` object's `styles`, which the orchestrator adopts into the shadow root.
- **Styles that do not:** CSS a bundler injects into `document.head` (for example `import './app.css'` under Vite) still applies to the page. Inherited properties such as `color` and `font-family` also flow into the shadow root from its host.
- **No JS isolation:** `sandbox: true` isolates CSS only. The proxy-based JS sandbox is a separate utility in `@tuvix.js/sandbox`.
