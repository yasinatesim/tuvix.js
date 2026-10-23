# Micro Apps

Eine Micro App ist ein Modul mit den Funktionen `mount` und `unmount`. Die Shell ruft `mount` mit einem Container-Element und Props auf; die App rendert in dieses Element. Die Shell ruft `unmount` auf, wenn die App die Seite verlassen soll; die App entfernt, was sie gerendert hat.

## Die Form des Moduls

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  bootstrap: async () => {},
  mount: async ({ container, props, name, bus }) => {
    container.textContent = `${name ?? 'app'} mounted`;
    void props;
    void bus;
  },
  update: async ({ props, container }) => {
    if (container) container.dataset.props = JSON.stringify(props);
  },
  unmount: async ({ container }) => {
    container.replaceChildren();
  },
};
```

| Hook | Erforderlich | Aufgerufen |
| --- | --- | --- |
| `bootstrap()` | nein | Einmal, nach dem ersten Laden, vor dem ersten `mount`. |
| `mount({ container, props, name, bus })` | ja | Jedes Mal, wenn die App aktiv wird. |
| `update({ props, container })` | nein | Wenn die Shell `updateAppProps` aufruft, während die App gemountet ist. |
| `unmount({ container })` | ja | Jedes Mal, wenn die App inaktiv wird. |

Jeder Hook darf ein Promise zurückgeben. Der Orchestrator wartet darauf, bevor er den nächsten Schritt ausführt.

## Von Hand schreiben

`defineMicroApp` validiert die Hooks, registriert das Modul unter `name`, löst `tuvix:mounted`, `tuvix:unmounted` und `tuvix:error` auf dem Container aus und gibt das Modul zurück:

```ts
import { defineMicroApp } from '@tuvix.js/core';

let off: (() => void) | undefined;

export default defineMicroApp({
  name: 'notifications',

  mount({ container, props, bus }) {
    const list = document.createElement('ul');
    container.replaceChildren(list);
    off = bus?.on<{ text: string }>('notify', ({ text }) => {
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    });
    container.dataset.user = String(props?.user ?? '');
  },

  unmount({ container }) {
    off?.();
    off = undefined;
    container.replaceChildren();
  },
});
```

Verwende den `bus` aus dem Mount-Kontext. Er ist der Bus des Orchestrators, also `getGlobalBus()`, sofern die Shell keine `eventBus`-Optionen übergeben hat.

## Einen Adapter verwenden

Adapter bauen das Modul aus einer Komponente und übernehmen Details, die du sonst selbst schreiben würdest:

- eine Framework-Instanz pro Container, sodass ein Modul an mehreren Stellen mounten kann;
- `update` rendert mit neuen Props neu, ohne erneuten Mount;
- ein `unmount`, das eintrifft, während `mount` noch lädt, wartet und hinterlässt einen leeren Container;
- die Events `tuvix:mounted`, `tuvix:unmounted` und `tuvix:error` auf dem Container;
- Hydration von serverseitig gerendertem Markup, wenn du `ssr: true` übergibst.

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Cart({ items }: { items: number }) {
  return <p>{items} items</p>;
}

export default createReactMicroApp({ name: 'cart', App: Cart });
```

## Das Modul für den Loader bereitstellen

Der Orchestrator bekommt ein Modul über den `entry` der App:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

// Bundled with the shell, code-split by your bundler.
orchestrator.register({
  name: 'cart',
  entry: () => import('./apps/cart'),
  container: '#cart',
  activeWhen: '/shop/*',
});

// Deployed on its own. The script registers itself by name.
orchestrator.register({
  name: 'notifications',
  entry: { scripts: ['https://cdn.example.com/notifications/main.js'], type: 'module' },
  container: '#notifications',
  activeWhen: '/',
});
```

Bei einem URL-Entry muss das Modul `registerModule(name, module)` aufrufen (Adapter und `defineMicroApp` tun das) oder ein globales UMD-Objekt mit einer `mount`-Funktion bereitstellen. Eine Loader-Funktion muss nur zum Modul oder zu `{ default: module }` auflösen.

## Props übergeben

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./apps/profile'),
  container: '#app',
  activeWhen: '/profile/*',
  props: { userId: '42', theme: 'dark' },
});

await orchestrator.updateAppProps('profile', { theme: 'light' });
// The app now has { userId: '42', theme: 'light' }.
```

- Props werden flach zusammengeführt. Um einen Schlüssel zu entfernen, setze ihn auf `undefined`.
- Ist die App gemountet und hat sie `update`, ruft der Orchestrator es auf und wird aufgelöst, sobald es abgeschlossen ist. Ein abgelehntes `update` versetzt die App in den Status `error` und ruft `onError` auf.
- Ist die App nicht gemountet oder hat sie kein `update`, speichert der Orchestrator die zusammengeführten Props für den nächsten Mount. Er mountet die App nicht neu.

## Ein Modul an mehreren Stellen mounten

Adapter halten pro Container eine eigene Instanz. `TuvixIsland` und dein eigener Code können `mount` mit demselben Modul auf zwei Containern aufrufen:

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Price from './Price.vue';

const price = createVueMicroApp({ name: 'price', App: Price });

const first = document.querySelector<HTMLElement>('#price-1');
const second = document.querySelector<HTMLElement>('#price-2');
if (first && second) {
  await price.mount({ container: first, props: { sku: 'a' } });
  await price.mount({ container: second, props: { sku: 'b' } });
  await price.update?.({ props: { sku: 'c' }, container: second }); // only #price-2
}
```

Ohne `container` aktualisiert `update` jeden Mount dieses Moduls. Der Orchestrator übergibt immer `container`.

## Build und Deployment

Baue jede App als ES-Modul-Bundle und registriere sie mit `type: 'module'`, oder als IIFE/UMD-Bundle und registriere ihre URL als klassisches Skript. Mit Vite:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', formats: ['es'], fileName: 'main' },
    // Leave dependencies bundled unless the shell provides them.
  },
});
```

Denk an Framework-Kopien: Zwei Micro Apps, die jeweils React bündeln, liefern React zweimal aus. Die Seite funktioniert trotzdem, weil jede App ihren eigenen Root rendert. Um eine einzige Kopie zu teilen, verwende Import Maps, Module Federation (`@tuvix.js/module-federation`) oder lass die Shell die Apps über Entries mit Loader-Funktion bündeln.

## Was eine Micro App nicht tun darf

- Außerhalb ihres Containers schreiben. Tuvix.js hindert sie nicht daran, und die nächste App in diesem Container rechnet nicht damit.
- Nach `unmount` Listener, Timer oder Subscriptions zurücklassen.
- Sich darauf verlassen, dass `bootstrap` mehr als einmal läuft. Es läuft einmal pro geladenem Modul.
