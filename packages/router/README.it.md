# @tuvix.js/router

> Routing history e hash per le micro app, il matcher condiviso `matchPath` e l'intercettazione dei link

Parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentazione completa: [tuvix.js.org/it/packages/router](https://tuvix.js.org/it/packages/router).

Il router associa i path degli URL ai nomi delle micro app e ti avvisa quando il path cambia. `matchPath` è il matcher di pattern usato anche da `activeWhen` del core e da `@tuvix.js/server`. Se la tua shell usa già React Router o TanStack Router, collegalo invece con `orchestrator.connectRouter()` di `@tuvix.js/core`.

## Installazione

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

## Avvio rapido

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

const stopLinks = interceptLinks({ navigate: (path) => router.push(path), base: '/app' });

await router.push('/users/42'); // URL: /app/users/42, currentPath: '/users/42'

stopLinks();
router.destroy();
```

Il costruttore aggiunge il listener `popstate` o `hashchange`. Non esiste una chiamata `start()`.

## API

### `createRouter(config)` e `Router`

`createRouter(config)` restituisce `new Router(config)` tipizzato come `IRouter`.

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | obbligatorio | `{ path, app, meta? }`. Controllate in ordine, vince la prima corrispondenza. I path corrispondono all'intero path: `'/'` è solo la home page, `'/*'` ogni path, `'/blog/*'` `/blog` e ciò che sta sotto. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` usa `pushState` e `location.pathname + search`. `hash` usa `#/path`. |
| `base` | `string` | `'/'` | Prefisso in modalità history. Rimosso in lettura (solo a confine di segmento), aggiunto in scrittura. |

| Membro | Comportamento |
| --- | --- |
| `currentPath`, `currentRoute` | Path relativo all'app (query inclusa in modalità history) e il suo `MatchedRoute \| null`. |
| `push(path)`, `replace(path)` | `Promise<void>`. Eseguono le guard, scrivono `base + path` (o `#path`), eseguono gli handler di `onChange`. Stesso path: nessuna operazione. |
| `back()`, `forward()` | `window.history.back()` / `forward()`. |
| `onChange(handler)` | Viene eseguito dopo ogni navigazione completata. Restituisce una funzione per annullare l'iscrizione. |
| `beforeEach(guard)` | Le guard vengono eseguite in ordine. `false`, un'eccezione o una promise rifiutata annullano la navigazione. Con indietro/avanti il router ripristina l'URL precedente con `replaceState`. Restituisce una funzione di rimozione. |
| `match(path)` | Prima route corrispondente o `null`. |
| `getActiveApps(path?)` | App di ogni route che corrisponde all'intero path, senza duplicati. Una route `'/'` è attiva solo su `/`; usa `'/*'` per ogni pagina. |
| `destroy()` | Rimuove i listener. Le chiamate successive a `push`, `replace`, `back`, `forward`, `onChange`, `beforeEach` lanciano un errore. |

### `matchPath(pattern, path, options?)`

Restituisce `{ matched, params }`.

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | Richiede che un pattern senza `/*` corrisponda all'intero path. |

- Scarta `?query` e `#hash`, ignora lo slash finale.
- `:name` cattura un segmento, decodificato come URI. Un `/*` finale corrisponde al path base e a tutto ciò che sta sotto; il resto non viene catturato. Un `*` in mezzo corrisponde a un segmento.
- Per default `/docs` corrisponde a `/docs/intro` ma non a `/docsify`, e `'/'` corrisponde a ogni path. Con `{ end: true }`, `'/'` corrisponde solo a `/`. Le route del router usano le regole di `end: true`; `activeWhen` del core e le route di `@tuvix.js/server` usano il default a prefisso.
- I pattern compilati vengono messi in cache. Il matching distingue maiuscole e minuscole.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
```

### Helper

| Export | Comportamento |
| --- | --- |
| `matchRoute(path, routes)` | Prima corrispondenza completa come `{ route, path, params, query }`, o `null`. Ignora `#hash`. |
| `isPathActive(path, pattern)` | `matchPath(pattern, path, { end: true }).matched`, le regole sull'intero path usate dalle route. |
| `pathToRegex(pattern)` | `{ regex, paramNames }` in cache con corrispondenza completa. Non modificare `regex`. |
| `parseQuery(query)` | Da `'?a=1&b'` a `{ a: '1', b: '' }`. Divide sul primo `=`, decodifica, mantiene il testo grezzo se la codifica non è valida. |
| `normalizePath(path)` | Aggiunge uno slash iniziale, rimuove uno slash finale. |

### `interceptLinks(options)`

Trasforma i clic su `<a href>` della stessa origine in chiamate `navigate(path)`. Restituisce una funzione di cleanup.

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | obbligatorio | Riceve `pathname + search + hash` senza `base`. Gli errori vengono registrati nel log. |
| `root` | `Document \| HTMLElement` | `document` | Dove si trova il listener dei clic. |
| `base` | `string` | `'/'` | I link fuori da questo prefisso passano al browser; rimosso prima di `navigate`/`prefetch`. |
| `shouldIntercept` | `(anchor, url, event) => boolean` | nessuno | Restituisci `false` per lasciare il clic al browser. Viene eseguito dopo i controlli integrati. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | nessuno | Su `pointerenter` o `focusin`, una volta per `pathname + search`. |

Il browser gestisce il clic quando: un altro handler ha chiamato `preventDefault()`; il pulsante non è quello principale o è premuto Ctrl/Meta/Shift/Alt; `target` è diverso da `_self`; c'è `download`; `rel` contiene `external`; c'è `data-tuvix-reload`; l'origine è diversa; il path è fuori da `base`; è un link hash al path e alla query correnti; oppure `shouldIntercept` restituisce `false`. I link dentro shadow root aperti vengono gestiti; gli elementi SVG `<a>` restano al browser.

### `resolveLink(event, options?)`

Restituisce `{ anchor, url, path }` per l'elemento HTML `<a href>` su cui è avvenuto un evento, oppure `null` quando il link deve gestirlo il browser. `path` è `pathname + search + hash` senza `base`. Lo usano `interceptLinks` e il prefetch al passaggio del mouse dell'orchestratore; chiamalo dai tuoi listener per applicare le stesse regole.

```ts
import { resolveLink } from '@tuvix.js/router';

document.addEventListener('focusin', (event) => {
  const link = resolveLink(event, { base: '/app' });
  if (link) console.log('next page might be', link.path);
});
```

Restituisce `null` per: un `<a>` SVG, un `<a>` senza `href` o nessun `<a>` (decide l'`<a>` più vicino nel path dell'evento); `target` diverso da `_self`; `download`; `rel` che contiene `external`; `data-tuvix-reload`; un'altra origine; un path fuori da `base`; assenza di `window`. Legge `event.composedPath()`, quindi trova i link negli shadow root aperti, non in quelli chiusi. Chiamalo durante il dispatch dell'evento. Non controlla pulsanti, tasti modificatori o link solo hash.

### Tipi

`RouterMode`, `RouterConfig`, `RouteConfig`, `MatchedRoute`, `NavigationEvent` (`{ from, to, fromRoute, toRoute }`, path senza `base`), `NavigationGuard`, `RouteChangeHandler`, `IRouter`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolveLinkOptions` (`{ base? }`), `ResolvedLink` (`{ anchor, url, path }`).

## Casi limite

- Il router non annulla una navigazione in corso quando ne parte un'altra; l'ultima catena di guard che termina scrive l'URL.
- Se altro codice chiama `history.pushState`, `currentPath` resta non aggiornato fino al successivo `popstate`, `hashchange` o navigazione del router.
- Sul server il costruttore imposta `currentPath` a `'/'` e non aggiunge nulla. I metodi di navigazione richiedono `window`.
- Una guard che annulla una navigazione indietro/avanti corregge la barra degli indirizzi; la posizione nella cronologia resta dove l'ha spostata il browser.

## Cosa non fa

- Non monta le app. Lo fa l'orchestratore di `@tuvix.js/core`, usando la configurazione `router` o `connectRouter`.
- Non intercetta i link se non chiami `interceptLinks`.
- Niente route annidate, redirect, guard per singola route o ripristino dello scroll.

## Migrazione dalla 0.4

- `push()`/`replace()` aggiungono il prefisso `base`: con `base: '/app'`, `push('/x')` scrive `/app/x`. Passa path relativi a `base`.
- `base` viene rimosso solo a confine di segmento.
- Le route corrispondono all'intero path in `match`, `getActiveApps` e `isPathActive`; una route `'/'` è attiva solo su `/`. Usa `'/*'` per una route catch-all.
- `RouteConfig.exact` è stato rimosso (veniva ignorato).
- `pathToRegex(pattern)` ha perso l'argomento `exact` e restituisce una `RegExp` in cache.
- I caratteri regex nei pattern corrispondono letteralmente; un `*` in mezzo corrisponde a un segmento.
- `matchRoute()` e `isPathActive()` ignorano `#hash`.

## Licenza

MIT
