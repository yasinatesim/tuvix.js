# Contribuer à Tuvix.js

Merci de votre intérêt pour la contribution ! Qu'il s'agisse d'une correction de bug, d'une nouvelle fonctionnalité, d'une amélioration de la documentation ou d'une traduction, toutes les contributions sont les bienvenues.

## Façons de Contribuer

- **Rapports de bugs** - [Ouvrir un issue](https://github.com/yasinatesim/tuvix.js/issues/new?template=bug_report.md)
- **Demandes de fonctionnalités** - [Démarrer une discussion](https://github.com/yasinatesim/tuvix.js/issues)
- **Code** - Corriger des bugs, ajouter des fonctionnalités, améliorer les tests
- **Documentation** - Corriger les fautes de frappe, ajouter des exemples, améliorer la clarté
- **Traductions** - Ajouter ou améliorer la documentation dans d'autres langues

## Pour Commencer

### 1. Fork et Clone

```bash
git clone https://github.com/VOTRE_NOM_UTILISATEUR/tuvix.js.git
cd tuvix.js
```

### 2. Installer les Dépendances

Nous utilisons [pnpm](https://pnpm.io) et [Node.js ≥ 18](https://nodejs.org).

```bash
pnpm install
```

### 3. Compiler Tous les Paquets

```bash
pnpm build
```

### 4. Exécuter les Tests

```bash
pnpm test
```

### 5. Démarrer le Serveur de Développement de la Documentation

```bash
cd website
pnpm install
pnpm dev
```

Ouvrez `http://localhost:5173` dans votre navigateur pour prévisualiser la documentation.

## Structure du Projet

```
tuvix.js/
├── packages/
│   ├── core/           @tuvix.js/core
│   ├── router/         @tuvix.js/router
│   ├── event-bus/      @tuvix.js/event-bus
│   ├── loader/         @tuvix.js/loader
│   ├── sandbox/        @tuvix.js/sandbox
│   ├── react/          @tuvix.js/react
│   ├── vue/            @tuvix.js/vue
│   ├── svelte/         @tuvix.js/svelte
│   ├── angular/        @tuvix.js/angular
│   ├── devtools/       @tuvix.js/devtools
│   ├── server/         @tuvix.js/server
│   ├── module-federation/
│   ├── create-tuvix-app/
│   └── tuvix/          tuvix.js umbrella
└── website/
    ├── .vitepress/     Configuration et thème VitePress
    ├── guide/          Documentation en anglais
    ├── packages/       Documentation API des paquets
    ├── tr/             Traductions en turc
    ├── es/             Traductions en espagnol
    └── ...             Autres langues
```

## Style de Code

- **TypeScript** - mode strict, tout le code doit être typé
- **Prettier** - exécutez `pnpm format` pour formater
- **Aucune dépendance d'exécution** - les paquets doivent avoir zéro dépendance d'exécution
- **Exports nommés** - évitez les exports par défaut
- **Messages d'erreur** - préfixer avec `[Tuvix ...]`

## Messages de Commit

Nous suivons [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat: add hash mode to router
fix(sandbox): clean up event listeners on unmount
docs: add Angular guide example
chore: bump vitepress to 1.7.0
test(event-bus): add once() edge case tests
```

## Processus de Pull Request

1. Créez une branche depuis `master` :
   ```bash
   git checkout -b feat/ma-fonctionnalite
   ```

2. Effectuez vos modifications et ajoutez des tests

3. Exécutez la suite de tests complète :
   ```bash
   pnpm test
   pnpm check-types
   pnpm lint
   ```

4. Si votre modification affecte un paquet publié, ajoutez un changeset :
   ```bash
   pnpm changeset
   ```

5. Poussez et ouvrez un PR contre `master`

6. Un mainteneur examinera votre PR. Veuillez répondre aux retours dans un délai de 7 jours.

## Ajouter une Traduction

Toute la documentation est en Markdown sous `website/`. Chaque langue a son propre répertoire :

```
website/
├── index.md              ← Anglais (racine)
├── guide/                ← Guides en anglais
├── tr/                   ← Turc
│   ├── index.md
│   ├── guide/
│   └── packages/
├── es/                   ← Espagnol
└── ...
```

### Étapes pour ajouter ou améliorer une traduction

1. Copiez les fichiers anglais de `website/guide/` vers `website/<lang>/guide/`
2. Traduisez le contenu Markdown (gardez les blocs de code en anglais)
3. Mettez à jour la configuration de la barre latérale dans `website/.vitepress/config/<lang>.ts`
4. Exécutez `cd website && pnpm dev` pour prévisualiser

::: tip Conseils de Traduction
- Gardez tous les exemples de code en anglais
- Traduisez les libellés de l'interface, les descriptions et le texte explicatif
- Utilisez la terminologie native lorsque des traductions standard existent
:::

## Langues Supportées

| Langue | Code | Statut |
|--------|------|--------|
| Anglais | `en` | Complet (référence) |
| Turc | `tr` | En cours |
| Espagnol | `es` | En cours |
| Allemand | `de` | En cours |
| Français | `fr` | En cours |
| Japonais | `ja` | En cours |
| Chinois | `zh` | En cours |
| Italien | `it` | En cours |
| Portugais | `pt` | En cours |
| Hindi | `hi` | En cours |

Si vous souhaitez contribuer à l'une de ces langues, consultez les [issues de traduction ouverts](https://github.com/yasinatesim/tuvix.js/labels/translation) ou ouvrez-en un nouveau.

## Code de Conduite

Ce projet suit le [Contributor Covenant](https://www.contributor-covenant.org/). Soyez respectueux et constructif.

## Licence

En contribuant, vous acceptez que vos contributions soient licenciées sous la Licence MIT.
