# Sandboxing

`@tuvix.js/sandbox` offre due strumenti. `CssSandbox` inserisce un'app in una shadow root, così il suo CSS e quello della pagina restano separati. `JsSandbox` esegue il codice su un proxy di `window`, così le sue scritture globali finiscono sul proxy. L'orchestratore usa `CssSandbox` per le app che registri con `sandbox: true`; non applica mai `JsSandbox`.

## Isolamento CSS per app

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

Per questa app l'orchestratore:

1. collega una shadow root aperta a `#widget` (o riusa quella di un mount precedente);
2. crea al suo interno un `<div data-tuvix-sandbox-root>` e passa quell'elemento a `mount` come `container`;
3. aggiunge gli `styles` dell'entry come tag `<link>` dentro la shadow root, non in `document.head`, e attende fino a `loader.timeout` che vengano caricati prima di chiamare `mount`.

Il CSS della pagina non raggiunge più l'app e il CSS dell'app non raggiunge più la pagina. Le proprietà ereditate come `color` e `font-family` arrivano comunque dall'elemento host; impostale su `:host` nel CSS dell'app per bloccarle.

Usalo quando un'app distribuisce selettori globali (`button { ... }`, un reset CSS) o quando il CSS della pagina rompe l'app.

### Casi limite

- Gli stili che un framework inietta a runtime finiscono in `document.head`, fuori dalla shadow root. Lo fanno l'iniezione CSS di Vite, le librerie CSS-in-JS e gli stili dei componenti Angular. Distribuisci un file CSS e indicalo in `entry.styles`, oppure aggiungi tu il CSS alla shadow root.
- Portal, modali e toast che eseguono il rendering in `document.body` escono dalla shadow root e perdono gli stili dell'app.
- `document.querySelector` dall'interno dell'app non trova gli elementi nella shadow root. Esegui la query a partire da `container`.
- Le entry di tipo funzione loader non elencano `styles`, quindi il tuo bundler inietta il loro CSS in `document.head`, dove la shadow root lo tiene fuori. Registra le app in sandbox con un'entry `{ scripts, styles, type }`.

## CssSandbox a mano

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

| Metodo | Effetto |
| --- | --- |
| `wrap(container)` | Collega una shadow root aperta, o riusa una aperta già esistente, e vi sposta i figli del container. |
| `adoptStyles(shadow, { urls, cssText })` | Inserisce elementi `<link>` e `<style>` all'inizio della shadow root. Salta un URL già adottato lì. Restituisce `{ elements, ready, remove }`. |
| `addStyle(shadow, css)` / `removeStyle(shadow, el)` | Aggiunge o rimuove un `<style>`. |
| `unwrap(container)` | Riporta i nodi che non sono stili nel light DOM e lascia uno `<slot>` perché vengano renderizzati. Toglie dal DOM i nodi `<style>` e i `<link>` di fogli di stile (compresi quelli di `addStyle` e `adoptStyles`); il successivo `wrap` di quel container li reinserisce in ordine. |

`wrap` lancia un'eccezione quando l'elemento non può ospitare una shadow root (per esempio `<input>`) o ne ha già una chiusa. `ready` non viene mai rifiutata. jsdom non emette mai `load` sui link, quindi non attendere `ready` nei test con jsdom. Se chiami `removeStyle` o `adopted.remove()` mentre il container non è avvolto, quel foglio di stile non torna al successivo `wrap`.

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

- Le scritture e `Object.defineProperty` attraverso il proxy finiscono in uno store della sandbox. Le letture controllano prima quello store, poi il vero `window`.
- Con `strict: true`, assegnare, dichiarare con `var` al livello superiore o definire con `Object.defineProperty` una variabile globale non presente nella allowlist integrata né in `allowedGlobals` lancia un `TypeError` e non salva nulla.
- `execScript(code)` esegue `code` dentro `with (scope)`, con `window`, `self`, `globalThis` e `this` legati al proxy. Gli assegnamenti diretti (`x = 1`), `var x` al livello superiore e `window.x = 1` finiscono tutti sul proxy; `let` e `const` restano locali allo script.
- Dentro `execScript`, leggere un identificatore non dichiarato restituisce `undefined` invece di lanciare un `ReferenceError`, e una direttiva `"use strict"` non ha effetto, perché `with` richiede la modalità non strict. Usa `new Function`, quindi la tua Content Security Policy deve consentire `unsafe-eval`.
- `activate()` e `deactivate()` impostano il flag `active`. Il proxy salva le scritture in entrambi gli stati.

`JsSandbox` copre solo il codice che accede alle variabili globali tramite `proxyWindow`. Uno script caricato con un tag `<script>`, un modulo incluso nel bundle, i timer e gli event listener usano tutti il vero `window`. Consideralo una protezione contro scritture globali accidentali negli snippet che esegui, non un confine di sicurezza.

## Sandbox combinata

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });

const shadow = sandbox.activate(container); // ShadowRoot | null
if (shadow) sandbox.css.addStyle(shadow, '.box { padding: 8px; }');

sandbox.deactivate(container); // unwrap
sandbox.destroy(container); // deactivate + reset the JS store
```

`activate` restituisce `null` quando `css` è `false`; in quel caso non collega nulla.

## Usarla dentro una micro app

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

Quando è l'orchestratore a montare l'app, preferisci `sandbox: true` su `register`: fa lo stesso lavoro e riusa la shadow root tra un mount e l'altro.

## Quando non usare la sandbox

- L'app usa portal verso `document.body` e ha bisogno dei suoi stili lì.
- Il design system della pagina deve applicare gli stili all'app.
- Ti serve un vero isolamento JavaScript. Usa un `<iframe>`.
