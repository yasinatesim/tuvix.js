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

An Express server that renders two React components to HTML and stitches them into a page template with `composeHTML` from `@tuvix.js/server`. The page is complete without client JavaScript.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/server` | `composeHTML(template, slots)` |
| `express` | HTTP server |
| `react-dom/server` | `renderToString` |

## Get started

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-ssr-react
pnpm install
pnpm start
```

Open [http://localhost:3000](http://localhost:3000). Set `PORT` to use another port. View the page source: both fragments are in the HTML the server sent.

## What's inside

```text
with-ssr-react/
├── server.js                 ← template, two React components, GET /
└── src/__tests__/server.test.js
```

## Key concepts

- **Slots:** the template contains `<tuvix-slot name="left-service">fallback</tuvix-slot>`. `composeHTML` replaces each slot element, fallback included, with the HTML you pass for that name. Slots without an entry keep their fallback.
- **Literal output:** fragments go in as written. `$&`, `$1` and a `<tuvix-slot>` inside a fragment are not expanded.
- **What it does not do:** this example sends static HTML only; nothing hydrates in the browser. See `with-ssr-islands` for server-rendered islands that hydrate on the client. To fetch fragments from separate services per route, use `createServerRenderer` from `@tuvix.js/server`.
