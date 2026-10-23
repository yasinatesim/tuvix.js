# Per iniziare

Questa pagina costruisce una shell con due micro app: una home page e una dashboard. Registrerai le app, lascerai che il router le monti e invierai nuove props a un'app montata.

## Installazione

Installa il pacchetto ombrello. Contiene orchestratore, router, loader, event bus e sandbox:

```bash
pnpm add tuvix.js
```

Aggiungi un adapter per ogni framework usato dalle tue micro app:

```bash
pnpm add @tuvix.js/react react react-dom
pnpm add @tuvix.js/vue vue
pnpm add @tuvix.js/svelte svelte
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
```

## Crea lo scaffolding di un progetto

`create-tuvix-app` genera un progetto shell o micro app che dipende dai pacchetti 0.5:

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-dashboard --template react-app
```

Template: `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. Passa `--example <name>` per copiare invece uno degli esempi del repository.

## Costruisci una shell

La shell gestisce il layout della pagina e decide quale app va dove. Dalle un elemento container:

```html
<nav>
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
</nav>
<main id="app"></main>
<script type="module" src="/src/main.ts"></script>
```

Poi crea l'orchestratore, registra le app e avvialo:

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

Cosa succede:

1. `start()` legge il path corrente e monta ogni app il cui `activeWhen` corrisponde.
2. Un clic su `<a href="/dashboard">` chiama `navigateTo('/dashboard')`. Il router aggiorna l'URL, l'orchestratore smonta `home` e poi monta `dashboard`.
3. Il primo mount di `dashboard` carica il suo script e il suo foglio di stile. I mount successivi riutilizzano il modulo già caricato.

Il router non intercetta mai i clic da solo. Senza `interceptLinks`, il clic su un link ricarica la pagina e l'orchestratore monta l'app giusta al nuovo caricamento della pagina.

## Scrivi una micro app

Una micro app è un oggetto con `mount` e `unmount`. `defineMicroApp` verifica la forma e registra il modulo con il suo nome, così il loader può trovarlo dopo l'esecuzione dello script:

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

Il `name` che passi a `defineMicroApp` deve essere uguale al nome che registri nella shell. Il loader cerca il modulo proprio con quel nome.

## Usa un adapter per framework

Gli adapter creano lo stesso modulo a partire da un componente radice. Lo registrano, mantengono un'istanza del framework per container ed emettono gli eventi del ciclo di vita.

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

Pagine dei framework: [React](/it/guide/react), [Vue](/it/guide/vue), [Svelte](/it/guide/svelte), [Angular](/it/guide/angular).

Fai la build di ogni micro app come bundle ES module e pubblicala. Una build in modalità libreria di Vite funziona:

```ts
// dashboard/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.tsx', formats: ['es'], fileName: 'main' },
  },
});
```

L'output ES di Vite termina in `.js`, che il loader tratta come script classico a meno che la entry non indichi `type: 'module'`. Mantieni `type: 'module'` nella entry della shell, come sopra.

## Aggiorna le props a runtime

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

`updateAppProps` unisce le nuove props a quelle registrate. Se l'app è montata e ha `update`, l'orchestratore lo chiama con le props unite e l'app si renderizza di nuovo sul posto. Se l'app non è montata, l'orchestratore conserva le props per il mount successivo.

## Cosa non fa la shell

- Non renderizza il tuo layout. È l'HTML della shell a contenere i container.
- Non condivide istanze di framework tra le app. Due app React ottengono due root React.
- Non mette in sandbox il JavaScript. Tutte le app girano nel `window` della pagina.

## Prossimi passi

- [Architettura](/it/guide/architecture): il percorso dalla navigazione a `mount`.
- [Routing](/it/guide/routing): pattern di `activeWhen`, il router integrato, le guardie.
- [Router esterno](/it/guide/external-router): segui TanStack Router o React Router.
- [Island SSR](/it/guide/ssr-islands): renderizza lato server le micro app dentro una pagina React.
