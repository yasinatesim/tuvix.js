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

Un shell micro-frontend complet construit avec **React 18** et **Vite**, démontrant comment l'orchestrateur Tuvix.js charge, monte et démonte des micro-apps React indépendantes.

## Paquets utilisés

| Paquet | Rôle |
|---|---|
| `@tuvix.js/core` | Shell Orchestrator |
| `@tuvix.js/react` | Factory `createReactMicroApp` |
| `@tuvix.js/event-bus` | Bus d'événements partagé |

## Démarrage

### Via npx (recommandé)

```bash
npx create-tuvix-app@latest --example with-react mon-app
cd mon-app
npm install
npm run dev
```

### Clonage manuel

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react
npm install
npm run dev
```

Ouvrez [http://localhost:5173/home](http://localhost:5173/home).

## Concepts clés

- **`createReactMicroApp`** - Encapsule un composant React dans un module compatible Tuvix.js avec les hooks `bootstrap`, `mount`, `unmount` et `update`.
- **Passage de props** - Le shell transmet les props `{ theme, user }` à l'app `home`.
- **Lifecycle** - Chaque app n'est montée que lorsque sa route est active.
