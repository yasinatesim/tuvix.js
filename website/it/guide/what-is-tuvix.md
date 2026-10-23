# Cos'è Tuvix.js?

Tuvix.js è un toolkit per microfrontend nel browser. Una pagina host (la shell) registra le micro app, e Tuvix.js carica il codice di ogni app, la monta in un container, le passa le props e la smonta quando lo dicono l'URL o il tuo codice. Ogni micro app può usare React, Vue, Svelte, Angular o nessun framework, e ogni team può fare la build e il deploy della propria app con i propri tempi.

## Cosa fa

- **Orchestra le micro app.** `createOrchestrator()` mantiene un registro delle app. Per ognuna decide, in base al path corrente, se l'app deve essere montata, ed esegue un reconcile alla volta, così due app che condividono un container non si sovrappongono mai.
- **Carica il codice su richiesta.** La `entry` di un'app può essere l'URL di uno script, una lista di script e fogli di stile, oppure una funzione come `() => import('./dashboard')`. Il loader ritenta i caricamenti falliti e interrompe quelli lenti.
- **Esegue il routing in base all'URL.** `activeWhen: '/dashboard/*'` monta un'app su `/dashboard` e su ogni path sottostante. Puoi usare il router integrato oppure seguire TanStack Router o React Router con `connectRouter()`.
- **Adatta i framework.** `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp` e `createAngularMicroApp` trasformano un componente radice in un modulo con `mount`, `update` e `unmount`.
- **Ospita island in una pagina React.** `TuvixIsland` monta una micro app Vue, Svelte, Angular o React dentro un albero React renderizzato lato server ed esegue la hydration dell'HTML del server senza inviarlo due volte. Vedi [Island SSR](/it/guide/ssr-islands).
- **Segnala il ciclo di vita.** Gli adapter e `defineMicroApp` emettono gli eventi DOM `tuvix:mounted`, `tuvix:unmounted` e `tuvix:error`, e `whenMounted(name)` si risolve quando un'app è sulla pagina. Vedi [Eventi del ciclo di vita](/it/guide/lifecycle-events).
- **Collega le app.** Tutte le app di una pagina condividono un unico event bus tramite `getGlobalBus()`, anche quando ogni app include nel proprio bundle una copia di `@tuvix.js/event-bus`.
- **Isola il CSS su richiesta.** `sandbox: true` renderizza un'app dentro uno shadow root, così il CSS della pagina e quello dell'app restano separati.

## Quando usarlo

Scegli Tuvix.js quando più team rilasciano parti della stessa pagina e devono distribuirle separatamente, oppure quando vuoi tenere in funzione un'app legacy accanto a una riscrittura in un altro framework. È adatto anche a un singolo team che vuole widget Vue o Svelte dentro un sito React con rendering lato server.

## Quando non usarlo

- Un team, un framework, un deploy: una normale single-page app è più semplice.
- Ti serve un isolamento di sicurezza rigido tra le app. Tuvix.js esegue tutte le app nello stesso realm JavaScript. `JsSandbox` di `@tuvix.js/sandbox` nasconde le scritture globali fatte tramite il suo proxy, ma non impedisce a un'app di raggiungere `window`. Per il codice non attendibile usa un `<iframe>`.
- Vuoi un unico bundle con stato condiviso tra tutte le app. Per scelta progettuale, le micro app comunicano tramite eventi e props.

## Pacchetti

| Pacchetto | Usalo per |
| --- | --- |
| `tuvix.js` | Un'unica installazione con core, router, event bus, loader e sandbox |
| `@tuvix.js/core` | `createOrchestrator`, `defineMicroApp` |
| `@tuvix.js/router` | `createRouter`, `matchPath`, `interceptLinks` |
| `@tuvix.js/loader` | Caricamento delle entry e runtime del ciclo di vita (`whenMounted`, `onLifecycle`) |
| `@tuvix.js/event-bus` | `createEventBus`, `getGlobalBus` |
| `@tuvix.js/sandbox` | `CssSandbox`, `JsSandbox` |
| `@tuvix.js/react`, `vue`, `svelte`, `angular` | Adapter per i framework, `TuvixIsland` (React) |
| `@tuvix.js/vite` | Link ai fogli di stile delle island per il `<head>` renderizzato lato server |
| `@tuvix.js/server` | Composizione lato server di frammenti HTML |
| `@tuvix.js/module-federation` | Entry caricate da remote di webpack Module Federation |
| `@tuvix.js/devtools` | Pannello di debug nella pagina |
| `create-tuvix-app` | Scaffolding dei progetti |

## Concetti chiave

| Termine | Significato |
| --- | --- |
| Shell | La pagina host che crea l'orchestratore e gestisce il layout |
| Micro app | Un modulo con `mount` e `unmount` (e, facoltativi, `bootstrap` e `update`) |
| Entry | Da dove il loader prende una micro app: URL, `{ scripts, styles }` o una funzione loader |
| Container | L'elemento in cui una micro app viene renderizzata |
| Island | Una micro app che l'host renderizza sul server e il client idrata sul posto |
| Event bus | Un canale pub/sub condiviso da tutte le app della pagina |

## Prossimi passi

- [Per iniziare](/it/guide/getting-started) costruisce una shell e due micro app.
- [Architettura](/it/guide/architecture) mostra come una navigazione diventa un mount.
- Arrivi dalla 0.4? Leggi [Migrazione alla 0.5](/it/guide/migration-0-5).
