# Lifecycle-Events

Adapter und `defineMicroApp` teilen der Seite mit, wann eine Micro App mountet, unmountet oder fehlschlägt. Du kannst auf DOM-Events hören, auf `whenMounted(name)` warten oder `isMounted(name)` abfragen. Nutze sie, um eine Animation zu starten, sobald eine Island interaktiv ist, um ein Skeleton auszublenden oder um Fehler zu melden, statt das DOM abzufragen oder Framework-Interna wie `__vue_app__` zu lesen.

## Events

| DOM-Event | Ausgelöst |
| --- | --- |
| `tuvix:mounted` | Nachdem die App gerendert oder hydriert hat und die Mount-Callbacks ihres Frameworks gelaufen sind. |
| `tuvix:unmounted` | Nachdem die App zerstört und ihr Container geleert wurde. |
| `tuvix:error` | Wenn `mount` oder `unmount` einen Fehler wirft oder wenn eine React-App nach dem Mount beim Rendern einen Fehler wirft. |

Jedes Event ist ein `CustomEvent<LifecycleDetail>`, das auf dem Container der App ausgelöst wird. Es steigt auf (bubbles) und ist `composed`, daher empfängt es ein Listener auf `document`, auch aus einem Shadow Root heraus. Ist der Container nicht mehr im DOM (React hat eine Island entfernt, bevor ihr Modul `unmounted` gemeldet hat), wird das Event stattdessen auf `document` ausgelöst, und `detail.container` zeigt weiterhin auf das Element.

```ts
import type { LifecycleDetail } from '@tuvix.js/loader';

const detail: LifecycleDetail = {
  name: 'footer', // the app name
  container: document.body, // the element the app rendered into
  hydrated: true, // true when the adapter adopted server markup
  error: undefined, // the thrown value, on 'error' only
};
```

## Mit onLifecycle zuhören

```ts
import { onLifecycle } from 'tuvix.js';

const stopMounted = onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} is interactive (hydrated: ${hydrated})`);
});

const stopErrors = onLifecycle('error', ({ name, error }) => {
  console.error(`${name} failed`, error);
});

// later
stopMounted();
stopErrors();
```

`onLifecycle(type, handler, target = document)` gibt eine Funktion zurück, die den Listener entfernt. Übergib einen Container als `target`, um nur einen Bereich abzuhören. Ein einfaches `addEventListener('tuvix:mounted', ...)` funktioniert ebenfalls.

## Mit whenMounted warten

```ts
import { whenMounted } from 'tuvix.js';

const controller = new AbortController();
setTimeout(() => controller.abort(new Error('footer did not mount in 5 s')), 5000);

const { container } = await whenMounted('footer', { signal: controller.signal });
container.classList.add('is-ready');
```

- Das Promise wird sofort aufgelöst, wenn die App bereits gemountet ist. Die Reihenfolge von deinem Code und dem Mount spielt also keine Rolle.
- Es wird nicht abgelehnt, wenn der Mount fehlschlägt. Übergib ein `signal` mit Timeout oder höre zusätzlich auf `tuvix:error`.
- Bricht das Signal ab, wird das Promise mit dem Grund (reason) des Signals abgelehnt.

## Mit isMounted prüfen

```ts
import { isMounted } from 'tuvix.js';

if (isMounted('footer')) {
  console.log('footer is on the page');
}
```

## Framework-Sniffing ersetzen

Ohne Lifecycle-Events muss ein Host raten, wann eine Island bereit ist, etwa indem er wiederholt nach den privaten Properties eines Frameworks sucht:

```ts no-check
// Breaks on Svelte, Angular and any Vue release that renames the property.
const timer = setInterval(() => {
  if ((container as any).__vue_app__) {
    clearInterval(timer);
    startReveal(container);
  }
}, 50);
```

Mit Lifecycle-Events funktioniert ein Listener für jeden Adapter:

```ts
import { onLifecycle } from 'tuvix.js';

declare function startReveal(container: HTMLElement): void;

onLifecycle('mounted', ({ name, container }) => {
  if (name === 'footer') startReveal(container);
});
```

## Wer die Events auslöst

| Quelle | Löst aus |
| --- | --- |
| `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp` (und die `Ssr`-Varianten) | alle drei |
| `TuvixReactApp` | alle drei |
| `TuvixIsland` | selbst keines; das Modul, das es einbettet, löst sie aus |
| `defineMicroApp` | alle drei; mit `ssr: true` ist `hydrated` gleich `true`, wenn der Container vor `mount` Markup enthielt |
| Einfache `{ mount, unmount }`-Objekte | keines, außer du rufst `emitLifecycle` auf |
| Der Orchestrator | keines; er sendet stattdessen `tuvix:app:*`-Events auf dem Event Bus |

`defineMicroApp` löst `tuvix:mounted` aus, nachdem dein `mount` aufgelöst ist, `tuvix:unmounted`, nachdem dein `unmount` aufgelöst ist, und `tuvix:error` (und wirft den Fehler erneut), wenn einer der beiden einen Fehler wirft. Ein `unmount` für einen Container, dessen `mount` noch läuft, wartet darauf:

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'clock',
  ssr: true, // the server rendered the time into the container
  mount({ container }) {
    container.textContent = new Date().toISOString();
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Ein Modul, das als einfaches Objekt geschrieben ist, kann die Events selbst auslösen:

```ts
import { emitLifecycle, type MicroAppModule } from '@tuvix.js/loader';

export const clock: MicroAppModule = {
  mount({ container }) {
    container.textContent = new Date().toISOString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated: false });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
};
```

## Sonderfälle

- Ein Modul kann in mehreren Containern mounten. `isMounted(name)` bleibt `true`, solange einer davon gemountet ist, und `whenMounted(name)` wird mit dem frühesten noch gemounteten Container aufgelöst. Gib jeder Platzierung einen eigenen Namen, wenn du sie unterscheiden musst.
- Ein `tuvix:unmounted`-Event für einen abgelösten Container erreicht Listener auf `document` einmal. `onLifecycle` mit einem Container als `target` sieht es nicht, weil das Event dieses Element nicht mehr durchläuft.
- Der Zustand liegt auf `window.__TUVIX_RUNTIME__`, daher teilen separat gebündelte Kopien von `@tuvix.js/loader` ihn.
- Auf dem Server gibt es kein DOM und kein Event. Rufe `whenMounted` dort nicht auf; es wird nie aufgelöst.

## Was es nicht tut

- Es meldet keinen Ladefortschritt. Das `onStatusChange` des Orchestrators deckt `bootstrapping`, `mounting` und die übrigen Status ab.
- Es wiederholt nichts und stellt nichts wieder her. Nutze das `fallback` des Orchestrators oder `fallback` an `TuvixIsland` und `TuvixReactApp`.
