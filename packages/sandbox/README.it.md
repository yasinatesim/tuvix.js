# @tuvix.js/sandbox

> Isolamento CSS con shadow DOM che sopravvive ai rimontaggi, adozione dei fogli di stile e una window Proxy per i globali degli script

Fa parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentazione completa: [tuvix.js.org/it/packages/sandbox](https://tuvix.js.org/it/packages/sandbox).

`CssSandbox` sposta il DOM di una micro app in una shadow root aperta, così il suo CSS e quello della pagina restano separati. L'orchestratore di `@tuvix.js/core` lo usa quando registri un'app con `sandbox: true`. `JsSandbox` tiene fuori dal vero `window` le scritture `window.x = ...` del codice che esegui tramite esso. È un Proxy, non un confine di sicurezza; usa un `<iframe sandbox>` per il codice non attendibile.

## Installazione

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Avvio rapido

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

### `createSandbox(options?)` e `Sandbox`

`createSandbox(options)` restituisce `new Sandbox(options)` tipizzato come `ISandbox`.

| Opzione | Tipo | Predefinito | Significato |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` avvolge il container in una shadow root. Con `false`, `activate` restituisce `null` e non collega nulla. |
| `js` | `boolean` | `true` | `activate`/`deactivate` attivano e disattivano `js.active`. Il proxy tiene comunque le scritture fuori da `window`. |
| `allowedGlobals` | `string[]` | `[]` | Nomi che la modalità strict permette al codice in sandbox di assegnare (salvati comunque sul proxy). |
| `strict` | `boolean` | `false` | Lancia un `TypeError` sulle scritture o sui `defineProperty` di globali fuori dall'allowlist e da `allowedGlobals`. |

Membri: `css` (`CssSandbox`), `js` (`JsSandbox`), `activate(container): ShadowRoot | null`, `deactivate(container)`, `destroy(container)` (disattiva, poi svuota i globali salvati).

### `CssSandbox`

| Metodo | Comportamento |
| --- | --- |
| `wrap(container)` | Sposta i figli in una shadow root aperta. Riusa `container.shadowRoot` se esiste (da un `wrap` precedente, da `unwrap`, da un'altra istanza), rimuove lo slot lasciato da `unwrap` e rimette in ordine i fogli di stile messi da parte. Lancia un'eccezione solo se `attachShadow` fallisce. |
| `unwrap(container)` | Riporta i figli nel light DOM, toglie dal DOM `<style>` e `<link rel="stylesheet">` (da `addStyle`, `adoptStyles` o dall'app) e li conserva per il `wrap` successivo, lascia uno `<slot>` così i figli vengono renderizzati. Non fa nulla sui container che questa istanza non ha avvolto. |
| `addStyle(shadowRoot, css)` | Aggiunge uno `<style>` in coda e lo restituisce. |
| `removeStyle(shadowRoot, styleEl)` | Rimuove `styleEl`. Se il container non è avvolto, il `wrap` successivo non lo ripristina. |
| `adoptStyles(shadowRoot, { urls?, cssText? })` | Inserisce i `<link>` e poi gli `<style>` all'inizio della shadow root, dopo gli stili adottati in precedenza. Salta gli URL già adottati, compresi i link messi da parte. Restituisce `{ elements, ready, remove }`. |

`ready` si risolve quando ogni link emette `load` o `error` e non viene mai rifiutata. jsdom non emette nessuno dei due, quindi non attenderla nei test con jsdom. `remove()` rimuove solo gli elementi di quella chiamata; se il container non è avvolto, non ricompaiono al `wrap` successivo.

### `JsSandbox`

`new JsSandbox(allowedGlobals = [], strict = false)`.

| Membro | Comportamento |
| --- | --- |
| `proxyWindow` | Proxy su `window`. Le letture controllano prima lo store della sandbox, poi il vero `window` (funzioni legate una sola volta). `window`, `self`, `globalThis` e, fuori da un iframe, `top`/`parent`/`frames` restituiscono il proxy. Le scritture e `Object.defineProperty` vanno nello store; un descrittore senza `value` mantiene il valore salvato. I descrittori accessor e quelli non configurabili lanciano un `TypeError`. |
| `execScript(code)` | Esegue `code` come script in modalità non strict dentro `with (scope)`. `window`, `self`, `globalThis` e il `this` di primo livello sono il proxy, e gli identificatori liberi vengono risolti tramite esso. `eval("...")` resta un eval diretto dentro quello scope. |
| `activate()`, `deactivate()`, `active` | Un flag. Non cambia il comportamento del proxy. |
| `reset()` | Svuota i globali salvati, imposta `active` a `false`. |

La modalità strict lancia `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "x". Add it to allowedGlobals to permit it.` per un'assegnazione, un `var x = 1` di primo livello o un `defineProperty` di un nome fuori dall'allowlist, e non salva nulla, attiva o no.

### Tipi

`SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles`.

## Casi limite

- In `execScript`, `x = 1`, `var x = 1`, `window.x = 1`, `window.window.x = 1`, `top.x = 1` e le stesse istruzioni dentro `eval("...")` salvano `x` sul proxy, mai sul vero `window`. `let`/`const` restano locali.
- In `execScript`, leggere un identificatore non dichiarato restituisce `undefined` invece di lanciare un'eccezione, e `"use strict"` in `code` non ha effetto.
- Dentro una semplice chiamata di funzione come `f()`, `this` è il vero oggetto globale, come stabilisce JavaScript in modalità non strict. Lì `this.x = 1` scrive sul vero `window`; scrivi invece `window.x = 1`.
- `execScript` usa `new Function`; la tua CSP richiede `'unsafe-eval'`.
- `JsSandbox`, `Sandbox` e `createSandbox()` leggono `window` nel costruttore e lanciano un'eccezione sul server.
- I figli del light DOM aggiunti mentre il container è avvolto non vengono renderizzati. Aggiungili nella shadow root.

## Cosa non fa

- Non modifica timer, event listener, `document` o tag `<script>`, e non ripulisce ciò che un'app lascia dietro di sé.
- Non dà al codice una propria origine o un proprio oggetto globale.
- Non impedisce agli stili ereditati (`color`, font, custom properties) di raggiungere la shadow root.

## Migrazione dalla 0.4

- `Sandbox({ css: false }).activate()` restituisce `null` e non collega nessuna shadow root. `ISandbox.activate` restituisce `ShadowRoot | null`.
- `strict: true` lancia un'eccezione sulle scritture bloccate invece di emettere un avviso.
- `execScript` esegue il codice in un blocco `with`: niente codice in modalità strict, le letture non dichiarate restituiscono `undefined`, un semplice `x = 1` resta sul proxy.
- `unwrap` conserva i fogli di stile per il `wrap` successivo invece di eliminarli.

## Licenza

MIT
