# ¿Qué es Tuvix.js?

Tuvix.js es un toolkit de micro frontends para el navegador. Una página host (la shell) registra micro apps, y Tuvix.js carga el código de cada app, la monta en un contenedor, le pasa props y la desmonta cuando la URL o tu código lo indican. Cada micro app puede usar React, Vue, Svelte, Angular o ningún framework, y cada equipo puede hacer el build y desplegar su app según su propio calendario.

## Qué hace

- **Orquesta micro apps.** `createOrchestrator()` mantiene un registro de apps. Para cada una decide, a partir de la ruta actual, si la app debe estar montada, y ejecuta una reconciliación a la vez para que dos apps que comparten un contenedor nunca se solapen.
- **Carga código bajo demanda.** El `entry` de una app puede ser la URL de un script, una lista de scripts y hojas de estilo, o una función como `() => import('./dashboard')`. El loader reintenta las cargas fallidas y aborta las lentas.
- **Enruta por URL.** `activeWhen: '/dashboard/*'` monta una app en `/dashboard` y en cada ruta por debajo. Puedes usar el router integrado o seguir a TanStack Router o React Router con `connectRouter()`.
- **Adapta frameworks.** `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp` y `createAngularMicroApp` convierten un componente raíz en un módulo con `mount`, `update` y `unmount`.
- **Aloja islas en una página React.** `TuvixIsland` monta una micro app de Vue, Svelte, Angular o React dentro de un árbol React renderizado en el servidor e hidrata el HTML del servidor sin enviarlo dos veces. Consulta [Islas SSR](/es/guide/ssr-islands).
- **Informa del ciclo de vida.** Los adaptadores y `defineMicroApp` despachan los eventos DOM `tuvix:mounted`, `tuvix:unmounted` y `tuvix:error`, y `whenMounted(name)` se resuelve en cuanto una app está en la página. Consulta [Eventos de ciclo de vida](/es/guide/lifecycle-events).
- **Conecta apps.** Todas las apps de una página comparten un único event bus a través de `getGlobalBus()`, incluso cuando cada app incluye en su bundle su propia copia de `@tuvix.js/event-bus`.
- **Aísla el CSS cuando lo pides.** `sandbox: true` renderiza una app dentro de un shadow root, de modo que el CSS de la página y el de la app se mantienen separados.

## Cuándo usarlo

Recurre a Tuvix.js cuando varios equipos entregan partes de una misma página y necesitan desplegarlas por separado, o cuando quieres mantener una app heredada funcionando junto a una reescritura en otro framework. También encaja con un solo equipo que quiere widgets de Vue o Svelte dentro de un sitio React con renderizado en el servidor.

## Cuándo no usarlo

- Un equipo, un framework, un despliegue: una single-page app normal es más sencilla.
- Necesitas un aislamiento de seguridad estricto entre apps. Tuvix.js ejecuta todas las apps en el mismo realm de JavaScript. `JsSandbox` de `@tuvix.js/sandbox` oculta las escrituras globales hechas a través de su proxy, pero no impide que una app acceda a `window`. Usa un `<iframe>` para código no confiable.
- Quieres un único bundle con estado compartido entre todas las apps. Las micro apps se comunican mediante eventos y props, por diseño.

## Paquetes

| Paquete | Úsalo para |
| --- | --- |
| `tuvix.js` | Una sola instalación con core, router, event bus, loader y sandbox |
| `@tuvix.js/core` | `createOrchestrator`, `defineMicroApp` |
| `@tuvix.js/router` | `createRouter`, `matchPath`, `interceptLinks` |
| `@tuvix.js/loader` | Carga de entries y el runtime de ciclo de vida (`whenMounted`, `onLifecycle`) |
| `@tuvix.js/event-bus` | `createEventBus`, `getGlobalBus` |
| `@tuvix.js/sandbox` | `CssSandbox`, `JsSandbox` |
| `@tuvix.js/react`, `vue`, `svelte`, `angular` | Adaptadores de framework, `TuvixIsland` (React) |
| `@tuvix.js/vite` | Enlaces a hojas de estilo de islas para el `<head>` renderizado en el servidor |
| `@tuvix.js/server` | Composición de fragmentos HTML en el servidor |
| `@tuvix.js/module-federation` | Entries que se cargan desde remotes de webpack Module Federation |
| `@tuvix.js/devtools` | Panel de depuración dentro de la página |
| `create-tuvix-app` | Generación de proyectos |

## Conceptos clave

| Término | Significado |
| --- | --- |
| Shell | La página host que crea el orquestador y controla el layout |
| Micro app | Un módulo con `mount` y `unmount` (y, opcionalmente, `bootstrap` y `update`) |
| Entry | De dónde obtiene el loader una micro app: URL, `{ scripts, styles }` o una función loader |
| Contenedor | El elemento en el que se renderiza una micro app |
| Isla | Una micro app que el host renderiza en el servidor y el cliente hidrata en su sitio |
| Event bus | Un canal pub/sub que comparten todas las apps de la página |

## Próximos pasos

- [Primeros pasos](/es/guide/getting-started) construye una shell y dos micro apps.
- [Arquitectura](/es/guide/architecture) muestra cómo una navegación se convierte en un montaje.
- ¿Vienes de 0.4? Lee [Migrar a 0.5](/es/guide/migration-0-5).
