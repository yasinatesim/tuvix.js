# Hook del ciclo di vita

L'orchestratore porta ogni app registrata attraverso una sequenza fissa di hook e stati. Questa pagina descrive gli hook che il tuo modulo implementa, gli stati che la shell può leggere e cosa succede in caso di errori e di navigazione rapida. Per sapere dall'esterno quando un'app è sulla pagina, usa gli [Eventi del ciclo di vita](/it/guide/lifecycle-events).

## Ordine degli hook

```text
register()
  └─ first activation: load entry → bootstrap() → mount()
       ├─ updateAppProps() while mounted → update()
       └─ deactivation → unmount()
  └─ next activation: mount()   (module cached, no bootstrap)
```

L'orchestratore attende ogni hook. Non chiama mai `mount` su un'app che è ancora in fase di mount e non chiama mai `unmount` mentre `mount` è ancora in esecuzione: l'unmount attende che il mount si concluda.

## bootstrap

Viene eseguito una volta per ogni modulo caricato, dopo il caricamento della entry e prima del primo `mount`. Usalo per il lavoro che deve sopravvivere ai remount, come la lettura della configurazione.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let config: { apiUrl: string } | undefined;

export default defineMicroApp({
  name: 'reports',
  async bootstrap() {
    const response = await fetch('/reports/config.json');
    config = (await response.json()) as { apiUrl: string };
  },
  mount({ container }) {
    container.textContent = `API: ${config?.apiUrl ?? 'unknown'}`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Se `bootstrap` lancia un errore, l'app passa allo stato `error` e il mount fallisce. Il tentativo di mount successivo chiama di nuovo `bootstrap`. Dopo un'esecuzione riuscita, i remount lo saltano.

## mount

Viene eseguito ogni volta che l'app diventa attiva, o quando chiami `mountApp(name)`. Il contesto contiene:

| Campo | Valore |
| --- | --- |
| `container` | L'elemento in cui renderizzare. Per le app con `sandbox: true`, un elemento dentro lo shadow root. |
| `props` | Le props registrate, unite a quelle di ogni chiamata a `updateAppProps`. |
| `name` | Il nome registrato dell'app. |
| `bus` | L'event bus dell'orchestratore. |

`mountApp(name)` si risolve dopo che `mount` si è concluso e viene rifiutata con l'errore di caricamento o di mount.

## update

Viene eseguito quando la shell chiama `updateAppProps(name, props)` mentre l'app è montata:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('reports', { range: '7d' });
```

Il contesto contiene le `props` unite e il `container`. Se `update` manca o l'app non è montata, l'orchestratore conserva le props e le passa al `mount` successivo. Non rimonta mai un'app perché le props sono cambiate.

`updateAppProps` attende prima un eventuale mount in corso, così l'aggiornamento raggiunge la nuova istanza. Un `unmount` che arriva durante un aggiornamento attende l'aggiornamento.

## unmount

Viene eseguito quando l'app diventa inattiva, con `unmountApp(name)`, `unregister(name)` e `destroy()`. Rimuovi tutto ciò che `mount` ha creato: root dei framework, listener, timer, sottoscrizioni al bus.

Dopo `unmount`, l'orchestratore rimuove da `document.head` i fogli di stile della entry dell'app. Il mount successivo li aggiunge di nuovo e attende che vengano caricati.

## Stato dell'app

```ts
import { createOrchestrator, type AppStatus } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
const status: AppStatus | null = orchestrator.getAppStatus('reports');
// 'registered' | 'bootstrapping' | 'bootstrapped' | 'mounting' | 'mounted'
// | 'updating' | 'unmounting' | 'unmounted' | 'error' | null (not registered)
```

| Metodo | Restituisce |
| --- | --- |
| `getAppStatus(name)` | Lo stato, oppure `null` per un nome sconosciuto. |
| `getMountedApps()` | I nomi con stato `mounted`. |
| `getRegisteredApps()` | Tutti i nomi registrati. |

## Errori e fallback

Quando il caricamento, `bootstrap` o `mount` falliscono, l'orchestratore:

1. scrive l'HTML di `fallback` dell'app nel suo container, se ne hai impostato uno;
2. imposta lo stato `error`;
3. emette `OrchestratorEvent.APP_ERROR` (`tuvix:app:error`) sul bus con `{ name, error, phase }`;
4. chiama `onError(error, name)`;
5. rifiuta `mountApp`. Un mount fallito durante un cambio di route viene invece registrato con `console.error`, e le altre app vengono comunque montate.

Un `update` o un `unmount` fallito esegue i passi da 2 a 4 e rifiuta `updateAppProps` o `unmountApp`; non scrive HTML di fallback. `phase` è `'load'` (che include la risoluzione del container), `'bootstrap'`, `'mount'`, `'update'` o `'unmount'`.

```ts
import { createOrchestrator, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.getEventBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, phase, error }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

Il successivo cambio di route che attiva un'app nello stato `error` prova a montarla di nuovo.

## Navigazione rapida

I cambi di route eseguono il reconcile uno alla volta. Le app inattive vengono smontate prima che quelle attive vengano montate. Quando i path arrivano più velocemente di quanto le app vengano montate:

- come passo successivo viene eseguito solo il path più recente in coda;
- un'app che diventa inattiva mentre la sua entry si carica salta il mount;
- un'app che diventa inattiva mentre `mount` è in esecuzione viene smontata appena `mount` si conclude.

Quindi A → B → A in rapida successione termina con solo A montata, e nessuna app renderizza in un container ancora occupato da un'altra app.

## Hook a livello di shell

```ts
import { createOrchestrator, OrchestratorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError: (error, name) => console.error(`[${name}]`, error),
  onStatusChange: (name, status) => console.debug(`[${name}] ${status}`),
});

const bus = orchestrator.getEventBus();
bus.on<{ name: string }>(OrchestratorEvent.APP_MOUNT, ({ name }) => {
  console.log('mounted', name);
});
bus.on<{ name: string }>(OrchestratorEvent.APP_UNMOUNT, ({ name }) => {
  console.log('unmounted', name);
});
bus.on<{ to: string }>(OrchestratorEvent.ROUTE_CHANGE, ({ to }) => {
  console.log('route', to);
});
```

| Evento | Payload | Emesso |
| --- | --- | --- |
| `tuvix:app:registered` | `{ name }` | `register()` |
| `tuvix:app:bootstrap` | `{ name }` | dopo `bootstrap` |
| `tuvix:app:mount` | `{ name }` | dopo `mount` |
| `tuvix:app:unmount` | `{ name }` | dopo `unmount` |
| `tuvix:app:error` | `{ name, error, phase }` | load, bootstrap, mount, update o unmount falliti |
| `tuvix:app:status-change` | `{ name, status }` | a ogni cambio di stato |
| `tuvix:route:change` | `{ from, to, fromRoute, toRoute }` | solo navigazione del router integrato |
| `tuvix:started` | `{}` | al termine di `start()` |
| `tuvix:destroyed` | `{}` | al termine di `destroy()` |

Questi eventi del bus provengono dall'orchestratore. Gli eventi DOM `tuvix:mounted` descritti in [Eventi del ciclo di vita](/it/guide/lifecycle-events) provengono dagli adapter e da `defineMicroApp`, e vengono emessi anche per le island montate senza orchestratore.

## Smantellamento

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.destroy();
```

`destroy()` attende un eventuale reconcile in corso, smonta tutte le app, ferma il router, le sottoscrizioni di `connectRouter`, il prefetch e l'observer del viewport, e svuota la cache del loader. Distrugge un event bus privato e lascia attivo il bus globale. Chiamarlo due volte è sicuro. Dopo la chiamata, `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` e `connectRouter` lanciano un errore; crea invece un nuovo orchestratore.
