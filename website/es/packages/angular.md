---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Bindings de Angular"
  description="Convierte un componente de Angular 15+ en una micro app de Tuvix.js: zoneless por defecto, una aplicación por contenedor, props como inputs del componente y renderizado en el servidor con estilos."
  icon="🔺"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Añade `@angular/compiler` cuando tus componentes no estén compilados con AOT (JIT), y `@angular/platform-server` más `@angular/compiler` en el servidor cuando llames a `renderAngularToString`. El adaptador de cliente necesita Angular 15 o posterior; el renderer de servidor necesita Angular 16 o posterior.

## Cuándo usarlo

Usa este paquete cuando un componente de Angular deba ejecutarse como una micro app entre otras: el orquestador lo monta en un contenedor en una ruta, le pasa props, las actualiza y lo desmonta al salir. Varias apps de Angular, o varias copias de una, pueden compartir página porque cada montaje recibe su propia aplicación de Angular y su propio elemento host. El adaptador nunca carga zone.js, así que una isla de Angular no parchea `Promise` ni `addEventListener` para las apps de React o Vue que tiene al lado.

Si Angular controla toda la página, inicialízalo como siempre con `bootstrapApplication`. Ahí el adaptador no te aporta nada.

## Inicio rápido

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

La entrada de la micro app lo envuelve:

```ts
// greeting-app.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { GreetingComponent } from './greeting.component';

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

La shell registra la app e inicia el orquestador:

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

El adaptador crea un elemento host `<app-greeting>` dentro de `#greeting` y, tras la actualización, muestra "Hello Grace".

## API

### `createAngularMicroApp`

```ts no-check
function createAngularMicroApp<C>(config: AngularMicroAppConfig<C>): MicroAppModule;
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre de la app. El adaptador registra el módulo con ese nombre mediante `registerModule` de `@tuvix.js/loader`. |
| `component` | `Type<C>` | obligatorio | Componente raíz. Los componentes standalone funcionan por sí solos. |
| `module` | `Type<unknown>` | ninguno | NgModule que declara `component`. El adaptador añade sus providers con `importProvidersFrom`. |
| `providers` | `AngularProviders` | `[]` | Providers de entorno para la aplicación, como `provideHttpClient()`. |
| `selector` | `string` | parte de elemento del selector del componente, si no `'div'` | Nombre de etiqueta del elemento host que el adaptador crea dentro del contenedor. |
| `zone` | `boolean` | `false` | Usa la detección de cambios de zone.js. Tu entrada de cliente debe importar `zone.js` primero. |
| `ssr` | `boolean` | `false` | Adopta el markup de `renderAngularToString`. Consulta `createSsrAngularMicroApp`. |
| `bootstrap` | `() => void \| Promise<void>` | ninguno | Configuración inicial que se ejecuta una sola vez. El `bootstrap()` del módulo la espera. |

Cada `mount({ container, props })`:

1. Carga primero `@angular/compiler` cuando `component` o `module` no tiene definición AOT (`ɵcmp` / `ɵmod`), y después `@angular/core` y `@angular/platform-browser`. Solo ayuda cuando el adaptador es el primer código que carga un paquete de Angular distinto de `@angular/core`. Si los archivos de tus componentes importan `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` u otra librería de Angular, esos paquetes se evalúan antes de que se ejecute el adaptador y fallan con "JIT compilation failed". Mantén `import '@angular/compiler'` como primera línea de tu entrada de cliente, o compila con AOT.
2. Llama a `createApplication({ providers })` con los providers de detección de cambios para tu versión de Angular (consulta [Detección de cambios](#change-detection)), los providers del módulo y `providers`.
3. Crea el elemento host (`<app-greeting>` para el selector `'app-greeting'`, `<div>` para un selector de atributo como `'[card]'`), lo coloca en el contenedor e inicializa el componente dentro de él.
4. Asigna las props como inputs del componente con `ComponentRef.setInput` antes de la primera detección de cambios, así que `ngOnInit` ya las ve. En versiones de Angular sin `ComponentFactoryResolver`, los inputs se asignan justo después de la inicialización, seguidos de un tick.
5. Despacha `tuvix:mounted` en el contenedor. Un fallo despacha `tuvix:error` y rechaza con el error original.

`update({ props, container? })` escribe los valores nuevos con `setInput` y ejecuta `appRef.tick()`, para un contenedor o para todos los montajes si omites `container`. Esto renderiza en todas las versiones de Angular, con o sin zone.js.

`unmount({ container })` destruye la aplicación, vacía el contenedor y despacha `tuvix:unmounted`.

Un componente declarado en un NgModule:

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

Las mismas opciones que `createAngularMicroApp` sin `ssr`; se comporta como `createAngularMicroApp({ ...config, ssr: true })`. Úsalo en el cliente para islas que el servidor renderizó con `renderAngularToString`.

Cuando el contenedor tiene markup del servidor, el adaptador reutiliza el elemento host si es hijo directo del contenedor y tiene la etiqueta esperada. Angular renderiza en ese elemento y reemplaza los hijos del servidor. Cuando Angular ha añadido los estilos del componente a `<head>`, el adaptador elimina las etiquetas `<style>` en línea del servidor y cualquier otra cosa junto al host. `tuvix:mounted` informa `hydrated: true`. Un contenedor vacío recibe un render normal de cliente.

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

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `props` | `Record<string, unknown>` | `{}` | Valores de input indexados por nombre de input (o alias). Se asignan antes de la primera detección de cambios, igual que en el montaje del cliente. Las claves que no son inputs se omiten. |
| `providers` | `AngularProviders` | `[]` | Providers de entorno para el render en el servidor. |
| `appId` | `string` | `'ng'` (el valor por defecto de Angular) | `APP_ID` de Angular. Angular lo escribe en el atributo `ng-app-id` de las etiquetas de estilo. |
| `document` | `string` | un documento vacío con el elemento host en `<body>` | Documento HTML en el que renderizar. Debe contener el elemento host. |
| `selector` | `string` | parte de elemento del selector del componente, si no `'app-root'` | Etiqueta del elemento host para el documento por defecto; Angular inicializa en el elemento que coincide. |

Renderiza un componente standalone con `renderApplication` de `@angular/platform-server` y devuelve un fragmento: las etiquetas `<style>` del componente tomadas del `<head>` renderizado, seguidas del HTML interno de `<body>`. Pon el fragmento en el contenedor en el que monta `createSsrAngularMicroApp`; la isla tiene sus estilos en el primer pintado.

Las `props` llegan al componente mediante `setInput` antes de la primera detección de cambios, igual que las asigna el `mount` del cliente, así que `ngOnInit` las ve en ambos lados. Pasa el mismo objeto al render en el servidor y al montaje en el cliente, y ambos producirán el mismo markup.

El render se ejecuta sin zone.js y nunca parchea el `Promise` global. Siempre carga `@angular/compiler` primero, porque Node carga los paquetes de Angular desde `node_modules` sin el linker de Angular. Llámalo desde una función de servidor, no desde código que también se ejecute en el navegador: en un navegador devuelve `''`.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAboutIsland(): Promise<string> {
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props: { title: 'About us' } });
  return `<section id="about" data-tuvix-app="about">${html}</section>`;
}
```

### Tipos

| Tipo | Significado |
| --- | --- |
| `AngularMicroAppConfig<C>` | Opciones de `createAngularMicroApp`. |
| `AngularSsrMicroAppConfig<C>` | `AngularMicroAppConfig<C>` sin `ssr`; opciones de `createSsrAngularMicroApp`. |
| `AngularSsrOptions` | Opciones de `renderAngularToString`. Importa el tipo desde `@tuvix.js/angular`. |
| `AngularProviders` | `Array<Provider \| EnvironmentProviders>`, lo que aceptan `createApplication` y `bootstrapApplication`. |

## Detección de cambios {#change-detection}

El adaptador nunca importa zone.js. Salvo que pases `zone: true`, elige la configuración zoneless que admite tu versión de Angular:

| Angular | Provider que añade el adaptador | Qué dispara la detección de cambios |
| --- | --- | --- |
| 20 y posteriores | `provideZonelessChangeDetection()` | Listeners de eventos de la plantilla, escrituras en signals, `markForCheck()`, `AsyncPipe`, `setInput` |
| 18 y 19 | `provideExperimentalZonelessChangeDetection()` | Igual que en 20 |
| 15 a 17 | `NgZone` reemplazado por `ɵNoopNgZone` | Nada por sí solo. `update()` desde el host sigue renderizando. |

En Angular 18 y posteriores, un campo normal que cambias en un callback de `setTimeout` o `fetch` no vuelve a renderizar la plantilla. Guarda ese estado en un signal o llama a `ChangeDetectorRef.markForCheck()`:

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

En Angular 15 a 17, los clics y otros eventos del DOM tampoco disparan la detección de cambios. Llama a `ChangeDetectorRef.detectChanges()` después de cambiar el estado:

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

Para mantener la detección de cambios basada en zone.js, importa zone.js en tu entrada de cliente antes de que el adaptador monte y pasa `zone: true`. El adaptador deja entonces el `NgZone` por defecto de Angular y se inicializa dentro de él:

```ts
import 'zone.js';
import { createAngularMicroApp } from '@tuvix.js/angular';
import { DashboardComponent } from './dashboard.component';

export default createAngularMicroApp({ name: 'dashboard', component: DashboardComponent, zone: true });
```

zone.js parchea `Promise`, los temporizadores y los listeners del DOM de toda la página, incluidas las apps de los demás frameworks.

## Renderizado en el servidor

1. En el servidor, llama a `renderAngularToString(Component)` y pon el fragmento en el elemento contenedor.
2. En el cliente, exporta `createSsrAngularMicroApp({ name, component })` desde la entrada de la isla.
3. El orquestador monta la app en ese contenedor. Angular renderiza en el elemento host del servidor y el adaptador descarta los estilos del servidor.

El adaptador vuelve a renderizar sobre el DOM del servidor. No usa la hidratación no destructiva de Angular (`provideClientHydration`), porque esa hidratación espera una página que Angular renderizó de principio a fin: busca el comentario marcador de hidratación de Angular como hijo directo de `<body>` y anotaciones `ngh` en los componentes. Una isla dentro de una página renderizada por React, Vue o una plantilla de servidor simple no tiene ninguna de las dos cosas. La contrapartida: el markup visible y los estilos llegan con el HTML, pero el estado dentro de la isla (foco, un valor escrito, la posición de scroll) se reinicia cuando Angular toma el control, y los clics anteriores a ese momento no hacen nada.

Pasa las mismas props al render en el servidor y al montaje en el cliente, para que el render del cliente coincida con el markup del servidor. El render no espera las peticiones HTTP ni los temporizadores que inicia el componente: carga los datos primero y pásalos como props.

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

Envía `props` al navegador con la página (por ejemplo, como JSON en una etiqueta `<script type="application/json">`) y registra la app con ellas:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const props = JSON.parse(document.getElementById('about-props')?.textContent ?? '{}') as Record<string, unknown>;
const orchestrator = createOrchestrator();

orchestrator.register({ name: 'about', entry: () => import('./about-app'), container: '#about', props });
await orchestrator.start();
```

Para valores que no son inputs, como la URL base de una API, pasa `providers` en ambos lados.

## Casos límite

- `zone: true` sin zone.js en la página rechaza el montaje con `[tuvix.js/angular] "<name>" sets zone: true, but zone.js is not loaded. Import 'zone.js' in your client entry before mounting, or drop zone: true.` y despacha `tuvix:error`.
- Las props cuyas claves no son inputs del componente se omiten, así que Angular no registra NG0303. Los inputs se emparejan por su nombre público (el alias, si definiste uno).
- Un input presente en las props anteriores y ausente en las nuevas se asigna a `undefined`. El inicializador del campo (`name = ''`) no se vuelve a ejecutar.
- `update` antes de que termine el montaje guarda las props; la inicialización pendiente usa las más recientes. `update({ container })` para un contenedor que este módulo no ha montado no hace nada.
- `unmount` mientras `mount` todavía está cargando Angular lo cancela: la aplicación se destruye, el contenedor queda vacío y no se dispara `tuvix:mounted`. Si la cancelación llega después de la inicialización, recibes `tuvix:mounted` seguido de `tuvix:unmounted`.
- Un segundo `mount` en el mismo contenedor destruye la primera aplicación antes de inicializar la nueva.
- `unmount` en un contenedor que este módulo nunca montó no hace nada.
- Si destruir la aplicación lanza un error, el adaptador vacía el contenedor, despacha `tuvix:error` y vuelve a lanzar el error.
- Con SSR, un contenedor cuyo markup no tiene ningún hijo directo que coincida con la etiqueta host recibe un elemento host nuevo. `hydrated` sigue siendo `true`, porque el contenedor tenía markup.
- En el servidor, un componente con selector de atributo (`'[card]'`) recurre a un host `<app-root>`, que el selector no encaja. Pasa un `document` cuyo `<body>` contenga un elemento que coincida.
- En Angular 16, `@angular/platform-server` copia las clases DOM de Domino (`Event`, `Node` y otras) en el objeto global de Node durante un render en el servidor. Lo hace Angular, no el adaptador.
- Los componentes JIT sin el plugin del compilador de Angular siguen necesitando `experimentalDecorators` de TypeScript; Angular no es compatible con la propuesta estándar de decoradores.

## Lo que no hace

- No carga zone.js ni ningún otro polyfill.
- No añade `provideClientHydration()` y no realiza hidratación no destructiva.
- No envía las props del servidor al navegador. Serialízalas tú en la página y pasa el mismo objeto al montaje del cliente.
- No espera las llamadas HTTP, los temporizadores ni las `PendingTasks` que inicia el componente durante un render en el servidor.
- No conserva los nodos del DOM del servidor, el foco ni el estado de los formularios cuando el cliente toma el control.
- No da al componente un servicio de props ni un bus de Tuvix. Declara inputs para las props y usa [`@tuvix.js/event-bus`](/es/packages/event-bus) para comunicarte con otras apps.

## Migrar desde 0.4

**`createAngularMicroApp` recibe un componente.** `platform` y `compilerOptions` ya no existen. Pasa el componente raíz como `component` y, si está declarado en un NgModule, el módulo como `module`.

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

**Las props son inputs.** `update()` ya no escribe `window.__TUVIX_ANGULAR_PROPS__`. Elimina los servicios que leían esa variable global y declara en su lugar campos `@Input()` con los nombres de las props.

**Zoneless por defecto.** Las apps se ejecutan sin zone.js salvo que pases `zone: true`. En Angular 15 a 17, los eventos del DOM ya no disparan la detección de cambios; llama a `ChangeDetectorRef.detectChanges()` en los handlers o activa zone.js. Puedes quitar `provideZonelessChangeDetection()` de tu entrada. Quita `import '@angular/compiler'` solo cuando los archivos de tus componentes no importen nada de Angular salvo `@angular/core`; si no, mantenlo como primera línea de la entrada de cliente, o compila con AOT.

**Sin `provideClientHydration()` automático.** `createSsrAngularMicroApp` vuelve a renderizar sobre el markup del servidor. No incluyas `provideClientHydration()` en sus `providers`.

**`appId` tiene efecto.** En 0.4, `renderAngularToString` aceptaba `appId` y lo ignoraba. Ahora asigna el `APP_ID` de Angular, así que el atributo `ng-app-id` de las etiquetas de estilo cambia de `ng` a tu valor.

**Elemento host.** En el cliente y en el servidor, la etiqueta host sale del selector del componente en lugar de un `'app-root'` fijo, y el adaptador de cliente la crea dentro del contenedor. `unmount` en un contenedor que el módulo nunca montó ya no lo vacía.

Consulta la [guía de Angular](/es/guide/angular) para ver una app completa.
