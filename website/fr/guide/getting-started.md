# Démarrage rapide

Cette page construit un shell avec deux micro apps : une page d'accueil et un tableau de bord. Vous allez enregistrer les apps, laisser le routeur les monter et envoyer de nouvelles props à une app montée.

## Installation {#install}

Installez le paquet tout-en-un. Il contient l'orchestrateur, le routeur, le loader, l'event bus et la sandbox :

```bash
pnpm add tuvix.js
```

Ajoutez un adaptateur pour chaque framework utilisé par vos micro apps :

```bash
pnpm add @tuvix.js/react react react-dom
pnpm add @tuvix.js/vue vue
pnpm add @tuvix.js/svelte svelte
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
```

## Générer un projet {#scaffold-a-project}

`create-tuvix-app` crée un projet de shell ou de micro app qui dépend des paquets 0.5 :

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-dashboard --template react-app
```

Templates : `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. Passez `--example <name>` pour copier plutôt l'un des exemples du dépôt.

## Construire un shell {#build-a-shell}

Le shell possède la mise en page et décide quelle app va où. Donnez-lui un élément conteneur :

```html
<nav>
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
</nav>
<main id="app"></main>
<script type="module" src="/src/main.ts"></script>
```

Créez ensuite l'orchestrateur, enregistrez les apps et démarrez-le :

```ts
// src/main.ts
import { createOrchestrator, interceptLinks, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  // '/' alone would match every path; `end: true` makes it exact.
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
});

// Turn <a href> clicks into router navigations instead of page loads.
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

Ce qui se passe :

1. `start()` lit le chemin courant et monte chaque app dont `activeWhen` correspond.
2. Un clic sur `<a href="/dashboard">` appelle `navigateTo('/dashboard')`. Le routeur pousse l'URL, l'orchestrateur démonte `home` puis monte `dashboard`.
3. Le premier montage de `dashboard` charge son script et sa feuille de style. Les montages suivants réutilisent le module chargé.

Le routeur n'intercepte jamais les clics de lui-même. Sans `interceptLinks`, un clic sur un lien recharge la page, et l'orchestrateur monte la bonne app au nouveau chargement.

## Écrire une micro app {#write-a-micro-app}

Une micro app est un objet avec `mount` et `unmount`. `defineMicroApp` vérifie sa forme et enregistre le module sous son nom, pour que le loader puisse le retrouver après l'exécution du script :

```ts
// apps/home.ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'home',

  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Welcome, ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },

  update({ props, container }) {
    const title = container?.querySelector('h1');
    if (title) title.textContent = `Welcome, ${String(props.user ?? 'Guest')}`;
  },

  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Le `name` passé à `defineMicroApp` doit être identique au nom enregistré dans le shell. Le loader recherche le module par ce nom.

## Utiliser un adaptateur de framework {#use-a-framework-adapter}

Les adaptateurs créent le même module à partir d'un composant racine. Ils l'enregistrent, gardent une instance de framework par conteneur et émettent les événements de cycle de vie.

```tsx
// dashboard/src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Dashboard for {user}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

```ts
// settings/src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Settings from './Settings.vue';

export default createVueMicroApp({ name: 'settings', App: Settings });
```

Pages des frameworks : [React](/fr/guide/react), [Vue](/fr/guide/vue), [Svelte](/fr/guide/svelte), [Angular](/fr/guide/angular).

Construisez chaque micro app sous forme de bundle de module ES et mettez-la en ligne. Un build de bibliothèque Vite convient :

```ts
// dashboard/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.tsx', formats: ['es'], fileName: 'main' },
  },
});
```

La sortie ES de Vite se termine par `.js`, que le loader traite comme un script classique sauf si l'entrée indique `type: 'module'`. Gardez `type: 'module'` dans l'entrée du shell, comme ci-dessus.

## Mettre à jour les props à l'exécution {#update-props-at-runtime}

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

`updateAppProps` fusionne les nouvelles props avec celles enregistrées. Si l'app est montée et possède `update`, l'orchestrateur l'appelle avec les props fusionnées et l'app se rend à nouveau sur place. Si l'app n'est pas montée, l'orchestrateur conserve les props pour le prochain montage.

## Ce que le shell ne fait pas {#what-the-shell-does-not-do}

- Il ne rend pas votre mise en page. Le HTML du shell contient lui-même les conteneurs.
- Il ne partage pas d'instances de framework entre les apps. Deux apps React obtiennent deux racines React.
- Il n'isole pas le JavaScript. Chaque app s'exécute dans le `window` de la page.

## Étapes suivantes {#next-steps}

- [Architecture](/fr/guide/architecture) : le chemin d'une navigation jusqu'à `mount`.
- [Routage](/fr/guide/routing) : les motifs `activeWhen`, le routeur intégré, les guards.
- [Routeur externe](/fr/guide/external-router) : suivre TanStack Router ou React Router.
- [Îlots SSR](/fr/guide/ssr-islands) : rendre des micro apps côté serveur dans une page React.
