---
title: 'tuvix.js'
---

<PackageHeader
  name="tuvix.js"
  title="tuvix.js (Umbrella)"
  description="Ein Paket, ein Importpfad. Exportiert den Orchestrator aus @tuvix.js/core sowie die öffentlichen APIs von @tuvix.js/router, @tuvix.js/event-bus, @tuvix.js/loader und @tuvix.js/sandbox erneut."
  icon="🎁"
  github="tuvix"
/>

## Installation

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

Die Installation von `tuvix.js` installiert `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` und `@tuvix.js/sandbox`. Alle sechs Pakete liefern Builds als ES-Modul und CommonJS aus und deklarieren `"sideEffects": false`.

## Wann du es verwendest

Installiere `tuvix.js` in einer Shell-Anwendung, die den Orchestrator zusammen mit dem Router, dem Event Bus oder der Sandbox verwendet. Du bekommst eine Abhängigkeit zum Versionieren und einen Importpfad, und dein Bundler entfernt die Exporte, die du nie importierst.

Installiere stattdessen die Scoped-Pakete, wenn:

- Eine Micro App nur mit der Shell spricht. `@tuvix.js/event-bus` allein gibt ihr `getGlobalBus()`, ohne den Orchestrator in ihre `node_modules` zu ziehen.
- Du einen Export brauchst, den das Gesamtpaket auslässt, etwa `registerModule` oder `emitLifecycle` aus `@tuvix.js/loader` oder `pathToRegex` aus `@tuvix.js/router`. Siehe [Nicht enthalten](#not-included).
- Deine `package.json` angeben soll, von welchen Teilen von Tuvix.js ein Paket abhängt.

Beides zu mischen ist sicher. Das Gesamtpaket exportiert dieselben Module erneut, daher geben `getGlobalBus` aus `tuvix.js` und aus `@tuvix.js/event-bus` denselben Bus zurück, und die Lifecycle-Helfer teilen sich eine Registry auf `window`.

## Schnellstart

Eine Shell, die `about` auf `/about` mountet, Link-Klicks in Navigationen des Routers umwandelt und App-Fehler protokolliert:

```ts
import { createOrchestrator, getGlobalBus, interceptLinks, OrchestratorEvent, type AppErrorEvent } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

orchestrator.register({
  name: 'about',
  entry: 'https://cdn.example.com/about/main.js',
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

Die App `about`, gebaut nach `https://cdn.example.com/about/main.js`:

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Ein Klick auf `<a href="/about?ref=nav">` pusht `/about?ref=nav`, und der Orchestrator mountet `about` in `#main` (der Query-String beeinflusst das Matching nicht).

## API

Jeder Export unten ist ein Re-Export. Die verlinkte Paketseite dokumentiert seine Signatur, Optionen und Sonderfälle.

### Aus `@tuvix.js/core`

Doku: [`@tuvix.js/core`](/de/packages/core).

| Export | Art | Was er tut |
| --- | --- | --- |
| `createOrchestrator` | Funktion | Erzeugt einen `Orchestrator`. |
| `Orchestrator` | Klasse | Registriert Apps, gleicht sie mit der URL ab, folgt einem Router (`connectRouter`), aktualisiert Props, räumt auf. |
| `defineMicroApp` | Funktion | Validiert ein Objekt `{ name, bootstrap?, mount, unmount, update?, ssr? }`, registriert es für den Loader und lässt es `tuvix:mounted` / `tuvix:unmounted` / `tuvix:error` senden. |
| `OrchestratorEvent` | Enum | Event-Namen, die der Orchestrator auf seinem Bus sendet (`tuvix:app:mount`, `tuvix:app:error`, ...). |
| `OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition` | Typ | Argumente von `createOrchestrator`, `register` und `defineMicroApp`. |
| `AppStatus`, `AppSandboxOption`, `RouterSource`, `RegisteredApp` | Typ | Union der App-Status, die Option `sandbox`, das Argument von `connectRouter`, die Form eines App-Eintrags. |
| `AppErrorEvent`, `AppErrorPhase` | Typ | Payload von `APP_ERROR` `{ name, error, phase }` und die Union seiner Phasen (`'load'`, `'bootstrap'`, `'mount'`, `'update'`, `'unmount'`). |

### Aus `@tuvix.js/event-bus`

Doku: [`@tuvix.js/event-bus`](/de/packages/event-bus).

| Export | Art | Was er tut |
| --- | --- | --- |
| `EventBus` | Klasse | Pub/Sub-Bus mit `on`, `once`, `emit`, `off`, `onAny`. |
| `createEventBus` | Funktion | Erzeugt einen neuen, separaten `EventBus`. |
| `getGlobalBus` | Funktion | Gibt den seitenweiten Bus zurück, der auf `window.__TUVIX_GLOBAL_BUS__` liegt. Der Orchestrator verwendet ihn standardmäßig. |
| `resetGlobalBus` | Funktion | Zerstört den seitenweiten Bus; das nächste `getGlobalBus()` erzeugt einen neuen. |
| `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` | Typ | Bus-Interface, Handler-Signaturen, Unsubscribe-Funktion, Konstruktor-Optionen. |

### Aus `@tuvix.js/router`

Doku: [`@tuvix.js/router`](/de/packages/router).

| Export | Art | Was er tut |
| --- | --- | --- |
| `Router` | Klasse | History- oder Hash-Router, der Pfade auf App-Namen abbildet. |
| `createRouter` | Funktion | Erzeugt einen `Router`. |
| `matchPath` | Funktion | Gleicht einen Pfad mit einem Muster ab (`:param`, `/*`, Query und Hash werden ignoriert). `activeWhen`-Strings verwenden ihn. |
| `matchRoute` | Funktion | Gibt die erste Route in einem `RouteConfig[]` zurück, die einen Pfad vollständig matcht, mit `params` und `query`. |
| `normalizePath` | Funktion | Fügt einen führenden Slash hinzu und entfernt einen abschließenden. |
| `interceptLinks` | Funktion | Wandelt Klicks auf Links derselben Origin in einen Aufruf von `navigate(path)` um, optional mit Prefetch bei erkennbarer Absicht. |
| `resolveLink` | Funktion | Gibt `{ anchor, url, path }` für den HTML-Link zurück, auf dem ein Event ausgelöst wurde, oder `null`, wenn der Browser ihn behandeln soll. |
| `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute` | Typ | Router-Interface, Optionen und Formen von Routen. |
| `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler` | Typ | Navigations-Payload, Signaturen von Guard und Listener. |
| `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` | Typ | Ergebnis und Optionen von `matchPath`, Optionen von `interceptLinks`, Ergebnis und Optionen von `resolveLink`. |

### Aus `@tuvix.js/loader`

Doku: [`@tuvix.js/loader`](/de/packages/loader).

| Export | Art | Was er tut |
| --- | --- | --- |
| `ModuleLoader` | Klasse | Lädt einen Entry (URL, Script/Style-Konfiguration oder Loader-Funktion) mit Timeout, Wiederholungen und Caching. |
| `createLoader` | Funktion | Erzeugt einen `ModuleLoader`. |
| `whenMounted` | Funktion | Wird aufgelöst, wenn eine App ihr Lifecycle-Event `mounted` sendet. |
| `onLifecycle` | Funktion | Hört auf die DOM-Events `tuvix:mounted`, `tuvix:unmounted` oder `tuvix:error`. |
| `isMounted` | Funktion | `true`, solange laut den Lifecycle-Events irgendein Container der App gemountet ist. |
| `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext` | Typ | Entry-Formate und der Lifecycle-Vertrag, den eine Micro App implementiert. |
| `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy` | Typ | Optionen und Ergebnisse des Loaders. |
| `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` | Typ | Namen der Lifecycle-Events, Payload und Typ des DOM-Events. |

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

const off = onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer', { signal: AbortSignal.timeout(5000) });
console.log(container.id, hydrated);
off();
```

### Aus `@tuvix.js/sandbox`

Doku: [`@tuvix.js/sandbox`](/de/packages/sandbox).

| Export | Art | Was er tut |
| --- | --- | --- |
| `CssSandbox` | Klasse | Verschiebt einen Container in einen Shadow Root und lädt Stylesheets darin. Der Orchestrator verwendet sie für `sandbox: true`. |
| `JsSandbox` | Klasse | Proxy für `window`, der globale Variablen, die ein Skript schreibt, vom echten `window` fernhält. |
| `Sandbox` | Klasse | `CssSandbox` und `JsSandbox` hinter einem Paar aus `activate` / `deactivate`. |
| `createSandbox` | Funktion | Erzeugt eine `Sandbox`. |
| `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox` | Typ | Optionen und Interfaces der Sandboxes. |
| `AdoptStylesOptions`, `AdoptedStyles` | Typ | Argument und Rückgabewert von `CssSandbox.adoptStyles`. |

### Nicht enthalten {#not-included}

Diese Exporte lässt das Gesamtpaket aus. Installiere das Paket, das sie bereitstellt.

| Du brauchst | Installiere |
| --- | --- |
| `registerModule`, `unregisterModule`, `getRegisteredModule`, `emitLifecycle`, `hasServerMarkup`, `normalizeEntry`, `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource` sowie die Typen `EntryLoader`, `EntryLoaderContext`, `MicroAppBus`, `ScriptType`, `CacheEntry`, `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions` | [`@tuvix.js/loader`](/de/packages/loader) |
| `pathToRegex`, `parseQuery`, `isPathActive` | [`@tuvix.js/router`](/de/packages/router) |
| Micro Apps mit React, Vue, Svelte oder Angular | [`@tuvix.js/react`](/de/packages/react), [`@tuvix.js/vue`](/de/packages/vue), [`@tuvix.js/svelte`](/de/packages/svelte), [`@tuvix.js/angular`](/de/packages/angular) |
| Serverseitige Komposition | [`@tuvix.js/server`](/de/packages/server) |
| Module-Federation-Remotes | [`@tuvix.js/module-federation`](/de/packages/module-federation) |
| Island-Assets in Vite-Builds | [`@tuvix.js/vite`](/de/packages/vite) |
| Das DevTools-Panel | [`@tuvix.js/devtools`](/de/packages/devtools) |
| Projekt-Scaffolding | [`create-tuvix-app`](/de/packages/create-tuvix-app) |

## Sonderfälle

- `tuvix.js` hat einen einzigen Einstiegspunkt. Subpath-Importe wie `tuvix.js/core` oder `tuvix.js/router` lassen sich nicht auflösen; importiere aus `tuvix.js` oder aus dem Scoped-Paket.
- Das Gesamtpaket pinnt seine Abhängigkeiten auf dasselbe Release. Installierst du `tuvix.js` neben einer anderen Version eines Scoped-Pakets, hast du zwei Kopien dieses Pakets. `getGlobalBus()` und die Lifecycle-Registry teilen ihren Zustand weiterhin über `window`, aber Prüfungen mit `instanceof Orchestrator` oder `instanceof EventBus` schlagen über die Kopien hinweg fehl.
- `whenMounted`, `onLifecycle` und `isMounted` reagieren auf `tuvix:*`-DOM-Events. Module aus `defineMicroApp` und den Framework-Adaptern senden sie; ein handgeschriebenes Modul sendet keine, außer es ruft `emitLifecycle` aus `@tuvix.js/loader` auf. Events für einen Container außerhalb des Dokuments werden auf `document` ausgelöst.
- `resetGlobalBus()` zerstört den Bus, den ein laufender Orchestrator hält. Der Orchestrator behält diesen zerstörten Bus, daher erreichen seine Events die Abonnenten des nächsten `getGlobalBus()` nicht mehr. Rufe es zwischen Tests auf, nach `orchestrator.destroy()`.
- Verhaltensänderungen und Breaking Changes in `@tuvix.js/core` und `@tuvix.js/router` gelten hier unverändert. Siehe [Migration von 0.4](/de/packages/core#migrating-from-0-4).

## Was es nicht tut

- Es bringt keinen eigenen Code mit. Jeder Export stammt aus einem der fünf Scoped-Pakete.
- Es enthält weder die Framework-Adapter noch das Server-Paket, Module Federation, Vite oder DevTools.
- Es bietet keine Subpath-Einstiegspunkte pro Paket.
