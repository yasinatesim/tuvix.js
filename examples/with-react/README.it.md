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

Una shell micro-frontend completa costruita con **React 18** e **Vite**, che dimostra come l'orchestratore Tuvix.js carica, monta e smonta micro-app React indipendenti.

## Pacchetti utilizzati

| Pacchetto | Ruolo |
|---|---|
| `@tuvix.js/core` | Shell Orchestrator |
| `@tuvix.js/react` | Factory `createReactMicroApp` |
| `@tuvix.js/event-bus` | Event bus condiviso |

## Per iniziare

### Tramite npx (consigliato)

```bash
npx create-tuvix-app@latest --example with-react mia-app
cd mia-app
npm install
npm run dev
```

### Clone manuale

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react
npm install
npm run dev
```

Apri [http://localhost:5173/home](http://localhost:5173/home).

## Concetti chiave

- **`createReactMicroApp`** - Incapsula un componente React in un modulo compatibile con Tuvix.js con hook `bootstrap`, `mount`, `unmount` e `update`.
- **Passaggio di props** - La shell passa props `{ theme, user }` all'app `home`.
- **Lifecycle** - Ogni app viene montata solo quando il suo percorso è attivo.
