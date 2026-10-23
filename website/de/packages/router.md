---
title: '@tuvix.js/router'
---

<PackageHeader
  name="@tuvix.js/router"
  title="Router"
  description="History- und Hash-Routing für Micro Apps, ein Path-Matcher, den Core und Server teilen, und Link-Abfangen für clientseitige Navigation."
  icon="🔀"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

`@tuvix.js/core` hängt von diesem Paket ab und re-exportiert `createRouter`, `matchPath` und `interceptLinks`. Diese drei kannst du also auch aus Core importieren.

## Wann du es verwendest {#when-to-use-it}

Der Router ordnet URL-Pfade den Namen von Micro Apps zu und meldet dir, wenn sich der Pfad ändert. Verwende ihn, wenn die Shell die Navigation steuert und entscheidet, welche Micro App für eine URL aktiv ist. Der Orchestrator erstellt einen Router für dich, wenn du `router` an `createOrchestrator` übergibst. Die meisten Shells erzeugen ihn deshalb nie selbst.

`matchPath` ist der einzige Pattern-Matcher in Tuvix.js. Core verwendet ihn für `activeWhen`-Strings und `@tuvix.js/server` für die `routes` der Apps. Ein Pattern bedeutet also an allen drei Stellen dasselbe. Du kannst ihn auch allein aufrufen, ohne Router.

Wenn deine Shell schon React Router, TanStack Router oder einen anderen Framework-Router verwendet, behalte ihn. Verbinde ihn mit `orchestrator.connectRouter({ subscribe, getPath })` aus `@tuvix.js/core` mit dem Orchestrator und lass diesen Router weg. `matchPath` und `interceptLinks` kannst du trotzdem daneben verwenden.

## Schnellstart {#quick-start}

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

Der Router hängt seinen `popstate`-Listener (History-Modus) oder `hashchange`-Listener (Hash-Modus) im Konstruktor an. Einen `start()`-Aufruf gibt es nicht.

Mit dem Orchestrator übergibst du dieselbe Konfiguration als `router` und navigierst über den Orchestrator:

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

Eine App ohne `activeWhen` folgt den `routes`, die sie nennen. `orchestrator.getRouter()` gibt die `IRouter`-Instanz zurück.

## API

### `createRouter`

```ts
import type { IRouter, RouterConfig } from '@tuvix.js/router';

declare function createRouter(config: RouterConfig): IRouter;
```

Gibt `new Router(config)` mit dem Typ `IRouter` zurück.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | erforderlich | Routentabelle. Der Router prüft die Routen in Array-Reihenfolge, der erste Treffer gewinnt. |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` liest `location.pathname + location.search` und schreibt mit `pushState`. `hash` liest und schreibt `#/path`. |
| `base` | `string` | `'/'` | Pfadpräfix, unter dem die App ausgeliefert wird, nur im History-Modus. Der Router entfernt es beim Lesen der URL und fügt es beim Schreiben hinzu. Der Hash-Modus ignoriert es. |

Jede `RouteConfig`:

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `path` | `string` | erforderlich | Pattern in `matchPath`-Syntax, geprüft gegen den ganzen Pfad. `'/'` trifft nur die Startseite, `'/*'` trifft jeden Pfad, `'/blog/*'` trifft `/blog` und alles darunter. |
| `app` | `string` | erforderlich | Name der Micro App, die aktiviert wird. |
| `meta` | `Record<string, unknown>` | keiner | Deine Daten. Der Router reicht sie über `MatchedRoute.route.meta` durch. |

### `Router`

```ts
import { Router } from '@tuvix.js/router';

const router = new Router({ routes: [{ path: '/cart', app: 'cart' }] });
```

Die Klasse hinter `createRouter`. Sie implementiert `IRouter`:

| Member | Signatur | Verhalten |
| --- | --- | --- |
| `currentPath` | `readonly string` | App-relativer Pfad ohne `base`. Im History-Modus enthält er den Query-String. |
| `currentRoute` | `readonly MatchedRoute \| null` | Ergebnis von `match(currentPath)`. |
| `push` | `(path: string) => Promise<void>` | Führt die Guards aus, schreibt die URL mit `history.pushState` (`base + path` im History-Modus, `#path` im Hash-Modus) und führt dann die `onChange`-Handler aus. |
| `replace` | `(path: string) => Promise<void>` | Wie `push`, aber mit `history.replaceState`. |
| `back` | `() => void` | Ruft `window.history.back()` auf. |
| `forward` | `() => void` | Ruft `window.history.forward()` auf. |
| `onChange` | `(handler: RouteChangeHandler) => () => void` | Führt `handler` nach jeder abgeschlossenen Navigation aus. Gibt eine Funktion zum Abmelden zurück. |
| `beforeEach` | `(guard: NavigationGuard) => () => void` | Fügt einen Guard hinzu. Gibt eine Funktion zurück, die ihn entfernt. |
| `match` | `(path: string) => MatchedRoute \| null` | Erste Route, die `path` trifft, oder `null`. |
| `getActiveApps` | `(path?: string) => string[]` | App-Namen aller Routen, die den ganzen `path` treffen (Standard: `currentPath`), in Routenreihenfolge, ohne Duplikate. |
| `destroy` | `() => void` | Entfernt den Window-Listener und leert Handler und Guards. |

Übergib `push` und `replace` einen Pfad relativ zu `base`. Mit `base: '/app'` schreibt `router.push('/x')` die URL `/app/x`, und `currentPath` wird `/x`.

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

`match`, `getActiveApps` und `isPathActive` wenden dieselben Regeln für den ganzen Pfad an. Eine Route `'/'` ist nur auf `/` aktiv. Verwende `'/*'` für eine App, die auf jeder Seite erscheint.

#### Guards

Guards laufen in der Reihenfolge, in der du sie hinzugefügt hast, einer nach dem anderen, bevor sich die URL ändert. Löst einer zu `false` auf, bricht die Navigation ab und die übrigen Guards laufen nicht. Jeder andere Wert lässt sie weiterlaufen. Ein Guard, der wirft oder rejected, bricht die Navigation ab, und der Router loggt den Fehler mit `console.error`.

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

Guards laufen auch bei den Zurück- und Vorwärts-Buttons. Der Browser hat dann schon navigiert. Bricht ein Guard ab, ruft der Router deshalb `history.replaceState` auf und schreibt die vorherige URL (mit `base`) zurück in die Adressleiste. Der History-Eintrag bleibt dort, wohin der Browser gesprungen ist.

### `matchPath`

```ts
import type { MatchPathOptions, PathMatch } from '@tuvix.js/router';

declare function matchPath(
  pattern: string,
  path: string,
  options?: MatchPathOptions
): PathMatch;
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | `true` verlangt, dass ein Pattern ohne `/*` den ganzen Pfad trifft. `false` trifft zusätzlich jeden Unterpfad. |

Gibt `{ matched, params }` zurück. Regeln:

- Der Matcher entfernt `?query` und `#hash` aus `path` und ignoriert auf beiden Seiten einen abschließenden Slash.
- `:name` erfasst ein nicht leeres Segment URI-dekodiert in `params.name`. Ein Wert mit fehlerhafter Prozentkodierung bleibt so, wie er geschrieben ist. Ein Segment kann Text und Params mischen: `/v:version` trifft `/v2`.
- Ein abschließendes `/*` trifft den Basispfad und alles darunter: `/docs/*` trifft `/docs` und `/docs/a/b`. Der Rest landet nicht in `params`.
- Ein `*` mitten im Pattern trifft genau ein Segment.
- Standardmäßig trifft ein einfaches Pattern seine Unterpfade an einer Segmentgrenze: `/docs` trifft `/docs/intro`, aber nicht `/docsify`.
- `'/'` trifft standardmäßig jeden Pfad. Mit `{ end: true }` trifft es nur `/`. Router-Routen verwenden immer die Regeln mit `end: true`. `activeWhen`-Strings in Core und die `routes` der Apps in `@tuvix.js/server` verwenden die Standard-Präfixregeln.
- Andere Regex-Zeichen in einem Pattern werden wörtlich verglichen. Der Vergleich beachtet Groß- und Kleinschreibung.

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

Der Matcher kompiliert jedes Pattern einmal und cacht die `RegExp`. Du kannst ihn also bei jeder Navigation aufrufen.

### `matchRoute`

```ts
import type { MatchedRoute, RouteConfig } from '@tuvix.js/router';

declare function matchRoute(path: string, routes: RouteConfig[]): MatchedRoute | null;
```

Gibt die erste Route zurück, deren `path` den ganzen `path` trifft (Regeln mit `end: true`), zusammen mit dem bereinigten Pfad, den dekodierten Params und der geparsten Query. Den `#hash` ignoriert sie. `Router.match` ruft sie auf.

```ts
import { matchRoute } from '@tuvix.js/router';

matchRoute('/users/42?tab=info', [{ path: '/users/:id', app: 'users' }]);
// { route: { path: '/users/:id', app: 'users' }, path: '/users/42', params: { id: '42' }, query: { tab: 'info' } }
```

### `isPathActive`

```ts
declare function isPathActive(path: string, pattern: string): boolean;
```

`matchPath(pattern, path, { end: true }).matched`: dieselben Regeln für den ganzen Pfad, die auch Routen verwenden. `'/'` ist also nur auf `/` aktiv. `Router.getActiveApps` verwendet sie.

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

Gibt die kompilierte `RegExp` für den Vergleich des ganzen Pfads und die Param-Namen des Patterns in Reihenfolge zurück. Das `regex`-Objekt stammt aus dem gemeinsamen Cache: Ändere weder seinen `lastIndex` noch anderen Zustand. Die Regex läuft gegen einen normalisierten Pfad ohne Query und Hash. Verwende `matchPath`, wenn der Pfad diese enthalten kann.

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

Parst `a=1&b=2`, mit oder ohne führendes `?`. Die Funktion teilt jedes Paar am ersten `=`, sodass Werte wie JWTs ihre `=`-Zeichen behalten. Sie dekodiert Schlüssel und Werte und behält den Rohtext, wenn das Dekodieren fehlschlägt. Ein Schlüssel ohne `=` wird zu `''`. Bei einem wiederholten Schlüssel bleibt der letzte Wert.

```ts
import { parseQuery } from '@tuvix.js/router';

parseQuery('?token=abc.def=ghi&debug'); // { token: 'abc.def=ghi', debug: '' }
```

### `normalizePath`

```ts
declare function normalizePath(path: string): string;
```

Fügt einen führenden Slash hinzu und entfernt einen abschließenden Slash. Query und Hash bleiben unverändert.

```ts
import { normalizePath } from '@tuvix.js/router';

normalizePath('users/42/'); // '/users/42'
```

### `interceptLinks`

```ts
import type { InterceptLinksOptions } from '@tuvix.js/router';

declare function interceptLinks(options: InterceptLinksOptions): () => void;
```

Hört auf Klicks auf `<a href>`-Elemente unter `root`, ruft bei denen, die es übernimmt, `preventDefault()` auf und übergibt ihren Pfad an `navigate`. Gibt eine Funktion zurück, die alle angehängten Listener entfernt.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | erforderlich | Erhält `pathname + search + hash` ohne `base`. Die Funktion loggt einen geworfenen Fehler oder ein rejectetes Promise mit `console.error`. |
| `root` | `Document \| HTMLElement` | `document` | Element, an dem der Klick-Listener hängt. |
| `base` | `string` | `'/'` | Pfadpräfix, unter dem die App ausgeliefert wird. Links außerhalb davon übernimmt der Browser. Die Funktion entfernt es, bevor sie `navigate` und `prefetch` aufruft. |
| `shouldIntercept` | `(anchor: HTMLAnchorElement, url: URL, event: MouseEvent) => boolean` | keiner | Läuft nach den eingebauten Prüfungen. Gib `false` zurück, damit der Browser den Klick übernimmt. |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | keiner | Läuft bei `pointerenter` oder `focusin` über einem geeigneten Link, einmal pro `pathname + search`. Der Pfad enthält keinen Hash. |

`interceptLinks` überlässt einen Klick dem Browser, wenn eine dieser Bedingungen zutrifft:

- Ein anderer Handler hat schon `preventDefault()` aufgerufen.
- Es ist nicht die primäre Maustaste, oder Ctrl, Meta, Shift oder Alt ist gedrückt.
- Der Anchor hat ein `target` außer `_self`, ein `download`-Attribut, ein `rel` mit `external` oder ein `data-tuvix-reload`-Attribut.
- Die aufgelöste URL hat einen anderen Origin als die Seite.
- Der URL-Pfad liegt außerhalb von `base` (`/app` umfasst `/app` und `/app/...`, nicht `/application`).
- Der Link hat einen Hash und denselben Pfad und dieselbe Query wie die aktuelle Seite. Der Browser scrollt zum Anchor.
- `shouldIntercept` gibt `false` zurück.

`prefetch` wendet die Prüfungen für Attribute, Origin und `base` an. Modifier-Tasten und die Regel für reine Hash-Links ignoriert es, und es feuert auch für einen Link auf die aktuelle Seite.

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

`interceptLinks` findet den Anchor mit [`resolveLink`](#resolvelink). Deshalb funktionieren auch Links in offenen Shadow Roots, und SVG-`<a>`-Elemente überlässt es dem Browser. In einer Umgebung ohne `document` oder `window` gibt es eine Cleanup-Funktion zurück, die nichts tut.

### `resolveLink`

```ts
import type { ResolvedLink, ResolveLinkOptions } from '@tuvix.js/router';

declare function resolveLink(
  event: Event,
  options?: ResolveLinkOptions
): ResolvedLink | null;
```

Findet das `<a href>`, auf dem ein Event stattfand, und gibt es mit seiner absoluten URL und seinem App-relativen Pfad zurück. Soll der Browser den Link übernehmen, gibt die Funktion `null` zurück. `interceptLinks` und `prefetch: { strategy: 'hover' }` des Orchestrators verwenden sie. Ruf sie aus deinen eigenen Listenern auf, wenn du dieselben Link-Regeln brauchst, zum Beispiel um beim Hover Daten vorzuwärmen oder Navigation innerhalb der App zu loggen.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `base` | `string` | `'/'` | Pfadpräfix, unter dem die App ausgeliefert wird. Für einen Link außerhalb davon gibt die Funktion `null` zurück. Sie entfernt es aus `path`. |

| Feld | Typ | Bedeutung |
| --- | --- | --- |
| `anchor` | `HTMLAnchorElement` | Das `<a>`-Element. |
| `url` | `URL` | Absolute URL des Links. |
| `path` | `string` | `pathname + search + hash` ohne `base`. |

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

`resolveLink` gibt `null` zurück, wenn eine dieser Bedingungen zutrifft:

- Das nächste `<a>` auf dem Event-Pfad ist ein SVG-`<a>` oder ein HTML-`<a>` ohne `href`, oder es gibt gar kein `<a>`. Die Suche endet beim ersten `<a>`, auf das sie trifft.
- Der Anchor hat ein `target` außer `_self`, ein `download`-Attribut, ein `rel` mit `external` oder ein `data-tuvix-reload`-Attribut.
- Die URL hat einen anderen Origin als die Seite.
- Der URL-Pfad liegt außerhalb von `base` (`/app` umfasst `/app` und `/app/...`, nicht `/application`).
- Es gibt kein `window`, etwa auf dem Server.

Die Funktion liest `event.composedPath()`. Ein Listener auf `document` findet deshalb Links in offenen Shadow Roots. Links in geschlossenen Shadow Roots bleiben ihr verborgen. Ruf sie auf, während das Event dispatcht wird: Nach dem Dispatch ist der Composed Path leer, und die Funktion weicht auf `event.target.closest('a')` aus, das nicht in eine Shadow Root hineinsehen kann.

Sie prüft weder Maustaste noch Modifier-Tasten, `defaultPrevented` oder die Regel für reine Hash-Links. Diese Prüfungen wendet `interceptLinks` bei Klicks zusätzlich an.

### Typen {#types}

| Typ | Bedeutung |
| --- | --- |
| `RouterMode` | `'history' \| 'hash'`. |
| `RouterConfig` | `{ mode?, base?, routes }`, die Optionen von `createRouter`. |
| `RouteConfig` | `{ path, app, meta? }`, eine Route. |
| `MatchedRoute` | `{ route, path, params, query }`. `path` ist der bereinigte Pathname, `params` sind die dekodierten `:param`-Werte, `query` ist der geparste Query-String. |
| `NavigationEvent` | `{ from, to, fromRoute, toRoute }`. `from` und `to` sind App-relative Pfade ohne `base`. |
| `NavigationGuard` | `(event: NavigationEvent) => boolean \| Promise<boolean>`. |
| `RouteChangeHandler` | `(event: NavigationEvent) => void`. |
| `IRouter` | Interface, das `Router` implementiert und `createRouter` zurückgibt. |
| `PathMatch` | `{ matched: boolean; params: Record<string, string> }`, das Ergebnis von `matchPath`. `params` ist `{}`, wenn nichts getroffen wurde. |
| `MatchPathOptions` | `{ end?: boolean }`. |
| `InterceptLinksOptions` | Optionen für `interceptLinks`. |
| `ResolveLinkOptions` | `{ base?: string }`, die Optionen von `resolveLink`. |
| `ResolvedLink` | `{ anchor: HTMLAnchorElement; url: URL; path: string }`, das Ergebnis von `resolveLink`. |

## Sonderfälle {#edge-cases}

- `push` und `replace` auf den Pfad, auf dem du schon bist (gleicher String, Query eingeschlossen), kehren zurück, ohne Guards oder Handler auszuführen.
- Der Router bricht eine laufende Navigation nicht ab, wenn du eine neue startest. Jedes `push` wartet auf seine eigenen Guards und schreibt dann die URL. Die Guard-Kette, die zuletzt fertig wird, gewinnt.
- Der Router erfährt von URL-Änderungen über sein eigenes `push`/`replace` und über `popstate`/`hashchange`. Ruft anderer Code `history.pushState` auf, bleibt `currentPath` veraltet, bis das nächste Event oder die nächste Router-Navigation kommt.
- Nach `destroy()` werfen `push`, `replace`, `back`, `forward`, `onChange` und `beforeEach` den Fehler `[Tuvix Router] Cannot use a destroyed Router. Create a new one.` `match` und `getActiveApps` funktionieren weiter.
- Wirft ein `onChange`-Handler, loggt der Router das mit `console.error` und ruft die anderen Handler trotzdem auf.
- Mit `base: '/app'` liest der Router `/application` als `/application`: Er entfernt die Base nur an einer Segmentgrenze. Im History-Modus verwirft er beim Lesen der URL den `#hash`.
- Auf dem Server (ohne `window`) setzt der Konstruktor `currentPath` auf `'/'` und hängt keinen Listener an. `push`, `replace`, `back` und `forward` brauchen `window`.
- `matchPath` mit einem `/*`-Pattern trifft auch den Basispfad selbst: `/dashboard/*` trifft `/dashboard`.
- Ein Event auf einem `<a>` innerhalb eines `<svg>` ergibt `null`, auch wenn ein HTML-`<a>` das SVG umschließt. `interceptLinks` und das Hover-Prefetch des Orchestrators überlassen diesen Link dem Browser, der die ganze Seite lädt.

## Was es nicht tut {#what-it-does-not-do}

- Es mountet und unmountet keine Micro Apps. Es meldet Treffer und Änderungen, der Orchestrator in `@tuvix.js/core` reagiert darauf.
- Es fängt keine Link-Klicks ab, solange du nicht `interceptLinks` aufrufst.
- Es kennt keine verschachtelten Routen, benannten Routen, Redirects oder Guards pro Route. Verwende `beforeEach` und prüfe `to` oder `toRoute`.
- Es erfasst den `/*`-Rest eines Pfads nicht in `params`.
- Es stellt die Scroll-Position nicht wieder her.

## Migration von 0.4 {#migrating-from-0-4}

`push()` und `replace()` stellen jetzt `base` voran. Übergib Pfade relativ zu `base`:

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ base: '/app', routes: [] });

// 0.4: router.push('/app/x') wrote /app/x, router.push('/x') wrote /x
// 0.5: router.push('/x') writes /app/x
await router.push('/x');
```

Weitere Breaking Changes:

- `base` wird nur an einer Segmentgrenze entfernt: `/application` wird nicht mehr als `/lication` gelesen.
- Routen treffen in `match`, `getActiveApps` und `isPathActive` den ganzen Pfad. In 0.4 behandelten `getActiveApps` und `isPathActive` eine `'/'`-Route als auf jedem Pfad aktiv. Ändere eine Catch-all-Route `{ path: '/', app }` in `{ path: '/*', app }`.
- `RouteConfig.exact` wurde entfernt. Die Option wurde akzeptiert und ignoriert. Lösche sie aus deinen Routenobjekten.
- `pathToRegex(pattern)` hat sein zweites Argument `exact` verloren und gibt eine gecachte `RegExp` zurück.
- Regex-Zeichen in Patterns werden wörtlich verglichen, und ein `*` mitten im Pattern trifft genau ein Segment.
- `matchRoute()` und `isPathActive()` ignorieren einen `#hash` im Pfad.
- Die Dokumentation für 0.4 nannte `navigate`, `go` und `onRouteChange`, eine Router-Option `orchestrator` und einen `guard` pro Route. Nichts davon existiert. Verwende `push`, `back`/`forward`, `onChange`, die `router`-Konfiguration des Orchestrators und `beforeEach`.
