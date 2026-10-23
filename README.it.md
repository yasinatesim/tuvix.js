<p align="center">
  <img src="./website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

<h1 align="center">Tuvix.js</h1>

<p align="center">
  Un toolkit per microfrontend: carica, monta e collega app distribuite in modo indipendente e scritte in React, Vue, Svelte, Angular o TypeScript puro, nel browser o come island renderizzate lato server dentro una pagina React.
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

## ✨ Funzionalità

- 🧩 **Adapter per framework** per React 18/19, Vue 3, Svelte 3-5 e Angular 15+. Ognuno trasforma un componente radice in un modulo micro app con `mount`, `update` e `unmount`, un'istanza per container.
- 🛣️ **Attivazione basata sul percorso.** `activeWhen: '/users/:id'` monta un'app sui percorsi corrispondenti. Query string e hash non la smontano mai. Un solo matcher (`matchPath`) serve l'orchestratore, il router e il pacchetto server.
- 🔁 **Montaggio ordinato.** I cambi di route vengono riconciliati uno alla volta; le app inattive vengono smontate prima che quelle nuove vengano montate, quindi una navigazione rapida A → B → A lascia sulla pagina solo A.
- 🔗 **Router esterni.** `orchestrator.connectRouter()` segue TanStack Router o React Router. `interceptLinks()` trasforma i clic sui semplici `<a href>` in navigazioni lato client.
- 🏝️ **Island SSR.** `TuvixIsland` ospita micro app Vue, Svelte, Angular e React in una pagina React renderizzata lato server, ne esegue la hydration sul posto e non riscrive mai il loro DOM a ogni nuovo render.
- 🎨 **Primo paint con stili.** `@tuvix.js/vite` indica al tuo server quali fogli di stile servono a ogni island, così li colleghi nell'`<head>`.
- 📦 **Entry flessibili.** URL di script, `{ scripts, styles, type }` o funzioni loader come `() => import('./app')`. Caricamenti paralleli, nuovi tentativi, timeout, hash SRI.
- 📡 **Event bus condiviso.** `getGlobalBus()` restituisce un bus per pagina, anche tra app con bundle separati.
- 🔔 **Eventi del ciclo di vita.** `tuvix:mounted`, `tuvix:unmounted`, `tuvix:error`, più `whenMounted(name)` e `onLifecycle()`.
- 🔒 **Isolamento CSS su richiesta.** `sandbox: true` renderizza un'app dentro una shadow root con i propri fogli di stile.
- 🟦 **TypeScript.** Ogni pacchetto di libreria include build ESM e CommonJS con le dichiarazioni dei tipi.

Tuvix.js non isola il JavaScript tra le app: ogni app gira nel `window` della pagina. Usa un `<iframe>` per il codice non attendibile.

---

## 🤖 Generatore di componenti con IA

Genera componenti tuvix.js dal linguaggio naturale con il chatbot del sito di documentazione.

- **Modello di chat:** MiniMax M2.5 via OpenRouter
- **Modello di embedding:** NVIDIA Nemotron Embed 1B via OpenRouter (recupero RAG)
- **Supporta:** React, Vue, Svelte, Angular
- **Dataset:** [tuvix-component-dataset](https://huggingface.co/datasets/yasinatesim/tuvix-component-dataset) su HuggingFace

> Provalo: [AI Generator](https://tuvix.js.org/it/chatbot) sul sito di documentazione

---

## 📦 Installazione

```bash
# Orchestrator, router, loader, event bus and sandbox
pnpm add tuvix.js

# Adapters, as needed
pnpm add @tuvix.js/react @tuvix.js/vue @tuvix.js/svelte @tuvix.js/angular

# Or scaffold a project
npx create-tuvix-app my-app --template shell
```

---

## 🚀 Avvio rapido

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

Senza framework:

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

### Aggiornare le props

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

Un'app montata che espone `update` esegue di nuovo il render sul posto. Altrimenti l'orchestratore conserva le props unite per il mount successivo.

---

## 🌉 Seguire un router esterno

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

## 🏝️ Island renderizzate lato server

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

Durante la hydration l'island legge il proprio HTML dalla pagina, quindi il client non ha mai bisogno di `footerHtml`. Consulta la [guida alle Island SSR](https://tuvix.js.org/it/guide/ssr-islands) ed [`examples/with-ssr-islands`](./examples/with-ssr-islands).

---

## 🔔 Eventi del ciclo di vita

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

## 📦 Pacchetti

| Pacchetto | Descrizione |
| --- | --- |
| [`tuvix.js`](./packages/tuvix) | Pacchetto ombrello: core, router, loader, event bus, sandbox |
| [`@tuvix.js/core`](./packages/core) | Orchestratore: registrazione, riconciliazione, props, `connectRouter` |
| [`@tuvix.js/router`](./packages/router) | Router history/hash, `matchPath`, `interceptLinks` |
| [`@tuvix.js/loader`](./packages/loader) | Caricamento delle entry e runtime del ciclo di vita |
| [`@tuvix.js/event-bus`](./packages/event-bus) | Bus pub/sub, `getGlobalBus()` a livello di pagina |
| [`@tuvix.js/sandbox`](./packages/sandbox) | `CssSandbox` (shadow DOM), `JsSandbox` (window proxy) |
| [`@tuvix.js/react`](./packages/react) | Adapter React, `TuvixReactApp`, `TuvixIsland`, hook |
| [`@tuvix.js/vue`](./packages/vue) | Adapter Vue 3, `renderVueToString` |
| [`@tuvix.js/svelte`](./packages/svelte) | Adapter Svelte 3-5, `renderSvelteToString` |
| [`@tuvix.js/angular`](./packages/angular) | Adapter Angular 15+ (zoneless), `renderAngularToString` |
| [`@tuvix.js/vite`](./packages/vite) | Plugin Vite: link ai fogli di stile delle island per l'`<head>` renderizzato lato server |
| [`@tuvix.js/server`](./packages/server) | Composizione lato server di frammenti HTML, streaming, metriche |
| [`@tuvix.js/module-federation`](./packages/module-federation) | Entry basate sui remote di webpack Module Federation |
| [`@tuvix.js/devtools`](./packages/devtools) | Pannello di debug nella pagina |
| [`create-tuvix-app`](./packages/cli) | Scaffolding dei progetti |

---

## 📁 Struttura del progetto

```text
tuvix.js/
├── packages/        # the 15 packages above
├── examples/        # runnable examples, see below
├── website/         # documentation site (VitePress, 10 languages)
├── scripts/         # docs and package validators
└── .changeset/      # release notes for the next version
```

---

## 🧪 Esempi

| Esempio | Mostra |
| --- | --- |
| [`with-ssr-islands`](./examples/with-ssr-islands) | Host React con island Vue, Svelte, Angular e React renderizzate lato server |
| [`with-react`](./examples/with-react) | Shell e micro app React |
| [`with-vue`](./examples/with-vue) | Micro app Vue 3 |
| [`with-svelte`](./examples/with-svelte) | Micro app Svelte |
| [`with-angular`](./examples/with-angular) | Micro app Angular |
| [`with-vanilla`](./examples/with-vanilla) | Nessun framework |
| [`with-multiple-frameworks`](./examples/with-multiple-frameworks) | React e Vue in una sola shell |
| [`with-react-router`](./examples/with-react-router) | Routing |
| [`with-react-event-bus`](./examples/with-react-event-bus) | Event bus |
| [`with-react-sandbox`](./examples/with-react-sandbox) | Sandbox CSS |
| [`with-react-devtools`](./examples/with-react-devtools) | Pannello devtools |
| [`with-module-federation-react`](./examples/with-module-federation-react) | Module Federation |
| [`with-ssr-react`](./examples/with-ssr-react) | Composizione lato server con `@tuvix.js/server` |
| [`with-ssr-vanilla`](./examples/with-ssr-vanilla) | Composizione lato server senza framework |

---

## 🗺️ Roadmap

Già disponibile:

- Orchestratore con riconciliazioni serializzate, `connectRouter`, montaggio nel viewport e HTML di fallback
- Adapter per React, Vue, Svelte 3-5 e Angular (zoneless), con hydration SSR
- `TuvixIsland`, eventi del ciclo di vita, asset delle island con `@tuvix.js/vite`
- Composizione lato server con streaming e metriche Prometheus (`@tuvix.js/server`)
- Entry Module Federation, devtools nella pagina, scaffolding da CLI
- Documentazione in 10 lingue

Pianificato:

- Hot module reload tra micro app
- Supporto nativo a ESM / import map
- Composizione lato server consapevole dell'edge, con cache dei frammenti stale-while-revalidate
- Utility di test e un orchestratore mock
- A/B testing dei frammenti

---

## 🤝 Contribuire

Leggi la [Guida per contribuire](./CONTRIBUTING.md) prima di aprire una pull request.

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js
pnpm install
pnpm build
pnpm test
```

Arrivi dalla 0.4? Leggi la [guida alla migrazione](https://tuvix.js.org/it/guide/migration-0-5).

---

## 🔑 Licenza

Copyright © 2026 - MIT License.
Vedi [LICENSE](./LICENSE) per maggiori informazioni.

---

<p align="center">Questo README è stato generato da <a href="https://github.com/yasinatesim/markdown-manager">markdown-manager</a> 🥲</p>
