# @tuvix.js/angular

> Bindings de Angular 15+ para el framework de micro frontends Tuvix.js

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Instalación

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Añade `@angular/compiler` para componentes JIT, y `@angular/platform-server` junto con `@angular/compiler` en el servidor para `renderAngularToString` (Angular 16+).

## Inicio rápido

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

El adaptador registra el módulo con `registerModule` de `@tuvix.js/loader`. Las props del orquestador se convierten en inputs del componente:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'greeting', entry: () => import('./greeting-app'), container: '#greeting', props: { name: 'Ada' } });
await orchestrator.start();
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

## API

### `createAngularMicroApp(config)`

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre de la app, registrado con `registerModule` |
| `component` | `Type<C>` | obligatorio | Componente raíz |
| `module` | `Type<unknown>` | ninguno | NgModule que declara `component`; sus providers se añaden con `importProvidersFrom` |
| `providers` | `AngularProviders` | `[]` | Providers de entorno, como `provideHttpClient()` |
| `selector` | `string` | parte de elemento del selector del componente; si no, `'div'` | Nombre de etiqueta del elemento host |
| `zone` | `boolean` | `false` | Usa zone.js; tu entrada debe importar `zone.js` primero |
| `ssr` | `boolean` | `false` | Adopta el markup de `renderAngularToString` |
| `bootstrap` | `() => void \| Promise<void>` | ninguno | Configuración que se ejecuta una sola vez |

- Cada montaje llama a `createApplication` e inicializa el componente en su propio elemento host dentro del contenedor, así que dos apps de Angular (o dos copias de la misma) nunca chocan en un único `app-root`.
- Las props se asignan con `ComponentRef.setInput` antes de la primera detección de cambios, así que `ngOnInit` las ve. Las claves que no son inputs se omiten.
- `update({ props, container? })` asigna los inputs nuevos y ejecuta `appRef.tick()` en un contenedor o en todos los montajes. Los inputs que faltan en las props nuevas se restablecen a `undefined`.
- Para los componentes JIT (sin `ɵcmp`), `@angular/compiler` se carga antes que `@angular/platform-browser`. Solo sirve cuando el adaptador es el primer código que carga un paquete de Angular distinto de `@angular/core`. Si los archivos de tus componentes importan `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` u otra librería de Angular, esos paquetes se evalúan antes de que se ejecute el adaptador y fallan con "JIT compilation failed". Mantén `import '@angular/compiler'` como primera línea de tu entrada del cliente, o compila con AOT.
- `unmount` destruye la aplicación, vacía el contenedor y despacha `tuvix:unmounted`. Si se llama mientras `mount` todavía está cargando, cancela el montaje.

### `createSsrAngularMicroApp(config)`

Equivale a `createAngularMicroApp({ ...config, ssr: true })`. Cuando el contenedor tiene markup del servidor, Angular renderiza en el elemento host del servidor y el adaptador elimina las etiquetas `<style>` que el servidor insertó en línea. `tuvix:mounted` informa `hydrated: true`.

Esto vuelve a renderizar sobre el DOM del servidor. La hidratación no destructiva de Angular (`provideClientHydration`) necesita un comentario marcador de hidratación directamente bajo `<body>`, que una isla dentro de otra página no puede aportar, así que el adaptador no la añade.

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString(component, options?)` de `@tuvix.js/angular/server`

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `providers` | `AngularProviders` | `[]` | Providers para el render en el servidor |
| `appId` | `string` | `'ng'` | `APP_ID` de Angular |
| `document` | `string` | documento vacío con el elemento host | Documento en el que se renderiza |
| `selector` | `string` | parte de elemento del selector del componente; si no, `'app-root'` | Etiqueta host del documento por defecto |
| `props` | `Record<string, unknown>` | `{}` | Valores para los inputs del componente, asignados antes de la primera detección de cambios |

Devuelve las etiquetas `<style>` del componente seguidas del markup del body. Se ejecuta sin zone, nunca parchea `Promise` y no espera a las peticiones HTTP que inicie el componente. Llámalo desde una función del servidor; en un navegador devuelve `''`.

`props` funciona igual que las props del cliente: las claves son nombres de inputs (o alias), las claves que no son inputs se omiten y `ngOnInit` ve los valores. Pasa el mismo objeto al render del servidor y a `mount` para que ambos lados rendericen el mismo markup.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

const props = { name: 'Ada' };
const aboutHtml = await renderAngularToString(AboutComponent, { appId: 'about', props });
// Client: aboutApp.mount({ container, props })
```

### Tipos

`AngularMicroAppConfig<C>`, `AngularSsrMicroAppConfig<C>`, `AngularSsrOptions`, `AngularProviders` (todos de `@tuvix.js/angular`).

## Detección de cambios

El adaptador nunca importa zone.js. Sin `zone: true`, añade `provideZonelessChangeDetection()` en Angular 20+, `provideExperimentalZonelessChangeDetection()` en 18-19, y reemplaza `NgZone` por `ɵNoopNgZone` en 15-17.

- Angular 18+: los event listeners, las signals, `markForCheck()` y `AsyncPipe` programan la detección de cambios. Un campo normal modificado en un temporizador o en un callback de `fetch` no lo hace; usa una signal o `markForCheck()`.
- Angular 15-17: los eventos del DOM no disparan la detección de cambios. Llama a `ChangeDetectorRef.detectChanges()` después de cambiar el estado, o pasa `zone: true`.

## Casos límite

- `zone: true` sin zone.js cargado rechaza el montaje y despacha `tuvix:error`.
- `unmount` sobre un contenedor que este módulo nunca montó no hace nada.
- En Angular 16, `@angular/platform-server` copia las clases del DOM de Domino (`Event`, `Node`, ...) en el objeto global de Node durante un render en el servidor. Esto lo hace Angular, no el adaptador.
- Los componentes con selector de atributo necesitan en el servidor un `document` con un elemento host que coincida.

## Lo que no hace

- No carga zone.js, no añade `provideClientHydration()` ni conserva los nodos del DOM del servidor ni el estado de los formularios.
- No escribe `window.__TUVIX_ANGULAR_PROPS__`; declara inputs.

Documentación completa: [tuvix.js.org/packages/angular](https://tuvix.js.org/packages/angular)

## Licencia

MIT
