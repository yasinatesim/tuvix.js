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

Démontre le **routage de micro apps basé sur l'URL** propulsé par `@tuvix.js/router`. Trois micro apps React indépendantes — Dashboard, Profile et Settings — sont enregistrées sur des routes spécifiques et montées/démontées automatiquement lors de la navigation.

## Paquets utilisés

| Paquet | Rôle |
|---|---|
| `@tuvix.js/core` | Orchestrateur shell (intègre le moteur de routage) |
| `@tuvix.js/router` | Routage en mode history/hash |
| `@tuvix.js/react` | Fabrique `createReactMicroApp` |

## Contenu

```
with-react-router/
├── index.html          ← barre de navigation avec mise en évidence du lien actif
├── vite.config.ts
├── src/
│   ├── shell.ts        ← enregistre 3 routes, synchronise la classe nav active
│   └── apps/
│       ├── dashboard/  ← actif sur /dashboard
│       ├── profile/    ← actif sur /profile
│       └── settings/   ← actif sur /settings
```

## Démarrage

### Via npx (recommandé)

```bash
npx create-tuvix-app@latest --example with-react-router mon-app
cd mon-app
npm install
npm run dev
```

### Clonage manuel

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-router
npm install
npm run dev
```

Ouvrez [http://localhost:5173/dashboard](http://localhost:5173/dashboard) et utilisez les liens de navigation.

## Concepts clés

- **Correspondance de routes** — chaque modèle `activeWhen` est comparé à `window.location.pathname`. Les modèles glob (`/dashboard/*`) permettent aux micro apps de contrôler leurs propres sous-routes.
- **Mode history** — utilise l'API History HTML5 pour des URLs propres sans `#`.
- **Zéro duplication de bundle** — à tout moment, seul le code de la micro app active s'exécute.
