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

# with-react-router

Demonstriert **URL-basiertes Micro-App-Routing** mit `@tuvix.js/router`. Drei unabhängige React-Micro-Apps — Dashboard, Profile und Settings — werden für bestimmte Routen registriert und automatisch ein-/ausgehängt, während der Benutzer navigiert.

## Verwendete Pakete

| Paket | Rolle |
|---|---|
| `@tuvix.js/core` | Shell-Orchestrator (enthält Router-Engine) |
| `@tuvix.js/router` | History/Hash-Modus-Routing |
| `@tuvix.js/react` | `createReactMicroApp`-Factory |

## Inhalt

```
with-react-router/
├── index.html          ← Navigationsleiste mit Hervorhebung aktiver Links
├── vite.config.ts
├── src/
│   ├── shell.ts        ← registriert 3 Routen, synchronisiert aktive Nav-Klasse
│   └── apps/
│       ├── dashboard/  ← aktiv bei /dashboard
│       ├── profile/    ← aktiv bei /profile
│       └── settings/   ← aktiv bei /settings
```

## Erste Schritte

### Via npx (empfohlen)

```bash
npx create-tuvix-app@latest --example with-react-router meine-app
cd meine-app
npm install
npm run dev
```

### Manuelles Klonen

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-router
npm install
npm run dev
```

Öffne [http://localhost:5173/dashboard](http://localhost:5173/dashboard) und verwende die Navigationslinks.

## Schlüsselkonzepte

- **Routen-Matching** — jedes `activeWhen`-Muster wird gegen `window.location.pathname` geprüft. Glob-Muster (`/dashboard/*`) erlauben Micro-Apps, ihre eigenen Sub-Routen zu steuern.
- **History-Modus** — verwendet die HTML5 History API für saubere URLs ohne `#`.
- **Keine Bundle-Duplizierung** — zu jedem Zeitpunkt läuft nur der Code der aktiven Micro-App.
