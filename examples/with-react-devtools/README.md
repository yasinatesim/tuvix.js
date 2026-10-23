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

The in-page debug panel from `@tuvix.js/devtools` attached to a shell with two React apps.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/devtools` | `installDevTools(orchestrator)` |
| `@tuvix.js/event-bus` | `getGlobalBus()` for the demo event |
| `@tuvix.js/react` | `createReactMicroApp` |

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
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). The panel sits in the bottom-right corner; the button above it hides and shows it.

## Key concepts

- **`installDevTools(orchestrator, options?)`** appends `#tuvix-devtools` to `<body>`. Once per second (`updateInterval`) it lists every registered app, marks mounted ones with a green dot, and shows the current route. It returns a function that removes the panel.
- **Event log:** the panel subscribes to the orchestrator's bus with `onAny`. Click **Emit app1:ping** in the left app and the event shows up in the log. The orchestrator's bus is `getGlobalBus()`, so an app that emits on the global bus reaches the panel.
- **What it does not do:** the panel has no error tab and does not show props or timings. Leave it out of production builds by calling `installDevTools` behind your own environment check.
