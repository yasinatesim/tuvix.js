# Migrazione alla 0.5

La 0.5 corregge bug che cambiavano il comportamento osservabile, quindi alcune di queste correzioni rompono il codice scritto per la 0.4. Questa pagina elenca ogni breaking change per pacchetto, con il codice da modificare. Aggiorna insieme tutti i pacchetti `tuvix.js` e `@tuvix.js/*` a `^0.5.0`: non è supportato mescolare adapter 0.4 e 0.5 nella stessa pagina.

```bash
pnpm up --latest "tuvix.js" "@tuvix.js/*"
```

I progetti creati con `create-tuvix-app` prima della 0.5 dipendono da `^0.1.0`, che non si risolve mai nella 0.4 o nella 0.5. Modifica quei range a mano.

## Core

### L'orchestratore usa il bus globale

Nella 0.4 ogni orchestratore aveva un bus privato, separato da `getGlobalBus()`. Nella 0.5 il bus dell'orchestratore è `getGlobalBus()`, a meno che tu non passi le opzioni `eventBus`, e `destroy()` lascia attivo il bus globale.

```ts no-check
// 0.4: two buses; apps listening on getGlobalBus() missed orchestrator events
const orchestrator = createOrchestrator();
orchestrator.getEventBus() === getGlobalBus(); // false
```

```ts
// 0.5
import { createOrchestrator, getGlobalBus } from 'tuvix.js';

const shared = createOrchestrator();
console.log(shared.getEventBus() === getGlobalBus()); // true

const isolated = createOrchestrator({ eventBus: {} }); // private bus, as in 0.4
console.log(isolated.getEventBus() === getGlobalBus()); // false
```

Se esponevi il bus dell'orchestratore su `window` perché le app potessero trovarlo, puoi eliminare quel codice e usare il `bus` del contesto di mount o `getGlobalBus()`.

### I cambi di route non toccano le app manuali

La 0.4 smontava al cambio di route successivo un'app priva sia di `activeWhen` sia di una route del router, e lo stesso valeva per le app con `mountWhenVisible`. Nella 0.5 la riconciliazione tocca solo le app controllate da `activeWhen` o da una route. Se contavi su una navigazione per rimuovere un'app montata manualmente, smontala tu:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.unmountApp('cookie-banner');
```

### sandbox: true esegue il rendering in una shadow root

Nella 0.4 l'opzione `sandbox` di `register` non faceva nulla. Nella 0.5 `sandbox: true` monta l'app dentro una shadow root e carica lì gli `styles` della sua entry. Il CSS della pagina non raggiunge più l'app, e gli stili della entry dell'app non raggiungono più la pagina. Rimuovi `sandbox: true` dalle app che dipendono dagli stili della pagina. Vedi [Sandboxing](/it/guide/sandbox).

### prefetch: 'hover'

La 0.4 eseguiva il prefetch di tutte le app al primo movimento del mouse in qualsiasi punto della pagina. La 0.5 esegue il prefetch di un'app quando il puntatore entra in un link dello stesso origin il cui percorso la attiva, o quando quel link riceve il focus. Usa `'idle'` o `'immediate'` per scaricare subito tutte le app.

### OrchestratorConfig.shared è stato rimosso

L'orchestratore non leggeva mai `shared`. Eliminalo e condividi le dipendenze con `@tuvix.js/module-federation` o con le import map.

### Pattern di activeWhen

Le stringhe di `activeWhen` ora usano `matchPath`. Una query string o un hash non smontano più un'app, i segmenti `:param` funzionano e caratteri come `.` e `(` vengono confrontati letteralmente.

```ts no-check
// 0.4: `.` was a regex wildcard and matched '/v1x0'
activeWhen: '/v1.0/*'
// 0.4: query strings broke matching, so people wrote functions
activeWhen: (path) => path.split('?')[0].startsWith('/dashboard')
```

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'dashboard',
  entry: () => import('./apps/dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*', // also active on /dashboard?tab=1
});
```

## Router

### La route '/' e RouteConfig.exact

I percorsi delle route corrispondono ovunque all'intero percorso. Una route `'/'` ora si attiva solo su `/`; nella 0.4 `getActiveApps()` la trattava come corrispondente a ogni percorso, mentre `match()` la trattava come esatta. `RouteConfig.exact` è stato rimosso, perché non cambiava mai nulla.

```ts no-check
// 0.4
routes: [{ path: '/', app: 'shell-nav' }, { path: '/settings', app: 'settings', exact: true }]
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({
  routes: [
    { path: '/*', app: 'shell-nav' }, // every path
    { path: '/settings', app: 'settings' }, // /settings only
  ],
});
void router;
```

`activeWhen: '/'` su `register` corrisponde ancora a ogni percorso, perché le stringhe di `activeWhen` usano il confronto per prefisso.

### push e replace aggiungono la base

```ts no-check
// 0.4 with base: '/app'
router.push('/app/settings'); // you had to add the base yourself
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({ base: '/app', routes: [] });
await router.push('/settings'); // URL: /app/settings
```

Se nella 0.5 passi `/app/settings`, l'URL scritto è `/app/app/settings`. Anche una guard che annulla una navigazione avanti/indietro ripristina l'URL con la base.

### Altre modifiche al router

- `base` viene rimossa solo al confine di un segmento. Con `base: '/app'`, `/application` resta `/application`.
- `pathToRegex()` restituisce una `RegExp` in cache: non modificarla. Il suo secondo argomento `exact` è stato rimosso.
- I caratteri speciali delle regex nei pattern vengono confrontati letteralmente. Un `*` in mezzo a un pattern corrisponde a un solo segmento.
- `matchRoute()` e `isPathActive()` ignorano un `#hash` nel percorso.

## Loader

### Opzioni rimosse

`LoaderOptions.fetch` e `EntryConfig.html` sono stati rimossi. Il loader non li leggeva mai: eliminali dalla tua configurazione.

```ts no-check
// 0.4
new ModuleLoader({ fetch: myFetch });
orchestrator.register({ name: 'x', entry: { scripts: ['/x.js'], html: '<div></div>' }, container: '#x' });
```

```ts
// 0.5
import { ModuleLoader } from '@tuvix.js/loader';

const loader = new ModuleLoader({ timeout: 10000 });
void loader;
```

### Gli script modulo vengono eseguiti una volta per URL

Dopo `unload(name)`, un'app registrata da uno script `type: 'module'` non si carica di nuovo dallo stesso URL, perché i browser eseguono uno script modulo una sola volta per URL. Per le app che scarichi e ricarichi usa una entry con funzione loader:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

Per un modulo in cache, `load()` ora riporta la sua `duration` reale invece di `0`.

## Module Federation

`federatedEntry` e `createFederatedEntry` restituiscono una funzione loader invece di `{ scripts: [remoteEntry.js] }`. La entry della 0.4 caricava lo script del container e poi falliva con "no exports found".

```ts no-check
// 0.4
orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }),
  container: '#main',
});
```

```ts
// 0.5
import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader, federatedEntry } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry(
    { name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' },
    './App', // exposed module path
  ),
  container: '#main',
  activeWhen: '/dashboard/*',
});

const remotes = createFederatedLoader({
  remotes: [{ name: 'settings', url: 'https://cdn.example.com/settings/remoteEntry.js' }],
  shareScope: {}, // replaces 0.4 `shared`
});

orchestrator.register({
  name: 'settings',
  entry: remotes.createFederatedEntry('settings', './App'),
  container: '#main',
  activeWhen: '/settings/*',
});
```

- `FederatedLoaderConfig.shared` è sostituito da `shareScope`. La 0.4 non leggeva mai `shared`.
- `loadRemoteContainer` restituisce `FederatedContainer` invece di `any`.

## React

- L'HTML server di `TuvixReactApp` ora contiene i marker di commento di Suspense (`<!--$-->...<!--/$-->`). Esegui rendering e hydration con `@tuvix.js/react` 0.5 su entrambi i lati.
- `mount` viene rifiutata quando il primo rendering lancia un errore. Nella 0.4 l'errore arrivava al gestore degli errori della root di React e `mount` si risolveva. Ora l'orchestratore mostra il `fallback` dell'app e chiama `onError`.
- `unmount` su un container che il modulo non ha mai montato non fa nulla. La 0.4 lo svuotava.

## Vue

`update()` non scrive più `app.config.globalProperties.$tuvixProps`. Ora le props sono reattive:

```vue
<!-- 0.4 -->
<template>{{ $tuvixProps.theme }}</template>
```

```vue
<!-- 0.5 -->
<script setup lang="ts">
defineProps<{ theme?: string }>();
</script>

<template>{{ theme }}</template>
```

I discendenti possono usare `inject('tuvixProps')`, che restituisce lo stesso oggetto reattivo.

- `VueSsrMicroAppConfig` non accetta più `ssr`. Lo imposta `createSsrVueMicroApp`.
- `unmount` su un container che il modulo non ha mai montato non fa nulla.

## Svelte

- Senza `ssr`, `createSvelteMicroApp` svuota il container prima del rendering. La 0.4 aggiungeva i componenti Svelte 3/4 dopo il markup esistente. Usa `createSsrSvelteMicroApp` per mantenere il markup del server ed eseguirne la hydration.
- `unmount` su un container che il modulo non ha mai montato, o il cui mount è fallito, non fa nulla. La 0.4 lo svuotava. Ora tutti e quattro gli adapter si comportano così.
- `renderSvelteToString` non ripiega più su `App.render` quando `svelte/server` non si carica. Se passi `render` usa Svelte 5; altrimenti segue il percorso di Svelte 5 quando `svelte` esporta `mount`, e chiama `App.render` solo per Svelte 3/4. Un errore di import o di rendering di Svelte 5 arriva fino a te.

I componenti Svelte 5 funzionano nella 0.5; nella 0.4 `createSvelteMicroApp` falliva con loro. Con Svelte 5, `update()` rimonta il componente a meno che tu non passi nella configurazione `SvelteMap` da `svelte/reactivity`, che aggiorna le props sul posto:

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

## Angular

### Nuova forma della configurazione

```ts no-check
// 0.4
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

export default createAngularMicroApp({
  name: 'admin',
  module: AppModule,
  platform: platformBrowserDynamic,
  selector: 'app-root',
});
```

```ts
// 0.5
import { createAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AppComponent, // required
  module: AppModule, // only when AppComponent is declared in an NgModule
});
```

`platform` e `compilerOptions` sono stati rimossi. Togli `import '@angular/compiler'` dalla tua entry: l'adapter carica il compilatore per i componenti JIT.

### Zoneless per impostazione predefinita

Le app girano senza zone.js a meno che tu non passi `zone: true`. Su Angular 15-17 gli eventi DOM non attivano più la change detection: chiama `ChangeDetectorRef.detectChanges()` negli handler, oppure importa `zone.js` nella tua entry e passa `zone: true`. Angular 18+ pianifica la change detection senza zone.js. Vedi [Angular](/it/guide/angular).

### Le props sono input

`update()` non scrive più `window.__TUVIX_ANGULAR_PROPS__`. Dichiara invece proprietà `@Input()`: l'adapter le imposta con `setInput`.

```ts no-check
// 0.4
ngOnInit() {
  this.userId = (window as any).__TUVIX_ANGULAR_PROPS__?.admin?.userId;
}
```

```ts
// 0.5
import { Component, Input } from '@angular/core';

@Component({ selector: 'app-admin', standalone: true, template: '{{ userId }}' })
export class AdminComponent {
  @Input() userId = '';
}
```

### Altre modifiche ad Angular

- `createSsrAngularMicroApp` non aggiunge più `provideClientHydration()`. Esegue di nuovo il rendering nell'elemento host del server.
- `unmount` su un container che il modulo non ha mai montato non fa nulla.

## Sandbox

- `Sandbox({ css: false }).activate(container)` restituisce `null` e non collega alcuna shadow root. `ISandbox.activate` restituisce `ShadowRoot | null`: controlla `null` prima di chiamare `addStyle`.
- In modalità strict, `JsSandbox` lancia un `TypeError` su una scrittura bloccata. La 0.4 registrava un avviso e salvava comunque il valore. Aggiungi ad `allowedGlobals` le variabili globali che il tuo codice scrive.

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });
const shadow = sandbox.activate(container);
if (shadow) sandbox.css.addStyle(shadow, ':host { display: block; }');
```

## Server

- `createServerRenderer().render()` restituisce `statusCode: 502` quando almeno un'app corrisponde al percorso e tutti i fetch dei frammenti falliscono. Restituisce ancora 200 quando nessuna app corrisponde o quando almeno un frammento va a buon fine. `createMiddleware` invia quello status. Il renderer in streaming invia sempre 200.
- `createMiddleware` e `createStreamingMiddleware` chiamano `next(error)` invece di `next()` quando il rendering lancia un errore, così Express instrada la richiesta al tuo gestore degli errori.

## Correzioni non breaking da conoscere

- `require('@tuvix.js/core')` e gli altri entry point CommonJS funzionano. Nella 0.4 cinque pacchetti facevano puntare `require` a file che la build non generava mai.
- `getGlobalBus()` conserva la sua istanza su `window`, quindi micro app con bundle separati condividono un unico bus.
- Gli adapter e `defineMicroApp` emettono `tuvix:mounted`, `tuvix:unmounted` e `tuvix:error`. Vedi [Eventi del ciclo di vita](/it/guide/lifecycle-events).
- Un `bootstrap()` che lancia un errore viene eseguito di nuovo al mount successivo. La 0.4 da quel momento lo saltava.
- `register()` dopo `start()` monta subito l'app quando il percorso corrente la attiva, e inizia a osservare un'app con `mountWhenVisible`.
- Ogni errore del ciclo di vita emette `tuvix:app:error` sul bus con `{ name, error, phase }`. La 0.4 lo emetteva solo per gli errori di caricamento e di mount.
- `maxListeners` avvisa con `console.warn` una volta per evento, con o senza `debug`.
- `orchestrator.connectRouter()` sostituisce i bridge basati su `setTimeout` + `reconcile()`. Vedi [Router esterno](/it/guide/external-router).
