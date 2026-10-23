# Eventos de ciclo de vida

Os adaptadores e `defineMicroApp` avisam a página quando um micro app é montado, desmontado ou falha. Você pode escutar eventos DOM, aguardar `whenMounted(name)` ou consultar `isMounted(name)`. Use-os para iniciar uma animação assim que uma ilha estiver interativa, esconder um skeleton ou reportar erros, em vez de fazer polling no DOM ou ler internals do framework como `__vue_app__`.

## Eventos

| Evento DOM | Disparado |
| --- | --- |
| `tuvix:mounted` | Depois que o app foi renderizado ou hidratado e os callbacks de montagem do framework rodaram. |
| `tuvix:unmounted` | Depois que o app foi destruído e o container foi esvaziado. |
| `tuvix:error` | Quando `mount` ou `unmount` lança um erro, ou quando um app React lança um erro ao renderizar depois da montagem. |

Cada evento é um `CustomEvent<LifecycleDetail>` disparado no container do app. Ele faz bubbling e é `composed`, então um listener em `document` o recebe, mesmo de dentro de uma shadow root. Quando o container já não está no DOM (o React removeu uma ilha antes de o módulo dela informar `unmounted`), o evento é disparado em `document`, e `detail.container` continua apontando para o elemento.

```ts
import type { LifecycleDetail } from '@tuvix.js/loader';

const detail: LifecycleDetail = {
  name: 'footer', // the app name
  container: document.body, // the element the app rendered into
  hydrated: true, // true when the adapter adopted server markup
  error: undefined, // the thrown value, on 'error' only
};
```

## Escutar com onLifecycle

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

`onLifecycle(type, handler, target = document)` retorna uma função que remove o listener. Passe um container como `target` para escutar apenas uma região. Um `addEventListener('tuvix:mounted', ...)` simples também funciona.

## Aguardar com whenMounted

```ts
import { whenMounted } from 'tuvix.js';

const controller = new AbortController();
setTimeout(() => controller.abort(new Error('footer did not mount in 5 s')), 5000);

const { container } = await whenMounted('footer', { signal: controller.signal });
container.classList.add('is-ready');
```

- Ela resolve na hora quando o app já está montado, então a ordem entre o seu código e a montagem não importa.
- Ela não rejeita quando a montagem falha. Passe um `signal` com timeout, ou escute também `tuvix:error`.
- Quando o signal é abortado, a promise rejeita com o motivo do signal.

## Verificar com isMounted

```ts
import { isMounted } from 'tuvix.js';

if (isMounted('footer')) {
  console.log('footer is on the page');
}
```

## Substituir a detecção de framework

Sem eventos de ciclo de vida, um host precisa adivinhar quando uma ilha está pronta, por exemplo fazendo polling de propriedades privadas de um framework:

```ts no-check
// Breaks on Svelte, Angular and any Vue release that renames the property.
const timer = setInterval(() => {
  if ((container as any).__vue_app__) {
    clearInterval(timer);
    startReveal(container);
  }
}, 50);
```

Com eventos de ciclo de vida, um único listener funciona para todos os adaptadores:

```ts
import { onLifecycle } from 'tuvix.js';

declare function startReveal(container: HTMLElement): void;

onLifecycle('mounted', ({ name, container }) => {
  if (name === 'footer') startReveal(container);
});
```

## Quem dispara os eventos

| Origem | Dispara |
| --- | --- |
| `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp` (e as variantes `Ssr`) | os três |
| `TuvixReactApp` | os três |
| `TuvixIsland` | nenhum por conta própria; o módulo que ele hospeda os dispara |
| `defineMicroApp` | os três; com `ssr: true`, `hydrated` é `true` quando o container tinha markup antes de `mount` |
| Objetos `{ mount, unmount }` simples | nenhum, a menos que você chame `emitLifecycle` |
| O orquestrador | nenhum; ele emite eventos `tuvix:app:*` no event bus |

`defineMicroApp` dispara `tuvix:mounted` depois que o seu `mount` resolve, `tuvix:unmounted` depois que o seu `unmount` resolve, e `tuvix:error` (e depois relança o erro) quando qualquer um deles lança um erro. Um `unmount` para um container cujo `mount` ainda está rodando espera por ele:

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

Um módulo escrito como objeto simples pode disparar os eventos por conta própria:

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

## Casos extremos

- Um módulo pode ser montado em vários containers. `isMounted(name)` continua `true` enquanto qualquer um deles estiver montado, e `whenMounted(name)` resolve com o container mais antigo ainda montado. Dê a cada posição um nome próprio quando precisar diferenciá-las.
- Um evento `tuvix:unmounted` de um container desconectado chega uma vez aos listeners de `document`. `onLifecycle` com um container como `target` não o vê, porque o evento já não passa por esse elemento.
- O estado fica em `window.__TUVIX_RUNTIME__`, então cópias de `@tuvix.js/loader` em bundles separados o compartilham.
- No servidor não há DOM nem eventos. Não chame `whenMounted` ali; ela nunca resolve.

## O que isso não faz

- Não informa o progresso do carregamento. O `onStatusChange` do orquestrador cobre `bootstrapping`, `mounting` e os demais status.
- Não tenta de novo nem se recupera. Use o `fallback` do orquestrador, ou `fallback` em `TuvixIsland` e `TuvixReactApp`.
