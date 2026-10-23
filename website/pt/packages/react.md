---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="Bindings para React"
  description="Transforme um componente React em um micro app Tuvix.js e hospede qualquer micro app (Vue, Svelte, Angular, React, vanilla) dentro de uma árvore React, com renderização no servidor e hidratação."
  icon="⚛️"
  npm="true"
/>

## Instalação

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

O pacote requer React 18 ou mais recente (faixa de peer `>=18.0.0` para `react` e `react-dom`). Ele depende de `@tuvix.js/loader` e `@tuvix.js/event-bus`.

## Quando usar

O pacote cobre duas direções:

- **React como micro app.** `createReactMicroApp` e `createSsrReactMicroApp` envolvem um componente React no módulo `{ bootstrap, mount, unmount, update }` que o orquestrador e o loader esperam. Use-os quando um app React for um dos micro apps que um shell Tuvix carrega.
- **React como host.** `TuvixIsland` monta qualquer módulo de micro app dentro de uma página React e mantém o DOM dele intacto entre re-renderizações. `TuvixReactApp` renderiza um micro app React inline na árvore do host. Use-os quando o seu shell for um framework React com SSR, como TanStack Start, Next.js ou Remix.

Se o seu shell for HTML puro sem React, você precisa apenas do primeiro par mais [`@tuvix.js/core`](/pt/packages/core). Para um micro app Vue, Svelte ou Angular, use [`@tuvix.js/vue`](/pt/packages/vue), [`@tuvix.js/svelte`](/pt/packages/svelte) ou [`@tuvix.js/angular`](/pt/packages/angular) para criar o módulo; `TuvixIsland` pode hospedar qualquer um deles.

## Início rápido

Crie o módulo do micro app:

```tsx
// src/dashboard.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Registre-o no shell. O orquestrador chama `mount` quando a rota corresponde e `update` quando você altera as props:

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

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome sob o qual o módulo se registra por meio de `registerModule` de `@tuvix.js/loader`. Os eventos de ciclo de vida o carregam. |
| `App` | `ComponentType<P>` | obrigatório | Componente raiz. Ele recebe as props de montagem como suas próprias props, então um componente com props obrigatórias como `{ page: 'privacy' \| 'terms' }` passa na checagem de tipos. |
| `bootstrap` | `() => void \| Promise<void>` | nenhum | Configuração executada uma única vez. O `bootstrap()` do módulo aguarda sua conclusão. |
| `ssr` | `boolean` | `false` | Hidrata a marcação do servidor com `hydrateRoot` quando o container contém elementos ou texto que não seja só espaço em branco. Um container com apenas espaços em branco ou comentários recebe uma renderização nova com `createRoot`. |

O módulo retornado tem quatro métodos:

- `mount({ container, props })` cria uma raiz React para aquele container. Ele resolve depois que o React faz o commit da primeira renderização e então dispara `tuvix:mounted` no container com `hydrated: true` ou `false`. Se `App` suspender na primeira renderização, `mount` aguarda até o conteúdo ser commitado.
- `update({ props, container })` re-renderiza `App` com `props` naquele container. Sem `container`, ele re-renderiza todos os containers que o módulo montou. O React mantém o state do componente porque a árvore mantém sua forma.
- `unmount({ container })` desmonta a raiz, esvazia o container com `replaceChildren()` e dispara `tuvix:unmounted`.
- `bootstrap()` executa `config.bootstrap`.

Cada container recebe sua própria raiz, então um módulo pode ser montado em vários lugares ao mesmo tempo:

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

O módulo importa `react-dom/client` de forma lazy dentro de `mount`. Um bundle de servidor pode importar o módulo (por exemplo, para compartilhar `App` com `TuvixReactApp`) sem trazer junto o renderizador do cliente.

### `createSsrReactMicroApp`

```ts no-check
function createSsrReactMicroApp<P extends object = Record<string, unknown>>(
  config: Omit<ReactMicroAppConfig<P>, 'ssr'>
): MicroAppModule;
```

Equivale a `createReactMicroApp({ ...config, ssr: true })`. Opções: `name`, `App`, `bootstrap`, como na tabela acima.

Use-o no cliente quando o container já contém HTML que o servidor renderizou para o mesmo componente. A árvore que ele renderiza é igual à que `TuvixReactApp` renderiza (error boundary mais `<Suspense>`), então ele hidrata a marcação de `TuvixReactApp` sem divergência:

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

| Prop | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome do micro app. A ilha o escreve em `data-tuvix-app` e o passa para `app.mount`. |
| `app` | `MicroAppModule` | obrigatório | O módulo a montar: o resultado de `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp`, `createReactMicroApp`, suas variantes `createSsr*` ou um objeto `{ mount, unmount, update? }` escrito à mão. |
| `props` | `Record<string, unknown>` | `{}` | Props para o módulo. A ilha as compara de forma rasa (shallow) a cada renderização. |
| `ssrHtml` | `string` | nenhum | O HTML da ilha renderizado no servidor, por exemplo de `renderVueToString`. Passe-o apenas no servidor. |
| `fallback` | `ReactNode` | `null` | Renderizado no lugar da ilha quando `mount` ou `update` rejeita. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Tag do elemento wrapper. |
| `className` | `string` | nenhum | Nome de classe do elemento wrapper. |

`TuvixIsland` hospeda um micro app que não é React (ou um app React empacotado separadamente) dentro de uma página React. Uma ponte escrita à mão que renderiza <span v-pre>`<div dangerouslySetInnerHTML={{ __html: html }} />`</span> quebra na primeira re-renderização do pai: o React vê um novo objeto `{ __html }`, atribui `innerHTML` de novo e destrói o DOM e os listeners que o micro app anexou. `TuvixIsland` evita isso:

- **Renderização no servidor.** Ela renderiza `<div data-tuvix-app={name} data-tuvix-island={id}>` com `ssrHtml` como HTML interno. `id` vem do `useId` do React, então o servidor e o cliente calculam o mesmo valor.
- **Hidratação.** Na primeira renderização no cliente, ela encontra o próprio elemento na página por meio de `data-tuvix-island` e lê de volta o HTML interno a partir do DOM. Você não envia `ssrHtml` ao cliente uma segunda vez, e a renderização no cliente corresponde à renderização no servidor.
- **DOM estável.** A ilha cria seu objeto `{ __html }` uma única vez, em `useState`. As renderizações seguintes reutilizam esse objeto, então o React nunca reescreve os filhos da ilha. As re-renderizações do pai preservam os nós e os listeners do micro app.
- **Montagem.** Após o primeiro commit, a ilha chama `app.mount({ container, props, name })`. Um módulo criado com `ssr: true` (`createSsrVueMicroApp` e similares) adota ali o DOM do servidor. Um módulo sem SSR renderiza do zero no container.
- **Props.** Quando `props` muda de forma rasa (chaves diferentes, ou um valor que falha em `Object.is`), a ilha chama `app.update({ props, container })`. Um módulo sem `update` recebe `unmount`, um container esvaziado e um novo `mount`. Um objeto literal inline com os mesmos valores não dispara uma atualização.
- **Identidade.** Um novo `name` ou `app` desmonta o módulo antigo e monta o novo.
- **Remoção.** Quando a ilha sai da árvore, ela chama `app.unmount({ container })` e esvazia o container.
- **Ordenação.** As chamadas de mount, update e unmount rodam uma após a outra. Um unmount que chega enquanto `mount` está pendente aguarda por ele.
- **Erros.** Se `mount` ou `update` rejeitar, a ilha renderiza `fallback` no lugar do wrapper. Os adaptadores disparam `tuvix:error` por conta própria; a ilha não adiciona nenhum evento. Uma mudança posterior de `name` ou `app` tenta de novo.

Uma configuração completa de servidor e cliente com um rodapé Vue dentro de um layout React:

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

O HTML do servidor chega ao navegador antes de qualquer JavaScript, então o rodapé fica visível e estilizado na primeira pintura assim que você imprime as folhas de estilo dele no `<head>`. [`@tuvix.js/vite`](/pt/packages/vite) fornece essas tags `<link>`.

### `TuvixReactApp`

```ts no-check
function TuvixReactApp<P extends object>(props: TuvixReactAppProps<P>): ReactElement;
```

| Prop | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome do micro app, escrito em `data-tuvix-app`. Use o mesmo `name` que você passa para `createSsrReactMicroApp`. |
| `App` | `ComponentType<P>` | obrigatório | Componente a renderizar. |
| `fallback` | `ReactNode` | `null` | Exibido enquanto `App` suspende e depois que ele lança um erro. |
| demais props | `P` | exigidas por `P` | Passadas para `App`. |

`TuvixReactApp` renderiza um micro app React inline, como parte da árvore React do host, então o seu framework SSR renderiza o HTML dele. Ele gera `<div data-tuvix-app={name}>` e envolve `App` em um error boundary e em um `<Suspense fallback>`:

- **Erros no servidor ficam locais.** Um erro lançado dentro de `App` durante a renderização no servidor faz o React renderizar `fallback` apenas para este app. O restante da página é renderizado, e o React tenta `App` de novo no cliente.
- **Erros no cliente ficam locais.** O error boundary captura erros de renderização no cliente, exibe `fallback` e dispara `tuvix:error` no wrapper.
- **Eventos de ciclo de vida.** Após o primeiro commit, ele dispara `tuvix:mounted`. `hydrated` é `true` quando o wrapper veio do HTML do servidor. Quando o componente sai da árvore, ele dispara `tuvix:unmounted` antes de o React desanexar o wrapper, então um listener em `document` o recebe. Se um boundary `<Suspense>` já exibido suspender de novo, o app reporta `unmounted` e depois `mounted` quando o conteúdo voltar.

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

Para hospedar um micro app Vue, Svelte, Angular ou vanilla, use `TuvixIsland`.

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): void;
```

Inscreve `handler` em `event` no `bus` dentro de um effect e cancela a inscrição na desmontagem. O hook guarda o `handler` mais recente em uma ref, então um handler que lê state atualizado não se reinscreve a cada renderização. Um novo `bus` ou `event` refaz a inscrição. A inscrição existe apenas no cliente; effects não rodam durante a renderização no servidor.

Os adaptadores não passam o bus do orquestrador para `App`. O orquestrador usa `getGlobalBus()`, a menos que você tenha passado opções `eventBus` a ele, então leia o bus de lá:

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

| Argumento | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `initialProps` | `T` | obrigatório | Valor inicial. O hook o lê na primeira renderização e ignora mudanças posteriores. |
| `bus` | `IEventBus` | nenhum | Bus a escutar. Sem ele, o hook retorna `initialProps` inalterado. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Evento cujo payload o hook mescla nas props atuais (`{ ...prev, ...payload }`). |

Nem o orquestrador nem os adaptadores emitem `tuvix:props:update`. Você mesmo o emite. Um módulo criado com `createReactMicroApp` não precisa deste hook para as props do orquestrador: `update({ props })` re-renderiza `App` com as novas props.

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
| `ReactMicroAppConfig<P>` | Configuração de `createReactMicroApp`: `name`, `App`, `bootstrap?`, `ssr?`. |
| `TuvixIslandProps` | Props de `TuvixIsland`: `name`, `app`, `props?`, `ssrHtml?`, `fallback?`, `as?`, `className?`. |
| `TuvixReactAppProps<P>` | Props de `TuvixReactApp`: `name`, `App`, `fallback?`, mais as props de `App`. |

## Casos extremos

- **A primeira renderização lança um erro.** `mount` rejeita com o erro, desmonta a raiz, esvazia o container e dispara `tuvix:error`. Na 0.4, `mount` resolvia e o erro chegava ao handler de erros da raiz do React.
- **Uma renderização posterior lança um erro.** O error boundary deixa o app em branco e dispara `tuvix:error`. A página host continua rodando. O app fica em branco até você desmontá-lo e montá-lo de novo; `update` não o traz de volta.
- **Desmontagem durante a montagem.** Um `unmount` que chega enquanto `mount` ainda está carregando `react-dom/client` ou aguardando o primeiro commit aguarda por ele, deixa o container vazio e não dispara nenhum evento `mounted`.
- **Montar duas vezes no mesmo container.** Um segundo `mount` em um container que o módulo já controla desmonta a raiz antiga, dispara `tuvix:unmounted`, depois renderiza do zero com as novas props e dispara `tuvix:mounted`. O state do componente é reiniciado. Os adaptadores de Vue, Svelte e Angular fazem o mesmo. Chame `update` para manter o state.
- **Container desconhecido.** `unmount` e `update` em um container que o módulo nunca montou não fazem nada.
- **As props são substituídas.** O `update` do módulo renderiza `App` com as props que você passa e nada mais. `orchestrator.updateAppProps` mescla as novas props sobre as registradas antes de chamar `update`.
- **Container só com espaços em branco e `ssr: true`.** O módulo renderiza do zero, porque `hasServerMarkup` ignora texto de espaço em branco e comentários.
- **Ilha removida pelo React.** O React desanexa o elemento da ilha antes de o módulo reportar `tuvix:unmounted`. `emitLifecycle` então dispara o evento em `document` em vez do elemento desanexado, então um listener em `document` (ou `onLifecycle` de `@tuvix.js/loader`) ainda o recebe, com `detail.container` indicando o elemento removido. Um listener no próprio container ou em um ancestral não o recebe. `isMounted(name)` continua `true` enquanto o app estiver montado em qualquer outro container e passa a `false` depois que o último for desmontado.
- **Ilha sob `<StrictMode>` em desenvolvimento.** O React executa o effect de montagem, a limpeza dele e o effect de novo. A ilha enfileira as chamadas ao módulo e ignora a primeira execução porque a limpeza dela já rodou, então o módulo monta uma única vez e adota o DOM do servidor.
- **Novo app depois de uma montagem com falha.** Quando `mount` rejeita, a ilha descarta o HTML do servidor. Se você então passar um `app` ou `name` diferente, o novo módulo monta em um elemento vazio em vez de adotar a marcação do app que falhou.
- **Alterar `ssrHtml` na ilha.** A ilha lê `ssrHtml` apenas na primeira renderização. Passe conteúdo novo por meio de `props`.
- **O mesmo nome duas vezes.** `registerModule` mantém o último módulo criado com um mesmo nome.

## O que ele não faz

- Ele não carrega módulos por URL. Importe o módulo ou deixe que [`@tuvix.js/core`](/pt/packages/core) o carregue por meio de um `entry`.
- Ele não renderiza um micro app para string. No servidor, use `renderToString` de `react-dom/server` com `TuvixReactApp`, ou o renderizador do próprio framework (`renderVueToString` de [`@tuvix.js/vue/server`](/pt/packages/vue), os equivalentes de Svelte e Angular) e passe o resultado para `TuvixIsland` como `ssrHtml`.
- Ele não passa `MountContext.bus` nem `MountContext.name` para `App`. Use `getGlobalBus()` de `@tuvix.js/event-bus`.
- Ele não carrega o CSS da ilha. Use [`@tuvix.js/vite`](/pt/packages/vite) para imprimir links de folhas de estilo para ilhas renderizadas no servidor.
- Ele não suporta React 17 ou versões anteriores.

## Migração a partir da 0.4

**O HTML de servidor de `TuvixReactApp` tem marcadores de Suspense.** O wrapper agora contém `<!--$-->…<!--/$-->` ao redor do app. Atualize `@tuvix.js/react` no servidor e no cliente ao mesmo tempo, ou a hidratação falha com uma divergência.

**`mount` rejeita quando a primeira renderização lança um erro.** Se você aguardava `mount` esperando que ele resolvesse, capture o erro:

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

**`unmount` em um container desconhecido não faz nada.** Na 0.4 ele limpava o container. Chame `container.replaceChildren()` você mesmo se dependia disso.

**Objeto de configuração.** Versões anteriores desta página mostravam `createReactMicroApp(App)`. A função recebe um objeto de configuração: `createReactMicroApp({ name: 'dashboard', App })`.

Veja o [guia de React](/pt/guide/react) para mais exemplos passo a passo.
