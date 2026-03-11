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

Dimostra il **routing di micro app basato su URL** alimentato da `@tuvix.js/router`. Tre micro app React indipendenti - Dashboard, Profile e Settings - vengono registrate su route specifiche e montate/smontate automaticamente durante la navigazione.

## Pacchetti utilizzati

| Pacchetto | Ruolo |
|---|---|
| `@tuvix.js/core` | Orchestratore shell (include il motore di routing) |
| `@tuvix.js/router` | Routing in modalità history/hash |
| `@tuvix.js/react` | Factory `createReactMicroApp` |

## Contenuto

```
with-react-router/
├── index.html          ← barra di navigazione con evidenziazione del link attivo
├── vite.config.ts
├── src/
│   ├── shell.ts        ← registra 3 route, sincronizza la classe nav attiva
│   └── apps/
│       ├── dashboard/  ← attivo su /dashboard
│       ├── profile/    ← attivo su /profile
│       └── settings/   ← attivo su /settings
```

## Iniziare

### Tramite npx (consigliato)

```bash
npx create-tuvix-app@latest --example with-react-router mia-app
cd mia-app
npm install
npm run dev
```

### Clonazione manuale

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-router
npm install
npm run dev
```

Apri [http://localhost:5173/dashboard](http://localhost:5173/dashboard) e usa i link di navigazione.

## Concetti chiave

- **Corrispondenza delle route** - ogni pattern `activeWhen` viene confrontato con `window.location.pathname`. I pattern glob (`/dashboard/*`) consentono alle micro app di controllare le proprie sotto-route.
- **Modalità history** - utilizza l'API History HTML5 per URL puliti senza `#`.
- **Zero duplicazione di bundle** - in qualsiasi momento viene eseguito solo il codice della micro app attiva.
