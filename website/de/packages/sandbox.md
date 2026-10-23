---
title: '@tuvix.js/sandbox'
---

<PackageHeader
  name="@tuvix.js/sandbox"
  title="Sandbox"
  description="CSS-Isolation in einem wiederverwendbaren Shadow Root, Übernahme von Stylesheets in diesen Root und ein Proxy-Window, das globale Variablen von Skripten vom echten window fernhält."
  icon="🔒"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Wann du es verwendest

Verwende `CssSandbox`, wenn sich das CSS einer Micro App und das CSS der Seite nicht gegenseitig beeinflussen dürfen. Es verschiebt das DOM der App in einen offenen Shadow Root auf dem Container, sodass die Selektoren der App drinnen und die Selektoren der Seite draußen bleiben. Der Orchestrator in `@tuvix.js/core` erledigt das für dich, wenn du eine App mit `sandbox: true` registrierst. Rufe dieses Paket selbst auf, wenn du Apps ohne den Orchestrator mountest.

Verwende `JsSandbox`, wenn du Skripttext von Drittanbietern ausführst und dessen Schreibzugriffe auf globale Variablen vom echten `window` fernhalten willst. Du führst den Code über `execScript` aus, das `window`, `this` und freie Bezeichner über einen Proxy auflöst. Der Orchestrator wendet es nicht an.

Greif zu etwas anderem, wenn du harte Isolation für nicht vertrauenswürdigen Code brauchst. Ein `<iframe>` mit dem Attribut `sandbox` gibt dem Code ein eigenes globales Objekt und einen eigenen Origin; dieses Paket tut das nicht.

## Schnellstart

Über den Orchestrator (nur CSS):

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'cart',
  entry: { scripts: ['/apps/cart/main.js'], styles: ['/apps/cart/style.css'] },
  container: '#cart',
  activeWhen: '/cart/*',
  sandbox: true,
});

await orchestrator.start();
```

Der Orchestrator verpackt `#cart` in einen Shadow Root, rendert die App in ein `<div data-tuvix-sandbox-root="cart">` darin und lädt `style.css` in den Shadow Root statt in `<head>`. Der Mount wartet auf diese Stylesheets, höchstens bis zum `timeout` des Loaders (standardmäßig 10000 ms). Der Orchestrator verwendet den Shadow Root wieder, wenn die App erneut mountet.

Von Hand:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container);
const target = shadowRoot ?? container;

const adopted = sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });
await adopted.ready;
target.append(Object.assign(document.createElement('p'), { textContent: 'Cart' }));

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox`

```ts
import type { ISandbox, SandboxOptions } from '@tuvix.js/sandbox';

declare function createSandbox(options?: SandboxOptions): ISandbox;
```

Gibt `new Sandbox(options)` zurück.

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` verpackt den Container in einen Shadow Root. Mit `false` gibt `activate` `null` zurück und hängt nichts an. |
| `js` | `boolean` | `true` | `activate`/`deactivate` schalten `sandbox.js.active` um. Der Proxy unter `sandbox.js.proxyWindow` hält Schreibzugriffe in jedem Fall vom echten `window` fern. |
| `allowedGlobals` | `string[]` | `[]` | Zusätzliche globale Namen, die Sandbox-Code im Strict Mode zuweisen darf. Schreibzugriffe darauf landen trotzdem auf dem Proxy. |
| `strict` | `boolean` | `false` | Wirft einen `TypeError`, wenn Sandbox-Code eine globale Variable außerhalb der eingebauten Allowlist und `allowedGlobals` zuweist oder definiert. |

### `Sandbox`

```ts
import { Sandbox } from '@tuvix.js/sandbox';

const sandbox = new Sandbox({ css: false, js: true });
console.log(sandbox.activate(document.body)); // null
```

Die Klasse hinter `createSandbox`. Sie implementiert `ISandbox`:

| Member | Signatur | Verhalten |
| --- | --- | --- |
| `css` | `readonly ICssSandbox` | Die verwendete `CssSandbox`-Instanz. |
| `js` | `readonly IJsSandbox` | Die verwendete `JsSandbox`-Instanz. |
| `activate` | `(container: HTMLElement) => ShadowRoot \| null` | `css.wrap(container)`, wenn `css` aktiv ist, danach `js.activate()`, wenn `js` aktiv ist. Gibt den Shadow Root oder `null` zurück. |
| `deactivate` | `(container: HTMLElement) => void` | `js.deactivate()`, danach `css.unwrap(container)`. |
| `destroy` | `(container: HTMLElement) => void` | `deactivate(container)`, danach `js.reset()`, das jede gespeicherte globale Variable löscht. |

### `CssSandbox`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const container = document.querySelector<HTMLElement>('#widget')!;

const shadowRoot = cssSandbox.wrap(container);
const style = cssSandbox.addStyle(shadowRoot, ':host { display: block; } p { color: teal; }');
cssSandbox.unwrap(container); // the <style> leaves the DOM and waits for the next wrap
cssSandbox.removeStyle(shadowRoot, style); // removed for good: the next wrap does not restore it
```

| Methode | Signatur | Verhalten |
| --- | --- | --- |
| `wrap` | `(container: HTMLElement) => ShadowRoot` | Verschiebt die Kinder des Containers in einen offenen Shadow Root und gibt ihn zurück. |
| `unwrap` | `(container: HTMLElement) => void` | Verschiebt die Kinder zurück ins Light DOM, legt die Stylesheets des Shadow Root beiseite und lässt einen `<slot>` im Shadow Root zurück. |
| `addStyle` | `(shadowRoot: ShadowRoot, css: string) => HTMLStyleElement` | Hängt ein `<style>` mit `css` ans Ende des Shadow Root an. |
| `removeStyle` | `(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement) => void` | Entfernt `styleEl`. Ist der Host entpackt, streicht es `styleEl` auch aus der Liste der beiseitegelegten Stylesheets, sodass das nächste `wrap` es nicht wiederherstellt. |
| `adoptStyles` | `(shadowRoot: ShadowRoot, styles: AdoptStylesOptions) => AdoptedStyles` | Fügt `<link>`- und `<style>`-Elemente am Anfang des Shadow Root ein. |

#### `wrap` und erneute Mounts {#wrap-and-remounts}

Ein DOM-Element kann seinen Shadow Root nach dem Anhängen nicht mehr verlieren. `wrap` geht damit so um:

1. Hat diese `CssSandbox`-Instanz den Container bereits verpackt und noch nicht entpackt, gibt `wrap` denselben Shadow Root zurück und verschiebt nichts.
2. Hat der Container einen offenen `shadowRoot` (aus einem früheren `wrap`, einem `unwrap` oder von einer anderen `CssSandbox`-Instanz), entfernt `wrap` den `<slot>`, den `unwrap` zurückgelassen hat, setzt die von `unwrap` beiseitegelegten Stylesheets wieder ein (am Anfang, in ihrer ursprünglichen Reihenfolge) und verwendet den Root wieder.
3. Andernfalls ruft es `container.attachShadow({ mode: 'open' })` auf.

Danach verschiebt es jedes Kind aus dem Light DOM in den Shadow Root. `wrap` wirft nur, wenn `attachShadow` fehlschlägt, zum Beispiel bei einem Element, das keinen Shadow Root aufnehmen kann (`<img>`, `<input>`), oder bei einem, das schon einen geschlossenen Root hat: `[Tuvix Sandbox] Cannot attach Shadow DOM to <img>: ...`.

#### `unwrap` und der Slot {#unwrap-and-the-slot}

`unwrap` verschiebt die Kinder des Shadow Root zurück in den Container. Es nimmt die Knoten `<style>` und `<link rel="stylesheet">` aus dem DOM, egal ob sie aus `addStyle`, `adoptStyles` oder der App stammen, sodass das CSS der App nicht mehr greift und nie auf die Seite gelangt. Es bewahrt sie beim Shadow Root auf. Der Shadow Root bleibt bestehen und enthält einen `<slot data-tuvix-sandbox-slot>`, über den der Browser die wiederhergestellten Kinder rendert. Für einen Container, den diese Instanz nicht verpackt hat, tut `unwrap` nichts.

Das nächste `wrap` dieses Hosts, durch diese oder eine andere `CssSandbox`-Instanz, entfernt den Slot, setzt die beiseitegelegten Stylesheets in ihrer Reihenfolge wieder ein und verschiebt die Kinder zurück. Nach einem erneuten Mount musst du Styles nicht noch einmal übernehmen. Rufst du `removeStyle(shadowRoot, el)` oder `adopted.remove()` auf, während der Host entpackt ist, entfernst du diese Stylesheets endgültig.

#### `adoptStyles`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const shadowRoot = cssSandbox.wrap(document.querySelector<HTMLElement>('#cart')!);

const adopted = cssSandbox.adoptStyles(shadowRoot, {
  urls: ['/apps/cart/style.css', '/shared/tokens.css'],
  cssText: ':host { display: block; }',
});

await adopted.ready; // every <link> fired load or error
console.log(adopted.elements.length); // 3

adopted.remove();
```

| Option | Typ | Standard | Bedeutung |
| --- | --- | --- | --- |
| `urls` | `readonly string[]` | `[]` | Jede URL wird zu einem `<link rel="stylesheet" data-tuvix-style>`, in Reihenfolge. |
| `cssText` | `string \| readonly string[]` | keiner | Jeder String wird zu einem `<style data-tuvix-style>`, das nach den Links steht. |

Verhalten:

- Die Elemente kommen an den Anfang des Shadow Root, hinter früher übernommene Styles, sodass App-Inhalte und `addStyle`-Styles später in der Kaskade folgen.
- Eine URL, die bereits in diesen Shadow Root übernommen wurde, wird übersprungen und erscheint nicht in `elements`. Das gilt auch für Links, die `unwrap` beiseitegelegt hat. `ready` wartet trotzdem auf diesen bestehenden Link, wenn ein früherer Aufruf ihn erstellt hat.
- `ready` löst auf, sobald jeder Link `load` oder `error` auslöst. Es lehnt nie ab, daher blockiert dich ein Stylesheet mit 404 nicht. jsdom löst keines der beiden Events aus, also warte in jsdom-Tests nicht auf `ready`.
- `remove()` entfernt nur die Elemente, die dieser Aufruf eingefügt hat, beiseitegelegte eingeschlossen, sodass das nächste `wrap` sie nicht wiederherstellt.

### `JsSandbox`

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const jsSandbox = new JsSandbox(['analyticsQueue'], true);
jsSandbox.activate();

jsSandbox.execScript('window.analyticsQueue = []'); // allowed, stored on the proxy
console.log('analyticsQueue' in window); // false
console.log(Reflect.get(jsSandbox.proxyWindow, 'analyticsQueue')); // []

try {
  jsSandbox.execScript('window.tracker = {}');
} catch (error) {
  console.log(error instanceof TypeError); // true
}

jsSandbox.reset();
```

Konstruktor: `new JsSandbox(allowedGlobals: string[] = [], strict = false)`.

| Member | Signatur | Verhalten |
| --- | --- | --- |
| `proxyWindow` | `readonly WindowProxy` | Proxy über dem echten `window`. |
| `active` | `readonly boolean` | Flag, das `activate` setzt und `deactivate`/`reset` zurücksetzen. |
| `activate` | `() => void` | Setzt `active` auf `true`. |
| `deactivate` | `() => void` | Setzt `active` auf `false`. Gespeicherte globale Variablen bleiben erhalten. |
| `execScript` | `(code: string) => unknown` | Führt `code` als Skript im Sloppy Mode innerhalb von `with (scope)` über `new Function` aus. `window`, `self`, `globalThis` und `this` auf oberster Ebene sind der Proxy, und freie Bezeichner werden über ihn aufgelöst. `eval("...")` bleibt ein direktes Eval innerhalb dieses Scopes. Gibt zurück, was der Code zurückgibt. |
| `reset` | `() => void` | Löscht jede gespeicherte globale Variable und setzt `active` auf `false`. |

Der Proxy:

- Lesezugriffe prüfen zuerst den eigenen Speicher der Sandbox und fallen dann auf das echte `window` durch. Funktionen des echten Window ohne `prototype` (`fetch`, `setTimeout`) kommen an das echte `window` gebunden zurück, einmal pro Funktion, sodass `proxyWindow.fetch === proxyWindow.fetch` gilt.
- `proxyWindow.window`, `.self`, `.globalThis` sowie `.top`/`.parent`/`.frames`, wenn die Seite nicht in einem iframe läuft, geben den Proxy selbst zurück. In einem iframe bleiben `top` und `parent` die echten.
- Zuweisungen und `Object.defineProperty` speichern den Wert auf dem Proxy. Das echte `window` ändert sich nie. Ein Deskriptor ohne `value` (`{ enumerable: false }`) behält den gespeicherten Wert. Accessor-Deskriptoren (`get`/`set`) und `configurable: false` lassen `Object.defineProperty` einen `TypeError` werfen.
- `delete proxyWindow.x` entfernt einen gespeicherten Wert. Für eine Property des echten Window gibt es `false` zurück, was in Strict-Mode-Code einen `TypeError` wirft.
- `in` prüft den Speicher und das echte `window`.

Strict Mode (`strict: true`): Eine Zuweisung (`window.x = 1` oder ein nacktes `x = 1`), ein `var x = 1` auf oberster Ebene oder ein Aufruf von `Object.defineProperty` für einen Namen außerhalb der eingebauten Allowlist und `allowedGlobals` wirft `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "tracker". Add it to allowedGlobals to permit it.` und speichert nichts. Die Prüfung läuft unabhängig davon, ob die Sandbox aktiv ist. Symbol-Schlüssel gelten immer als blockiert. Die eingebaute Allowlist umfasst Standard-Globals wie `console`, Timer, `Promise`, `Map`, `JSON`, `fetch`, `URL`, `navigator`, `document`, `location` und `history`. Erlaubte Schreibzugriffe, auch auf diese Namen, bleiben auf dem Proxy.

### Typen

| Typ | Bedeutung |
| --- | --- |
| `SandboxOptions` | `{ css?, js?, allowedGlobals?, strict? }`, die Optionen von `createSandbox`. |
| `ISandbox` | Interface, das `Sandbox` implementiert: `css`, `js`, `activate`, `deactivate`, `destroy`. |
| `ICssSandbox` | Interface, das `CssSandbox` implementiert. |
| `IJsSandbox` | Interface, das `JsSandbox` implementiert. |
| `AdoptStylesOptions` | `{ urls?, cssText? }` für `adoptStyles`. |
| `AdoptedStyles` | `{ elements, ready, remove }`, von `adoptStyles` zurückgegeben. |

## Sonderfälle

- Innerhalb von `execScript` speichern `x = 1`, `var x = 1` auf oberster Ebene, `window.x = 1`, `window.window.x = 1`, `top.x = 1` und dieselben Anweisungen innerhalb von `eval("...")` alle `x` auf dem Proxy, nie auf dem echten `window`. `let` und `const` bleiben lokal im Skript.
- Das Lesen eines nicht deklarierten Bezeichners innerhalb von `execScript` gibt `undefined` zurück, statt einen `ReferenceError` zu werfen, und eine `"use strict"`-Direktive in `code` hat keine Wirkung, da `with` den Sloppy Mode braucht.
- In einem einfachen Funktionsaufruf wie `f()` ist `this` das echte globale Objekt, so wie JavaScript im Sloppy Mode es definiert. `this.x = 1` in einer solchen Funktion schreibt in das echte `window`. Schreibe `window.x = 1` in Code, den du über `execScript` ausführst.
- `execScript` verwendet `new Function`, daher blockiert eine Content Security Policy ohne `'unsafe-eval'` es.
- Das Erzeugen von `JsSandbox`, `Sandbox` oder `createSandbox()` liest `window`, daher werfen sie auf dem Server einen `ReferenceError`. `CssSandbox` braucht `document` erst, wenn du seine Methoden aufrufst.
- Zwei `CssSandbox`-Instanzen können sich einen Host teilen. Das zweite `wrap` verwendet den Shadow Root der ersten Instanz wieder.
- Kinder im Light DOM, die du hinzufügst, während der Container verpackt ist, bleiben außerhalb des Shadow Root und werden über keinen Slot gerendert, daher sind sie nicht sichtbar. Hänge sie stattdessen in den Shadow Root.
- `Sandbox({ css: false }).activate()` gibt `null` zurück. Rendere in den Container.

## Was es nicht tut

- Es patcht keine Timer, Event Listener, `document` oder `<script>`-Tags. Code, der nicht über `proxyWindow` läuft, wirkt auf die echte Seite.
- Es räumt keine Intervalle oder Listener auf, die eine App hinterlässt. Entferne sie im `unmount` der App.
- Es gibt Code keinen eigenen Origin und kein eigenes globales Objekt. Verwende für nicht vertrauenswürdigen Code ein `<iframe sandbox>`.
- Es löst keinen Shadow Root ab. Das DOM hat dafür keine API; `unwrap` lässt stattdessen einen Slot zurück.
- Es stoppt keine Vererbung. `color`, `font-family` und CSS Custom Properties, die auf dem Host oder seinen Vorfahren gesetzt sind, wirken weiterhin in den Shadow Root hinein.

## Migration von 0.4 {#migrating-from-0-4}

- `Sandbox({ css: false }).activate(container)` gibt `null` zurück und hängt keinen Shadow Root an. In 0.4 hat es einen angehängt und die Kinder des Containers versteckt. `ISandbox.activate` gibt jetzt `ShadowRoot | null` zurück:

  ```ts
  import { createSandbox } from '@tuvix.js/sandbox';

  const container = document.querySelector<HTMLElement>('#app')!;
  const sandbox = createSandbox({ css: false });

  // 0.4: const root: ShadowRoot = sandbox.activate(container);
  const root = sandbox.activate(container) ?? container;
  ```

- `strict: true` wirft bei einem blockierten Schreibzugriff einen `TypeError`. In 0.4 hat es eine Warnung geloggt und den Wert gespeichert. Trage die Namen, die deine Skripte setzen, in `allowedGlobals` ein.
- `execScript` führt Code in einem `with`-Block aus. Der Code kann kein Strict-Mode-Code sein, das Lesen eines nicht deklarierten Bezeichners gibt `undefined` zurück, statt zu werfen, und ein nacktes `x = 1` landet jetzt auf dem Proxy statt auf dem echten `window`.
- `unwrap` behält die Stylesheets des Shadow Root, und das nächste `wrap` stellt sie wieder her. In 0.4 hat `unwrap` sie gelöscht. Entferne Code, der nach einem erneuten Mount `cssText`- oder `addStyle`-Styles noch einmal hinzufügt, sonst bekommst du Duplikate.
- Die Doku zu 0.4 behauptete, `js: true` fange `addEventListener`, Timer und `document.createElement` ab. Das hat es nie getan, und 0.5 tut es auch nicht.
