# @tuvix.js/sandbox

> CSS-Isolation per Shadow DOM, die Remounts übersteht, Übernahme von Stylesheets und ein Proxy-`window` für globale Skriptvariablen

Teil des [Tuvix.js](https://github.com/yasinatesim/tuvix.js) Microfrontend-Frameworks. Vollständige Dokumentation: [tuvix.js.org/de/packages/sandbox](https://tuvix.js.org/de/packages/sandbox).

`CssSandbox` verschiebt das DOM einer Micro App in einen offenen Shadow Root, sodass ihr CSS und das CSS der Seite getrennt bleiben. Der Orchestrator in `@tuvix.js/core` verwendet sie, wenn du eine App mit `sandbox: true` registrierst. `JsSandbox` hält Schreibzugriffe wie `window.x = ...` aus Code, den du über sie ausführst, vom echten `window` fern. Sie ist ein Proxy, keine Sicherheitsgrenze; verwende für nicht vertrauenswürdigen Code ein `<iframe sandbox>`.

## Installation

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Schnellstart

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container); // ShadowRoot, or null with css: false
sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox(options?)` und `Sandbox`

`createSandbox(options)` gibt `new Sandbox(options)` mit dem Typ `ISandbox` zurück.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` hüllt den Container in einen Shadow Root. `false`: `activate` gibt `null` zurück und hängt nichts an. |
| `js` | `boolean` | `true` | `activate`/`deactivate` schalten `js.active` um. Der Proxy hält Schreibzugriffe in beiden Fällen von `window` fern. |
| `allowedGlobals` | `string[]` | `[]` | Namen, die Sandbox-Code im Strict Mode zuweisen darf (werden trotzdem im Proxy gespeichert). |
| `strict` | `boolean` | `false` | Wirft einen `TypeError` bei Schreibzugriffen oder `defineProperty` auf globale Variablen außerhalb der Allowlist und von `allowedGlobals`. |

Member: `css` (`CssSandbox`), `js` (`JsSandbox`), `activate(container): ShadowRoot | null`, `deactivate(container)`, `destroy(container)` (deaktivieren, dann gespeicherte globale Variablen löschen).

### `CssSandbox`

| Methode | Verhalten |
| --- | --- |
| `wrap(container)` | Verschiebt die Kindelemente in einen offenen Shadow Root. Verwendet `container.shadowRoot` wieder, wenn einer existiert (früheres `wrap`, `unwrap`, eine andere Instanz), entfernt den Slot, den `unwrap` hinterlassen hat, und setzt die beiseitegelegten Stylesheets in ihrer Reihenfolge zurück. Wirft nur, wenn `attachShadow` fehlschlägt. |
| `unwrap(container)` | Verschiebt die Kindelemente zurück ins Light DOM, nimmt `<style>` und `<link rel="stylesheet">` (aus `addStyle`, `adoptStyles` oder der App) aus dem DOM und hebt sie für das nächste `wrap` auf, hinterlässt einen `<slot>`, damit die Kindelemente rendern. Keine Aktion für Container, die diese Instanz nicht gewrappt hat. |
| `addStyle(shadowRoot, css)` | Hängt ein `<style>` an und gibt es zurück. |
| `removeStyle(shadowRoot, styleEl)` | Entfernt `styleEl`. Im ungewrappten Zustand stellt das nächste `wrap` es nicht wieder her. |
| `adoptStyles(shadowRoot, { urls?, cssText? })` | Fügt `<link>`s und danach `<style>`s am Anfang des Shadow Root ein, hinter früher übernommenen Styles. Überspringt bereits übernommene URLs, auch beiseitegelegte Links. Gibt `{ elements, ready, remove }` zurück. |

`ready` löst auf, sobald jeder Link `load` oder `error` auslöst, und lehnt nie ab. jsdom löst keines von beiden aus, also warte in jsdom-Tests nicht darauf. `remove()` entfernt nur die Elemente dieses Aufrufs; im ungewrappten Zustand kommen sie beim nächsten `wrap` nicht zurück.

### `JsSandbox`

`new JsSandbox(allowedGlobals = [], strict = false)`.

| Member | Verhalten |
| --- | --- |
| `proxyWindow` | Proxy über `window`. Lesezugriffe prüfen zuerst den Speicher der Sandbox, dann das echte `window` (Funktionen werden einmal gebunden). `window`, `self`, `globalThis` sowie `top`/`parent`/`frames` außerhalb eines iframes geben den Proxy zurück. Schreibzugriffe und `Object.defineProperty` gehen in den Speicher; ein Deskriptor ohne `value` behält den gespeicherten Wert. Accessor-Deskriptoren und nicht konfigurierbare Deskriptoren werfen einen `TypeError`. |
| `execScript(code)` | Führt `code` als Skript im Sloppy Mode innerhalb von `with (scope)` aus. `window`, `self`, `globalThis` und `this` auf oberster Ebene sind der Proxy, und freie Bezeichner werden über ihn aufgelöst. `eval("...")` bleibt ein direktes eval innerhalb dieses Scopes. |
| `activate()`, `deactivate()`, `active` | Ein Flag. Es ändert nicht, wie sich der Proxy verhält. |
| `reset()` | Löscht gespeicherte globale Variablen und setzt `active` auf `false`. |

Der Strict Mode wirft `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "x". Add it to allowedGlobals to permit it.` bei einer Zuweisung, einem `var x = 1` auf oberster Ebene oder `defineProperty` mit einem Namen außerhalb der Allowlist und speichert nichts, egal ob aktiv oder nicht.

### Typen

`SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles`.

## Sonderfälle

- In `execScript` speichern `x = 1`, `var x = 1`, `window.x = 1`, `window.window.x = 1`, `top.x = 1` und dieselben Anweisungen innerhalb von `eval("...")` die Variable `x` im Proxy, nie im echten `window`. `let`/`const` bleiben lokal.
- Das Lesen eines nicht deklarierten Bezeichners in `execScript` gibt `undefined` zurück, statt zu werfen, und `"use strict"` in `code` hat keine Wirkung.
- Innerhalb eines einfachen Funktionsaufrufs wie `f()` ist `this` das echte globale Objekt, so wie JavaScript im Sloppy Mode es definiert. `this.x = 1` schreibt dort in das echte `window`; schreib stattdessen `window.x = 1`.
- `execScript` verwendet `new Function`; deine CSP braucht `'unsafe-eval'`.
- `JsSandbox`, `Sandbox` und `createSandbox()` lesen `window` im Konstruktor und werfen auf dem Server.
- Kindelemente im Light DOM, die hinzukommen, während der Container gewrappt ist, rendern nicht. Hänge sie in den Shadow Root.

## Was es nicht tut

- Es patcht keine Timer, Event-Listener, `document` oder `<script>`-Tags und räumt nicht auf, was eine App zurücklässt.
- Es gibt Code keine eigene Origin und kein eigenes globales Objekt.
- Es hält vererbte Styles (`color`, Schriften, Custom Properties) nicht vom Shadow Root fern.

## Migration von 0.4

- `Sandbox({ css: false }).activate()` gibt `null` zurück und hängt keinen Shadow Root an. `ISandbox.activate` gibt `ShadowRoot | null` zurück.
- `strict: true` wirft bei blockierten Schreibzugriffen, statt zu warnen.
- `execScript` führt Code in einem `with`-Block aus: kein Strict-Mode-Code, Lesezugriffe auf nicht deklarierte Bezeichner geben `undefined` zurück, ein nacktes `x = 1` bleibt im Proxy.
- `unwrap` hebt Stylesheets für das nächste `wrap` auf, statt sie zu löschen.

## Lizenz

MIT
