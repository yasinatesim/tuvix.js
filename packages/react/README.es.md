# @tuvix.js/react

> Convierte componentes de React en micro apps de Tuvix.js y aloja cualquier micro app dentro de un árbol de React con hidratación SSR.

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Instalación

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

Requiere React 18 o posterior.

## Inicio rápido

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

El módulo se registra a sí mismo con el nombre `'dashboard'` mediante `registerModule` de `@tuvix.js/loader`, así que el orquestador lo encuentra cuando el script termina de cargar. Pasa al orquestador un `entry` como `() => import('./dashboard')`, un `container` y `props`.

## API

### `createReactMicroApp(config)`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre en el registro; los eventos de ciclo de vida lo incluyen. |
| `App` | `ComponentType<P>` | obligatorio | Componente raíz. Recibe las props de montaje; las props obligatorias se comprueban en los tipos. |
| `bootstrap` | `() => void \| Promise<void>` | ninguno | Configuración que se ejecuta una sola vez. |
| `ssr` | `boolean` | `false` | Hidrata con `hydrateRoot` cuando el contenedor tiene markup del servidor (elementos o texto que no sea solo espacios en blanco). |

- Cada contenedor recibe su propia raíz de React, así que un mismo módulo puede montarse en varios lugares.
- `mount({ container, props })` se resuelve después del primer commit y despacha `tuvix:mounted` con `hydrated`.
- `update({ props, container })` vuelve a renderizar un contenedor, o todos si no pasas `container`. El estado de los componentes se conserva.
- `unmount({ container })` desmonta la raíz, vacía el contenedor y despacha `tuvix:unmounted`.
- `react-dom/client` se carga de forma diferida dentro de `mount`, así que los bundles del servidor pueden importar el módulo.

### `createSsrReactMicroApp(config)`

`createReactMicroApp({ ...config, ssr: true })`. Opciones: `name`, `App`, `bootstrap`. Renderiza el mismo árbol que `TuvixReactApp`, así que hidrata el markup de `TuvixReactApp` sin discrepancias.

### `TuvixIsland`

Aloja cualquier módulo de micro app (Vue, Svelte, Angular, React o un `{ mount, unmount, update? }` escrito a mano) dentro de un árbol de React.

| Prop | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Se escribe en `data-tuvix-app` y se pasa a `mount`. |
| `app` | `MicroAppModule` | obligatorio | El módulo que se monta. |
| `props` | `Record<string, unknown>` | `{}` | Se compara de forma superficial; un cambio llama a `app.update({ props, container })`, o vuelve a montar si el módulo no tiene `update`. |
| `ssrHtml` | `string` | ninguno | HTML de la isla renderizado en el servidor. Pásalo solo en el servidor. |
| `fallback` | `ReactNode` | `null` | Se renderiza cuando `mount` o `update` se rechazan. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Etiqueta del contenedor. |
| `className` | `string` | ninguno | Clase del contenedor. |

Un puente escrito a mano con `<div dangerouslySetInnerHTML={{ __html }} />` pierde el DOM y los listeners de la micro app en el siguiente re-render del padre, porque React vuelve a asignar `innerHTML` por cada objeto `{ __html }` nuevo. `TuvixIsland` crea ese objeto una sola vez. Durante la hidratación encuentra su elemento mediante un atributo `data-tuvix-island` (generado con `useId`) y lee el HTML de vuelta desde la página, así que el cliente no necesita `ssrHtml`. Un `name` o un `app` nuevos provocan un nuevo montaje; al eliminarla se llama a `app.unmount`. Las llamadas se ejecutan en orden, así que un desmontaje espera a que termine un montaje pendiente.

```tsx
// Layout.tsx, rendered on the server with footerHtml and on the client without it
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <TuvixIsland name="footer" app={footer} props={{ year }} ssrHtml={footerHtml} fallback={<footer>© {year}</footer>} />
  );
}
```

```tsx
// entry-server.tsx
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const footerHtml = await renderVueToString(Footer, { year: 2026 });
  return renderToString(<Layout year={2026} footerHtml={footerHtml} />);
}
```

```tsx
// entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

### `TuvixReactApp`

Renderiza una micro app de React en línea dentro del árbol del host, envuelta en `<div data-tuvix-app={name}>`.

| Prop | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Debe coincidir con el `name` del módulo. |
| `App` | `ComponentType<P>` | obligatorio | Componente que se renderiza. |
| `fallback` | `ReactNode` | `null` | Se muestra mientras `App` está suspendido o después de que lance un error. |
| otras props | `P` | según `P` | Se pasan a `App`. |

`App` se ejecuta dentro de un error boundary y un `<Suspense fallback>`. Un error de renderizado en el servidor reemplaza solo esta app por `fallback`, y React la vuelve a intentar en el cliente. Un error de renderizado en el cliente muestra `fallback` y despacha `tuvix:error`. Despacha `tuvix:mounted` (con `hydrated`) y `tuvix:unmounted`.

### `useTuvixBus(bus, event, handler)`

Se suscribe en un efecto y cancela la suscripción al desmontar. El `handler` más reciente se guarda en una ref, así que no vuelve a suscribirse en cada render. Pasa `getGlobalBus()` de `@tuvix.js/event-bus`; el adaptador no entrega el bus del orquestador a `App`.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Devuelve props que fusionan cada payload de `updateEvent` (por defecto `'tuvix:props:update'`) en `bus`. Nada en Tuvix emite ese evento; lo emites tú. Los módulos creados con `createReactMicroApp` reciben las props nuevas mediante `update` sin este hook.

### Tipos

`ReactMicroAppConfig<P>`, `TuvixIslandProps`, `TuvixReactAppProps<P>`.

## Casos límite

- Un error lanzado en el primer render rechaza `mount`, vacía el contenedor y despacha `tuvix:error`. Un error posterior deja la app en blanco hasta que la vuelvas a montar.
- `unmount` durante un `mount` pendiente espera a que termine y deja el contenedor vacío.
- `mount` sobre un contenedor que el módulo ya ocupa desmonta la raíz anterior (despachando `tuvix:unmounted`) y renderiza desde cero con las props nuevas, igual que los adaptadores de Vue, Svelte y Angular.
- `unmount` y `update` sobre un contenedor desconocido no hacen nada.
- Cuando React elimina un `TuvixIsland`, el módulo informa `tuvix:unmounted` después de que el elemento se separa del DOM. El evento va a `document` (con `detail.container` definido), así que los listeners de `document` y `onLifecycle` lo reciben; los listeners del contenedor o de sus ancestros no. `isMounted(name)` pasa a `false` cuando ya no queda montado ningún contenedor de la app.
- Con `<StrictMode>` en desarrollo, React ejecuta dos veces el efecto de montaje de la isla, pero la isla omite la primera ejecución descartada: el módulo se monta una sola vez y adopta el markup del servidor.
- Tras un montaje fallido, un `app` o un `name` nuevos se montan en un elemento vacío. Nunca reciben el HTML del servidor de la app que falló.

## Lo que no hace

- Cargar módulos por URL. Usa `@tuvix.js/core` o `@tuvix.js/loader`.
- Renderizar a un string. Usa `react-dom/server`, o `renderVueToString` y funciones similares para `ssrHtml`.
- Cargar el CSS de las islas. Usa `@tuvix.js/vite`.

## Cambios incompatibles en 0.5

- El HTML que `TuvixReactApp` genera en el servidor ahora incluye marcadores de comentario de Suspense; actualiza el servidor y el cliente a la vez.
- `mount` se rechaza cuando el primer render lanza un error.
- `unmount` sobre un contenedor que el módulo nunca montó no hace nada.

Documentación completa: [tuvix.js.org/packages/react](https://tuvix.js.org/packages/react)

## Licencia

MIT
