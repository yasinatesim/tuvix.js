<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Une boîte à outils microfrontend : chargez, montez et connectez des applications déployées indépendamment, écrites en React, Vue, Svelte, Angular ou TypeScript pur, dans le navigateur ou sous forme d'îlots rendus côté serveur dans une page React.
</p>

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

---

## ✨ Fonctionnalités

- 🧩 **Adaptateurs de framework** pour React 18/19, Vue 3, Svelte 3-5 et Angular 15+. Chacun transforme un composant racine en module de micro app avec `mount`, `update` et `unmount`, une instance par conteneur.
- 🛣️ **Activation par chemin.** `activeWhen: '/users/:id'` monte une app sur les chemins correspondants. Les query strings et les hashes ne la démontent jamais. Un seul matcher (`matchPath`) sert l'orchestrateur, le routeur et le paquet serveur.
- 🔁 **Montage ordonné.** Les changements de route sont réconciliés un par un ; les apps inactives sont démontées avant le montage des nouvelles, donc une navigation rapide A → B → A ne laisse que A sur la page.
- 🔗 **Routeurs externes.** `orchestrator.connectRouter()` suit TanStack Router ou React Router. `interceptLinks()` transforme les clics sur de simples `<a href>` en navigations côté client.
- 🏝️ **Îlots SSR.** `TuvixIsland` héberge des micro apps Vue, Svelte, Angular et React dans une page React rendue côté serveur, les hydrate sur place et ne réécrit jamais leur DOM lors d'un nouveau rendu.
- 🎨 **Premier affichage (first paint) stylé.** `@tuvix.js/vite` indique à votre serveur les feuilles de style dont chaque îlot a besoin, pour que vous les liiez dans le `<head>`.
- 📦 **Entrées flexibles.** URL de scripts, `{ scripts, styles, type }`, ou fonctions loader comme `() => import('./app')`. Chargements parallèles, nouvelles tentatives, timeouts, hashes SRI.
- 📡 **Event bus partagé.** `getGlobalBus()` renvoie un seul bus par page, même entre des apps bundlées séparément.
- 🔔 **Événements de cycle de vie.** `tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`, ainsi que `whenMounted(name)` et `onLifecycle()`.
- 🔒 **Isolation CSS à la demande.** `sandbox: true` rend une app dans un shadow root avec ses propres feuilles de style.
- 🟦 **TypeScript.** Chaque paquet de bibliothèque fournit des builds ESM et CommonJS avec des déclarations de types.

Tuvix.js n'isole pas le JavaScript entre les apps : chaque app s'exécute dans le `window` de la page. Utilisez une `<iframe>` pour du code non fiable.

---

## 🤖 Générateur de composants IA

Générez des composants tuvix.js à partir du langage naturel avec le chatbot du site de documentation.

- **Modèle de chat :** MiniMax M2.5 via OpenRouter
- **Modèle d'embedding :** NVIDIA Nemotron Embed 1B via OpenRouter (récupération RAG)
- **Prend en charge :** React, Vue, Svelte, Angular
- **Jeu de données :** [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset) sur HuggingFace

> Essayez-le : [Générateur IA](https://tuvix.js.org/chatbot) sur le site de documentation

---

## 📦 Installation

```bash
# Orchestrator, router, loader, event bus and sandbox
pnpm add tuvix.js

# Adapters, as needed
pnpm add @tuvix.js/react @tuvix.js/vue @tuvix.js/svelte @tuvix.js/angular

# Or scaffold a project
npx create-tuvix-app my-app --template shell
```

---

## 🚀 Démarrage rapide

### Shell

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#main-content',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
  fallback: '<p>Dashboard is unavailable.</p>',
});

orchestrator.register({
  name: 'settings',
  entry: () => import('./apps/settings'),
  container: '#main-content',
  activeWhen: '/settings/*',
});

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

### Micro app

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Welcome, {user}</h1>;
}

// Registers itself as "dashboard", so the shell's script entry finds it.
export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Sans framework :

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'settings',
  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Settings for ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

### Mettre à jour les props

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

Une app montée qui possède `update` refait son rendu sur place. Sinon, l'orchestrateur conserve les props fusionnées pour le prochain montage.

---

## 🌉 Suivre un routeur externe

```ts
import { createOrchestrator } from 'tuvix.js';
import { router } from './router'; // TanStack Router instance

const orchestrator = createOrchestrator(); // no built-in router

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

await orchestrator.start();
```

---

## 🏝️ Îlots rendus côté serveur

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });

// `footerHtml` comes from renderSvelteToString() in server-only code.
export function Layout({ footerHtml }: { footerHtml?: string }) {
  return <TuvixIsland name="footer" app={footer} props={{ year: 2026 }} ssrHtml={footerHtml} fallback={<footer>© 2026</footer>} />;
}
```

Pendant l'hydratation, l'îlot lit son HTML depuis la page, donc le client n'a jamais besoin de `footerHtml`. Consultez le [guide des îlots SSR](https://tuvix.js.org/guide/ssr-islands) et [`examples/with-ssr-islands`](./examples/with-ssr-islands).

---

## 🔔 Événements de cycle de vie

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer');
container.classList.add(hydrated ? 'hydrated' : 'rendered');
```

---

## 🔌 Event bus

```ts
import { getGlobalBus } from 'tuvix.js';

const bus = getGlobalBus(); // the same bus the orchestrator passes to mount()

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => console.log(userId));
bus.emit('user:login', { userId: '42' });
off();
```

---

## 📦 Paquets

| Paquet | Description |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | Tout-en-un : core, routeur, loader, event bus, sandbox |
| [`@tuvix.js/core`](./packages/core) | Orchestrateur : enregistrement, réconciliation, props, `connectRouter` |
| [`@tuvix.js/router`](./packages/router) | Routeur history/hash, `matchPath`, `interceptLinks` |
| [`@tuvix.js/loader`](./packages/loader) | Chargement des entrées et runtime du cycle de vie |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Bus pub/sub, `getGlobalBus()` à l'échelle de la page |
| [`@tuvix.js/sandbox`](./packages/sandbox) | `CssSandbox` (shadow DOM), `JsSandbox` (window proxy) |
| [`@tuvix.js/react`](./packages/react) | Adaptateur React, `TuvixReactApp`, `TuvixIsland`, hooks |
| [`@tuvix.js/vue`](./packages/vue) | Adaptateur Vue 3, `renderVueToString` |
| [`@tuvix.js/svelte`](./packages/svelte) | Adaptateur Svelte 3-5, `renderSvelteToString` |
| [`@tuvix.js/angular`](./packages/angular) | Adaptateur Angular 15+ (zoneless), `renderAngularToString` |
| [`@tuvix.js/vite`](./packages/vite) | Plugin Vite : liens des feuilles de style des îlots pour le `<head>` rendu côté serveur |
| [`@tuvix.js/server`](./packages/server) | Composition côté serveur de fragments HTML, streaming, métriques |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Entrées reposant sur des remotes webpack Module Federation |
| [`@tuvix.js/devtools`](./packages/devtools) | Panneau de débogage intégré à la page |
| [`create-tuvix-app`](./packages/cli) | Génération de projets |

---

## 📁 Structure du projet

```text
tuvix.js/
├── packages/        # the 15 packages above
├── examples/        # runnable examples, see below
├── website/         # documentation site (VitePress, 10 languages)
├── scripts/         # docs and package validators
└── .changeset/      # release notes for the next version
```

---

## 🧪 Exemples

| Exemple | Montre |
| --- | --- |
| [`with-ssr-islands`](./examples/with-ssr-islands) | Hôte React avec des îlots Vue, Svelte, Angular et React rendus côté serveur |
| [`with-react`](./examples/with-react) | Shell et micro apps React |
| [`with-vue`](./examples/with-vue) | Micro apps Vue 3 |
| [`with-svelte`](./examples/with-svelte) | Micro apps Svelte |
| [`with-angular`](./examples/with-angular) | Micro apps Angular |
| [`with-vanilla`](./examples/with-vanilla) | Sans framework |
| [`with-multiple-frameworks`](./examples/with-multiple-frameworks) | React et Vue dans un même shell |
| [`with-react-router`](./examples/with-react-router) | Routage |
| [`with-react-event-bus`](./examples/with-react-event-bus) | Event bus |
| [`with-react-sandbox`](./examples/with-react-sandbox) | Sandbox CSS |
| [`with-react-devtools`](./examples/with-react-devtools) | Panneau devtools |
| [`with-module-federation-react`](./examples/with-module-federation-react) | Module Federation |
| [`with-ssr-react`](./examples/with-ssr-react) | Composition côté serveur avec `@tuvix.js/server` |
| [`with-ssr-vanilla`](./examples/with-ssr-vanilla) | Composition côté serveur sans framework |

---

## 🗺️ Feuille de route

Livré :

- Orchestrateur avec réconciliations sérialisées, `connectRouter`, montage selon le viewport et HTML de fallback
- Adaptateurs pour React, Vue, Svelte 3-5 et Angular (zoneless), avec hydratation SSR
- `TuvixIsland`, événements de cycle de vie, assets d'îlots `@tuvix.js/vite`
- Composition côté serveur avec streaming et métriques Prometheus (`@tuvix.js/server`)
- Entrées Module Federation, devtools intégrés à la page, génération de projets en CLI
- Documentation en 10 langues

Prévu :

- Hot module reload entre les micro apps
- Prise en charge native d'ESM et des import maps
- Composition côté serveur adaptée à l'edge, avec cache de fragments stale-while-revalidate
- Utilitaires de test et un orchestrateur factice
- Tests A/B de fragments

---

## 🤝 Contribuer

Lisez le [guide de contribution](./CONTRIBUTING.md) avant d'ouvrir une pull request.

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js
pnpm install
pnpm build
pnpm test
```

Vous venez de la 0.4 ? Lisez le [guide de migration](https://tuvix.js.org/guide/migration-0-5).

---

## 🔑 Licence

Copyright © 2026 - Licence MIT.
Consultez [LICENSE](./LICENSE) pour plus d'informations.

---

<p align="center">Ce README a été généré par <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 🥲</p>
