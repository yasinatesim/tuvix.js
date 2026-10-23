# Migrar a 0.5

0.5 corrige errores que cambiaban el comportamiento observable, así que algunas de estas correcciones rompen código de 0.4. Esta página enumera cada cambio incompatible por paquete, con el código que hay que cambiar. Actualiza todos los paquetes `tuvix.js` y `@tuvix.js/*` a `^0.5.0` a la vez; no se admite mezclar adaptadores de 0.4 y 0.5 en una misma página.

```bash
pnpm up --latest "tuvix.js" "@tuvix.js/*"
```

Los proyectos creados con `create-tuvix-app` antes de 0.5 dependen de `^0.1.0`, que nunca se resuelve a 0.4 ni a 0.5. Edita esos rangos a mano.

## Core

### El orquestador usa el bus global

0.4 daba a cada orquestador un bus privado, separado de `getGlobalBus()`. En 0.5, el bus del orquestador es `getGlobalBus()` salvo que pases opciones en `eventBus`, y `destroy()` deja vivo el bus global.

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

Si exponías el bus del orquestador en `window` para que las apps lo encontraran, puedes quitarlo y usar el `bus` del contexto de montaje o `getGlobalBus()`.

### Los cambios de ruta no tocan las apps manuales

0.4 desmontaba en el siguiente cambio de ruta una app que no tenía ni `activeWhen` ni una ruta del router, y también las apps con `mountWhenVisible`. En 0.5, las reconciliaciones solo afectan a apps controladas por `activeWhen` o por una ruta. Si dependías de una navegación para eliminar una app montada manualmente, desmóntala tú mismo:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.unmountApp('cookie-banner');
```

### sandbox: true renderiza en un shadow root

En 0.4, `sandbox` en `register` no hacía nada. En 0.5, `sandbox: true` monta la app dentro de un shadow root y carga ahí los `styles` de su entrada. El CSS de la página deja de llegar a la app, y los estilos de la entrada de la app dejan de llegar a la página. Quita `sandbox: true` de las apps que dependen de los estilos de la página. Consulta [Sandboxing](/es/guide/sandbox).

### prefetch: 'hover'

0.4 precargaba todas las apps con el primer movimiento del ratón en cualquier parte de la página. 0.5 precarga una app cuando el puntero entra en un enlace del mismo origen cuya ruta la activa, o cuando el foco llega a él. Usa `'idle'` o `'immediate'` para descargar todas las apps de antemano.

### OrchestratorConfig.shared ya no existe

El orquestador nunca leía `shared`. Elimínalo y comparte dependencias con `@tuvix.js/module-federation` o con import maps.

### Patrones de activeWhen

Las cadenas de `activeWhen` ahora usan `matchPath`. Una query string o un hash ya no desmontan una app, los segmentos `:param` funcionan, y caracteres como `.` y `(` coinciden de forma literal.

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

### La ruta '/' y RouteConfig.exact

Las rutas coinciden con la ruta completa en todas partes. Una ruta `'/'` ahora solo se activa en `/`; en 0.4, `getActiveApps()` la trataba como cualquier ruta mientras que `match()` la trataba como exacta. `RouteConfig.exact` ya no existe, porque nunca cambiaba nada.

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

`activeWhen: '/'` en `register` sigue coincidiendo con cualquier ruta, porque las cadenas de `activeWhen` usan coincidencia por prefijo.

### push y replace añaden la base

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

Pasar `/app/settings` en 0.5 escribe `/app/app/settings`. Un guard que cancela una navegación hacia atrás o hacia delante también restaura la URL con la base.

### Otros cambios del router

- `base` solo se elimina en un límite de segmento. Con `base: '/app'`, `/application` se queda como `/application`.
- `pathToRegex()` devuelve un `RegExp` en caché; no lo modifiques. Su segundo argumento, `exact`, ya no existe.
- Los caracteres de regex en los patrones coinciden de forma literal. Un `*` en mitad de un patrón coincide con un segmento.
- `matchRoute()` e `isPathActive()` ignoran un `#hash` en la ruta.

## Loader

### Opciones eliminadas

`LoaderOptions.fetch` y `EntryConfig.html` ya no existen. El loader nunca los leía; elimínalos de tu configuración.

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

### Los scripts de módulo se ejecutan una vez por URL

Después de `unload(name)`, una app cuyo script `type: 'module'` se registró a sí mismo no vuelve a cargarse desde la misma URL, porque los navegadores ejecutan un script de módulo una vez por URL. Usa una entrada con función loader para las apps que descargas y vuelves a cargar:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

`load()` para un módulo en caché ahora informa su `duration` real en lugar de `0`.

## Module Federation

`federatedEntry` y `createFederatedEntry` devuelven una función loader en lugar de `{ scripts: [remoteEntry.js] }`. La entrada de 0.4 cargaba el script del contenedor y luego fallaba con "no exports found".

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

- `FederatedLoaderConfig.shared` se sustituye por `shareScope`. 0.4 nunca leía `shared`.
- `loadRemoteContainer` devuelve `FederatedContainer` en lugar de `any`.

## React

- El HTML de servidor de `TuvixReactApp` ahora contiene marcadores de comentario de Suspense (`<!--$-->...<!--/$-->`). Renderiza e hidrata con `@tuvix.js/react` 0.5 en ambos lados.
- `mount` se rechaza cuando el primer renderizado lanza un error. En 0.4 el error llegaba al manejador de errores raíz de React y `mount` se resolvía. Ahora el orquestador muestra el `fallback` de la app y llama a `onError`.
- `unmount` en un contenedor que el módulo nunca montó no hace nada. 0.4 lo vaciaba.

## Vue

`update()` ya no escribe `app.config.globalProperties.$tuvixProps`. Ahora las props son reactivas:

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

Los descendientes pueden usar `inject('tuvixProps')`, que devuelve el mismo objeto reactivo.

- `VueSsrMicroAppConfig` ya no acepta `ssr`. `createSsrVueMicroApp` lo establece.
- `unmount` en un contenedor que el módulo nunca montó no hace nada.

## Svelte

- Sin `ssr`, `createSvelteMicroApp` vacía el contenedor antes de renderizar. 0.4 añadía los componentes de Svelte 3/4 después del markup existente. Usa `createSsrSvelteMicroApp` para conservar e hidratar el markup del servidor.
- `unmount` en un contenedor que el módulo nunca montó, o cuyo montaje falló, no hace nada. 0.4 lo vaciaba. Los cuatro adaptadores se comportan ahora así.
- `renderSvelteToString` ya no recurre a `App.render` cuando `svelte/server` no se carga. Si se pasa `render`, usa Svelte 5; si no, toma el camino de Svelte 5 cuando `svelte` exporta `mount`, y llama a `App.render` solo para Svelte 3/4. Un error de importación o de renderizado de Svelte 5 te llega directamente.

Los componentes de Svelte 5 funcionan en 0.5; en 0.4 `createSvelteMicroApp` fallaba con ellos. Un `update()` de Svelte 5 vuelve a montar el componente salvo que pases `SvelteMap` de `svelte/reactivity` en la configuración, que actualiza las props en el sitio:

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

## Angular

### Nueva forma de la configuración

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

`platform` y `compilerOptions` ya no existen. Quita `import '@angular/compiler'` de tu entrada; el adaptador carga el compilador para los componentes JIT.

### Sin zone.js por defecto

Las apps se ejecutan sin zone.js salvo que pases `zone: true`. En Angular 15-17, los eventos del DOM ya no disparan la detección de cambios; llama a `ChangeDetectorRef.detectChanges()` en los handlers, o importa `zone.js` en tu entrada y pasa `zone: true`. Angular 18+ programa la detección de cambios sin zone.js. Consulta [Angular](/es/guide/angular).

### Las props son inputs

`update()` ya no escribe `window.__TUVIX_ANGULAR_PROPS__`. Declara propiedades `@Input()` en su lugar; el adaptador las establece con `setInput`.

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

### Otros cambios de Angular

- `createSsrAngularMicroApp` ya no añade `provideClientHydration()`. Vuelve a renderizar dentro del elemento host del servidor.
- `unmount` en un contenedor que el módulo nunca montó no hace nada.

## Sandbox

- `Sandbox({ css: false }).activate(container)` devuelve `null` y no adjunta ningún shadow root. `ISandbox.activate` devuelve `ShadowRoot | null`; comprueba si es `null` antes de llamar a `addStyle`.
- El modo estricto de `JsSandbox` lanza un `TypeError` ante una escritura bloqueada. 0.4 registraba un aviso y guardaba el valor de todos modos. Añade a `allowedGlobals` las variables globales en las que escribe tu código.

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });
const shadow = sandbox.activate(container);
if (shadow) sandbox.css.addStyle(shadow, ':host { display: block; }');
```

## Server

- `createServerRenderer().render()` devuelve `statusCode: 502` cuando al menos una app coincide con la ruta y fallan todas las peticiones de fragmentos. Sigue devolviendo 200 cuando ninguna app coincide o cuando un fragmento tiene éxito. `createMiddleware` envía ese estado. El renderizador de streaming siempre envía 200.
- `createMiddleware` y `createStreamingMiddleware` llaman a `next(error)` en lugar de `next()` cuando el renderizado lanza un error, así que Express dirige la petición a tu manejador de errores.

## Correcciones compatibles que conviene conocer

- `require('@tuvix.js/core')` y los demás puntos de entrada CommonJS funcionan. En 0.4, cinco paquetes apuntaban `require` a archivos que el build nunca generaba.
- `getGlobalBus()` guarda su instancia en `window`, así que las micro apps empaquetadas por separado comparten un único bus.
- Los adaptadores y `defineMicroApp` despachan `tuvix:mounted`, `tuvix:unmounted` y `tuvix:error`. Consulta [Eventos de ciclo de vida](/es/guide/lifecycle-events).
- Un `bootstrap()` que lanza un error se vuelve a ejecutar en el siguiente montaje. 0.4 lo omitía a partir de ese momento.
- `register()` después de `start()` monta la app de inmediato cuando la ruta actual la activa, y empieza a observar una app con `mountWhenVisible`.
- Cada fallo del ciclo de vida emite `tuvix:app:error` en el bus con `{ name, error, phase }`. 0.4 solo lo emitía para fallos de carga y de montaje.
- `maxListeners` avisa con `console.warn` una vez por evento, con o sin `debug`.
- `orchestrator.connectRouter()` sustituye a los puentes de `setTimeout` + `reconcile()`. Consulta [Router externo](/es/guide/external-router).
