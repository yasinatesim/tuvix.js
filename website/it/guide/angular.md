# Con Angular

`@tuvix.js/angular` esegue il bootstrap di un componente Angular come micro app, senza zone.js per impostazione predefinita. Renderizza anche componenti standalone in HTML sul server.

Supporta Angular 15 e successivi. `renderAngularToString` richiede Angular 16 o successivo con `@angular/platform-server`.

## Installazione

```bash
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
# JIT components (no AOT build step) also need the compiler
pnpm add @angular/compiler
# for renderAngularToString
pnpm add @angular/platform-server
```

## Trasformare un componente in una micro app

```ts
// src/main.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin.component';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  providers: [provideHttpClient()],
});
```

| Opzione | Tipo | Descrizione |
| --- | --- | --- |
| `name` | `string` | Obbligatoria. Deve corrispondere al nome dell'app registrata. |
| `component` | `Type<C>` | Obbligatoria. Componente radice, standalone o dichiarato in `module`. |
| `module` | `Type<unknown>` | NgModule che dichiara `component`. I suoi provider vengono importati con `importProvidersFrom`. |
| `providers` | `Array<Provider \| EnvironmentProviders>` | Provider di ambiente. |
| `selector` | `string` | Tag dell'elemento host. Predefinito: la parte elemento del selettore del componente, oppure `div`. |
| `zone` | `boolean` | Usa il change detection di zone.js. Predefinito `false`. |
| `ssr` | `boolean` | Adotta il markup di `renderAngularToString`. `createSsrAngularMicroApp` la imposta. |
| `bootstrap` | `() => void \| Promise<void>` | Viene eseguita una volta prima del primo mount. |

Ogni mount chiama `createApplication` ed esegue il bootstrap del componente nel proprio elemento host dentro il container. Due app Angular sulla stessa pagina, o un modulo in due container, non entrano in conflitto su un `app-root` condiviso.

Quando il componente non ha un `ɵcmp` compilato (JIT), l'adapter carica `@angular/compiler` prima di `@angular/platform-browser`. Serve solo quando l'adapter è il primo codice a caricare un pacchetto Angular diverso da `@angular/core`. Se i file dei tuoi componenti importano `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` o un'altra libreria Angular, quei pacchetti vengono valutati prima che l'adapter entri in azione e falliscono con "JIT compilation failed". Tieni `import '@angular/compiler'` come prima riga della tua entry client, oppure fai la build AOT.

## Input dalle props

Dichiara le props come input del componente:

```ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `<h1>Admin for {{ userId }}</h1>`,
})
export class AdminComponent {
  @Input() userId = '';
}
```

- Il mount imposta gli input con `ComponentRef.setInput` prima del primo change detection, quindi `ngOnInit` li vede.
- `update({ props })` imposta i nuovi valori ed esegue il change detection. Con `container`, aggiorna solo quel mount.
- Le chiavi che non sono input vengono ignorate. Gli input assenti dalle nuove props tornano a `undefined`.

## Change detection senza zone.js

L'adapter non importa mai zone.js, quindi non modifica `Promise`, i timer o gli eventi DOM nella pagina o sul server. Sceglie il provider in base alla versione di Angular:

| Angular | Provider | Gli eventi DOM attivano il change detection |
| --- | --- | --- |
| 20+ | `provideZonelessChangeDetection()` | sì |
| 18-19 | `provideExperimentalZonelessChangeDetection()` | sì |
| 15-17 | `NgZone` sostituita da una zone no-op | no |

Su Angular 15-17 nulla esegue il change detection dopo un clic. Chiama `detectChanges()` nei tuoi handler:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="add()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  add(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

Per mantenere il change detection basato su zone, importa `zone.js` all'inizio della tua entry client e passa `zone: true`. Se zone.js non è caricato, `mount` rifiuta.

## Rendering lato server

```ts
// server-only module
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<string> {
  return renderAngularToString(AboutComponent, { appId: 'about', props: { userId: '42' } });
}
```

```ts
// client
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export const about = createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

- `renderAngularToString(component, { props?, providers?, appId?, document?, selector? })` restituisce i tag `<style>` del componente seguiti dall'elemento host, quindi l'island ha già gli stili al primo paint. Viene eseguita senza zone.
- `props` imposta gli input del componente prima del primo change detection, come fa `mount` sul client. Le chiavi che non sono input vengono ignorate. Passa le stesse props all'island sul client, altrimenti la hydration mostra un contenuto diverso.
- Non attende le richieste HTTP o i timer avviati dal componente. Carica prima i dati e forniscili.
- Chiamala da codice server. Nel browser restituisce `''`.

Sul client, `createSsrAngularMicroApp` renderizza nell'elemento host del server, poi rimuove i tag `<style>` inline del server dopo che Angular ha aggiunto i propri. L'evento `tuvix:mounted` riporta `hydrated: true`. Questo sostituisce il DOM del server. La hydration non distruttiva di Angular richiede un marcatore direttamente sotto `<body>`, che un'island dentro un'altra pagina non può fornire, quindi l'adapter non aggiunge `provideClientHydration()`.

## Event bus

```ts
import { Component, OnDestroy, signal } from '@angular/core';
import { getGlobalBus } from '@tuvix.js/event-bus';

@Component({
  selector: 'app-cart-badge',
  standalone: true,
  template: `<span>{{ count() }}</span>`,
})
export class CartBadgeComponent implements OnDestroy {
  readonly count = signal(0);
  private readonly off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) =>
    this.count.set(itemCount),
  );

  ngOnDestroy(): void {
    this.off();
  }
}
```

I signal pianificano il change detection su Angular 18+ senza zone. Su 15-17, chiama `ChangeDetectorRef.detectChanges()` dopo `set`.

## Cosa non fa l'adapter

- Non carica zone.js né `@angular/localize`. Importali nella tua entry quando ti servono.
- Non esegue una hydration non distruttiva; vedi sopra.
- Non condivide lo stato tra i mount. Ogni mount è un'applicazione Angular a sé con il proprio injector radice, quindi un servizio `providedIn: 'root'` esiste una volta per ogni mount.

## API

| Export | Scopo |
| --- | --- |
| `createAngularMicroApp({ name, component, module?, providers?, selector?, zone?, ssr?, bootstrap? })` | Modulo di micro app Angular |
| `createSsrAngularMicroApp(config)` | Lo stesso con `ssr: true` |
| `renderAngularToString(component, options?)` da `@tuvix.js/angular/server` | Stili + HTML dell'elemento host |
