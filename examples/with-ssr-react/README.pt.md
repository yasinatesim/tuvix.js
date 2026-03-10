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

# with-ssr-react

Demonstrates **Server-Side Rendering (SSR) Fragment Composition** using `@tuvix.js/server`.

In a micro-frontend architecture, client-side only rendering leads to poor SEO and slow Time-to-Interactive. The Tuvix.js Server package allows an Express (or Fastify) shell to concurrently fetch pre-rendered HTML fragments from your micro apps and stitch them into a single coherent HTTP response before it hits the browser.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/server` | `createServerRenderer` utility |
| `express` | Web server framework |
| `react-dom/server` | Serverside React rendering |

## What's inside

```
with-ssr-react/
└── server.js     ← starts Express on :3000, runs rendering logic
```

## Get started

### Via npx (recommended)

```bash
npx create-tuvix-app@latest --example with-ssr-react my-app
cd my-app
npm install
npm start
```

### Manual clone

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-ssr-react
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Upon inspecting the network tab, you will see that the initial document payload contains the fully rendered React output, not empty divs.

## Key concepts

- **`<tuvix-slot id="name">`** — You define an HTML shell string containing these placeholder slots.
- **`renderer.render(fragments)`** — The Express handler passes a map of fragment IDs to their HTML strings (rendered by React's `renderToString` or fetched via `fetch()`). Tuvix safely stitches the slots together.
