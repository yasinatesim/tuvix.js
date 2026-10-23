# Routing

Tuvix.js entscheidet anhand des aktuellen Pfads, welche Apps gemountet werden. Das beschreibst du mit `activeWhen` an jeder App, mit `routes` am eingebauten Router oder mit beidem. Ein einziger Matcher, `matchPath` aus `@tuvix.js/router`, interpretiert jedes Muster. Daher verstehen `activeWhen`, der Router und `@tuvix.js/server` unter `/users/:id` dasselbe.

## Regeln für Muster

`activeWhen`-Strings verwenden Präfix-Matching:

| Muster | Passt auf | Passt nicht auf | Params |
| --- | --- | --- | --- |
| `/dashboard` | `/dashboard`, `/dashboard/`, `/dashboard/stats` | `/dashboards` | keine |
| `/dashboard/*` | dieselben Pfade wie `/dashboard` | `/dashboards` | keine |
| `/users/:id` | `/users/42`, `/users/42/posts` | `/users` | `{ id: '42' }` |
| `/v:version/docs` | `/v2/docs` | `/2/docs` | `{ version: '2' }` |
| `/` | jeden Pfad | keinen | keine |

- Der Matcher entfernt `?query` und `#hash` vor dem Abgleich, daher passt `/dashboard?tab=1` weiterhin auf `/dashboard`.
- Er dekodiert Params: `/users/J%C3%BCrgen` ergibt `{ id: 'Jürgen' }`.
- Zeichen wie `.` und `(` passen wörtlich.
- Ein `*` in der Mitte eines Musters passt auf genau ein Segment.

Prüfe ein Muster selbst:

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/settings', '/settings/profile').matched; // true
matchPath('/settings', '/settings/profile', { end: true }).matched; // false
matchPath('/', '/about', { end: true }).matched; // false
```

## Apps mit activeWhen aktivieren

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  activeWhen: '/users/:id',
});

orchestrator.register({
  name: 'header',
  entry: () => import('./apps/header'),
  container: '#header',
  activeWhen: '/', // every page
});

await orchestrator.start();
```

Eine Funktion erhält den Pfad und gibt einen Boolean zurück. Nutze sie für exakte Treffer, mehrere Präfixe oder Feature Flags.

## Der eingebaute Router

Übergib `router` an `createOrchestrator`, dann gleicht der Orchestrator nach jeder Navigation des Routers ab:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/settings', app: 'settings' },
      { path: '/billing/*', app: 'billing' },
    ],
  },
});

orchestrator.register({ name: 'settings', entry: () => import('./apps/settings'), container: '#app' });
orchestrator.register({ name: 'billing', entry: () => import('./apps/billing'), container: '#app' });

await orchestrator.start();
await orchestrator.navigateTo('/billing/invoices');
```

Eine App ohne `activeWhen` folgt den Routen, die sie benennen. Zwei Unterschiede zu `activeWhen`:

- Routenpfade müssen vollständig passen. `/settings` passt auf `/settings` und `/settings/`, nicht auf `/settings/profile`. Füge `/*` für Unterpfade hinzu.
- Eine Route mit dem Pfad `/` aktiviert ihre App nur auf `/`. Verwende `/*` für eine Route, die auf jeden Pfad passt.

Hat eine App `activeWhen`, verwendet der Orchestrator es und ignoriert `routes`.

Der Router hört auf `popstate` (History-Modus) oder `hashchange` (Hash-Modus). Er fängt keine Link-Klicks ab; siehe den nächsten Abschnitt.

## Link-Klicks

`interceptLinks` macht aus Klicks auf `<a href>` mit gleichem Origin Aufrufe deiner `navigate`-Funktion und gibt eine Aufräumfunktion zurück:

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

const stop = interceptLinks({
  navigate: (path) => orchestrator.navigateTo(path),
  prefetch: (path) => console.debug('user may open', path),
});

// later, when the shell leaves the page
stop();
```

Diese Klicks überlässt es dem Browser:

- eine Modifikatortaste (Ctrl, Meta, Shift, Alt) oder eine andere als die primäre Maustaste;
- `event.defaultPrevented` ist bereits true;
- ein anderes `target` als `_self`, ein `download`-Attribut, `rel="external"` oder `data-tuvix-reload`;
- ein anderer Origin oder ein Pfad außerhalb von `base`;
- ein reiner Hash-Link auf dem aktuellen Pfad, damit der Browser scrollt.

`prefetch(path)` läuft bei pointerenter oder focus, einmal pro Pfad. `shouldIntercept(anchor, url, event)` ergänzt einen eigenen Filter; gib `false` zurück, damit der Browser den Klick behandelt. `root` beschränkt das Zuhören auf ein Element.

## Navigation und Guards

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/users/:id', app: 'user' }] });

const offGuard = router.beforeEach(async ({ to }) => {
  if (!to.startsWith('/admin')) return true;
  const response = await fetch('/api/me');
  return response.ok;
});

const offChange = router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} → ${to}`, toRoute?.params);
});

await router.push('/users/42'); // pushState
await router.replace('/users/43'); // replaceState
router.back();

router.currentPath; // '/users/43'
router.currentRoute?.params; // { id: '43' }
router.currentRoute?.query; // parsed ?query
router.match('/users/7'); // MatchedRoute | null, no navigation
router.getActiveApps('/users/7'); // ['user']

offGuard();
offChange();
router.destroy();
```

- Guards laufen der Reihe nach vor `push`, `replace` und Zurück/Vorwärts. `false` bricht ab. Ein Guard, der einen Fehler wirft, bricht ab und protokolliert den Fehler.
- Eine abgebrochene Zurück/Vorwärts-Navigation stellt die vorherige URL mit `replaceState` wieder her.
- `push` auf den aktuellen Pfad tut nichts.
- `router.match` gibt die erste passende Route zurück; `getActiveApps` gibt jede App zurück, deren Route passt.

## Basispfad

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { base: '/app', routes: [{ path: '/reports/*', app: 'reports' }] },
});

interceptLinks({ base: '/app', navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.navigateTo('/reports'); // URL becomes /app/reports
```

Mit `base: '/app'`:

- entfernt der Router `/app` vor dem Abgleich, daher lassen Routen und `activeWhen`-Muster es weg;
- schreiben `push('/x')` und `replace('/x')` `/app/x`;
- bleibt `/application` `/application`: Die Basis wird nur an einer Segmentgrenze entfernt;
- braucht `interceptLinks` dieselbe `base`, sonst übergibt es `/app/x` an `navigateTo`, das `/app/app/x` schreibt.

## Hash-Modus

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ mode: 'hash', routes: [{ path: '/about', app: 'about' }] });
await router.push('/about'); // URL: /#/about
```

Nutze ihn auf statischen Hosts, die nicht jeden Pfad auf `index.html` umschreiben können. Im Hash-Modus ignoriert der Router `base`.

## Params in einer App lesen

Der Mount-Kontext enthält keine Params. Lies sie aus dem Pfad oder übergib sie als Props:

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { routes: [{ path: '/users/:id', app: 'user' }] },
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  props: { id: matchPath('/users/:id', location.pathname).params.id },
});

orchestrator.getRouter()?.onChange(({ toRoute }) => {
  if (toRoute?.route.app === 'user') {
    void orchestrator.updateAppProps('user', { id: toRoute.params.id });
  }
});

await orchestrator.start();
```

## Externe Router

Wenn TanStack Router, React Router oder ein anderer Router die Navigation steuert, lass `config.router` weg und rufe `orchestrator.connectRouter({ subscribe, getPath })` auf. Siehe [Externer Router](/de/guide/external-router).

## Was Routing nicht tut

- Es rendert keine Routenkomponenten. Apps rendern sich selbst in Container.
- Es lädt keine Daten. Nutze einen Guard, `onChange` oder das eigene `mount` der App.
- Der Router behandelt keine Link-Klicks, außer du rufst `interceptLinks` auf.
