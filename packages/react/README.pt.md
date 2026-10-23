# @tuvix.js/react

> Transforme componentes React em micro apps Tuvix.js e hospede qualquer micro app dentro de uma árvore React com hidratação SSR.

Parte do framework de microfrontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Instalação

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

Requer React 18 ou mais recente.

## Início rápido

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

O módulo se registra como `'dashboard'` por meio de `registerModule` de `@tuvix.js/loader`, então o orquestrador o encontra depois que o script carrega. Passe ao orquestrador uma `entry` como `() => import('./dashboard')`, um `container` e `props`.

## API

### `createReactMicroApp(config)`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome no registro; os eventos de ciclo de vida o carregam. |
| `App` | `ComponentType<P>` | obrigatório | Componente raiz. Recebe as props de montagem; as props obrigatórias são verificadas pelos tipos. |
| `bootstrap` | `() => void \| Promise<void>` | nenhum | Configuração executada uma única vez. |
| `ssr` | `boolean` | `false` | Hidrata com `hydrateRoot` quando o container contém markup do servidor (elementos ou texto que não seja só espaço em branco). |

- Cada container recebe sua própria raiz React, então um módulo pode ser montado em vários lugares.
- `mount({ container, props })` resolve depois do primeiro commit e dispara `tuvix:mounted` com `hydrated`.
- `update({ props, container })` renderiza de novo um container, ou todos eles quando não há `container`. O estado do componente é preservado.
- `unmount({ container })` desmonta a raiz, esvazia o container e dispara `tuvix:unmounted`.
- `react-dom/client` é carregado sob demanda dentro de `mount`, então bundles de servidor podem importar o módulo.

### `createSsrReactMicroApp(config)`

`createReactMicroApp({ ...config, ssr: true })`. Opções: `name`, `App`, `bootstrap`. Renderiza a mesma árvore que `TuvixReactApp`, então hidrata o markup de `TuvixReactApp` sem divergência.

### `TuvixIsland`

Hospeda qualquer módulo de micro app (Vue, Svelte, Angular, React ou um `{ mount, unmount, update? }` escrito à mão) dentro de uma árvore React.

| Prop | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Escrito em `data-tuvix-app` e repassado a `mount`. |
| `app` | `MicroAppModule` | obrigatório | O módulo a montar. |
| `props` | `Record<string, unknown>` | `{}` | Comparadas de forma rasa; uma mudança chama `app.update({ props, container })`, ou remonta quando o módulo não tem `update`. |
| `ssrHtml` | `string` | nenhum | HTML da ilha renderizado no servidor. Passe apenas no servidor. |
| `fallback` | `ReactNode` | `null` | Renderizado quando `mount` ou `update` rejeita. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Tag do wrapper. |
| `className` | `string` | nenhum | Classe do wrapper. |

Uma ponte escrita à mão com `<div dangerouslySetInnerHTML={{ __html }} />` perde o DOM e os listeners do micro app na próxima nova renderização do pai, porque o React atribui `innerHTML` de novo para cada novo objeto `{ __html }`. `TuvixIsland` cria esse objeto uma única vez. Durante a hidratação, ele encontra seu elemento por um atributo `data-tuvix-island` (vindo de `useId`) e lê o HTML de volta da página, então o cliente não precisa de `ssrHtml`. Um novo `name` ou `app` remonta; a remoção chama `app.unmount`. As chamadas rodam em ordem, então uma desmontagem aguarda uma montagem pendente.

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

Renderiza um micro app React inline na árvore hospedeira, dentro de `<div data-tuvix-app={name}>`.

| Prop | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Deve corresponder ao `name` do módulo. |
| `App` | `ComponentType<P>` | obrigatório | Componente a renderizar. |
| `fallback` | `ReactNode` | `null` | Exibido enquanto `App` está suspenso ou depois que ele lança um erro. |
| outras props | `P` | exigidas por `P` | Repassadas a `App`. |

`App` fica dentro de um error boundary e de um `<Suspense fallback>`. Um erro de renderização no servidor substitui apenas este app pelo `fallback`, e o React tenta de novo no cliente. Um erro de renderização no cliente exibe o `fallback` e dispara `tuvix:error`. Ele dispara `tuvix:mounted` (com `hydrated`) e `tuvix:unmounted`.

### `useTuvixBus(bus, event, handler)`

Faz a inscrição em um effect e cancela a inscrição na desmontagem. O `handler` mais recente fica guardado em um ref, então não há nova inscrição a cada renderização. Passe `getGlobalBus()` de `@tuvix.js/event-bus`; o adaptador não entrega o bus do orquestrador a `App`.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

Retorna props que mesclam cada payload de `updateEvent` (padrão `'tuvix:props:update'`) em `bus`. Nada no Tuvix emite esse evento; quem o emite é você. Módulos criados com `createReactMicroApp` recebem novas props por `update` sem este hook.

### Tipos

`ReactMicroAppConfig<P>`, `TuvixIslandProps`, `TuvixReactAppProps<P>`.

## Casos extremos

- Um erro lançado na primeira renderização rejeita `mount`, esvazia o container e dispara `tuvix:error`. Um erro posterior deixa o app em branco até você remontá-lo.
- `unmount` durante um `mount` pendente aguarda esse `mount` e deixa o container vazio.
- `mount` em um container que o módulo já controla desmonta a raiz antiga (disparando `tuvix:unmounted`) e renderiza do zero com as novas props, como os adaptadores de Vue, Svelte e Angular.
- `unmount` e `update` em um container desconhecido não fazem nada.
- Quando o React remove um `TuvixIsland`, o módulo informa `tuvix:unmounted` depois que o elemento é desanexado. O evento vai para `document` (com `detail.container` definido), então listeners em `document` e `onLifecycle` o recebem; listeners no container ou em seus ancestrais não. `isMounted(name)` passa a `false` quando nenhum container do app está montado.
- Com `<StrictMode>` em desenvolvimento, o React executa o effect de montagem da ilha duas vezes, mas a ilha ignora a primeira execução descartada: o módulo monta uma única vez e adota o markup do servidor.
- Depois de uma montagem com falha, um novo `app` ou `name` monta em um elemento vazio. Ele nunca recebe o HTML de servidor do app que falhou.

## O que ele não faz

- Carregar módulos por URL. Use `@tuvix.js/core` ou `@tuvix.js/loader`.
- Renderizar para string. Use `react-dom/server`, ou `renderVueToString` e similares para `ssrHtml`.
- Carregar o CSS das ilhas. Use `@tuvix.js/vite`.

## Breaking changes na 0.5

- O HTML de servidor de `TuvixReactApp` agora tem marcadores de comentário do Suspense; atualize servidor e cliente juntos.
- `mount` rejeita quando a primeira renderização lança um erro.
- `unmount` em um container que o módulo nunca montou não faz nada.

Documentação completa: [tuvix.js.org/packages/react](https://tuvix.js.org/packages/react)

## Licença

MIT
