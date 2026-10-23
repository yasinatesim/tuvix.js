---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="Bindings de React"
  description="Convierte un componente de React en una micro app de Tuvix.js y aloja cualquier micro app (Vue, Svelte, Angular, React, vanilla) dentro de un árbol de React con renderizado en el servidor e hidratación."
  icon="⚛️"
  npm="true"
/>

## Instalación

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

El paquete necesita React 18 o posterior (rango de peer `>=18.0.0` para `react` y `react-dom`). Depende de `@tuvix.js/loader` y `@tuvix.js/event-bus`.

## Cuándo usarlo

El paquete cubre dos direcciones:

- **React como micro app.** `createReactMicroApp` y `createSsrReactMicroApp` envuelven un componente de React en el módulo `{ bootstrap, mount, unmount, update }` que esperan el orquestador y el loader. Úsalos cuando una app de React sea una de las micro apps que carga una shell de Tuvix.
- **React como host.** `TuvixIsland` monta cualquier módulo de micro app dentro de una página de React y mantiene intacto su DOM entre re-renders. `TuvixReactApp` renderiza una micro app de React en línea dentro del árbol del host. Úsalos cuando tu shell sea un framework SSR de React como TanStack Start, Next.js o Remix.

Si tu shell es HTML plano sin React, solo necesitas el primer par más [`@tuvix.js/core`](/es/packages/core). Para una micro app de Vue, Svelte o Angular, usa [`@tuvix.js/vue`](/es/packages/vue), [`@tuvix.js/svelte`](/es/packages/svelte) o [`@tuvix.js/angular`](/es/packages/angular) para crear el módulo; `TuvixIsland` puede alojar cualquiera de ellos.

## Inicio rápido

Crea el módulo de la micro app:

```tsx
// src/dashboard.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Regístralo en la shell. El orquestador llama a `mount` cuando la ruta coincide y a `update` cuando cambias las props:

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { userId: 'u_42' },
});

await orchestrator.start();

// Re-renders <Dashboard userId="u_43" />; component state survives.
await orchestrator.updateAppProps('dashboard', { userId: 'u_43' });
```

## API

### `createReactMicroApp`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre con el que se registra el módulo mediante `registerModule` de `@tuvix.js/loader`. Los eventos de ciclo de vida lo incluyen. |
| `App` | `ComponentType<P>` | obligatorio | Componente raíz. Recibe las props de montaje como sus propias props, así que un componente con props obligatorias como `{ page: 'privacy' \| 'terms' }` pasa la comprobación de tipos. |
| `bootstrap` | `() => void \| Promise<void>` | ninguno | Configuración inicial que se ejecuta una sola vez. El `bootstrap()` del módulo la espera. |
| `ssr` | `boolean` | `false` | Hidrata el markup del servidor con `hydrateRoot` cuando el contenedor tiene elementos o texto que no sea solo espacios en blanco. Un contenedor con solo espacios en blanco o comentarios recibe un render nuevo con `createRoot`. |

El módulo devuelto tiene cuatro métodos:

- `mount({ container, props })` crea una raíz de React para ese contenedor. Se resuelve cuando React confirma el primer render y luego despacha `tuvix:mounted` en el contenedor con `hydrated: true` o `false`. Si `App` se suspende en el primer render, `mount` espera hasta que el contenido se confirme.
- `update({ props, container })` vuelve a renderizar `App` con `props` en ese contenedor. Sin `container` vuelve a renderizar todos los contenedores que el módulo ha montado. React conserva el estado del componente porque el árbol mantiene su forma.
- `unmount({ container })` desmonta la raíz, vacía el contenedor con `replaceChildren()` y despacha `tuvix:unmounted`.
- `bootstrap()` ejecuta `config.bootstrap`.

Cada contenedor recibe su propia raíz, así que un módulo puede montarse en varios lugares a la vez:

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

const badge = createReactMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

El módulo importa `react-dom/client` de forma diferida dentro de `mount`. Un bundle de servidor puede importar el módulo (por ejemplo, para compartir `App` con `TuvixReactApp`) sin arrastrar el renderer del cliente.

### `createSsrReactMicroApp`

```ts no-check
function createSsrReactMicroApp<P extends object = Record<string, unknown>>(
  config: Omit<ReactMicroAppConfig<P>, 'ssr'>
): MicroAppModule;
```

Equivale a `createReactMicroApp({ ...config, ssr: true })`. Opciones: `name`, `App`, `bootstrap`, como en la tabla anterior.

Úsalo en el cliente cuando el contenedor ya tenga HTML que el servidor renderizó para el mismo componente. El árbol que renderiza coincide con el que renderiza `TuvixReactApp` (error boundary más `<Suspense>`), así que hidrata el markup de `TuvixReactApp` sin desajustes:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export default createSsrReactMicroApp({ name: 'legal-app', App: LegalPage });
```

### `TuvixIsland`

```ts no-check
function TuvixIsland(props: TuvixIslandProps): ReactElement;
```

| Prop | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre de la micro app. La isla lo escribe en `data-tuvix-app` y lo pasa a `app.mount`. |
| `app` | `MicroAppModule` | obligatorio | El módulo que se monta: el resultado de `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp`, `createReactMicroApp`, sus variantes `createSsr*` o un objeto `{ mount, unmount, update? }` escrito a mano. |
| `props` | `Record<string, unknown>` | `{}` | Props para el módulo. La isla las compara de forma superficial en cada render. |
| `ssrHtml` | `string` | ninguno | El HTML de la isla renderizado en el servidor, por ejemplo con `renderVueToString`. Pásalo solo en el servidor. |
| `fallback` | `ReactNode` | `null` | Se renderiza en lugar de la isla cuando `mount` o `update` se rechazan. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Etiqueta del elemento envoltorio. |
| `className` | `string` | ninguno | Nombre de clase del elemento envoltorio. |

`TuvixIsland` aloja una micro app que no es de React (o una de React empaquetada por separado) dentro de una página de React. Un puente escrito a mano que renderiza <span v-pre>`<div dangerouslySetInnerHTML={{ __html: html }} />`</span> se rompe en el primer re-render del padre: React ve un objeto `{ __html }` nuevo, vuelve a asignar `innerHTML` y destruye el DOM y los listeners que adjuntó la micro app. `TuvixIsland` lo evita:

- **Render en el servidor.** Renderiza `<div data-tuvix-app={name} data-tuvix-island={id}>` con `ssrHtml` como HTML interno. `id` viene de `useId` de React, así que el servidor y el cliente calculan el mismo valor.
- **Hidratación.** En el primer render del cliente encuentra su propio elemento en la página mediante `data-tuvix-island` y vuelve a leer el HTML interno desde el DOM. No envías `ssrHtml` al cliente una segunda vez, y el render del cliente coincide con el del servidor.
- **DOM estable.** La isla crea su objeto `{ __html }` una sola vez, en `useState`. Los renders posteriores reutilizan ese objeto, así que React nunca reescribe los hijos de la isla. Los re-renders del padre conservan los nodos y listeners de la micro app.
- **Montaje.** Tras el primer commit la isla llama a `app.mount({ container, props, name })`. Un módulo creado con `ssr: true` (`createSsrVueMicroApp` y similares) adopta ahí el DOM del servidor. Un módulo sin SSR renderiza desde cero en el contenedor.
- **Props.** Cuando `props` cambia de forma superficial (claves distintas, o un valor que no pasa `Object.is`), la isla llama a `app.update({ props, container })`. Un módulo sin `update` recibe `unmount`, un contenedor vaciado y un nuevo `mount`. Un objeto literal en línea con los mismos valores no provoca una actualización.
- **Identidad.** Un `name` o `app` nuevo desmonta el módulo anterior y monta el nuevo.
- **Eliminación.** Cuando la isla sale del árbol, llama a `app.unmount({ container })` y vacía el contenedor.
- **Orden.** Las llamadas a mount, update y unmount se ejecutan una tras otra. Un unmount que llega mientras `mount` está pendiente lo espera.
- **Errores.** Si `mount` o `update` se rechazan, la isla renderiza `fallback` en lugar del envoltorio. Los adaptadores despachan `tuvix:error` por sí mismos; la isla no añade ningún evento. Un cambio posterior de `name` o `app` lo vuelve a intentar.

Una configuración completa de servidor y cliente con un footer de Vue dentro de un layout de React:

```tsx
// src/Layout.tsx (shared by server and client)
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <main>
      <h1>Home</h1>
      <TuvixIsland
        name="footer"
        app={footer}
        props={{ year }}
        ssrHtml={footerHtml}
        fallback={<footer>© {year}</footer>}
        as="section"
        className="site-footer"
      />
    </main>
  );
}
```

```tsx
// src/entry-server.tsx (runs on the server only)
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const year = 2026;
  const footerHtml = await renderVueToString(Footer, { year });
  const body = renderToString(<Layout year={year} footerHtml={footerHtml} />);
  return `<!doctype html><html><body><div id="root">${body}</div><script type="module" src="/src/entry-client.tsx"></script></body></html>`;
}
```

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

// No footerHtml here: the island reads the footer HTML from the page.
hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

El HTML del servidor llega al navegador antes que cualquier JavaScript, así que el footer se ve con estilos en el primer pintado en cuanto imprimes sus hojas de estilo en `<head>`. [`@tuvix.js/vite`](/es/packages/vite) te da esas etiquetas `<link>`.

### `TuvixReactApp`

```ts no-check
function TuvixReactApp<P extends object>(props: TuvixReactAppProps<P>): ReactElement;
```

| Prop | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obligatorio | Nombre de la micro app, escrito en `data-tuvix-app`. Usa el mismo `name` que pasas a `createSsrReactMicroApp`. |
| `App` | `ComponentType<P>` | obligatorio | Componente que se renderiza. |
| `fallback` | `ReactNode` | `null` | Se muestra mientras `App` está suspendido y después de que lance un error. |
| otras props | `P` | según exija `P` | Se pasan a `App`. |

`TuvixReactApp` renderiza una micro app de React en línea, como parte del árbol de React del host, así que tu framework SSR renderiza su HTML. Genera `<div data-tuvix-app={name}>` y envuelve `App` en un error boundary y un `<Suspense fallback>`:

- **Los errores del servidor quedan aislados.** Un error lanzado dentro de `App` durante el renderizado en el servidor hace que React renderice `fallback` solo para esta app. El resto de la página se renderiza, y React reintenta `App` en el cliente.
- **Los errores del cliente quedan aislados.** El error boundary captura los errores de render en el cliente, muestra `fallback` y despacha `tuvix:error` en el envoltorio.
- **Eventos de ciclo de vida.** Tras el primer commit despacha `tuvix:mounted`. `hydrated` es `true` cuando el envoltorio vino del HTML del servidor. Cuando el componente sale del árbol, despacha `tuvix:unmounted` antes de que React separe el envoltorio, así que un listener en `document` lo recibe. Si un límite `<Suspense>` ya visible se vuelve a suspender, la app informa `unmounted` y luego `mounted` cuando el contenido vuelve.

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal-app"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

Para alojar una micro app de Vue, Svelte, Angular o vanilla, usa `TuvixIsland`.

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): void;
```

Suscribe `handler` a `event` en `bus` dentro de un effect y cancela la suscripción al desmontar. El hook guarda el `handler` más reciente en un ref, así que un handler que lee estado actualizado no se vuelve a suscribir en cada render. Un `bus` o `event` nuevo vuelve a suscribir. La suscripción existe solo en el cliente; los effects no se ejecutan durante el renderizado en el servidor.

Los adaptadores no pasan el bus del orquestador a `App`. El orquestador usa `getGlobalBus()` a menos que le hayas dado opciones `eventBus`, así que lee el bus desde ahí:

```tsx
import { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function CartIcon() {
  const [count, setCount] = useState(0);

  useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
    setCount(items.length);
  });

  return <span>{count}</span>;
}
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): T;
```

| Argumento | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `initialProps` | `T` | obligatorio | Valor inicial. El hook lo lee en el primer render e ignora los cambios posteriores. |
| `bus` | `IEventBus` | ninguno | Bus en el que escuchar. Sin él, el hook devuelve `initialProps` sin cambios. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Evento cuyo payload el hook fusiona con las props actuales (`{ ...prev, ...payload }`). |

Ni el orquestador ni los adaptadores emiten `tuvix:props:update`. Lo emites tú. Un módulo creado con `createReactMicroApp` no necesita este hook para las props del orquestador: `update({ props })` vuelve a renderizar `App` con las props nuevas.

```tsx
import { useTuvixProps } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function ThemeLabel() {
  const props = useTuvixProps({ theme: 'light' }, getGlobalBus());
  return <p>Theme: {props.theme}</p>;
}

// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
```

### Tipos

| Tipo | Significado |
| --- | --- |
| `ReactMicroAppConfig<P>` | Configuración de `createReactMicroApp`: `name`, `App`, `bootstrap?`, `ssr?`. |
| `TuvixIslandProps` | Props de `TuvixIsland`: `name`, `app`, `props?`, `ssrHtml?`, `fallback?`, `as?`, `className?`. |
| `TuvixReactAppProps<P>` | Props de `TuvixReactApp`: `name`, `App`, `fallback?`, más las props de `App`. |

## Casos límite

- **El primer render lanza un error.** `mount` se rechaza con el error, desmonta la raíz, vacía el contenedor y despacha `tuvix:error`. En 0.4 `mount` se resolvía y el error llegaba al manejador de errores de la raíz de React.
- **Un render posterior lanza un error.** El error boundary deja la app en blanco y despacha `tuvix:error`. La página host sigue funcionando. La app queda en blanco hasta que la desmontes y la vuelvas a montar; `update` no la recupera.
- **Unmount durante el montaje.** Un `unmount` que llega mientras `mount` todavía está cargando `react-dom/client` o esperando el primer commit lo espera, deja el contenedor vacío y no despacha ningún evento `mounted`.
- **Montar dos veces en un contenedor.** Un segundo `mount` en un contenedor que el módulo ya ocupa desmonta la raíz anterior, despacha `tuvix:unmounted`, luego renderiza desde cero con las props nuevas y despacha `tuvix:mounted`. El estado del componente se reinicia. Los adaptadores de Vue, Svelte y Angular hacen lo mismo. Llama a `update` para conservar el estado.
- **Contenedor desconocido.** `unmount` y `update` en un contenedor que el módulo nunca montó no hacen nada.
- **Las props se reemplazan.** El `update` del módulo renderiza `App` con las props que pasas y nada más. `orchestrator.updateAppProps` fusiona las props nuevas sobre las registradas antes de llamar a `update`.
- **Contenedor con solo espacios en blanco y `ssr: true`.** El módulo renderiza desde cero, porque `hasServerMarkup` ignora el texto de espacios en blanco y los comentarios.
- **Isla eliminada por React.** React separa el elemento de la isla antes de que el módulo informe `tuvix:unmounted`. `emitLifecycle` despacha entonces el evento en `document` en lugar de en el elemento separado, así que un listener en `document` (u `onLifecycle` de `@tuvix.js/loader`) lo sigue recibiendo, con `detail.container` apuntando al elemento eliminado. Un listener en el propio contenedor o en un ancestro no lo recibe. `isMounted(name)` sigue siendo `true` mientras la app esté montada en cualquier otro contenedor y pasa a `false` cuando se desmonta el último.
- **Isla bajo `<StrictMode>` en desarrollo.** React ejecuta el effect de montaje, su cleanup y otra vez el effect. La isla encola las llamadas al módulo y omite la primera ejecución porque su cleanup ya se ejecutó, así que el módulo se monta una sola vez y adopta el DOM del servidor.
- **App nueva tras un montaje fallido.** Cuando `mount` se rechaza, la isla descarta su HTML del servidor. Si después pasas un `app` o `name` distinto, el nuevo módulo se monta en un elemento vacío en lugar de adoptar el markup de la app que falló.
- **Cambiar `ssrHtml` en la isla.** La isla lee `ssrHtml` solo en su primer render. Pasa el contenido nuevo mediante `props`.
- **El mismo nombre dos veces.** `registerModule` conserva el último módulo creado con un nombre.

## Lo que no hace

- No carga módulos por URL. Importa el módulo, o deja que [`@tuvix.js/core`](/es/packages/core) lo cargue mediante un `entry`.
- No renderiza una micro app a string. En el servidor usa `renderToString` de `react-dom/server` con `TuvixReactApp`, o el renderer propio del framework (`renderVueToString` de [`@tuvix.js/vue/server`](/es/packages/vue), los equivalentes de Svelte y Angular) y pasa el resultado a `TuvixIsland` como `ssrHtml`.
- No pasa `MountContext.bus` ni `MountContext.name` a `App`. Usa `getGlobalBus()` de `@tuvix.js/event-bus`.
- No carga el CSS de la isla. Usa [`@tuvix.js/vite`](/es/packages/vite) para imprimir los enlaces a hojas de estilo de las islas renderizadas en el servidor.
- No es compatible con React 17 ni versiones anteriores.

## Migrar desde 0.4

**El HTML de servidor de `TuvixReactApp` tiene marcadores de Suspense.** El envoltorio ahora contiene `<!--$-->…<!--/$-->` alrededor de la app. Actualiza `@tuvix.js/react` en el servidor y en el cliente a la vez, o la hidratación fallará por desajuste.

**`mount` se rechaza cuando el primer render lanza un error.** Si esperabas `mount` con `await` y contabas con que se resolviera, captura el error:

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Broken(): never {
  throw new Error('boom');
}

const app = createReactMicroApp({ name: 'broken', App: Broken });
const container = document.createElement('div');

try {
  await app.mount({ container });
} catch (error) {
  // 0.4: never reached. 0.5: the render error; the container is empty.
  container.textContent = 'This section failed to load.';
}
```

**`unmount` en un contenedor desconocido no hace nada.** En 0.4 vaciaba el contenedor. Llama tú mismo a `container.replaceChildren()` si dependías de eso.

**Objeto de configuración.** Versiones anteriores de esta página mostraban `createReactMicroApp(App)`. La función recibe un objeto de configuración: `createReactMicroApp({ name: 'dashboard', App })`.

Consulta la [guía de React](/es/guide/react) para más recorridos.
