---
title: '@tuvix.js/router'
---

<PackageHeader
  name="@tuvix.js/router"
  title="Router"
  description="Routing history e hash per le micro app, un unico matcher di path condiviso con core e con il server, e intercettazione dei link per la navigazione lato client."
  icon="🔀"
  npm="true"
/>

## Installazione

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

`@tuvix.js/core` dipende da questo pacchetto e riesporta `createRouter`, `matchPath` e `interceptLinks`, quindi puoi importare queste tre funzioni anche da core.

## Quando usarlo

Il router associa i path degli URL ai nomi delle micro app e ti avvisa quando il path cambia. Usalo quando la shell gestisce la navigazione e decide quale micro app è attiva per un URL. L'orchestratore ne crea uno per te quando passi `router` a `createOrchestrator`, quindi la maggior parte delle shell non lo costruisce mai a mano.

`matchPath` è l'unico matcher di pattern in Tuvix.js. Core lo usa per le stringhe `activeWhen` e `@tuvix.js/server` lo usa per le `routes` delle app, quindi un pattern ha lo stesso significato in tutti e tre i punti. Puoi chiamarlo da solo, senza un router.

Se la tua shell usa già React Router, TanStack Router o il router di un altro framework, tienilo. Collegalo all'orchestratore con `orchestrator.connectRouter({ subscribe, getPath })` di `@tuvix.js/core` e fai a meno di questo router. Puoi comunque usare `matchPath` e `interceptLinks` insieme a quel router.

## Avvio rapido

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
    { path: '/settings', app: 'settings' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

router.beforeEach(({ from }) => !from.startsWith('/settings') || confirm('Discard unsaved settings?'));

// <a href="/app/users/42"> now calls router.push('/users/42') instead of reloading.
const stopLinks = interceptLinks({
  navigate: (path) => router.push(path),
  base: '/app',
});

await router.push('/users/42?tab=posts');
console.log(router.currentPath); // '/users/42?tab=posts'
console.log(router.currentRoute?.params); // { id: '42' }
console.log(window.location.pathname); // '/app/users/42'

// On teardown:
stopLinks();
router.destroy();
```

Il router registra il listener `popstate` (modalità history) o `hashchange` (modalità hash) nel costruttore. Non esiste una chiamata `start()`.

Con l'orchestratore, passa la stessa configurazione come `router` e naviga tramite l'orchestratore:

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { interceptLinks } from '@tuvix.js/router';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Un'app senza `activeWhen` segue le `routes` che la nominano. `orchestrator.getRouter()` restituisce l'istanza `IRouter`.

## API

### `createRouter`

```ts
import type { IRouter, RouterConfig } from '@tuvix.js/router';

declare function createRouter(config: RouterConfig): IRouter;
```

Restituisce `new Router(config)` tipizzato come `IRouter`.

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | obbligatorio | Tabella delle route. Il router controlla le route nell'ordine dell'array e vince la prima corrispondenza. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` legge `location.pathname + location.search` e scrive con `pushState`. `hash` legge e scrive `#/path`. |
| `base` | `string` | `'/'` | Prefisso di path sotto cui l'app è servita, solo in modalità history. Il router lo rimuove quando legge l'URL e lo aggiunge quando lo scrive. La modalità hash lo ignora. |

Ogni `RouteConfig`:

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `path` | `string` | obbligatorio | Pattern nella sintassi di `matchPath`, confrontato con l'intero path. `'/'` corrisponde solo alla home page, `'/*'` corrisponde a ogni path, `'/blog/*'` corrisponde a `/blog` e a tutto ciò che sta sotto. |
| `app` | `string` | obbligatorio | Nome della micro app da attivare. |
| `meta` | `Record<string, unknown>` | nessuno | Dati tuoi. Il router li inoltra in `MatchedRoute.route.meta`. |

### `Router`

```ts
import { Router } from '@tuvix.js/router';

const router = new Router({ routes: [{ path: '/cart', app: 'cart' }] });
```

La classe dietro `createRouter`. Implementa `IRouter`:

| Membro | Firma | Comportamento |
| --- | --- | --- |
| `currentPath` | `readonly string` | Path relativo all'app, senza `base`. In modalità history include la query string. |
| `currentRoute` | `readonly MatchedRoute \| null` | Risultato di `match(currentPath)`. |
| `push` | `(path: string) => Promise<void>` | Esegue le guard, scrive l'URL con `history.pushState` (`base + path` in modalità history, `#path` in modalità hash), poi esegue gli handler `onChange`. |
| `replace` | `(path: string) => Promise<void>` | Come `push`, ma con `history.replaceState`. |
| `back` | `() => void` | Chiama `window.history.back()`. |
| `forward` | `() => void` | Chiama `window.history.forward()`. |
| `onChange` | `(handler: RouteChangeHandler) => () => void` | Esegue `handler` dopo ogni navigazione completata. Restituisce una funzione per annullare l'iscrizione. |
| `beforeEach` | `(guard: NavigationGuard) => () => void` | Aggiunge una guard. Restituisce una funzione che la rimuove. |
| `match` | `(path: string) => MatchedRoute \| null` | Prima route che corrisponde a `path`, oppure `null`. |
| `getActiveApps` | `(path?: string) => string[]` | Nomi delle app di ogni route che corrisponde all'intero `path` (default: `currentPath`), nell'ordine delle route, senza duplicati. |
| `destroy` | `() => void` | Rimuove il listener su window e azzera handler e guard. |

Passa a `push` e `replace` un path relativo a `base`. Con `base: '/app'`, `router.push('/x')` scrive `/app/x` e `currentPath` diventa `/x`.

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  base: '/app',
  routes: [
    { path: '/*', app: 'header' },
    { path: '/docs/*', app: 'docs' },
    { path: '/docs/:page', app: 'doc-sidebar' },
  ],
});

router.match('/docs/intro')?.route.app; // 'header' (first match wins)
router.getActiveApps('/docs/intro'); // ['header', 'docs', 'doc-sidebar']
router.getActiveApps('/'); // ['header']
await router.replace('/docs/intro'); // URL: /app/docs/intro, no new history entry
router.back();
```

`match`, `getActiveApps` e `isPathActive` applicano le stesse regole sull'intero path. Una route `'/'` è attiva solo su `/`; usa `'/*'` per un'app che compare in ogni pagina.

#### Guard

Le guard vengono eseguite nell'ordine in cui le hai aggiunte, una alla volta, prima che l'URL cambi. Se una guard si risolve in `false`, la navigazione viene annullata e le guard rimanenti vengono saltate. Qualsiasi altro valore la lascia proseguire. Una guard che lancia un'eccezione o viene rifiutata annulla la navigazione, e il router registra l'errore con `console.error`.

```ts
import { createRouter } from '@tuvix.js/router';

declare function isAdmin(): Promise<boolean>;

const router = createRouter({
  routes: [{ path: '/admin/*', app: 'admin' }],
});

const removeGuard = router.beforeEach(async ({ to }) => {
  if (to.startsWith('/admin')) return isAdmin();
  return true;
});

removeGuard();
```

Le guard vengono eseguite anche per i pulsanti indietro e avanti. A quel punto il browser si è già spostato, quindi quando una guard annulla, il router chiama `history.replaceState` per rimettere l'URL precedente (con `base`) nella barra degli indirizzi. La voce della cronologia resta dove il browser l'ha spostata.

### `matchPath`

```ts
import type { MatchPathOptions, PathMatch } from '@tuvix.js/router';

declare function matchPath(
  pattern: string,
  path: string,
  options?: MatchPathOptions
): PathMatch;
```

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | `true` richiede che un pattern senza `/*` corrisponda all'intero path. `false` corrisponde anche a ogni sotto-path. |

Restituisce `{ matched, params }`. Regole:

- Il matcher scarta `?query` e `#hash` da `path` e ignora uno slash finale su entrambi i lati.
- `:name` cattura un segmento non vuoto in `params.name`, decodificato come URI. Un valore con percent-encoding malformato resta com'è scritto. Un segmento può mescolare testo e parametri: `/v:version` corrisponde a `/v2`.
- Un `/*` finale corrisponde al path base e a tutto ciò che sta sotto: `/docs/*` corrisponde a `/docs` e a `/docs/a/b`. La parte restante non viene catturata in `params`.
- Un `*` in mezzo a un pattern corrisponde a un solo segmento.
- Per default un pattern semplice corrisponde ai suoi sotto-path al confine di un segmento: `/docs` corrisponde a `/docs/intro` e non corrisponde a `/docsify`.
- `'/'` corrisponde per default a ogni path. Con `{ end: true }` corrisponde solo a `/`. Le route del router usano sempre le regole `end: true`; le stringhe `activeWhen` di core e le `routes` delle app di `@tuvix.js/server` usano le regole di prefisso predefinite.
- Gli altri caratteri speciali delle regex in un pattern corrispondono letteralmente. Il confronto distingue maiuscole e minuscole.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts#bio'); // { matched: true, params: { id: '42' } }
matchPath('/files/:name', '/files/a%20b.txt').params.name; // 'a b.txt'
matchPath('/docs', '/docs/intro').matched; // true
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
matchPath('/docs', '/docsify').matched; // false
matchPath('/', '/anything').matched; // true
matchPath('/a/*/c', '/a/b/c').matched; // true
```

Il matcher compila ogni pattern una sola volta e mette in cache la `RegExp`, quindi puoi chiamarlo a ogni navigazione.

### `matchRoute`

```ts
import type { MatchedRoute, RouteConfig } from '@tuvix.js/router';

declare function matchRoute(path: string, routes: RouteConfig[]): MatchedRoute | null;
```

Restituisce la prima route il cui `path` corrisponde a `path` per intero (regole `end: true`), con il path ripulito, i parametri decodificati e la query analizzata. Ignora l'`#hash`. `Router.match` la chiama.

```ts
import { matchRoute } from '@tuvix.js/router';

matchRoute('/users/42?tab=info', [{ path: '/users/:id', app: 'users' }]);
// { route: { path: '/users/:id', app: 'users' }, path: '/users/42', params: { id: '42' }, query: { tab: 'info' } }
```

### `isPathActive`

```ts
declare function isPathActive(path: string, pattern: string): boolean;
```

`matchPath(pattern, path, { end: true }).matched`: le regole sull'intero path usate dalle route, quindi `'/'` è attivo solo su `/`. `Router.getActiveApps` la usa.

```ts
import { isPathActive } from '@tuvix.js/router';

isPathActive('/settings/profile', '/settings'); // false
isPathActive('/settings/profile', '/settings/*'); // true
isPathActive('/settings/profile', '/'); // false
isPathActive('/settings/profile', '/*'); // true
```

### `pathToRegex`

```ts
declare function pathToRegex(pattern: string): { regex: RegExp; paramNames: string[] };
```

Restituisce la `RegExp` compilata per la corrispondenza completa di un pattern e i nomi dei suoi parametri in ordine. L'oggetto `regex` proviene dalla cache condivisa: non modificare il suo `lastIndex` né altro stato. La regex viene eseguita su un path normalizzato senza query né hash; usa `matchPath` quando il path può contenerli.

```ts
import { pathToRegex } from '@tuvix.js/router';

const { regex, paramNames } = pathToRegex('/posts/:slug');
regex.test('/posts/hello'); // true
paramNames; // ['slug']
```

### `parseQuery`

```ts
declare function parseQuery(queryString: string): Record<string, string>;
```

Analizza `a=1&b=2`, con o senza il `?` iniziale. Divide ogni coppia sul primo `=`, così valori come i JWT mantengono i loro caratteri `=`, decodifica chiavi e valori e mantiene il testo grezzo quando la decodifica fallisce. Una chiave senza `=` diventa `''`. Una chiave ripetuta mantiene l'ultimo valore.

```ts
import { parseQuery } from '@tuvix.js/router';

parseQuery('?token=abc.def=ghi&debug'); // { token: 'abc.def=ghi', debug: '' }
```

### `normalizePath`

```ts
declare function normalizePath(path: string): string;
```

Aggiunge uno slash iniziale e rimuove uno slash finale. Non tocca query né hash.

```ts
import { normalizePath } from '@tuvix.js/router';

normalizePath('users/42/'); // '/users/42'
```

### `interceptLinks`

```ts
import type { InterceptLinksOptions } from '@tuvix.js/router';

declare function interceptLinks(options: InterceptLinksOptions): () => void;
```

Ascolta i clic sugli elementi `<a href>` sotto `root`, chiama `preventDefault()` su quelli che gestisce e passa il loro path a `navigate`. Restituisce una funzione che rimuove tutti i listener che ha aggiunto.

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | obbligatorio | Riceve `pathname + search + hash` senza `base`. La funzione registra con `console.error` un errore lanciato o una promise rifiutata. |
| `root` | `Document \| HTMLElement` | `document` | Elemento su cui si trova il listener dei clic. |
| `base` | `string` | `'/'` | Prefisso di path sotto cui l'app è servita. I link esterni a questo prefisso vanno al browser. La funzione lo rimuove prima di chiamare `navigate` e `prefetch`. |
| `shouldIntercept` | `(anchor: HTMLAnchorElement, url: URL, event: MouseEvent) => boolean` | nessuno | Viene eseguita dopo i controlli integrati. Restituisci `false` per lasciare il clic al browser. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | nessuno | Viene eseguita su `pointerenter` o `focusin` sopra un link idoneo, una volta per `pathname + search`. Il path non ha hash. |

`interceptLinks` lascia il clic al browser quando vale una qualsiasi di queste condizioni:

- Un altro handler ha già chiamato `preventDefault()`.
- Il pulsante non è quello principale, oppure è premuto Ctrl, Meta, Shift o Alt.
- L'anchor ha un `target` diverso da `_self`, un attributo `download`, un `rel` che contiene `external` o un attributo `data-tuvix-reload`.
- L'URL risolto ha un'origine diversa da quella della pagina.
- Il path dell'URL è fuori da `base` (`/app` copre `/app` e `/app/...`, non `/application`).
- Il link ha un hash e lo stesso path e la stessa query della pagina corrente. Il browser scorre fino all'ancora.
- `shouldIntercept` restituisce `false`.

`prefetch` applica i controlli su attributi, origine e `base`. Ignora i tasti modificatori e la regola sul solo hash, e si attiva anche per un link alla pagina corrente.

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/shop/*', app: 'shop' }] });
const nav = document.querySelector('nav') ?? document;

const stop = interceptLinks({
  navigate: (path) => router.push(path),
  root: nav,
  shouldIntercept: (anchor) => !anchor.closest('[data-legacy]'),
  prefetch: (path) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.append(link);
  },
});

stop();
```

`interceptLinks` trova l'anchor con [`resolveLink`](#resolvelink), quindi i link dentro shadow root aperte funzionano e gli elementi SVG `<a>` restano al browser. In un ambiente senza `document` o `window` restituisce una funzione di cleanup che non fa nulla.

### `resolveLink`

```ts
import type { ResolvedLink, ResolveLinkOptions } from '@tuvix.js/router';

declare function resolveLink(
  event: Event,
  options?: ResolveLinkOptions
): ResolvedLink | null;
```

Trova l'`<a href>` su cui è avvenuto un evento e lo restituisce con il suo URL assoluto e il path relativo all'app. Restituisce `null` quando il link spetta al browser. La usano `interceptLinks` e `prefetch: { strategy: 'hover' }` dell'orchestratore. Chiamala dai tuoi listener quando ti servono le stesse regole sui link, per esempio per precaricare dati all'hover o per registrare la navigazione interna all'app.

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `base` | `string` | `'/'` | Prefisso di path sotto cui l'app è servita. Un link fuori da questo prefisso restituisce `null`. La funzione lo rimuove da `path`. |

| Campo | Tipo | Significato |
| --- | --- | --- |
| `anchor` | `HTMLAnchorElement` | L'elemento `<a>`. |
| `url` | `URL` | URL assoluto del link. |
| `path` | `string` | `pathname + search + hash`, senza `base`. |

```ts
import { resolveLink } from '@tuvix.js/router';

const warmed = new Set<string>();

function warmUp(event: Event): void {
  const link = resolveLink(event, { base: '/app' });
  if (!link || warmed.has(link.url.pathname)) return;
  warmed.add(link.url.pathname);
  void fetch(`/api/page-data?path=${encodeURIComponent(link.path)}`);
}

// pointerenter does not bubble, so listen in the capture phase.
document.addEventListener('pointerenter', warmUp, true);
document.addEventListener('focusin', warmUp);
```

`resolveLink` restituisce `null` quando vale una qualsiasi di queste condizioni:

- L'`<a>` più vicino nel percorso dell'evento è un `<a>` SVG, oppure un `<a>` HTML senza `href`, oppure non c'è alcun `<a>`. La ricerca si ferma al primo `<a>` che incontra.
- L'anchor ha un `target` diverso da `_self`, un attributo `download`, un `rel` che contiene `external` o un attributo `data-tuvix-reload`.
- L'URL ha un'origine diversa da quella della pagina.
- Il path dell'URL è fuori da `base` (`/app` copre `/app` e `/app/...`, non `/application`).
- Non esiste `window`, come sul server.

Legge `event.composedPath()`, quindi un listener su `document` trova i link dentro shadow root aperte. I link dentro shadow root chiuse le restano nascosti. Chiamala mentre l'evento è in fase di dispatch: al termine del dispatch il percorso composto è vuoto e la funzione ripiega su `event.target.closest('a')`, che non può guardare dentro una shadow root.

Non controlla il pulsante del mouse, i tasti modificatori, `defaultPrevented` né la regola sul solo hash. `interceptLinks` applica questi controlli in aggiunta per i clic.

### Tipi

| Tipo | Significato |
| --- | --- |
| `RouterMode` | `'history' \| 'hash'`. |
| `RouterConfig` | `{ mode?, base?, routes }`, le opzioni di `createRouter`. |
| `RouteConfig` | `{ path, app, meta? }`, una route. |
| `MatchedRoute` | `{ route, path, params, query }`. `path` è il pathname ripulito, `params` i valori `:param` decodificati, `query` la query string analizzata. |
| `NavigationEvent` | `{ from, to, fromRoute, toRoute }`. `from` e `to` sono path relativi all'app, senza `base`. |
| `NavigationGuard` | `(event: NavigationEvent) => boolean \| Promise<boolean>`. |
| `RouteChangeHandler` | `(event: NavigationEvent) => void`. |
| `IRouter` | Interfaccia che `Router` implementa e che `createRouter` restituisce. |
| `PathMatch` | `{ matched: boolean; params: Record<string, string> }`, il risultato di `matchPath`. `params` è `{}` quando non c'è corrispondenza. |
| `MatchPathOptions` | `{ end?: boolean }`. |
| `InterceptLinksOptions` | Opzioni di `interceptLinks`. |
| `ResolveLinkOptions` | `{ base?: string }`, le opzioni di `resolveLink`. |
| `ResolvedLink` | `{ anchor: HTMLAnchorElement; url: URL; path: string }`, il risultato di `resolveLink`. |

## Casi limite

- `push` e `replace` verso il path su cui ti trovi (stessa stringa, query inclusa) ritornano senza eseguire guard né handler.
- Il router non annulla una navigazione in sospeso quando ne avvii un'altra. Ogni `push` attende le proprie guard, poi scrive l'URL, quindi vince l'ultima catena di guard che termina.
- Il router viene a sapere dei cambi di URL dai propri `push`/`replace` e da `popstate`/`hashchange`. Se altro codice chiama `history.pushState`, `currentPath` resta obsoleto fino al prossimo evento o alla prossima navigazione del router.
- Dopo `destroy()`, `push`, `replace`, `back`, `forward`, `onChange` e `beforeEach` lanciano `[Tuvix Router] Cannot use a destroyed Router. Create a new one.` `match` e `getActiveApps` continuano a funzionare.
- Se un handler `onChange` lancia un'eccezione, il router la registra con `console.error` e chiama comunque gli altri handler.
- Con `base: '/app'`, il router legge `/application` come `/application`: rimuove la base solo al confine di un segmento. In modalità history scarta l'`#hash` quando legge l'URL.
- Sul server (senza `window`), il costruttore imposta `currentPath` a `'/'` e non registra alcun listener. `push`, `replace`, `back` e `forward` richiedono `window`.
- `matchPath` con un pattern `/*` corrisponde al path base stesso: `/dashboard/*` corrisponde a `/dashboard`.
- Un evento su un `<a>` dentro un `<svg>` si risolve in `null`, anche quando un `<a>` HTML avvolge l'SVG. `interceptLinks` e il prefetch all'hover dell'orchestratore lasciano quel link al browser, che carica la pagina intera.

## Cosa non fa

- Non monta né smonta le micro app. Segnala corrispondenze e cambi; l'orchestratore in `@tuvix.js/core` agisce di conseguenza.
- Non intercetta i clic sui link a meno che tu non chiami `interceptLinks`.
- Non ha route annidate, route con nome, redirect né guard per singola route. Usa `beforeEach` e controlla `to` o `toRoute`.
- Non cattura in `params` la parte `/*` restante di un path.
- Non ripristina la posizione di scroll.

## Migrazione dalla 0.4

`push()` e `replace()` ora aggiungono il prefisso `base`. Passa path relativi a `base`:

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ base: '/app', routes: [] });

// 0.4: router.push('/app/x') wrote /app/x, router.push('/x') wrote /x
// 0.5: router.push('/x') writes /app/x
await router.push('/x');
```

Altre breaking change:

- `base` viene rimosso solo al confine di un segmento: `/application` non viene più letto come `/lication`.
- Le route corrispondono all'intero path in `match`, `getActiveApps` e `isPathActive`. Nella 0.4, `getActiveApps` e `isPathActive` consideravano una route `'/'` attiva su ogni path. Trasforma una route catch-all `{ path: '/', app }` in `{ path: '/*', app }`.
- `RouteConfig.exact` è stato rimosso. Era accettato e ignorato; eliminalo dai tuoi oggetti route.
- `pathToRegex(pattern)` ha perso il secondo argomento `exact` e restituisce una `RegExp` in cache.
- I caratteri speciali delle regex nei pattern corrispondono letteralmente, e un `*` in mezzo a un pattern corrisponde a un solo segmento.
- `matchRoute()` e `isPathActive()` ignorano un `#hash` nel path.
- La documentazione della 0.4 elencava `navigate`, `go` e `onRouteChange`, un'opzione `orchestrator` del router e una `guard` per singola route. Nessuno di questi esiste. Usa `push`, `back`/`forward`, `onChange`, la configurazione `router` dell'orchestratore e `beforeEach`.
