# @tuvix.js/angular

> Binding Angular 15+ per il framework per microfrontend Tuvix.js

Parte del framework per microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Installazione

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Aggiungi `@angular/compiler` per i componenti JIT, e `@angular/platform-server` più `@angular/compiler` sul server per `renderAngularToString` (Angular 16+).

## Avvio rapido

```ts
import { Component, Input } from '@angular/core';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

L'adapter registra il modulo con `registerModule` di `@tuvix.js/loader`. Le props dell'orchestratore diventano input del componente:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'greeting', entry: () => import('./greeting-app'), container: '#greeting', props: { name: 'Ada' } });
await orchestrator.start();
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

## API

### `createAngularMicroApp(config)`

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `name` | `string` | obbligatorio | Nome dell'app, registrato con `registerModule` |
| `component` | `Type<C>` | obbligatorio | Componente radice |
| `module` | `Type<unknown>` | nessuno | NgModule che dichiara `component`; i suoi provider vengono aggiunti con `importProvidersFrom` |
| `providers` | `AngularProviders` | `[]` | Provider di ambiente, come `provideHttpClient()` |
| `selector` | `string` | parte elemento del selettore del componente, altrimenti `'div'` | Nome del tag dell'elemento host |
| `zone` | `boolean` | `false` | Usa zone.js; la tua entry deve importare `zone.js` per primo |
| `ssr` | `boolean` | `false` | Adotta il markup di `renderAngularToString` |
| `bootstrap` | `() => void \| Promise<void>` | nessuno | Setup eseguito una sola volta |

- Ogni mount chiama `createApplication` ed esegue il bootstrap del componente nel proprio elemento host dentro il container, così due app Angular (o due copie della stessa) non entrano mai in conflitto su un unico `app-root`.
- Le props vengono impostate con `ComponentRef.setInput` prima della prima change detection, quindi `ngOnInit` le vede. Le chiavi che non sono input vengono ignorate.
- `update({ props, container? })` imposta i nuovi input ed esegue `appRef.tick()` per un container o per tutti i mount. Gli input assenti dalle nuove props tornano a `undefined`.
- Per i componenti JIT (senza `ɵcmp`) `@angular/compiler` viene caricato prima di `@angular/platform-browser`. Serve solo quando l'adapter è il primo codice a caricare un pacchetto Angular diverso da `@angular/core`. Se i file dei tuoi componenti importano `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` o un'altra libreria Angular, quei pacchetti vengono valutati prima che l'adapter parta e falliscono con "JIT compilation failed". Tieni `import '@angular/compiler'` come prima riga della tua entry client, oppure fai la build AOT.
- `unmount` distrugge l'applicazione, svuota il container ed emette `tuvix:unmounted`. Se viene chiamato mentre `mount` sta ancora caricando, annulla il mount.

### `createSsrAngularMicroApp(config)`

Equivale a `createAngularMicroApp({ ...config, ssr: true })`. Quando il container contiene markup del server, Angular renderizza nell'elemento host del server e l'adapter rimuove i tag `<style>` inline del server. `tuvix:mounted` riporta `hydrated: true`.

Questo renderizza di nuovo sopra il DOM del server. La hydration non distruttiva di Angular (`provideClientHydration`) richiede un commento marcatore di hydration direttamente sotto `<body>`, che un'island dentro un'altra pagina non può fornire, quindi l'adapter non lo aggiunge.

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString(component, options?)` da `@tuvix.js/angular/server`

| Opzione | Tipo | Default | Significato |
| --- | --- | --- | --- |
| `providers` | `AngularProviders` | `[]` | Provider per il render sul server |
| `appId` | `string` | `'ng'` | `APP_ID` di Angular |
| `document` | `string` | documento vuoto con l'elemento host | Documento in cui renderizzare |
| `selector` | `string` | parte elemento del selettore del componente, altrimenti `'app-root'` | Tag host per il documento di default |
| `props` | `Record<string, unknown>` | `{}` | Valori per gli input del componente, impostati prima della prima change detection |

Restituisce i tag `<style>` del componente seguiti dal markup del body. Gira senza zone, non modifica mai `Promise` e non attende le richieste HTTP avviate dal componente. Chiamala da una funzione server; in un browser restituisce `''`.

`props` funziona come le props del client: le chiavi sono nomi di input (o alias), le chiavi che non sono input vengono ignorate e `ngOnInit` vede i valori. Passa lo stesso oggetto al render sul server e a `mount`, così entrambi i lati producono lo stesso markup.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

const props = { name: 'Ada' };
const aboutHtml = await renderAngularToString(AboutComponent, { appId: 'about', props });
// Client: aboutApp.mount({ container, props })
```

### Tipi

`AngularMicroAppConfig<C>`, `AngularSsrMicroAppConfig<C>`, `AngularSsrOptions`, `AngularProviders` (tutti da `@tuvix.js/angular`).

## Change detection

L'adapter non importa mai zone.js. Senza `zone: true` aggiunge `provideZonelessChangeDetection()` su Angular 20+, `provideExperimentalZonelessChangeDetection()` su 18-19, e sostituisce `NgZone` con `ɵNoopNgZone` su 15-17.

- Angular 18+: event listener, signal, `markForCheck()` e `AsyncPipe` pianificano la change detection. Un campo semplice modificato in un timer o in una callback di `fetch` no; usa un signal o `markForCheck()`.
- Angular 15-17: gli eventi DOM non avviano la change detection. Chiama `ChangeDetectorRef.detectChanges()` dopo aver modificato lo stato, o passa `zone: true`.

## Casi limite

- `zone: true` senza zone.js caricato rifiuta il mount ed emette `tuvix:error`.
- `unmount` su un container che questo modulo non ha mai montato non fa nulla.
- Su Angular 16, `@angular/platform-server` copia le classi DOM di Domino (`Event`, `Node`, ...) sull'oggetto globale di Node durante un render sul server. Lo fa Angular, non l'adapter.
- I componenti con selettore di attributo richiedono sul server un `document` con un elemento host corrispondente.

## Cosa non fa

- Non carica zone.js, non aggiunge `provideClientHydration()` e non conserva i nodi DOM del server né lo stato dei form.
- Non scrive `window.__TUVIX_ANGULAR_PROPS__`; dichiara gli input.

Documentazione completa: [tuvix.js.org/it/packages/angular](https://tuvix.js.org/it/packages/angular)

## Licenza

MIT
