# Com React

`@tuvix.js/react` faz três trabalhos. `createReactMicroApp` transforma um componente React em um micro app que qualquer shell pode montar. `TuvixReactApp` renderiza um micro app React dentro de uma página host React, com renderização no servidor. `TuvixIsland` hospeda um micro app Vue, Svelte, Angular, React ou escrito à mão dentro de uma página React.

Requer React 18 ou 19.

## Instalação

```bash
pnpm add @tuvix.js/react react react-dom
```

## Transforme um componente em micro app

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

O módulo:

- se registra sob `name`, para que uma entry de URL o encontre;
- cria uma raiz React por container, para que um módulo possa ser montado em vários lugares;
- resolve `mount` depois que o React faz o commit da primeira renderização e então dispara `tuvix:mounted` no container;
- passa as props do shell para `App` como props dele. `App` pode declarar props obrigatórias; o adaptador não as verifica em tempo de execução.

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `name` | `string` | Obrigatório. Deve ser igual ao nome do app registrado. |
| `App` | `ComponentType<P>` | Obrigatório. Componente raiz. |
| `bootstrap` | `() => void \| Promise<void>` | Roda uma vez antes da primeira montagem. |
| `ssr` | `boolean` | Hidrata quando o container contém markup do servidor. `createSsrReactMicroApp` define essa opção. |

## Props e atualizações

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'light' });
```

`update({ props, container })` renderiza de novo a raiz daquele container com as props mescladas. O state do componente é preservado. Sem `container`, renderiza de novo todas as raízes do módulo. Chamar `mount` em um container no qual este módulo já renderizou faz uma nova renderização em vez de criar uma segunda raiz.

## Erros

O adaptador envolve `App` em um error boundary:

- Um erro lançado durante a primeira renderização rejeita `mount`, esvazia o container e dispara `tuvix:error`. O orquestrador então mostra o HTML de `fallback` do app.
- Um erro lançado depois disso deixa o app em branco e dispara `tuvix:error`. O resto da página continua funcionando.

## Apps React renderizados no servidor

Quando a página host é React e renderiza no servidor (TanStack Start, Next.js, Remix ou o seu próprio `renderToString`), renderize o micro app inline com `TuvixReactApp`:

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

- Ele renderiza `<div data-tuvix-app="legal">` em volta de `App`, então o HTML vem da própria renderização no servidor do host.
- Todas as props, exceto `name`, `App` e `fallback`, vão para `App`.
- `App` fica no seu próprio `<Suspense fallback>`. Se ele lançar um erro no servidor, o React envia o fallback apenas para este app e tenta o app de novo no cliente.
- No cliente, um error boundary mostra `fallback` e dispara `tuvix:error`.
- Depois do primeiro commit, ele dispara `tuvix:mounted` com `hydrated: true` quando hidratou HTML do servidor, e `tuvix:unmounted` quando sai da árvore.

Quando um bundle separado precisa hidratar esse markup (por exemplo, uma página composta por `@tuvix.js/server`), exporte o mesmo componente com `createSsrReactMicroApp`. Ele renderiza a mesma árvore de Suspense, então a hidratação corresponde:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export default createSsrReactMicroApp({ name: 'legal', App: LegalPage });
```

Com `ssr: true`, um container que contém apenas espaços em branco ou comentários recebe uma renderização nova em vez de uma hidratação.

## Hospede outros micro apps com TuvixIsland

`TuvixIsland` monta qualquer módulo de micro app dentro de uma árvore React:

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

| Prop | Descrição |
| --- | --- |
| `name` | Escrito em `data-tuvix-app` e passado para `mount`. |
| `app` | O módulo a montar. |
| `props` | Comparadas de forma rasa a cada renderização. Uma mudança chama `app.update`, ou desmonta + monta quando o módulo não tem `update`. |
| `ssrHtml` | HTML do servidor para a ilha. Necessário apenas no servidor. |
| `fallback` | Renderizado no lugar da ilha quando `mount` ou `update` é rejeitado. |
| `as`, `className` | Tag do wrapper (padrão `div`) e classe. |

O React nunca reescreve o HTML interno da ilha depois da primeira renderização, então novas renderizações do pai preservam o DOM e os listeners que o módulo anexou. Um novo `name` ou `app` remonta; remover a ilha chama `app.unmount`. Montagem, atualização e desmontagem rodam uma depois da outra, então uma desmontagem que chega durante `mount` espera por ele.

`TuvixIsland` não carrega módulos por URL. Importe o módulo, ou deixe o orquestrador gerenciar entries de URL. A configuração completa no servidor está em [Ilhas SSR](/pt/guide/ssr-islands).

## Hooks

### useTuvixBus

Assina na montagem e cancela a assinatura na desmontagem. Ele lê o `handler` mais recente por meio de uma ref, então um handler inline não refaz a assinatura a cada renderização:

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

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` retorna um state que incorpora cada payload emitido em `updateEvent`. Nada no Tuvix.js emite esse evento; emita-o você mesmo quando quiser enviar props pelo bus em vez de `updateAppProps`.

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

## O que o adaptador não faz

- Ele não compartilha uma raiz React entre micro apps. Cada app, e cada container, recebe a sua.
- Ele não deduplica o React. Dois micro apps React com bundles separados levam duas cópias do React.
- Ele não renderiza o `<head>` da página host. Títulos e meta tags pertencem ao host.

## API

| Export | Finalidade |
| --- | --- |
| `createReactMicroApp({ name, App, bootstrap?, ssr? })` | Módulo de micro app React |
| `createSsrReactMicroApp({ name, App, bootstrap? })` | O mesmo com `ssr: true` |
| `TuvixReactApp` | Micro app React inline em um host React, com SSR |
| `TuvixIsland` | Hospeda qualquer módulo de micro app em uma árvore React, com SSR |
| `useTuvixBus(bus, event, handler)` | Assinatura do event bus vinculada ao componente |
| `useTuvixProps(initial, bus?, event?)` | Props mescladas a partir de eventos do bus |
