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

# with-react-event-bus

Demonstrates **cross-app event communication** using `@tuvix.js/event-bus` and the `useTuvixBus` React hook. Three independent micro apps share a single bus instance: the **Header** publishes `user:login` events; the **Sidebar** and **Content** apps react in real time without any direct coupling.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/event-bus` | `createEventBus` - shared singleton |
| `@tuvix.js/react` | `createReactMicroApp`, `useTuvixBus` hook |

## What's inside

```
with-react-event-bus/
├── index.html
├── vite.config.ts
├── src/
│   ├── shell.ts              ← creates bus, registers 3 apps, passes bus as prop
│   └── apps/
│       ├── header/           ← publishes user:login on button click
│       ├── sidebar/          ← subscribes via useTuvixBus, shows event log
│       └── content/          ← subscribes via useTuvixBus, shows welcome card
```

## Get started

### Via npx (recommended)

```bash
npx create-tuvix-app@latest --example with-react-event-bus my-app
cd my-app
npm install
npm run dev
```

### Manual clone

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-event-bus
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and click "Login as Alice / Bob / Charlie".

## Key concepts

- **`createEventBus()`** - creates a typed pub/sub channel. Instantiated once in the shell and passed as a prop to every micro app.
- **`useTuvixBus(bus, event, handler)`** - React hook that auto-subscribes on mount and unsubscribes on unmount, preventing memory leaks.
- **Zero coupling** - apps communicate via string event names only; no shared module references or global state mutations.
