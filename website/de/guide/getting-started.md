# Erste Schritte

Auf dieser Seite baust du eine Shell mit zwei Micro Apps: einer Startseite und einem Dashboard. Du registrierst die Apps, lässt den Router sie mounten und schickst neue Props an eine gemountete App.

## Installation

Installiere das Gesamtpaket. Es enthält Orchestrator, Router, Loader, Event Bus und Sandbox:

```bash
pnpm add tuvix.js
```

Füge für jedes Framework, das deine Micro Apps verwenden, einen Adapter hinzu:

```bash
pnpm add @tuvix.js/react react react-dom
pnpm add @tuvix.js/vue vue
pnpm add @tuvix.js/svelte svelte
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
```

## Ein Projekt anlegen

`create-tuvix-app` erzeugt ein Shell- oder Micro-App-Projekt, das von den 0.5-Paketen abhängt:

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-dashboard --template react-app
```

Templates: `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. Übergib `--example <name>`, um stattdessen eines der Beispiele aus dem Repository zu kopieren.

## Eine Shell bauen

Die Shell verantwortet das Seitenlayout und entscheidet, welche App wohin kommt. Gib ihr ein Container-Element:

```html
<nav>
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
</nav>
<main id="app"></main>
<script type="module" src="/src/main.ts"></script>
```

Erstelle dann den Orchestrator, registriere die Apps und starte ihn:

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

Was passiert:

1. `start()` liest den aktuellen Pfad und mountet jede App, deren `activeWhen` passt.
2. Ein Klick auf `<a href="/dashboard">` ruft `navigateTo('/dashboard')` auf. Der Router setzt die URL, der Orchestrator unmountet `home` und mountet dann `dashboard`.
3. Der erste Mount von `dashboard` lädt sein Skript und sein Stylesheet. Spätere Mounts verwenden das geladene Modul wieder.

Der Router fängt Klicks nie von selbst ab. Ohne `interceptLinks` lädt ein Klick auf einen Link die Seite neu, und der Orchestrator mountet beim neuen Seitenaufruf die richtige App.

## Eine Micro App schreiben

Eine Micro App ist ein Objekt mit `mount` und `unmount`. `defineMicroApp` prüft die Form und registriert das Modul unter seinem Namen, damit der Loader es findet, nachdem das Skript gelaufen ist:

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

Der `name`, den du an `defineMicroApp` übergibst, muss dem Namen entsprechen, den du in der Shell registrierst. Der Loader sucht das Modul unter diesem Namen.

## Einen Framework-Adapter verwenden

Adapter erzeugen dasselbe Modul aus einer Root-Komponente. Sie registrieren es, halten eine Framework-Instanz pro Container und lösen Lifecycle-Events aus.

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

Framework-Seiten: [React](/de/guide/react), [Vue](/de/guide/vue), [Svelte](/de/guide/svelte), [Angular](/de/guide/angular).

Baue jede Micro App als ES-Modul-Bundle und lade sie hoch. Ein Vite-Library-Build funktioniert:

```ts
// dashboard/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.tsx', formats: ['es'], fileName: 'main' },
  },
});
```

Die ES-Ausgabe von Vite endet auf `.js`. Der Loader behandelt sie als klassisches Skript, solange der Entry nicht `type: 'module'` angibt. Behalte `type: 'module'` im Entry der Shell, wie oben gezeigt.

## Props zur Laufzeit aktualisieren

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

`updateAppProps` führt die neuen Props mit den registrierten zusammen. Ist die App gemountet und hat sie `update`, ruft der Orchestrator es mit den zusammengeführten Props auf, und die App rendert an Ort und Stelle neu. Ist die App nicht gemountet, speichert der Orchestrator die Props für den nächsten Mount.

## Was die Shell nicht tut

- Sie rendert dein Layout nicht. Das eigene HTML der Shell enthält die Container.
- Sie teilt keine Framework-Instanzen zwischen Apps. Zwei React-Apps bekommen zwei React-Roots.
- Sie isoliert JavaScript nicht in einer Sandbox. Jede App läuft im `window` der Seite.

## Nächste Schritte

- [Architektur](/de/guide/architecture): der Weg von der Navigation zu `mount`.
- [Routing](/de/guide/routing): `activeWhen`-Muster, der eingebaute Router, Guards.
- [Externer Router](/de/guide/external-router): TanStack Router oder React Router folgen.
- [SSR-Islands](/de/guide/ssr-islands): Micro Apps innerhalb einer React-Seite serverseitig rendern.
