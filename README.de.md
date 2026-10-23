<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Ein Microfrontend-Toolkit: Lade, mounte und verbinde unabhängig deployte Apps in React, Vue, Svelte, Angular oder reinem TypeScript, im Browser oder als serverseitig gerenderte Islands in einer React-Seite.
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

## ✨ Funktionen

- 🧩 **Framework-Adapter** für React 18/19, Vue 3, Svelte 3-5 und Angular 15+. Jeder macht aus einer Root-Komponente ein Micro-App-Modul mit `mount`, `update` und `unmount`, eine Instanz pro Container.
- 🛣️ **Pfadbasierte Aktivierung.** `activeWhen: '/users/:id'` mountet eine App auf passenden Pfaden. Query-Strings und Hashes unmounten sie nie. Ein Matcher (`matchPath`) dient dem Orchestrator, dem Router und dem Server-Paket.
- 🔁 **Geordnetes Mounten.** Routenwechsel werden nacheinander abgeglichen; inaktive Apps werden unmountet, bevor neue gemountet werden, sodass nach einer schnellen Navigation A → B → A nur A auf der Seite bleibt.
- 🔗 **Externe Router.** `orchestrator.connectRouter()` folgt TanStack Router oder React Router. `interceptLinks()` macht aus Klicks auf normale `<a href>`-Links clientseitige Navigationen.
- 🏝️ **SSR-Islands.** `TuvixIsland` bettet Micro Apps in Vue, Svelte, Angular und React in eine serverseitig gerenderte React-Seite ein, hydriert sie an Ort und Stelle und schreibt ihr DOM beim erneuten Rendern nie um.
- 🎨 **Gestylter erster Paint.** `@tuvix.js/vite` teilt deinem Server mit, welche Stylesheets jede Island braucht, damit du sie im `<head>` verlinkst.
- 📦 **Flexible Entries.** Skript-URLs, `{ scripts, styles, type }` oder Loader-Funktionen wie `() => import('./app')`. Paralleles Laden, Wiederholungsversuche, Timeouts, SRI-Hashes.
- 📡 **Gemeinsamer Event Bus.** `getGlobalBus()` liefert einen Bus pro Seite, auch über separat gebündelte Apps hinweg.
- 🔔 **Lifecycle-Events.** `tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`, dazu `whenMounted(name)` und `onLifecycle()`.
- 🔒 **CSS-Isolation auf Wunsch.** `sandbox: true` rendert eine App in einem Shadow Root mit eigenen Stylesheets.
- 🟦 **TypeScript.** Jedes Bibliothekspaket liefert ESM- und CommonJS-Builds mit Typdeklarationen.

Tuvix.js isoliert JavaScript nicht zwischen Apps: Jede App läuft im `window` der Seite. Verwende für nicht vertrauenswürdigen Code ein `<iframe>`.

---

## 🤖 KI-Komponenten-Generator

Erzeuge tuvix.js-Komponenten aus natürlicher Sprache mit dem Chatbot auf der Dokumentationsseite.

- **Chat-Modell:** MiniMax M2.5 über OpenRouter
- **Embedding-Modell:** NVIDIA Nemotron Embed 1B über OpenRouter (RAG-Retrieval)
- **Unterstützt:** React, Vue, Svelte, Angular
- **Dataset:** [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset) auf HuggingFace

> Probier es aus: [KI-Generator](https://tuvix.js.org/de/chatbot) auf der Dokumentationsseite

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

## 🚀 Schnellstart

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

### Micro App

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Welcome, {user}</h1>;
}

// Registers itself as "dashboard", so the shell's script entry finds it.
export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Ohne Framework:

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

### Props aktualisieren

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

Eine gemountete App mit `update` rendert an Ort und Stelle neu. Andernfalls behält der Orchestrator die zusammengeführten Props für den nächsten Mount.

---

## 🌉 Einem externen Router folgen

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

## 🏝️ Serverseitig gerenderte Islands

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

Während der Hydration liest die Island ihr HTML aus der Seite, daher braucht der Client `footerHtml` nie. Siehe die [Anleitung zu SSR-Islands](https://tuvix.js.org/de/guide/ssr-islands) und [`examples/with-ssr-islands`](./examples/with-ssr-islands).

---

## 🔔 Lifecycle-Events

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer');
container.classList.add(hydrated ? 'hydrated' : 'rendered');
```

---

## 🔌 Event Bus

```ts
import { getGlobalBus } from 'tuvix.js';

const bus = getGlobalBus(); // the same bus the orchestrator passes to mount()

const off = bus.on<{ userId: string }>('user:login', ({ userId }) => console.log(userId));
bus.emit('user:login', { userId: '42' });
off();
```

---

## 📦 Pakete

| Paket | Beschreibung |
| --- | --- |
| [`tuvix.js`](./packages/tuvix/README.de.md) | Gesamtpaket: Core, Router, Loader, Event Bus, Sandbox |
| [`@tuvix.js/core`](./packages/core/README.de.md) | Orchestrator: Registrierung, Abgleich, Props, `connectRouter` |
| [`@tuvix.js/router`](./packages/router/README.de.md) | History-/Hash-Router, `matchPath`, `interceptLinks` |
| [`@tuvix.js/loader`](./packages/loader/README.de.md) | Laden von Entries und die Lifecycle-Runtime |
| [`@tuvix.js/event-bus`](./packages/event-bus/README.de.md) | Pub/Sub-Bus, seitenweiter `getGlobalBus()` |
| [`@tuvix.js/sandbox`](./packages/sandbox/README.de.md) | `CssSandbox` (Shadow DOM), `JsSandbox` (Proxy-Window) |
| [`@tuvix.js/react`](./packages/react/README.de.md) | React-Adapter, `TuvixReactApp`, `TuvixIsland`, Hooks |
| [`@tuvix.js/vue`](./packages/vue/README.de.md) | Vue-3-Adapter, `renderVueToString` |
| [`@tuvix.js/svelte`](./packages/svelte/README.de.md) | Adapter für Svelte 3-5, `renderSvelteToString` |
| [`@tuvix.js/angular`](./packages/angular/README.de.md) | Adapter für Angular 15+ (zoneless), `renderAngularToString` |
| [`@tuvix.js/vite`](./packages/vite/README.de.md) | Vite-Plugin: Stylesheet-Links der Islands für den serverseitig gerenderten `<head>` |
| [`@tuvix.js/server`](./packages/server/README.de.md) | Serverseitige Komposition von HTML-Fragmenten, Streaming, Metriken |
| [`@tuvix.js/module-federation`](./packages/module-federation/README.de.md) | Entries auf Basis von Remotes aus webpack Module Federation |
| [`@tuvix.js/devtools`](./packages/devtools/README.de.md) | Debug-Panel direkt in der Seite |
| [`create-tuvix-app`](./packages/cli/README.de.md) | Projekt-Scaffolding |

---

## 📁 Projektstruktur

```text
tuvix.js/
├── packages/        # the 15 packages above
├── examples/        # runnable examples, see below
├── website/         # documentation site (VitePress, 10 languages)
├── scripts/         # docs and package validators
└── .changeset/      # release notes for the next version
```

---

## 🧪 Beispiele

| Beispiel | Zeigt |
| --- | --- |
| [`with-ssr-islands`](./examples/with-ssr-islands) | React-Host mit serverseitig gerenderten Islands in Vue, Svelte, Angular und React |
| [`with-react`](./examples/with-react/README.de.md) | React-Shell und Micro Apps |
| [`with-vue`](./examples/with-vue/README.de.md) | Micro Apps in Vue 3 |
| [`with-svelte`](./examples/with-svelte/README.de.md) | Micro Apps in Svelte |
| [`with-angular`](./examples/with-angular/README.de.md) | Micro Apps in Angular |
| [`with-vanilla`](./examples/with-vanilla) | Ohne Framework |
| [`with-multiple-frameworks`](./examples/with-multiple-frameworks/README.de.md) | React und Vue in einer Shell |
| [`with-react-router`](./examples/with-react-router/README.de.md) | Routing |
| [`with-react-event-bus`](./examples/with-react-event-bus/README.de.md) | Event Bus |
| [`with-react-sandbox`](./examples/with-react-sandbox/README.de.md) | CSS-Sandbox |
| [`with-react-devtools`](./examples/with-react-devtools/README.de.md) | DevTools-Panel |
| [`with-module-federation-react`](./examples/with-module-federation-react/README.de.md) | Module Federation |
| [`with-ssr-react`](./examples/with-ssr-react/README.de.md) | Server-Komposition mit `@tuvix.js/server` |
| [`with-ssr-vanilla`](./examples/with-ssr-vanilla) | Server-Komposition ohne Framework |

---

## 🗺️ Roadmap

Ausgeliefert:

- Orchestrator mit serialisiertem Abgleich, `connectRouter`, Mounten im Viewport und Fallback-HTML
- Adapter für React, Vue, Svelte 3-5 und Angular (zoneless), mit SSR-Hydration
- `TuvixIsland`, Lifecycle-Events, Island-Assets über `@tuvix.js/vite`
- Server-Komposition mit Streaming und Prometheus-Metriken (`@tuvix.js/server`)
- Entries über Module Federation, DevTools direkt in der Seite, Scaffolding per CLI
- Dokumentation in 10 Sprachen

Geplant:

- Hot Module Reload über Micro Apps hinweg
- Unterstützung für natives ESM und Import Maps
- Edge-fähige Server-Komposition mit Fragment-Caching nach dem Stale-while-revalidate-Prinzip
- Test-Utilities und ein Mock-Orchestrator
- A/B-Tests für Fragmente

---

## 🤝 Mitwirken

Lies den [Leitfaden zum Mitwirken](./CONTRIBUTING.md), bevor du einen Pull Request öffnest.

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js
pnpm install
pnpm build
pnpm test
```

Du kommst von 0.4? Lies die [Migrationsanleitung](https://tuvix.js.org/de/guide/migration-0-5).

---

## 🔑 Lizenz

Copyright © 2026, MIT-Lizenz.
Siehe [LICENSE](./LICENSE) für weitere Informationen.

---

<p align="center">Diese README wurde mit <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> erstellt 🥲</p>
