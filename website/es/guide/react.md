# Con React

`@tuvix.js/react` cumple tres funciones. `createReactMicroApp` convierte un componente de React en una micro app que cualquier shell puede montar. `TuvixReactApp` renderiza una micro app de React dentro de una página host de React, con renderizado en el servidor. `TuvixIsland` aloja una micro app de Vue, Svelte, Angular, React o escrita a mano dentro de una página de React.

Requiere React 18 o 19.

## Instalación

```bash
pnpm add @tuvix.js/react react react-dom
```

## Convertir un componente en una micro app

```tsx
// src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile ${theme}`}>User {userId}</div>;
}

export default createReactMicroApp({ name: 'profile', App: Profile });
```

El módulo:

- se registra bajo `name`, para que una entry de URL lo encuentre;
- crea un root de React por contenedor, así que un módulo puede montarse en varios sitios;
- resuelve `mount` después de que React confirme el primer render y luego despacha `tuvix:mounted` en el contenedor;
- pasa las props de la shell a `App` como sus props. `App` puede declarar props obligatorias; el adaptador no las comprueba en runtime.

| Opción | Tipo | Descripción |
| --- | --- | --- |
| `name` | `string` | Obligatoria. Debe coincidir con el nombre de la app registrada. |
| `App` | `ComponentType<P>` | Obligatoria. Componente raíz. |
| `bootstrap` | `() => void \| Promise<void>` | Se ejecuta una vez antes del primer montaje. |
| `ssr` | `boolean` | Hidrata cuando el contenedor tiene markup del servidor. `createSsrReactMicroApp` la activa. |

## Props y actualizaciones

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'light' });
```

`update({ props, container })` vuelve a renderizar el root de ese contenedor con las props combinadas. El estado de los componentes se conserva. Sin `container`, vuelve a renderizar todos los roots del módulo. Llamar a `mount` en un contenedor en el que este módulo ya renderizó lo vuelve a renderizar en lugar de crear un segundo root.

## Errores

El adaptador envuelve `App` en un error boundary:

- Una excepción durante el primer render rechaza `mount`, vacía el contenedor y despacha `tuvix:error`. Después el orquestador muestra el HTML de `fallback` de la app.
- Una excepción posterior deja la app en blanco y despacha `tuvix:error`. El resto de la página sigue funcionando.

## Apps de React renderizadas en el servidor

Cuando la página host es de React y se renderiza en el servidor (TanStack Start, Next.js, Remix o tu propio `renderToString`), renderiza la micro app en línea con `TuvixReactApp`:

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

- Renderiza `<div data-tuvix-app="legal">` alrededor de `App`, así que el HTML sale del propio render en el servidor del host.
- Todas las props excepto `name`, `App` y `fallback` van a `App`.
- `App` está dentro de su propio `<Suspense fallback>`. Si lanza una excepción en el servidor, React envía el fallback solo para esta app y reintenta la app en el cliente.
- En el cliente, un error boundary muestra `fallback` y despacha `tuvix:error`.
- Después del primer commit despacha `tuvix:mounted` con `hydrated: true` cuando hidrató HTML del servidor, y `tuvix:unmounted` cuando sale del árbol.

Cuando un bundle separado debe hidratar ese markup (por ejemplo, una página que compuso `@tuvix.js/server`), exporta el mismo componente con `createSsrReactMicroApp`. Renderiza el mismo árbol de Suspense, así que la hidratación coincide:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export default createSsrReactMicroApp({ name: 'legal', App: LegalPage });
```

Con `ssr: true`, un contenedor que solo tiene espacios en blanco o comentarios recibe un render nuevo en lugar de una hidratación.

## Alojar otras micro apps con TuvixIsland

`TuvixIsland` monta cualquier módulo de micro app dentro de un árbol de React:

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });

export function Footer({ newsletterHtml }: { newsletterHtml?: string }) {
  return (
    <TuvixIsland
      name="newsletter"
      app={newsletter}
      props={{ list: 'weekly' }}
      ssrHtml={newsletterHtml}
      fallback={<p>Subscribe at example.com/newsletter</p>}
    />
  );
}
```

| Prop | Descripción |
| --- | --- |
| `name` | Se escribe en `data-tuvix-app` y se pasa a `mount`. |
| `app` | El módulo que se monta. |
| `props` | Se comparan de forma superficial en cada render. Un cambio llama a `app.update`, o a unmount + mount cuando el módulo no tiene `update`. |
| `ssrHtml` | HTML del servidor para la isla. Solo se necesita en el servidor. |
| `fallback` | Se renderiza en lugar de la isla cuando `mount` o `update` se rechaza. |
| `as`, `className` | Etiqueta del wrapper (por defecto `div`) y clase. |

React nunca reescribe el HTML interno de la isla después del primer render, así que los re-renders del padre conservan el DOM y los listeners que adjuntó el módulo. Un `name` o `app` nuevo vuelve a montar; quitar la isla llama a `app.unmount`. Mount, update y unmount se ejecutan uno tras otro, así que un unmount que llega durante `mount` lo espera.

`TuvixIsland` no carga módulos por URL. Importa el módulo o deja que el orquestador gestione las entries de URL. La configuración completa del servidor está en [Islas SSR](/es/guide/ssr-islands).

## Hooks

### useTuvixBus

Se suscribe al montar y cancela la suscripción al desmontar. Lee el `handler` más reciente a través de una ref, así que un handler en línea no vuelve a suscribirse en cada render:

```tsx
import { useState } from 'react';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/react';

const bus = getGlobalBus();

export function CartBadge() {
  const [count, setCount] = useState(0);
  useTuvixBus<{ itemCount: number }>(bus, 'cart:updated', ({ itemCount }) => setCount(itemCount));
  return <span className="badge">{count}</span>;
}
```

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` devuelve un estado que combina cada payload emitido en `updateEvent`. Nada en Tuvix.js emite ese evento; emítelo tú cuando quieras enviar props a través del bus en lugar de `updateAppProps`.

```tsx
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixProps } from '@tuvix.js/react';

const bus = getGlobalBus();

export function Theme() {
  const props = useTuvixProps({ theme: 'light' }, bus);
  return <p>Theme: {props.theme}</p>;
}

bus.emit('tuvix:props:update', { theme: 'dark' });
```

## Lo que no hace el adaptador

- No comparte un root de React entre micro apps. Cada app, y cada contenedor, tiene el suyo.
- No deduplica React. Dos micro apps de React empaquetadas por separado incluyen dos copias de React.
- No renderiza el `<head>` de la página host. Los títulos y las meta tags son responsabilidad del host.

## API

| Export | Propósito |
| --- | --- |
| `createReactMicroApp({ name, App, bootstrap?, ssr? })` | Módulo de micro app de React |
| `createSsrReactMicroApp({ name, App, bootstrap? })` | Igual, con `ssr: true` |
| `TuvixReactApp` | Micro app de React en línea en un host de React, con SSR |
| `TuvixIsland` | Aloja cualquier módulo de micro app en un árbol de React, con SSR |
| `useTuvixBus(bus, event, handler)` | Suscripción al event bus ligada al componente |
| `useTuvixProps(initial, bus?, event?)` | Props combinadas a partir de eventos del bus |
