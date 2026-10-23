---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Binding per Angular"
  description="Trasforma un componente Angular 15+ in una micro app Tuvix.js: zoneless di default, un'applicazione per container, props come input del componente e rendering lato server con stili."
  icon="🔺"
  npm="true"
/>

## Installazione

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Aggiungi `@angular/compiler` quando i tuoi componenti non sono compilati AOT (JIT), e `@angular/platform-server` più `@angular/compiler` sul server quando chiami `renderAngularToString`. L'adapter client richiede Angular 15 o successivo; il renderer server richiede Angular 16 o successivo.

## Quando usarlo

Usa questo pacchetto quando un componente Angular deve girare come una micro app tra le altre: l'orchestratore lo monta in un container su una route, gli passa le props, le aggiorna e lo smonta quando la route non è più attiva. Più app Angular, o più copie della stessa, possono condividere una pagina perché ogni mount riceve la propria applicazione Angular e il proprio elemento host. L'adapter non carica mai zone.js, quindi un'island Angular non modifica `Promise` o `addEventListener` per le app React o Vue accanto.

Se Angular gestisce l'intera pagina, eseguine il bootstrap nel modo consueto con `bootstrapApplication`. In quel caso l'adapter non ti dà alcun vantaggio.

## Avvio rapido

Un componente standalone con un input:

```ts
// greeting.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}
```

L'entry della micro app lo avvolge:

```ts
// greeting-app.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { GreetingComponent } from './greeting.component';

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

La shell registra l'app e avvia l'orchestratore:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'greeting',
  entry: () => import('./greeting-app'),
  container: '#greeting',
  activeWhen: '/hello',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Later: setInput('name', 'Grace') and one change detection pass.
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

L'adapter crea un elemento host `<app-greeting>` dentro `#greeting` e, dopo l'aggiornamento, mostra "Hello Grace".

## API

### `createAngularMicroApp`

```ts no-check
function createAngularMicroApp<C>(config: AngularMicroAppConfig<C>): MicroAppModule;
```

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome dell'app. L'adapter registra il modulo con questo nome tramite `registerModule` di `@tuvix.js/loader`. |
| `component` | `Type<C>` | obbligatorio | Componente radice. I componenti standalone funzionano da soli. |
| `module` | `Type<unknown>` | nessuno | NgModule che dichiara `component`. L'adapter aggiunge i suoi provider con `importProvidersFrom`. |
| `providers` | `AngularProviders` | `[]` | Provider d'ambiente per l'applicazione, come `provideHttpClient()`. |
| `selector` | `string` | parte elemento del selettore del componente, altrimenti `'div'` | Nome del tag dell'elemento host che l'adapter crea dentro il container. |
| `zone` | `boolean` | `false` | Usa la change detection di zone.js. La tua entry client deve importare prima `zone.js`. |
| `ssr` | `boolean` | `false` | Adotta il markup di `renderAngularToString`. Vedi `createSsrAngularMicroApp`. |
| `bootstrap` | `() => void \| Promise<void>` | nessuno | Setup eseguito una sola volta. Il `bootstrap()` del modulo lo attende. |

Ogni `mount({ container, props })`:

1. Carica prima `@angular/compiler` quando `component` o `module` non ha una definizione AOT (`ɵcmp` / `ɵmod`), poi `@angular/core` e `@angular/platform-browser`. Serve solo quando l'adapter è il primo codice a caricare un pacchetto Angular diverso da `@angular/core`. Se i file dei tuoi componenti importano `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` o un'altra libreria Angular, quei pacchetti vengono valutati prima che l'adapter entri in azione e falliscono con "JIT compilation failed". Tieni `import '@angular/compiler'` come prima riga della tua entry client, oppure fai la build AOT.
2. Chiama `createApplication({ providers })` con i provider di change detection per la tua versione di Angular (vedi [Change detection](#change-detection)), i provider del modulo e `providers`.
3. Crea l'elemento host (`<app-greeting>` per il selettore `'app-greeting'`, `<div>` per un selettore di attributo come `'[card]'`), lo inserisce nel container ed esegue il bootstrap del componente al suo interno.
4. Imposta le props come input del componente con `ComponentRef.setInput` prima della prima change detection, così `ngOnInit` le vede già. Sulle versioni di Angular senza `ComponentFactoryResolver` gli input vengono impostati subito dopo il bootstrap, seguiti da un tick.
5. Invia `tuvix:mounted` sul container. In caso di errore invia `tuvix:error` e rifiuta con l'errore originale.

`update({ props, container? })` scrive i nuovi valori con `setInput` ed esegue `appRef.tick()`, per un container o per ogni mount se ometti `container`. Questo esegue il rendering su ogni versione di Angular, zoneless o no.

`unmount({ container })` distrugge l'applicazione, svuota il container e invia `tuvix:unmounted`.

Un componente dichiarato in un NgModule:

```ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin/admin.component';
import { AdminModule } from './admin/admin.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  module: AdminModule,
  providers: [provideHttpClient()],
});
```

### `createSsrAngularMicroApp`

```ts no-check
function createSsrAngularMicroApp<C>(config: AngularSsrMicroAppConfig<C>): MicroAppModule;
```

Stesse opzioni di `createAngularMicroApp` senza `ssr`; si comporta come `createAngularMicroApp({ ...config, ssr: true })`. Usalo sul client per le island di cui il server ha eseguito il rendering con `renderAngularToString`.

Quando il container contiene markup del server, l'adapter riusa l'elemento host se è un figlio diretto del container con il tag atteso. Angular esegue il rendering in quell'elemento e sostituisce i figli del server. Dopo che Angular ha aggiunto gli stili del componente a `<head>`, l'adapter rimuove i tag `<style>` inline del server e qualsiasi altra cosa accanto all'host. `tuvix:mounted` riporta `hydrated: true`. Un container vuoto riceve un normale rendering client.

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString`

```ts no-check
// import from '@tuvix.js/angular/server'
function renderAngularToString(component: unknown, options?: AngularSsrOptions): Promise<string>;
```

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `props` | `Record<string, unknown>` | `{}` | Valori degli input indicizzati per nome dell'input (o alias). Impostati prima della prima change detection, come nel mount client. Le chiavi che non sono input vengono ignorate. |
| `providers` | `AngularProviders` | `[]` | Provider d'ambiente per il rendering lato server. |
| `appId` | `string` | `'ng'` (default di Angular) | `APP_ID` di Angular. Angular lo scrive nell'attributo `ng-app-id` dei tag di stile. |
| `document` | `string` | un documento vuoto con l'elemento host in `<body>` | Documento HTML in cui eseguire il rendering. Deve contenere l'elemento host. |
| `selector` | `string` | parte elemento del selettore del componente, altrimenti `'app-root'` | Tag dell'elemento host per il documento di default; Angular esegue il bootstrap nell'elemento che corrisponde. |

Esegue il rendering di un componente standalone con `renderApplication` di `@angular/platform-server` e restituisce un unico frammento: i tag `<style>` del componente presi dall'`<head>` renderizzato, seguiti dall'HTML interno di `<body>`. Inserisci il frammento nel container in cui monta `createSsrAngularMicroApp`; l'island ha i suoi stili al primo paint.

Le `props` arrivano al componente tramite `setInput` prima della prima change detection, nello stesso modo in cui le imposta il `mount` client, quindi `ngOnInit` le vede su entrambi i lati. Passa lo stesso oggetto al rendering server e al mount client ed entrambi producono lo stesso markup.

Il rendering gira zoneless e non modifica mai la `Promise` globale. Carica sempre prima `@angular/compiler`, perché Node carica i pacchetti Angular da `node_modules` senza l'Angular linker. Chiamalo da una funzione server, non da codice che gira anche nel browser: nel browser restituisce `''`.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAboutIsland(): Promise<string> {
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props: { title: 'About us' } });
  return `<section id="about" data-tuvix-app="about">${html}</section>`;
}
```

### Tipi

| Tipo | Significato |
| --- | --- |
| `AngularMicroAppConfig<C>` | Opzioni di `createAngularMicroApp`. |
| `AngularSsrMicroAppConfig<C>` | `AngularMicroAppConfig<C>` senza `ssr`; opzioni di `createSsrAngularMicroApp`. |
| `AngularSsrOptions` | Opzioni di `renderAngularToString`. Importa il tipo da `@tuvix.js/angular`. |
| `AngularProviders` | `Array<Provider \| EnvironmentProviders>`, ciò che accettano `createApplication` e `bootstrapApplication`. |

## Change detection {#change-detection}

L'adapter non importa mai zone.js. A meno che tu non passi `zone: true`, sceglie la configurazione zoneless supportata dalla tua versione di Angular:

| Angular | Provider aggiunto dall'adapter | Cosa avvia la change detection |
| --- | --- | --- |
| 20 e successive | `provideZonelessChangeDetection()` | Listener di eventi nel template, scritture sui signal, `markForCheck()`, `AsyncPipe`, `setInput` |
| 18 e 19 | `provideExperimentalZonelessChangeDetection()` | Come per la 20 |
| Dalla 15 alla 17 | `NgZone` sostituito da `ɵNoopNgZone` | Niente di per sé. `update()` dall'host esegue comunque il rendering. |

Su Angular 18 e successive, un campo semplice che modifichi in una callback di `setTimeout` o `fetch` non riesegue il rendering del template. Tieni quello stato in un signal, oppure chiama `ChangeDetectorRef.markForCheck()`:

```ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  standalone: true,
  template: `<time>{{ now() }}</time>`,
})
export class ClockComponent {
  readonly now = signal(new Date().toLocaleTimeString());

  constructor() {
    setInterval(() => this.now.set(new Date().toLocaleTimeString()), 1000);
  }
}
```

Su Angular dalla 15 alla 17, anche i clic e gli altri eventi DOM non avviano la change detection. Chiama `ChangeDetectorRef.detectChanges()` dopo aver modificato lo stato:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="increment()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  increment(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

Per mantenere la change detection basata su zone, importa zone.js nella tua entry client prima che l'adapter esegua il mount e passa `zone: true`. L'adapter lascia allora al suo posto la `NgZone` di default di Angular ed esegue il bootstrap al suo interno:

```ts
import 'zone.js';
import { createAngularMicroApp } from '@tuvix.js/angular';
import { DashboardComponent } from './dashboard.component';

export default createAngularMicroApp({ name: 'dashboard', component: DashboardComponent, zone: true });
```

zone.js modifica `Promise`, i timer e i listener DOM per l'intera pagina, incluse le app degli altri framework.

## Rendering lato server

1. Sul server, chiama `renderAngularToString(Component)` e inserisci il frammento nell'elemento container.
2. Sul client, esporta `createSsrAngularMicroApp({ name, component })` dall'entry dell'island.
3. L'orchestratore monta l'app in quel container. Angular esegue il rendering nell'elemento host del server e l'adapter rimuove gli stili del server.

L'adapter riesegue il rendering sopra il DOM del server. Non usa la hydration non distruttiva di Angular (`provideClientHydration`), perché quella hydration si aspetta una pagina di cui Angular ha eseguito il rendering per intero: cerca il commento marcatore della hydration di Angular come figlio diretto di `<body>` e le annotazioni `ngh` sui componenti. Un'island dentro una pagina renderizzata da React, Vue o da un semplice template server non ha né l'uno né le altre. Il compromesso: il markup visibile e gli stili arrivano con l'HTML, ma lo stato dentro l'island (focus, un valore digitato, la posizione di scroll) si azzera quando subentra Angular, e i clic prima di quel momento non hanno effetto.

Passa le stesse props al rendering server e al mount client, così il rendering client corrisponde al markup del server. Il rendering non attende le richieste HTTP o i timer avviati dal componente: carica prima i dati e passali come props.

```ts
// server.ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<{ html: string; props: { text: string } }> {
  const response = await fetch('https://api.example.com/about');
  const props = { text: await response.text() };
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props });
  return { html, props };
}
```

Invia `props` al browser insieme alla pagina (per esempio come JSON in un tag `<script type="application/json">`) e registra l'app con quelle props:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const props = JSON.parse(document.getElementById('about-props')?.textContent ?? '{}') as Record<string, unknown>;
const orchestrator = createOrchestrator();

orchestrator.register({ name: 'about', entry: () => import('./about-app'), container: '#about', props });
await orchestrator.start();
```

Per i valori che non sono input, come l'URL base di un'API, passa invece `providers` su entrambi i lati.

## Casi limite

- `zone: true` senza zone.js nella pagina fa rifiutare il mount con `[tuvix.js/angular] "<name>" sets zone: true, but zone.js is not loaded. Import 'zone.js' in your client entry before mounting, or drop zone: true.` e invia `tuvix:error`.
- Le props le cui chiavi non sono input del componente vengono ignorate, così Angular non registra NG0303. Gli input vengono abbinati per nome pubblico (l'alias, se ne imposti uno).
- Un input presente nelle vecchie props e assente nelle nuove viene impostato a `undefined`. L'inizializzatore del campo (`name = ''`) non viene rieseguito.
- `update` prima che il mount finisca memorizza le props; il bootstrap in sospeso usa le più recenti. `update({ container })` per un container che questo modulo non ha montato non fa nulla.
- `unmount` mentre `mount` sta ancora caricando Angular lo annulla: l'applicazione viene distrutta, il container resta vuoto e `tuvix:mounted` non viene inviato. Se l'annullamento arriva dopo il bootstrap, ricevi `tuvix:mounted` seguito da `tuvix:unmounted`.
- Un secondo `mount` sullo stesso container distrugge la prima applicazione prima di eseguire il bootstrap della nuova.
- `unmount` su un container che questo modulo non ha mai montato non fa nulla.
- Se la distruzione dell'applicazione lancia un errore, l'adapter svuota il container, invia `tuvix:error` e rilancia l'errore.
- Con SSR, un container il cui markup non ha un figlio diretto corrispondente al tag dell'host riceve un nuovo elemento host. `hydrated` resta `true`, perché il container conteneva markup.
- Sul server, un componente con selettore di attributo (`'[card]'`) ricade su un host `<app-root>`, che il selettore non abbina. Passa un `document` il cui `<body>` contenga un elemento corrispondente.
- Su Angular 16, `@angular/platform-server` copia le classi DOM di Domino (`Event`, `Node` e altre) sull'oggetto globale di Node durante un rendering lato server. Lo fa Angular, non l'adapter.
- I componenti JIT senza il plugin del compilatore Angular richiedono comunque `experimentalDecorators` di TypeScript; Angular non supporta la proposta standard dei decorator.

## Cosa non fa

- Non carica zone.js né altri polyfill.
- Non aggiunge `provideClientHydration()` e non esegue la hydration non distruttiva.
- Non invia le props del server al browser. Serializzale tu nella pagina e passa lo stesso oggetto al mount client.
- Non attende chiamate HTTP, timer o `PendingTasks` avviati dal componente durante un rendering lato server.
- Non mantiene i nodi DOM del server, il focus o lo stato dei form quando subentra il client.
- Non fornisce al componente un servizio Tuvix per le props né un bus. Dichiara input per le props e usa [`@tuvix.js/event-bus`](/it/packages/event-bus) per comunicare con le altre app.

## Migrazione dalla 0.4

**`createAngularMicroApp` accetta un componente.** `platform` e `compilerOptions` sono stati rimossi. Passa il componente radice come `component` e, se è dichiarato in un NgModule, il modulo come `module`.

```ts no-check
// 0.4
createAngularMicroApp({
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

export default createAngularMicroApp({ name: 'admin', component: AppComponent, module: AppModule });
```

**Le props sono input.** `update()` non scrive più `window.__TUVIX_ANGULAR_PROPS__`. Elimina i servizi che leggono quella variabile globale e dichiara invece campi `@Input()` con i nomi delle props.

**Zoneless di default.** Le app girano senza zone.js a meno che tu non passi `zone: true`. Su Angular dalla 15 alla 17, gli eventi DOM non avviano più la change detection; chiama `ChangeDetectorRef.detectChanges()` negli handler oppure attiva zone.js. Puoi togliere `provideZonelessChangeDetection()` dalla tua entry. Togli `import '@angular/compiler'` solo quando i file dei tuoi componenti non importano nulla da Angular a parte `@angular/core`; altrimenti tienilo come prima riga dell'entry client, oppure fai la build AOT.

**Nessun `provideClientHydration()` automatico.** `createSsrAngularMicroApp` riesegue il rendering sopra il markup del server. Non inserire `provideClientHydration()` nei suoi `providers`.

**`appId` ha effetto.** Nella 0.4, `renderAngularToString` accettava `appId` e lo ignorava. Ora imposta l'`APP_ID` di Angular, quindi l'attributo `ng-app-id` dei tag di stile passa da `ng` al tuo valore.

**Elemento host.** Sul client e sul server, il tag dell'host deriva dal selettore del componente invece che da un `'app-root'` fisso, e l'adapter client lo crea dentro il container. `unmount` su un container che il modulo non ha mai montato non lo svuota più.

Vedi la [guida ad Angular](/it/guide/angular) per un'app completa.
