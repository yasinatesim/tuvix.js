# Con Angular

`@tuvix.js/angular` inicializa un componente Angular como micro app, sin zone.js por defecto. También renderiza componentes standalone a HTML en el servidor.

Es compatible con Angular 15 y versiones posteriores. `renderAngularToString` necesita Angular 16 o posterior con `@angular/platform-server`.

## Instalación

```bash
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
# JIT components (no AOT build step) also need the compiler
pnpm add @angular/compiler
# for renderAngularToString
pnpm add @angular/platform-server
```

## Convertir un componente en una micro app

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

| Opción | Tipo | Descripción |
| --- | --- | --- |
| `name` | `string` | Obligatorio. Debe coincidir con el nombre de la app registrada. |
| `component` | `Type<C>` | Obligatorio. Componente raíz, standalone o declarado en `module`. |
| `module` | `Type<unknown>` | NgModule que declara `component`. Sus providers se importan con `importProvidersFrom`. |
| `providers` | `Array<Provider \| EnvironmentProviders>` | Providers de entorno. |
| `selector` | `string` | Etiqueta del elemento host. Por defecto: la parte de elemento del selector del componente, o `div`. |
| `zone` | `boolean` | Usa la detección de cambios de zone.js. Por defecto `false`. |
| `ssr` | `boolean` | Adopta el markup de `renderAngularToString`. `createSsrAngularMicroApp` lo activa. |
| `bootstrap` | `() => void \| Promise<void>` | Se ejecuta una vez antes del primer montaje. |

Cada montaje llama a `createApplication` e inicializa el componente en su propio elemento host dentro del contenedor. Dos apps Angular en una misma página, o un módulo en dos contenedores, no colisionan en un `app-root` compartido.

Cuando el componente no tiene `ɵcmp` compilado (JIT), el adaptador carga `@angular/compiler` antes que `@angular/platform-browser`. Solo ayuda cuando el adaptador es el primer código que carga un paquete de Angular distinto de `@angular/core`. Si los archivos de tus componentes importan `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` u otra librería de Angular, esos paquetes se evalúan antes de que se ejecute el adaptador y fallan con "JIT compilation failed". Mantén `import '@angular/compiler'` como primera línea de tu entrada de cliente, o compila con AOT.

## Inputs a partir de props

Declara las props como inputs del componente:

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

- El montaje establece los inputs con `ComponentRef.setInput` antes de la primera detección de cambios, así que `ngOnInit` los ve.
- `update({ props })` establece los nuevos valores y ejecuta la detección de cambios. Con `container`, actualiza solo ese montaje.
- Las claves que no son inputs se omiten. Los inputs que faltan en las nuevas props se restablecen a `undefined`.

## Detección de cambios sin zone.js

El adaptador nunca importa zone.js, así que no parchea `Promise`, los temporizadores ni los eventos del DOM en la página ni en el servidor. Elige el provider según la versión de Angular:

| Angular | Provider | Los eventos del DOM disparan la detección de cambios |
| --- | --- | --- |
| 20+ | `provideZonelessChangeDetection()` | sí |
| 18-19 | `provideExperimentalZonelessChangeDetection()` | sí |
| 15-17 | `NgZone` reemplazado por una zona no-op | no |

En Angular 15-17, nada ejecuta la detección de cambios después de un clic. Llama a `detectChanges()` en tus handlers:

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

Para mantener la detección de cambios basada en zonas, importa `zone.js` al principio de tu entrada de cliente y pasa `zone: true`. Si zone.js no está cargado, `mount` se rechaza.

## Renderizado en el servidor

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

- `renderAngularToString(component, { props?, providers?, appId?, document?, selector? })` devuelve las etiquetas `<style>` del componente seguidas del elemento host, así que la isla tiene estilos en el primer pintado. Se ejecuta sin zone.js.
- `props` establece los inputs del componente antes de la primera detección de cambios, igual que `mount` en el cliente. Las claves que no son inputs se omiten. Pasa las mismas props a la isla en el cliente, o la hidratación mostrará un contenido distinto.
- No espera a las peticiones HTTP ni a los temporizadores que inicie el componente. Carga los datos primero y proporciónalos.
- Llámalo desde código de servidor. En el navegador devuelve `''`.

En el cliente, `createSsrAngularMicroApp` renderiza dentro del elemento host del servidor y luego elimina las etiquetas `<style>` incrustadas por el servidor cuando Angular ya ha añadido las suyas. El evento `tuvix:mounted` informa `hydrated: true`. Esto reemplaza el DOM del servidor. La hidratación no destructiva de Angular necesita un marcador directamente bajo `<body>`, algo que una isla dentro de otra página no puede proporcionar, así que el adaptador no añade `provideClientHydration()`.

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

Los signals programan la detección de cambios en Angular 18+ sin zone.js. En 15-17, llama a `ChangeDetectorRef.detectChanges()` después de `set`.

## Lo que no hace el adaptador

- No carga zone.js ni `@angular/localize`. Impórtalos en tu entrada cuando los necesites.
- No hidrata de forma no destructiva; consulta la sección anterior.
- No comparte estado entre montajes. Cada montaje es su propia aplicación Angular con su propio inyector raíz, así que un servicio `providedIn: 'root'` existe una vez por montaje.

## API

| Export | Propósito |
| --- | --- |
| `createAngularMicroApp({ name, component, module?, providers?, selector?, zone?, ssr?, bootstrap? })` | Módulo de micro app de Angular |
| `createSsrAngularMicroApp(config)` | Igual, con `ssr: true` |
| `renderAngularToString(component, options?)` de `@tuvix.js/angular/server` | Estilos + HTML del elemento host |
