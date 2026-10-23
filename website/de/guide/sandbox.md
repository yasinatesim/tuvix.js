# Sandboxing

`@tuvix.js/sandbox` bietet zwei Werkzeuge. `CssSandbox` legt eine App in einen Shadow Root, damit ihr CSS und das CSS der Seite getrennt bleiben. `JsSandbox` führt Code gegen ein Proxy-`window` aus, sodass seine globalen Schreibzugriffe auf dem Proxy landen. Der Orchestrator verwendet `CssSandbox` für Apps, die du mit `sandbox: true` registrierst; `JsSandbox` wendet er nie an.

## CSS-Isolation pro App

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'widget',
  entry: {
    scripts: ['https://cdn.example.com/widget/main.js'],
    styles: ['https://cdn.example.com/widget/main.css'],
    type: 'module',
  },
  container: '#widget',
  activeWhen: '/',
  sandbox: true, // same as { css: true }
});
```

Für diese App führt der Orchestrator folgende Schritte aus:

1. Er hängt einen offenen Shadow Root an `#widget` an (oder verwendet den aus einem früheren Mount wieder);
2. er erzeugt darin ein `<div data-tuvix-sandbox-root>` und übergibt dieses Element als `container` an `mount`;
3. er fügt die `styles` des Entry als `<link>`-Tags in den Shadow Root ein, nicht in `document.head`, und wartet bis zu `loader.timeout` darauf, dass sie geladen sind, bevor er `mount` aufruft.

Das CSS der Seite erreicht die App nicht mehr, und das CSS der App erreicht die Seite nicht mehr. Vererbte Eigenschaften wie `color` und `font-family` fließen weiterhin vom Host-Element hinein; setze sie im CSS der App auf `:host`, um das zu verhindern.

Verwende es, wenn eine App globale Selektoren mitbringt (`button { ... }`, ein CSS-Reset) oder wenn das CSS der Seite die App kaputt macht.

### Sonderfälle

- Styles, die ein Framework zur Laufzeit einfügt, landen in `document.head`, außerhalb des Shadow Root. Die CSS-Injection von Vite, CSS-in-JS-Bibliotheken und die Komponenten-Styles von Angular tun das alle. Liefere eine CSS-Datei aus und trage sie in `entry.styles` ein, oder füge das CSS selbst in den Shadow Root ein.
- Portals, Modals und Toasts, die in `document.body` rendern, verlassen den Shadow Root und verlieren die Styles der App.
- `document.querySelector` aus der App heraus findet keine Elemente im Shadow Root. Suche stattdessen ab `container`.
- Entries in Form einer Loader-Funktion listen keine `styles` auf, daher fügt dein Bundler ihr CSS in `document.head` ein, wo der Shadow Root es fernhält. Registriere Apps mit Sandbox über einen Entry der Form `{ scripts, styles, type }`.

## CssSandbox von Hand

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const css = new CssSandbox();
const shadow = css.wrap(container); // moves existing children into the shadow root

const adopted = css.adoptStyles(shadow, {
  urls: ['/widget/main.css'],
  cssText: ':host { display: block; font-family: system-ui; }',
});
await adopted.ready; // resolves once each <link> fired load or error

const button = document.createElement('button');
button.textContent = 'Buy';
shadow.append(button);

// Later
adopted.remove();
css.unwrap(container);
```

| Methode | Wirkung |
| --- | --- |
| `wrap(container)` | Hängt einen offenen Shadow Root an oder verwendet einen vorhandenen offenen wieder und verschiebt die Kinder des Containers hinein. |
| `adoptStyles(shadow, { urls, cssText })` | Fügt `<link>`- und `<style>`-Elemente am Anfang des Shadow Root ein. Überspringt eine URL, die dort bereits übernommen wurde. Gibt `{ elements, ready, remove }` zurück. |
| `addStyle(shadow, css)` / `removeStyle(shadow, el)` | Hängt ein `<style>` an oder entfernt es. |
| `unwrap(container)` | Verschiebt Nicht-Style-Knoten zurück ins Light DOM und hinterlässt einen `<slot>`, damit sie gerendert werden. Nimmt `<style>`- und Stylesheet-`<link>`-Knoten (auch die aus `addStyle` und `adoptStyles`) aus dem DOM; das nächste `wrap` dieses Containers fügt sie in ihrer Reihenfolge wieder ein. |

`wrap` wirft einen Fehler, wenn das Element keinen Shadow Root aufnehmen kann (zum Beispiel `<input>`) oder bereits einen geschlossenen hat. `ready` wird nie abgelehnt. jsdom löst bei Links nie `load` aus, also warte in jsdom-Tests nicht auf `ready`. Rufst du `removeStyle` oder `adopted.remove()` auf, während der Container entpackt ist, kommt dieses Stylesheet beim nächsten `wrap` nicht zurück.

## JsSandbox

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const js = new JsSandbox(['dataLayer'], /* strict */ true);

js.execScript('window.dataLayer = []'); // allowed, stored on the proxy
console.log('dataLayer' in window); // false, unless the page defined it

try {
  js.execScript('counter = 1'); // bare assignment to a global that is not allowed
} catch (error) {
  console.log(error instanceof TypeError); // true: strict mode blocked the write
}

const loose = new JsSandbox(); // not strict
loose.execScript('var version = 2; build = 7;');
console.log(Reflect.get(loose.proxyWindow, 'version'), 'version' in window); // 2 false

js.reset(); // forget every stored global
```

- Schreibzugriffe und `Object.defineProperty` über den Proxy gehen in einen Speicher der Sandbox. Lesezugriffe prüfen zuerst diesen Speicher, dann das echte `window`.
- Mit `strict: true` wirft das Zuweisen, die `var`-Deklaration auf oberster Ebene oder `Object.defineProperty` für ein Global außerhalb der eingebauten Allowlist und `allowedGlobals` einen `TypeError` und speichert nichts.
- `execScript(code)` führt `code` innerhalb von `with (scope)` aus, wobei `window`, `self`, `globalThis` und `this` an den Proxy gebunden sind. Nackte Zuweisungen (`x = 1`), `var x` auf oberster Ebene und `window.x = 1` landen alle auf dem Proxy; `let` und `const` bleiben lokal im Skript.
- Innerhalb von `execScript` liefert das Lesen eines nicht deklarierten Bezeichners `undefined`, statt einen `ReferenceError` zu werfen, und eine `"use strict"`-Direktive hat keine Wirkung, weil `with` den Sloppy Mode braucht. Es verwendet `new Function`, daher braucht deine Content Security Policy `unsafe-eval`.
- `activate()` und `deactivate()` setzen das Flag `active`. Der Proxy speichert Schreibzugriffe in beiden Zuständen.

`JsSandbox` deckt nur Code ab, der über `proxyWindow` auf Globals zugreift. Ein per `<script>`-Tag geladenes Skript, ein gebündeltes Modul, Timer und Event Listener verwenden alle das echte `window`. Betrachte es als Schutz vor versehentlichen globalen Schreibzugriffen in Snippets, die du ausführst, nicht als Sicherheitsgrenze.

## Kombinierte Sandbox

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });

const shadow = sandbox.activate(container); // ShadowRoot | null
if (shadow) sandbox.css.addStyle(shadow, '.box { padding: 8px; }');

sandbox.deactivate(container); // unwrap
sandbox.destroy(container); // deactivate + reset the JS store
```

`activate` gibt `null` zurück, wenn `css` `false` ist; dann hängt es nichts an.

## Verwendung in einer Micro App

```ts
import { defineMicroApp } from '@tuvix.js/core';
import { CssSandbox } from '@tuvix.js/sandbox';

const css = new CssSandbox();

export default defineMicroApp({
  name: 'widget',
  mount({ container }) {
    const shadow = css.wrap(container);
    css.addStyle(shadow, 'p { color: rebeccapurple; }');
    const text = document.createElement('p');
    text.textContent = 'Isolated';
    shadow.append(text);
  },
  unmount({ container }) {
    container.shadowRoot?.replaceChildren();
    css.unwrap(container);
  },
});
```

Verwende lieber `sandbox: true` bei `register`, wenn der Orchestrator die App mountet; das erledigt dieselbe Arbeit und verwendet den Shadow Root über erneute Mounts hinweg wieder.

## Wann du nicht sandboxen solltest

- Die App verwendet Portals in `document.body` und braucht dort ihre Styles.
- Das Design-System der Seite soll die App gestalten.
- Du brauchst echte JavaScript-Isolation. Verwende ein `<iframe>`.
