# Eventi del ciclo di vita

Gli adapter e `defineMicroApp` comunicano alla pagina quando una micro app viene montata, smontata o fallisce. Puoi ascoltare eventi DOM, attendere `whenMounted(name)` oppure interrogare `isMounted(name)`. Usali per avviare un'animazione quando un'island diventa interattiva, per nascondere uno skeleton o per segnalare errori, invece di interrogare periodicamente il DOM o leggere dettagli interni del framework come `__vue_app__`.

## Eventi

| Evento DOM | Inviato |
| --- | --- |
| `tuvix:mounted` | Dopo che l'app ha eseguito il rendering o la hydration e le callback di mount del suo framework sono state eseguite. |
| `tuvix:unmounted` | Dopo che l'app è stata distrutta e il suo container svuotato. |
| `tuvix:error` | Quando `mount` o `unmount` lancia un'eccezione, oppure quando un'app React lancia un'eccezione durante il rendering dopo il mount. |

Ogni evento è un `CustomEvent<LifecycleDetail>` inviato sul container dell'app. Risale il DOM (bubbling) ed è `composed`, quindi un listener su `document` lo riceve, anche dall'interno di una shadow root. Quando il container non è più nel DOM (React ha rimosso un'island prima che il suo modulo segnalasse `unmounted`), l'evento viene inviato su `document` e `detail.container` punta comunque all'elemento.

```ts
import type { LifecycleDetail } from '@tuvix.js/loader';

const detail: LifecycleDetail = {
  name: 'footer', // the app name
  container: document.body, // the element the app rendered into
  hydrated: true, // true when the adapter adopted server markup
  error: undefined, // the thrown value, on 'error' only
};
```

## Ascoltare con onLifecycle

```ts
import { onLifecycle } from 'tuvix.js';

const stopMounted = onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} is interactive (hydrated: ${hydrated})`);
});

const stopErrors = onLifecycle('error', ({ name, error }) => {
  console.error(`${name} failed`, error);
});

// later
stopMounted();
stopErrors();
```

`onLifecycle(type, handler, target = document)` restituisce una funzione che rimuove il listener. Passa un container come `target` per ascoltare una sola area. Funziona anche un semplice `addEventListener('tuvix:mounted', ...)`.

## Attendere con whenMounted

```ts
import { whenMounted } from 'tuvix.js';

const controller = new AbortController();
setTimeout(() => controller.abort(new Error('footer did not mount in 5 s')), 5000);

const { container } = await whenMounted('footer', { signal: controller.signal });
container.classList.add('is-ready');
```

- Si risolve subito se l'app è già montata, quindi l'ordine tra il tuo codice e il mount non conta.
- Non viene rifiutata se il mount fallisce. Passa un `signal` con un timeout, oppure ascolta anche `tuvix:error`.
- Quando il signal viene annullato, la promise viene rifiutata con il motivo del signal.

## Verificare con isMounted

```ts
import { isMounted } from 'tuvix.js';

if (isMounted('footer')) {
  console.log('footer is on the page');
}
```

## Sostituire il rilevamento del framework

Senza eventi del ciclo di vita, un host deve indovinare quando un'island è pronta, per esempio controllando a intervalli le proprietà private di un framework:

```ts no-check
// Breaks on Svelte, Angular and any Vue release that renames the property.
const timer = setInterval(() => {
  if ((container as any).__vue_app__) {
    clearInterval(timer);
    startReveal(container);
  }
}, 50);
```

Con gli eventi del ciclo di vita, un solo listener funziona per ogni adapter:

```ts
import { onLifecycle } from 'tuvix.js';

declare function startReveal(container: HTMLElement): void;

onLifecycle('mounted', ({ name, container }) => {
  if (name === 'footer') startReveal(container);
});
```

## Chi invia gli eventi

| Origine | Invia |
| --- | --- |
| `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp` (e le varianti `Ssr`) | tutti e tre |
| `TuvixReactApp` | tutti e tre |
| `TuvixIsland` | nessuno direttamente; li invia il modulo che ospita |
| `defineMicroApp` | tutti e tre; con `ssr: true`, `hydrated` è `true` quando il container conteneva markup prima di `mount` |
| Oggetti semplici `{ mount, unmount }` | nessuno, a meno che tu non chiami `emitLifecycle` |
| L'orchestratore | nessuno; emette invece eventi `tuvix:app:*` sull'event bus |

`defineMicroApp` invia `tuvix:mounted` dopo che il tuo `mount` si è risolto, `tuvix:unmounted` dopo che il tuo `unmount` si è risolto e `tuvix:error` (poi rilancia l'eccezione) quando uno dei due lancia un'eccezione. Un `unmount` per un container il cui `mount` è ancora in esecuzione lo attende:

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'clock',
  ssr: true, // the server rendered the time into the container
  mount({ container }) {
    container.textContent = new Date().toISOString();
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Un modulo scritto come oggetto semplice può inviare gli eventi da solo:

```ts
import { emitLifecycle, type MicroAppModule } from '@tuvix.js/loader';

export const clock: MicroAppModule = {
  mount({ container }) {
    container.textContent = new Date().toISOString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated: false });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
};
```

## Casi limite

- Un modulo può essere montato in più container. `isMounted(name)` resta `true` finché uno di essi è montato, e `whenMounted(name)` si risolve con il primo container ancora montato. Assegna un nome diverso a ogni posizionamento quando devi distinguerli.
- Un evento `tuvix:unmounted` per un container staccato raggiunge una sola volta i listener su `document`. `onLifecycle` con un container come `target` non lo vede, perché l'evento non passa più attraverso quell'elemento.
- Lo stato risiede in `window.__TUVIX_RUNTIME__`, quindi le copie di `@tuvix.js/loader` incluse in bundle separati lo condividono.
- Sul server non ci sono né DOM né eventi. Non chiamare `whenMounted` lì: non si risolve mai.

## Cosa non fa

- Non segnala l'avanzamento del caricamento. `onStatusChange` dell'orchestratore copre `bootstrapping`, `mounting` e gli altri stati.
- Non ritenta e non recupera. Usa il `fallback` dell'orchestratore, oppure `fallback` su `TuvixIsland` e `TuvixReactApp`.
