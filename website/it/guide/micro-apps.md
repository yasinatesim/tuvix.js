# Micro app

Una micro app è un modulo con le funzioni `mount` e `unmount`. La shell chiama `mount` con un elemento container e le props; l'app si renderizza in quell'elemento. La shell chiama `unmount` quando l'app deve lasciare la pagina; l'app rimuove ciò che ha renderizzato.

## La forma del modulo

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

| Hook | Obbligatorio | Chiamato |
| --- | --- | --- |
| `bootstrap()` | no | Una volta, dopo il primo caricamento, prima del primo `mount`. |
| `mount({ container, props, name, bus })` | sì | Ogni volta che l'app diventa attiva. |
| `update({ props, container })` | no | Quando la shell chiama `updateAppProps` mentre l'app è montata. |
| `unmount({ container })` | sì | Ogni volta che l'app diventa inattiva. |

Ogni hook può restituire una promise. L'orchestratore la attende prima del passo successivo.

## Scriverne una a mano

`defineMicroApp` valida gli hook, registra il modulo con il nome `name`, emette `tuvix:mounted`, `tuvix:unmounted` e `tuvix:error` sul container e restituisce il modulo:

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

Usa il `bus` del contesto di mount. È il bus dell'orchestratore, cioè `getGlobalBus()` a meno che la shell non abbia passato opzioni `eventBus`.

## Usare un adapter

Gli adapter costruiscono il modulo a partire da un componente e gestiscono dettagli che altrimenti scriveresti tu:

- un'istanza del framework per container, così un modulo può essere montato in più punti;
- `update` renderizza di nuovo con le nuove props senza un remount;
- un `unmount` che arriva mentre `mount` sta ancora caricando attende e lascia un container vuoto;
- eventi `tuvix:mounted`, `tuvix:unmounted` e `tuvix:error` sul container;
- hydration del markup renderizzato lato server quando passi `ssr: true`.

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Cart({ items }: { items: number }) {
  return <p>{items} items</p>;
}

export default createReactMicroApp({ name: 'cart', App: Cart });
```

## Esporre il modulo al loader

L'orchestratore ottiene un modulo tramite la `entry` dell'app:

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

Con una entry URL, il modulo deve chiamare `registerModule(name, module)` (gli adapter e `defineMicroApp` lo fanno) oppure esporre una variabile globale UMD con una funzione `mount`. A una funzione loader basta risolversi nel modulo o in `{ default: module }`.

## Passare le props

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

- Le props vengono unite in modo superficiale (shallow merge). Per rimuovere una chiave, impostala a `undefined`.
- Quando l'app è montata e ha `update`, l'orchestratore lo chiama e si risolve dopo che si è concluso. Un `update` rifiutato porta l'app nello stato `error` e chiama `onError`.
- Quando l'app non è montata, o non ha `update`, l'orchestratore conserva le props unite per il mount successivo. Non rimonta l'app.

## Montare un modulo in più punti

Gli adapter mantengono un'istanza separata per ogni container. `TuvixIsland` e il tuo codice possono chiamare `mount` su due container con lo stesso modulo:

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

Senza `container`, `update` aggiorna ogni mount di quel modulo. L'orchestratore passa sempre `container`.

## Build e deploy

Fai la build di ogni app come bundle ES module e registrala con `type: 'module'`, oppure come bundle IIFE/UMD e registra il suo URL come script classico. Con Vite:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', formats: ['es'], fileName: 'main' },
    // Leave dependencies bundled unless the shell provides them.
  },
});
```

Tieni presenti le copie dei framework: due micro app che includono ciascuna React nel proprio bundle distribuiscono React due volte. La pagina funziona comunque, perché ogni app renderizza la propria root. Per condividere una sola copia, usa le import map, Module Federation (`@tuvix.js/module-federation`), oppure fai in modo che la shell includa le app nel proprio bundle tramite entry di tipo funzione loader.

## Cosa una micro app non deve fare

- Scrivere fuori dal proprio container. Tuvix.js non lo impedisce, e la prossima app in quel container non se lo aspetta.
- Lasciare listener, timer o sottoscrizioni attivi dopo `unmount`.
- Contare sul fatto che `bootstrap` venga eseguito più di una volta. Viene eseguito una volta per ogni modulo caricato.
