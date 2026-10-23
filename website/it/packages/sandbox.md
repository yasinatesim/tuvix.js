---
title: '@tuvix.js/sandbox'
---

<PackageHeader
  name="@tuvix.js/sandbox"
  title="Sandbox"
  description="Isolamento CSS in una root Shadow DOM riutilizzabile, adozione dei fogli di stile in quella root e un window Proxy che tiene i global degli script lontani dal window reale."
  icon="🔒"
  npm="true"
/>

## Installazione

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Quando usarlo

Usa `CssSandbox` quando il CSS di una micro app e il CSS della pagina non devono influenzarsi a vicenda. Sposta il DOM dell'app in una shadow root aperta sul container, così i selettori dell'app restano dentro e quelli della pagina restano fuori. L'orchestratore di `@tuvix.js/core` lo fa per te quando registri un'app con `sandbox: true`. Chiama tu questo pacchetto quando monti le app senza l'orchestratore.

Usa `JsSandbox` quando esegui il testo di script di terze parti e vuoi che le sue scritture globali non tocchino il vero `window`. Esegui il codice tramite `execScript`, che risolve `window`, `this` e gli identificatori liberi attraverso un Proxy. L'orchestratore non lo applica.

Scegli un'altra soluzione quando ti serve un isolamento forte per codice non attendibile. Un `<iframe>` con l'attributo `sandbox` dà al codice un proprio oggetto globale e una propria origine; questo pacchetto no.

## Avvio rapido

Tramite l'orchestratore (solo CSS):

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

L'orchestratore avvolge `#cart` in una shadow root, esegue il rendering dell'app in un `<div data-tuvix-sandbox-root="cart">` al suo interno e carica `style.css` nella shadow root invece che in `<head>`. Il mount attende quei fogli di stile, fino al `timeout` del loader (10000 ms per default). L'orchestratore riusa la shadow root quando l'app viene montata di nuovo.

A mano:

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

Restituisce `new Sandbox(options)`.

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` avvolge il container in una shadow root. Con `false`, `activate` restituisce `null` e non collega nulla. |
| `js` | `boolean` | `true` | `activate`/`deactivate` attivano e disattivano `sandbox.js.active`. Il proxy in `sandbox.js.proxyWindow` tiene comunque le scritture lontane dal vero `window`. |
| `allowedGlobals` | `string[]` | `[]` | Nomi globali aggiuntivi che la strict mode consente al codice in sandbox di assegnare. Le scritture su questi nomi finiscono comunque sul proxy. |
| `strict` | `boolean` | `false` | Lancia un `TypeError` quando il codice in sandbox assegna o definisce un global fuori dalla allowlist integrata e da `allowedGlobals`. |

### `Sandbox`

```ts
import { Sandbox } from '@tuvix.js/sandbox';

const sandbox = new Sandbox({ css: false, js: true });
console.log(sandbox.activate(document.body)); // null
```

La classe dietro `createSandbox`. Implementa `ISandbox`:

| Membro | Firma | Comportamento |
| --- | --- | --- |
| `css` | `readonly ICssSandbox` | L'istanza di `CssSandbox` che usa. |
| `js` | `readonly IJsSandbox` | L'istanza di `JsSandbox` che usa. |
| `activate` | `(container: HTMLElement) => ShadowRoot \| null` | `css.wrap(container)` quando `css` è attivo, poi `js.activate()` quando `js` è attivo. Restituisce la shadow root o `null`. |
| `deactivate` | `(container: HTMLElement) => void` | `js.deactivate()`, poi `css.unwrap(container)`. |
| `destroy` | `(container: HTMLElement) => void` | `deactivate(container)`, poi `js.reset()`, che cancella ogni global memorizzato. |

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

| Metodo | Firma | Comportamento |
| --- | --- | --- |
| `wrap` | `(container: HTMLElement) => ShadowRoot` | Sposta i figli del container in una shadow root aperta e la restituisce. |
| `unwrap` | `(container: HTMLElement) => void` | Riporta i figli nel light DOM, mette da parte i fogli di stile della shadow root e lascia uno `<slot>` nella shadow root. |
| `addStyle` | `(shadowRoot: ShadowRoot, css: string) => HTMLStyleElement` | Aggiunge uno `<style>` con `css` alla fine della shadow root. |
| `removeStyle` | `(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement) => void` | Rimuove `styleEl`. Quando l'host non è avvolto, elimina anche `styleEl` dall'elenco degli stili messi da parte, così il `wrap` successivo non lo ripristina. |
| `adoptStyles` | `(shadowRoot: ShadowRoot, styles: AdoptStylesOptions) => AdoptedStyles` | Inserisce elementi `<link>` e `<style>` all'inizio della shadow root. |

#### `wrap` e i rimontaggi

Un elemento DOM non può perdere la propria shadow root una volta collegata. `wrap` gestisce questo vincolo:

1. Se questa istanza di `CssSandbox` ha già avvolto il container e non lo ha ancora liberato con `unwrap`, `wrap` restituisce la stessa shadow root e non sposta nulla.
2. Se il container ha una `shadowRoot` aperta (da un `wrap` precedente, da un `unwrap` o da un'altra istanza di `CssSandbox`), `wrap` rimuove lo `<slot>` lasciato da `unwrap`, rimette i fogli di stile che `unwrap` aveva messo da parte (all'inizio, nel loro ordine originale) e riusa la root.
3. Altrimenti chiama `container.attachShadow({ mode: 'open' })`.

Poi sposta ogni figlio del light DOM nella shadow root. `wrap` lancia un'eccezione solo quando `attachShadow` fallisce, per esempio su un elemento che non può ospitare una shadow root (`<img>`, `<input>`) o su uno che ha già una root chiusa: `[Tuvix Sandbox] Cannot attach Shadow DOM to <img>: ...`.

#### `unwrap` e lo slot

`unwrap` riporta i figli della shadow root nel container. Toglie dal DOM i nodi `<style>` e `<link rel="stylesheet">`, che provengano da `addStyle`, da `adoptStyles` o dall'app, così il CSS dell'app smette di applicarsi e non raggiunge mai la pagina. Li conserva insieme alla shadow root. La shadow root resta e contiene un solo `<slot data-tuvix-sandbox-slot>`, attraverso cui il browser esegue il rendering dei figli ripristinati. `unwrap` non fa nulla per un container che questa istanza non ha avvolto.

Il `wrap` successivo di quell'host, da parte di questa o di qualsiasi altra istanza di `CssSandbox`, rimuove lo slot, rimette in ordine i fogli di stile messi da parte e riporta dentro i figli. Dopo un rimontaggio non devi adottare di nuovo gli stili. Chiamare `removeStyle(shadowRoot, el)` o `adopted.remove()` mentre l'host non è avvolto rimuove quei fogli definitivamente.

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

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `urls` | `readonly string[]` | `[]` | Ogni URL diventa un `<link rel="stylesheet" data-tuvix-style>`, in ordine. |
| `cssText` | `string \| readonly string[]` | nessuno | Ogni stringa diventa uno `<style data-tuvix-style>`, posizionato dopo i link. |

Comportamento:

- Gli elementi vanno all'inizio della shadow root, dopo gli stili adottati in precedenza, così il contenuto dell'app e gli stili di `addStyle` vengono dopo nella cascata.
- Un URL già adottato in questa shadow root viene saltato e non compare in `elements`. Questo vale anche per i link che `unwrap` ha messo da parte. `ready` attende comunque quel link esistente quando lo ha creato una chiamata precedente.
- `ready` si risolve quando ogni link emette `load` o `error`. Non viene mai rifiutata, quindi un foglio di stile in 404 non ti blocca. jsdom non emette nessuno dei due eventi, quindi non attendere `ready` nei test con jsdom.
- `remove()` rimuove solo gli elementi inseriti da questa chiamata, compresi quelli messi da parte, così il `wrap` successivo non li ripristina.

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

Costruttore: `new JsSandbox(allowedGlobals: string[] = [], strict = false)`.

| Membro | Firma | Comportamento |
| --- | --- | --- |
| `proxyWindow` | `readonly WindowProxy` | Proxy sul vero `window`. |
| `active` | `readonly boolean` | Flag impostato da `activate` e azzerato da `deactivate`/`reset`. |
| `activate` | `() => void` | Imposta `active` a `true`. |
| `deactivate` | `() => void` | Imposta `active` a `false`. I global memorizzati restano. |
| `execScript` | `(code: string) => unknown` | Esegue `code` come script in sloppy mode dentro `with (scope)` tramite `new Function`. `window`, `self`, `globalThis` e il `this` di primo livello sono il proxy, e gli identificatori liberi si risolvono attraverso di esso. `eval("...")` resta un eval diretto dentro quello scope. Restituisce ciò che restituisce il codice. |
| `reset` | `() => void` | Cancella ogni global memorizzato e imposta `active` a `false`. |

Il proxy:

- Le letture controllano prima lo store della sandbox, poi passano al vero `window`. Le funzioni del vero window senza `prototype` (`fetch`, `setTimeout`) vengono restituite legate al vero `window`, una volta per funzione, quindi `proxyWindow.fetch === proxyWindow.fetch`.
- `proxyWindow.window`, `.self`, `.globalThis` e, quando la pagina non è in un iframe, `.top`/`.parent`/`.frames` restituiscono il proxy stesso. In un iframe, `top` e `parent` restano quelli reali.
- Le assegnazioni e `Object.defineProperty` memorizzano il valore sul proxy. Il vero `window` non cambia mai. Un descrittore senza `value` (`{ enumerable: false }`) mantiene il valore memorizzato. I descrittori accessor (`get`/`set`) e `configurable: false` fanno lanciare a `Object.defineProperty` un `TypeError`.
- `delete proxyWindow.x` rimuove un valore memorizzato. Per una proprietà del vero window restituisce `false`, che lancia un `TypeError` nel codice in strict mode.
- `in` controlla lo store e il vero `window`.

Strict mode (`strict: true`): un'assegnazione (`window.x = 1` o un semplice `x = 1`), un `var x = 1` di primo livello o una chiamata a `Object.defineProperty` per un nome fuori dalla allowlist integrata e da `allowedGlobals` lancia `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "tracker". Add it to allowedGlobals to permit it.` e non memorizza nulla. Il controllo avviene sia con la sandbox attiva sia con la sandbox inattiva. Le chiavi Symbol sono sempre considerate bloccate. La allowlist integrata copre i global standard come `console`, i timer, `Promise`, `Map`, `JSON`, `fetch`, `URL`, `navigator`, `document`, `location` e `history`. Le scritture consentite, comprese quelle su questi nomi, restano sul proxy.

### Tipi

| Tipo | Significato |
| --- | --- |
| `SandboxOptions` | `{ css?, js?, allowedGlobals?, strict? }`, le opzioni di `createSandbox`. |
| `ISandbox` | Interfaccia implementata da `Sandbox`: `css`, `js`, `activate`, `deactivate`, `destroy`. |
| `ICssSandbox` | Interfaccia implementata da `CssSandbox`. |
| `IJsSandbox` | Interfaccia implementata da `JsSandbox`. |
| `AdoptStylesOptions` | `{ urls?, cssText? }` per `adoptStyles`. |
| `AdoptedStyles` | `{ elements, ready, remove }` restituito da `adoptStyles`. |

## Casi limite

- Dentro `execScript`, `x = 1`, un `var x = 1` di primo livello, `window.x = 1`, `window.window.x = 1`, `top.x = 1` e le stesse istruzioni dentro `eval("...")` memorizzano tutti `x` sul proxy, mai sul vero `window`. `let` e `const` restano locali allo script.
- Leggere un identificatore non dichiarato dentro `execScript` restituisce `undefined` invece di lanciare un `ReferenceError`, e una direttiva `"use strict"` in `code` non ha effetto, perché `with` richiede la sloppy mode.
- Dentro una semplice chiamata di funzione come `f()`, `this` è il vero oggetto globale, come definisce JavaScript in sloppy mode. `this.x = 1` in una funzione del genere scrive sul vero `window`. Nel codice che esegui tramite `execScript` scrivi `window.x = 1`.
- `execScript` usa `new Function`, quindi una Content Security Policy senza `'unsafe-eval'` lo blocca.
- Costruire `JsSandbox`, `Sandbox` o `createSandbox()` legge `window`, quindi sul server lanciano un `ReferenceError`. `CssSandbox` richiede `document` solo quando chiami i suoi metodi.
- Due istanze di `CssSandbox` possono condividere un host. Il secondo `wrap` riusa la shadow root della prima istanza.
- I figli del light DOM che aggiungi mentre il container è avvolto restano fuori dalla shadow root e non passano da nessuno slot, quindi non vengono mostrati. Aggiungili invece dentro la shadow root.
- `Sandbox({ css: false }).activate()` restituisce `null`. Esegui il rendering nel container.

## Cosa non fa

- Non modifica timer, event listener, `document` o tag `<script>`. Il codice che non passa da `proxyWindow` agisce sulla pagina reale.
- Non ripulisce gli intervalli o i listener lasciati da un'app. Cancellali nell'`unmount` dell'app.
- Non dà al codice un'origine o un oggetto globale separati. Usa un `<iframe sandbox>` per il codice non attendibile.
- Non stacca una shadow root. Il DOM non ha un'API per farlo; `unwrap` lascia invece uno slot.
- Non blocca l'ereditarietà. `color`, `font-family` e le custom property CSS impostate sull'host o sui suoi antenati arrivano comunque nella shadow root.

## Migrazione dalla 0.4

- `Sandbox({ css: false }).activate(container)` restituisce `null` e non collega nessuna shadow root. Nella 0.4 ne collegava una e nascondeva i figli del container. `ISandbox.activate` ora restituisce `ShadowRoot | null`:

  ```ts
  import { createSandbox } from '@tuvix.js/sandbox';

  const container = document.querySelector<HTMLElement>('#app')!;
  const sandbox = createSandbox({ css: false });

  // 0.4: const root: ShadowRoot = sandbox.activate(container);
  const root = sandbox.activate(container) ?? container;
  ```

- `strict: true` lancia un `TypeError` su una scrittura bloccata. Nella 0.4 registrava un avviso e memorizzava il valore. Aggiungi ad `allowedGlobals` i nomi che i tuoi script impostano.
- `execScript` esegue il codice dentro un blocco `with`. Il codice non può essere in strict mode, leggere un identificatore non dichiarato restituisce `undefined` invece di lanciare un'eccezione, e un semplice `x = 1` ora finisce sul proxy invece che sul vero `window`.
- `unwrap` conserva i fogli di stile della shadow root e il `wrap` successivo li ripristina. Nella 0.4 `unwrap` li eliminava. Rimuovi il codice che aggiunge di nuovo gli stili `cssText` o `addStyle` dopo un rimontaggio, altrimenti ottieni duplicati.
- La documentazione della 0.4 diceva che `js: true` intercetta `addEventListener`, i timer e `document.createElement`. Non lo ha mai fatto, e nemmeno la 0.5 lo fa.
