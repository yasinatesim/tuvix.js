# @tuvix.js/router

> History- und Hash-Routing für Micro Apps, der gemeinsame Matcher `matchPath` und das Abfangen von Links

Teil des [Tuvix.js](https://github.com/yasinatesim/tuvix.js) Microfrontend-Frameworks. Vollständige Dokumentation: [tuvix.js.org/de/packages/router](https://tuvix.js.org/de/packages/router).

Der Router ordnet URL-Pfade den Namen von Micro Apps zu und teilt dir mit, wenn sich der Pfad ändert. `matchPath` ist der Pattern-Matcher, den auch `activeWhen` in core und `@tuvix.js/server` verwenden. Wenn deine Shell bereits React Router oder TanStack Router nutzt, verbinde ihn stattdessen mit `orchestrator.connectRouter()` aus `@tuvix.js/core`.

## Installation

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

## Schnellstart

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

Der Konstruktor hängt den Listener für `popstate` oder `hashchange` an. Einen Aufruf `start()` gibt es nicht.

## API

### `createRouter(config)` und `Router`

`createRouter(config)` gibt `new Router(config)` mit dem Typ `IRouter` zurück.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | erforderlich | `{ path, app, meta? }`. Wird der Reihe nach geprüft, der erste Treffer gewinnt. Pfade müssen den ganzen Pfad treffen: `'/'` ist nur die Startseite, `'/*'` jeder Pfad, `'/blog/*'` `/blog` und alles darunter. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` verwendet `pushState` und `location.pathname + search`. `hash` verwendet `#/path`. |
| `base` | `string` | `'/'` | Präfix im History-Modus. Wird beim Lesen entfernt (nur an Segmentgrenzen) und beim Schreiben hinzugefügt. |

| Member | Verhalten |
| --- | --- |
| `currentPath`, `currentRoute` | App-relativer Pfad (im History-Modus inklusive Query) und seine `MatchedRoute \| null`. |
| `push(path)`, `replace(path)` | `Promise<void>`. Führt Guards aus, schreibt `base + path` (oder `#path`), führt die `onChange`-Handler aus. Gleicher Pfad: keine Aktion. |
| `back()`, `forward()` | `window.history.back()` / `forward()`. |
| `onChange(handler)` | Läuft nach jeder abgeschlossenen Navigation. Gibt eine Funktion zum Abbestellen zurück. |
| `beforeEach(guard)` | Guards laufen der Reihe nach. `false`, ein geworfener Fehler oder eine Ablehnung bricht ab. Bei Zurück/Vorwärts stellt der Router die vorherige URL mit `replaceState` wieder her. Gibt eine Funktion zum Entfernen zurück. |
| `match(path)` | Erste passende Route oder `null`. |
| `getActiveApps(path?)` | Apps aller Routen, die den ganzen Pfad treffen, ohne Duplikate. Eine Route `'/'` ist nur auf `/` aktiv; verwende `'/*'` für jede Seite. |
| `destroy()` | Entfernt die Listener. Spätere Aufrufe von `push`, `replace`, `back`, `forward`, `onChange`, `beforeEach` werfen einen Fehler. |

### `matchPath(pattern, path, options?)`

Gibt `{ matched, params }` zurück.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | Ein Pattern ohne `/*` muss den ganzen Pfad treffen. |

- Entfernt `?query` und `#hash` und ignoriert einen abschließenden Slash.
- `:name` erfasst ein Segment, URI-dekodiert. Ein abschließendes `/*` trifft den Basispfad und alles darunter; der Rest wird nicht erfasst. Ein `*` in der Mitte trifft ein Segment.
- Standardmäßig trifft `/docs` den Pfad `/docs/intro`, aber nicht `/docsify`, und `'/'` trifft jeden Pfad. Mit `{ end: true }` trifft `'/'` nur `/`. Router-Routen verwenden die Regeln von `end: true`; `activeWhen` in core und Routen von `@tuvix.js/server` verwenden den Präfix-Standard.
- Kompilierte Patterns werden gecacht. Das Matching unterscheidet Groß- und Kleinschreibung.

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
```

### Helfer

| Export | Verhalten |
| --- | --- |
| `matchRoute(path, routes)` | Erster vollständiger Treffer als `{ route, path, params, query }` oder `null`. Ignoriert `#hash`. |
| `isPathActive(path, pattern)` | `matchPath(pattern, path, { end: true }).matched`, die Regeln für den ganzen Pfad, die Routen verwenden. |
| `pathToRegex(pattern)` | Gecachtes `{ regex, paramNames }` für den vollständigen Treffer. Verändere `regex` nicht. |
| `parseQuery(query)` | `'?a=1&b'` zu `{ a: '1', b: '' }`. Trennt am ersten `=`, dekodiert und behält bei fehlerhafter Kodierung den Rohtext. |
| `normalizePath(path)` | Fügt einen führenden Slash hinzu und entfernt einen abschließenden Slash. |

### `interceptLinks(options)`

Macht aus Klicks auf `<a href>` derselben Origin Aufrufe von `navigate(path)`. Gibt eine Aufräumfunktion zurück.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | erforderlich | Erhält `pathname + search + hash` ohne `base`. Fehler werden geloggt. |
| `root` | `Document \| HTMLElement` | `document` | Wo der Klick-Listener sitzt. |
| `base` | `string` | `'/'` | Links außerhalb davon gehen an den Browser; wird vor `navigate`/`prefetch` entfernt. |
| `shouldIntercept` | `(anchor, url, event) => boolean` | keiner | Gib `false` zurück, damit der Browser den Klick behandelt. Läuft nach den eingebauten Prüfungen. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | keiner | Bei `pointerenter` oder `focusin`, einmal pro `pathname + search`. |

Der Browser behält den Klick, wenn: ein anderer Handler `preventDefault()` aufgerufen hat; eine andere als die primäre Maustaste oder Ctrl/Meta/Shift/Alt im Spiel ist; `target` etwas anderes als `_self` ist; `download` gesetzt ist; `rel` den Wert `external` enthält; `data-tuvix-reload` gesetzt ist; die Origin eine andere ist; der Pfad außerhalb von `base` liegt; ein Hash-Link auf den aktuellen Pfad und die aktuelle Query zeigt; oder `shouldIntercept` `false` zurückgibt. Links in offenen Shadow Roots werden behandelt; SVG-`<a>`-Elemente bleiben dem Browser überlassen.

### `resolveLink(event, options?)`

Gibt `{ anchor, url, path }` für das HTML-`<a href>` zurück, auf dem ein Event passiert ist, oder `null`, wenn der Browser den Link behandeln soll. `path` ist `pathname + search + hash` ohne `base`. `interceptLinks` und der Hover-Prefetch des Orchestrators verwenden es; ruf es aus deinen eigenen Listenern auf, um dieselben Regeln anzuwenden.

```ts
import { resolveLink } from '@tuvix.js/router';

document.addEventListener('focusin', (event) => {
  const link = resolveLink(event, { base: '/app' });
  if (link) console.log('next page might be', link.path);
});
```

Es gibt `null` zurück für: ein SVG-`<a>`, ein `<a>` ohne `href` oder kein `<a>` (das nächste `<a>` auf dem Event-Pfad entscheidet); `target` außer `_self`; `download`; `rel` mit `external`; `data-tuvix-reload`; eine andere Origin; einen Pfad außerhalb von `base`; kein `window`. Es liest `event.composedPath()` und findet daher Links in offenen Shadow Roots, nicht in geschlossenen. Ruf es während des Dispatch auf. Es prüft keine Maustasten, Modifier-Tasten oder reine Hash-Links.

### Typen

`RouterMode`, `RouterConfig`, `RouteConfig`, `MatchedRoute`, `NavigationEvent` (`{ from, to, fromRoute, toRoute }`, Pfade ohne `base`), `NavigationGuard`, `RouteChangeHandler`, `IRouter`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolveLinkOptions` (`{ base? }`), `ResolvedLink` (`{ anchor, url, path }`).

## Sonderfälle

- Der Router bricht eine laufende Navigation nicht ab, wenn eine andere startet; die Guard-Kette, die zuletzt fertig wird, schreibt die URL.
- Wenn anderer Code `history.pushState` aufruft, bleibt `currentPath` veraltet bis zum nächsten `popstate`, `hashchange` oder zur nächsten Router-Navigation.
- Auf dem Server setzt der Konstruktor `currentPath` auf `'/'` und hängt nichts an. Navigationsmethoden brauchen `window`.
- Ein Guard, der eine Zurück/Vorwärts-Navigation abbricht, korrigiert die Adressleiste; die Position in der History bleibt dort, wohin der Browser sie bewegt hat.

## Was es nicht tut

- Es mountet keine Apps. Das übernimmt der Orchestrator in `@tuvix.js/core` mit der `router`-Konfiguration oder `connectRouter`.
- Es fängt keine Links ab, solange du `interceptLinks` nicht aufrufst.
- Keine verschachtelten Routen, Redirects, Guards pro Route oder Wiederherstellung der Scroll-Position.

## Migration von 0.4

- `push()`/`replace()` stellen `base` voran: Mit `base: '/app'` schreibt `push('/x')` den Pfad `/app/x`. Übergib Pfade relativ zu `base`.
- `base` wird nur an einer Segmentgrenze entfernt.
- Routen müssen in `match`, `getActiveApps` und `isPathActive` den ganzen Pfad treffen; eine Route `'/'` ist nur auf `/` aktiv. Verwende `'/*'` als Catch-all.
- `RouteConfig.exact` wurde entfernt (es wurde ignoriert).
- `pathToRegex(pattern)` hat sein Argument `exact` verloren und gibt eine gecachte `RegExp` zurück.
- Regex-Zeichen in Patterns werden wörtlich gematcht; ein `*` in der Mitte trifft ein Segment.
- `matchRoute()` und `isPathActive()` ignorieren `#hash`.

## Lizenz

MIT
