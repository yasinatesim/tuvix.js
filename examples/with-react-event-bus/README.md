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

Three React apps that talk over one event bus: the header publishes `user:login`, the sidebar and the content app react to it.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/event-bus` | `getGlobalBus()` |
| `@tuvix.js/react` | `createReactMicroApp`, `useTuvixBus` |

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
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) and click **Login as Alice / Bob / Charlie**.

## What's inside

```text
with-react-event-bus/
└── src/
    ├── shell.ts          ← registers the 3 apps; passes no bus
    └── apps/
        ├── header/       ← bus.emit('user:login', user)
        ├── sidebar/      ← useTuvixBus(bus, 'user:login', …) → event log
        └── content/      ← useTuvixBus(bus, 'user:login', …) → welcome card
```

## Key concepts

- **`getGlobalBus()`** returns one bus per page. It is stored on `window.__TUVIX_GLOBAL_BUS__`, so apps that each bundle their own copy of `@tuvix.js/event-bus` still share it. The orchestrator uses the same bus unless you pass `eventBus` options to `createOrchestrator`.
- **No wiring in the shell:** each app's `main.tsx` reads `getGlobalBus()` and hands it to its component as the `bus` prop, which keeps the components easy to test with a private bus from `createEventBus()`.
- **`useTuvixBus(bus, event, handler)`** subscribes when the component mounts and unsubscribes when it unmounts.
- **Coupling:** apps share event names and payload types (`UserLoginEvent`), nothing else.
