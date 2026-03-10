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

Eine vollständige Micro-Frontend-Shell mit **React 18** und **Vite**, die zeigt, wie der Tuvix.js-Orchestrator unabhängige React-Micro-Apps lädt, einbindet und entfernt.

## Verwendete Pakete

| Paket | Rolle |
|---|---|
| `@tuvix.js/core` | Shell-Orchestrator |
| `@tuvix.js/react` | `createReactMicroApp`-Factory |
| `@tuvix.js/event-bus` | Gemeinsamer Event-Bus |

## Schnellstart

### Via npx (empfohlen)

```bash
npx create-tuvix-app@latest --example with-react meine-app
cd meine-app
npm install
npm run dev
```

### Manuelles Klonen

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react
npm install
npm run dev
```

Öffne [http://localhost:5173/home](http://localhost:5173/home).

## Schlüsselkonzepte

- **`createReactMicroApp`** — Kapselt eine React-Komponente in ein Tuvix.js-kompatibles Modul mit `bootstrap`-, `mount`-, `unmount`- und `update`-Hooks.
- **Prop-Weiterleitung** — Die Shell übergibt `{ theme, user }` Props an die `home`-App.
- **Lebenszyklus** — Jede App wird nur dann eingebunden, wenn ihre Route aktiv ist.
