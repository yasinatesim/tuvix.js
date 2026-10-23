# Routing

Tuvix.js decide quali app montare in base al percorso corrente. Lo descrivi con `activeWhen` su ogni app, con `routes` sul router integrato, o con entrambi. Un unico matcher, `matchPath` di `@tuvix.js/router`, interpreta ogni pattern, quindi `activeWhen`, il router e `@tuvix.js/server` danno lo stesso significato a `/users/:id`.

## Regole dei pattern

Le stringhe di `activeWhen` usano il matching per prefisso:

| Pattern | Corrisponde a | Non corrisponde a | Parametri |
| --- | --- | --- | --- |
| `/dashboard` | `/dashboard`, `/dashboard/`, `/dashboard/stats` | `/dashboards` | nessuno |
| `/dashboard/*` | gli stessi percorsi di `/dashboard` | `/dashboards` | nessuno |
| `/users/:id` | `/users/42`, `/users/42/posts` | `/users` | `{ id: '42' }` |
| `/v:version/docs` | `/v2/docs` | `/2/docs` | `{ version: '2' }` |
| `/` | ogni percorso | nessuno | nessuno |

- Il matcher scarta `?query` e `#hash` prima del confronto, quindi `/dashboard?tab=1` corrisponde comunque a `/dashboard`.
- Decodifica i parametri: `/users/J%C3%BCrgen` produce `{ id: 'Jürgen' }`.
- Caratteri come `.` e `(` corrispondono letteralmente.
- Un `*` in mezzo a un pattern corrisponde a un segmento.

Verifica un pattern da solo:

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/settings', '/settings/profile').matched; // true
matchPath('/settings', '/settings/profile', { end: true }).matched; // false
matchPath('/', '/about', { end: true }).matched; // false
```

## Attivare le app con activeWhen

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

Una funzione riceve il percorso e restituisce un booleano. Usala per corrispondenze esatte, più prefissi o feature flag.

## Il router integrato

Passa `router` a `createOrchestrator` e l'orchestratore riconcilia dopo ogni navigazione eseguita dal router:

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

Un'app senza `activeWhen` segue le route che la nominano. Due differenze rispetto ad `activeWhen`:

- I percorsi delle route devono corrispondere per intero. `/settings` corrisponde a `/settings` e `/settings/`, non a `/settings/profile`. Aggiungi `/*` per i sottopercorsi.
- Una route con percorso `/` attiva la sua app solo su `/`. Usa `/*` per una route che corrisponde a ogni percorso.

Quando un'app ha `activeWhen`, l'orchestratore usa quello e ignora `routes`.

Il router ascolta `popstate` (modalità history) o `hashchange` (modalità hash). Non intercetta i clic sui link; vedi la sezione successiva.

## Clic sui link

`interceptLinks` trasforma i clic su `<a href>` della stessa origine in chiamate alla tua funzione `navigate` e restituisce una funzione di pulizia:

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

Lascia al browser questi clic:

- con un tasto modificatore (Ctrl, Meta, Shift, Alt) o con un pulsante diverso da quello principale;
- con `event.defaultPrevented` già true;
- con `target` diverso da `_self`, un attributo `download`, `rel="external"` o `data-tuvix-reload`;
- verso un'altra origine, o verso un percorso fuori da `base`;
- su un link solo hash nel percorso corrente, così il browser esegue lo scroll.

`prefetch(path)` viene eseguito su pointerenter o focus, una volta per percorso. `shouldIntercept(anchor, url, event)` aggiunge un tuo filtro; restituisci `false` per lasciare il clic al browser. `root` limita l'ascolto a un solo elemento.

## Navigazione e guard

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

- I guard vengono eseguiti in ordine prima di `push`, `replace` e della navigazione avanti/indietro. `false` annulla. Un guard che lancia un'eccezione annulla e registra l'errore nel log.
- Una navigazione avanti/indietro annullata ripristina l'URL precedente con `replaceState`.
- `push` verso il percorso corrente non fa nulla.
- `router.match` restituisce la prima route che corrisponde; `getActiveApps` restituisce ogni app la cui route corrisponde.

## Percorso base

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { base: '/app', routes: [{ path: '/reports/*', app: 'reports' }] },
});

interceptLinks({ base: '/app', navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.navigateTo('/reports'); // URL becomes /app/reports
```

Con `base: '/app'`:

- il router rimuove `/app` prima del confronto, quindi le route e i pattern di `activeWhen` lo omettono;
- `push('/x')` e `replace('/x')` scrivono `/app/x`;
- `/application` resta `/application`: il base viene rimosso solo al confine di un segmento;
- `interceptLinks` richiede lo stesso `base`, altrimenti passa `/app/x` a `navigateTo`, che scrive `/app/app/x`.

## Modalità hash

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ mode: 'hash', routes: [{ path: '/about', app: 'about' }] });
await router.push('/about'); // URL: /#/about
```

Usala su host statici che non possono riscrivere ogni percorso verso `index.html`. In modalità hash il router ignora `base`.

## Leggere i parametri in un'app

Il contesto di mount non contiene parametri. Leggili dal percorso, oppure passali come props:

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

## Router esterni

Se la navigazione è gestita da TanStack Router, React Router o un altro router, ometti `config.router` e chiama `orchestrator.connectRouter({ subscribe, getPath })`. Vedi [Router esterno](/it/guide/external-router).

## Cosa non fa il routing

- Non esegue il rendering dei componenti di route. Le app eseguono il proprio rendering nei container.
- Non carica dati. Usa un guard, `onChange` o il `mount` dell'app stessa.
- Il router non gestisce i clic sui link, a meno che tu non chiami `interceptLinks`.
