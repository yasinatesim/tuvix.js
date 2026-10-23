# Ilhas SSR

Uma ilha é um micro app que o servidor renderiza como HTML dentro de uma página React e que o navegador hidrata com o próprio framework. Com o `TuvixIsland` de `@tuvix.js/react`, um único host React pode conter ilhas Vue, Svelte, Angular e React. O usuário vê o conteúdo já estilizado antes de qualquer JavaScript rodar, e cada ilha fica interativa assim que o framework dela carrega.

## O que você precisa

| Peça | Pacote | Roda em |
| --- | --- | --- |
| Página host React com renderização no servidor | seu app (`react-dom/server`, TanStack Start, ...) | servidor + cliente |
| `TuvixIsland`, `TuvixReactApp` | `@tuvix.js/react` | servidor + cliente |
| Módulos de ilha: `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`, `createSsrReactMicroApp` | adaptadores | cliente |
| `renderVueToString`, `renderSvelteToString`, `renderAngularToString` | `@tuvix.js/<adapter>/server` | somente servidor |
| `getAssets`, `renderAssetTags` | `@tuvix.js/vite` | somente servidor |

Nenhum orquestrador participa. O próprio `TuvixIsland` chama `mount`, `update` e `unmount` do módulo da ilha.

## Como uma requisição flui

```text
server                                         browser
──────                                         ───────
renderVueToString(Card, props) ─┐
                                ▼
<TuvixIsland ssrHtml={html}> renders           HTML arrives, CSS links in <head>
<div data-tuvix-app="card">…html…</div>   ──►  apply → styled first paint
getAssets([...]) → <link rel=stylesheet>
                                               hydrateRoot(host)
                                               TuvixIsland reads its innerHTML from the DOM
                                               React leaves the island's children alone
                                               useEffect → card.mount({ container, props })
                                               Vue adapter: createSSRApp → hydrates in place
                                               tuvix:mounted { hydrated: true }
```

## 1. Configure o Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [react(), vue(), svelte(), tuvix()],
});
```

Adicione `"@tuvix.js/vite/client"` a `compilerOptions.types` para que o TypeScript reconheça `virtual:tuvix/assets`.

## 2. Crie os módulos de ilha

Cada ilha exporta um módulo criado com a variante `Ssr` do seu adaptador. Esses arquivos rodam no navegador e não devem importar renderizadores de servidor.

```ts
// src/islands/vue-card/index.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import VueCard from './VueCard.vue';

export const vueCard = createSsrVueMicroApp({ name: 'vue-card', App: VueCard });
```

```ts
// src/islands/svelte-counter/index.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Counter from './Counter.svelte';

// SvelteMap makes TuvixIsland prop changes update in place instead of remounting.
export const svelteCounter = createSsrSvelteMicroApp({ name: 'svelte-counter', App: Counter, SvelteMap });
```

```ts
// src/islands/angular-contact/index.ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { ContactComponent } from './contact.component';

export const angularContact = createSsrAngularMicroApp({ name: 'angular-contact', component: ContactComponent });
```

## 3. Renderize o HTML das ilhas no servidor

Mantenha os renderizadores de servidor em um módulo que só o código de servidor importa:

```ts
// src/server/render-islands.ts (server only)
import { renderVueToString } from '@tuvix.js/vue/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import { renderAngularToString } from '@tuvix.js/angular/server';
import { render } from 'svelte/server';
import VueCard from '../islands/vue-card/VueCard.vue';
import Counter from '../islands/svelte-counter/Counter.svelte';
import { ContactComponent } from '../islands/angular-contact/contact.component';

export async function renderIslands(): Promise<Record<string, string>> {
  const [card, counter, contact] = await Promise.all([
    renderVueToString(VueCard, { title: 'Hello' }),
    renderSvelteToString(Counter, { start: 3 }, { render }),
    renderAngularToString(ContactComponent, { appId: 'contact', props: { heading: 'Write to us' } }),
  ]);
  return { 'vue-card': card, 'svelte-counter': counter, 'angular-contact': contact };
}
```

As funções `render*ToString` são exclusivas do servidor. No navegador elas retornam `''`. Chame-as a partir de código que nunca roda no navegador: sua entry de servidor, uma rota de API ou uma função de servidor do framework, como o `createServerFn` do TanStack Start. Não as chame a partir de um loader de rota isomórfico. Esse loader também roda no navegador durante a navegação no cliente, onde recebe `''`, e o seu bundler envia o renderizador de servidor do Vue, Svelte ou Angular para o cliente porque o loader o importa.

## 4. Coloque as ilhas na página

```tsx
// src/pages/Home.tsx
import { createContext, useContext } from 'react';
import { TuvixIsland } from '@tuvix.js/react';
import { vueCard } from '../islands/vue-card';
import { svelteCounter } from '../islands/svelte-counter';

// Filled by the server entry; empty on the client.
export const IslandHtml = createContext<Record<string, string>>({});

export function Home() {
  const html = useContext(IslandHtml);
  return (
    <main>
      <TuvixIsland
        name="vue-card"
        app={vueCard}
        props={{ title: 'Hello' }}
        ssrHtml={html['vue-card']}
        fallback={<p>The card failed to load.</p>}
      />
      <TuvixIsland name="svelte-counter" app={svelteCounter} props={{ start: 3 }} ssrHtml={html['svelte-counter']} />
    </main>
  );
}
```

Passe as mesmas props no servidor e no cliente. Se o servidor renderizou com `{ start: 3 }` e o cliente monta com `{ start: 4 }`, o framework detecta uma divergência de hidratação.

## 5. Vincule o CSS das ilhas no head

O Vite injeta CSS Modules, blocos `<style>` do Vue e estilos do Svelte a partir do JavaScript. Sem ajuda, o HTML do servidor chega ao navegador antes desse JavaScript, e a primeira pintura sai sem estilo (FOUC). `getAssets` retorna as URLs das folhas de estilo de que uma entry precisa, para que o servidor possa vinculá-las no `<head>`:

```tsx
// src/entry-server.tsx
import { renderToString } from 'react-dom/server';
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { Home, IslandHtml } from './pages/Home';
import { renderIslands } from './server/render-islands';

export async function render(): Promise<string> {
  const [islandHtml, assets] = await Promise.all([
    renderIslands(),
    getAssets(['src/entry-client.tsx', 'src/pages/Home.tsx']),
  ]);

  const body = renderToString(
    <IslandHtml.Provider value={islandHtml}>
      <Home />
    </IslandHtml.Provider>,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <title>Home</title>
    ${renderAssetTags(assets)}
  </head>
  <body>
    <div id="app">${body}</div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>`;
}
```

- Passe caminhos de módulo relativos à raiz do Vite. Em um build de produção, cada caminho precisa ser um input do build ou o alvo de um `import()` no build do cliente; qualquer outro caminho é rejeitado.
- Se o Rollup juntar dois alvos de `import()` em um único chunk, o manifest lista esse chunk pelo nome com hash em vez do caminho do seu módulo, e `getAssets` rejeita esse caminho. O exemplo esbarra nisso quando `@angular/core` cai em um chunk de página, e resolve com `manualChunks`, que dá a `@angular/core` um chunk próprio.
- `getAssets` segue imports estáticos e ignora alvos de `import()`. Uma página ou ilha importada de forma lazy que é renderizada no servidor precisa de uma entrada própria na lista.
- Em dev, ele retorna URLs de CSS com `?direct` e, assim que o Vite injeta o próprio `<style>`, desativa o `<link>` correspondente, para que as edições via HMR sejam aplicadas.
- Ilhas Angular levam os estilos inline: `renderAngularToString` coloca as tags `<style>` do componente antes do markup.
- Svelte: compile com `css: 'injected'` (estilos inline no HTML da ilha) ou mantenha `emitCss` e vincule os estilos com `getAssets`. Não os dois.

## 6. Hidrate no cliente

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Home } from './pages/Home';

hydrateRoot(document.getElementById('app')!, <Home />);
```

O cliente renderiza sem o HTML das ilhas. Cada `TuvixIsland` lê o próprio markup da página durante a hidratação, o React mantém esses nós e o módulo da ilha os hidrata.

## Por que o HTML não é enviado duas vezes

Uma ilha ingênua passa o HTML do servidor como prop nos dois lados. Nesse caso, o React precisa da string no cliente para hidratar `dangerouslySetInnerHTML`, então o HTML trafega uma vez no documento e outra vez nos dados de hidratação. Além disso, cada nova renderização do pai com um novo objeto `{ __html }` faz o React atribuir `innerHTML` de novo, o que apaga o DOM e os listeners que o framework da ilha anexou.

O `TuvixIsland` evita os dois problemas:

- No servidor, ele escreve `ssrHtml` em `<div data-tuvix-app={name} data-tuvix-island={id}>`.
- Durante a hidratação, ele encontra esse elemento pelo atributo `data-tuvix-island` baseado em `useId` e lê o `innerHTML` uma vez. O cliente nunca precisa de `ssrHtml`.
- Ele guarda o objeto `{ __html }` no state, então as renderizações seguintes entregam ao React o mesmo objeto e o React nunca reescreve os filhos da ilha.

O que o seu framework faz com os dados do loader é outra questão. Se você retornar o HTML da ilha de um loader do TanStack Start ou do Remix, o framework também serializa o resultado desse loader na página. Entregue o HTML à ilha por algo que o framework não serializa, como um contexto React preenchido pelo sua entry de servidor, como no passo 4.

## Estado por requisição

O código de servidor atende muitas requisições em um único processo. Tudo o que você cria no escopo do módulo é compartilhado entre todas elas.

- Crie um cache de dados, como o `QueryClient` do TanStack Query, por requisição, e não no escopo do módulo. Um client no nível do módulo no servidor mistura dados entre requisições e usuários, e as entradas desatualizadas dele causam divergências de hidratação.
- Passe os dados de que uma ilha precisa como props, a partir do cache da própria requisição. O módulo da ilha cria o próprio estado no cliente ao montar.
- Formate datas e números com `timeZone` e locale explícitos. O servidor normalmente roda em UTC e o navegador no fuso do usuário; `Intl.DateTimeFormat` sem `timeZone` renderiza um dia diferente perto da meia-noite e quebra a hidratação.

```tsx
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

declare function createRequestCache(): { dehydrate(): unknown };
declare function Page(props: { data: unknown }): ReactElement;

export function renderRequest(): string {
  const cache = createRequestCache(); // one per request
  return renderToString(<Page data={cache.dehydrate()} />);
}
```

## Tags head e meta pertencem ao host

As ilhas são renderizadas em uma `<div>` no body. Elas não devem emitir `<title>`, `<meta>` ou `<link rel=canonical>`. Defina essas tags no host (pela API de head do seu framework ou no template HTML). Para componentes Svelte que usam `<svelte:head>`, chame `renderSvelte` em vez de `renderSvelteToString` e coloque você mesmo a saída `head` no head do documento.

## Erros

- Se o `mount` ou o `update` da ilha rejeitar, o `TuvixIsland` renderiza o `fallback` no lugar. O adaptador já terá disparado `tuvix:error`.
- Se um renderizador de servidor lançar um erro, o seu código de servidor decide: capture o erro e não passe `ssrHtml`; a ilha começa vazia e é renderizada no cliente.
- O `TuvixReactApp` envolve o componente em `<Suspense>`, então um erro de renderização no servidor substitui apenas aquele app pelo `fallback` dele, e o React tenta de novo no cliente.

Observe as ilhas a partir do código da página com `onLifecycle('mounted', ...)` e `onLifecycle('error', ...)`; veja [Eventos de ciclo de vida](/pt/guide/lifecycle-events).

## Projeto de exemplo

`examples/with-ssr-islands` no repositório junta tudo isso: um servidor Express + Vite com um host React 19, um card Vue 3, um contador Svelte 5, um formulário de contato Angular 20 zoneless (JIT; o compilador carrega como um chunk lazy), uma newsletter com `TuvixReactApp` e uma ilha que falha de propósito para mostrar o fallback. `src/server/render-islands.ts` contém os renderizadores de servidor, `src/entry-server.tsx` vincula os assets com `getAssets` e `src/runtime/islands.ts` reage aos eventos de ciclo de vida. A ilha Angular recebe o input `heading` da opção `props` no servidor e o mesmo objeto no cliente. A partir da raiz do repositório, execute `pnpm --filter with-ssr-islands dev` (porta 5186), ou `build` e depois `start` (porta 5185; `PORT` substitui). O README do exemplo explica cada peça e as verificações que a spec do Playwright executa.

## O que as ilhas não fazem

- O `TuvixIsland` não carrega módulos por URL. Importe o módulo da ilha no bundle do host.
- Ele não compartilha estado entre ilhas. Use props, o event bus ou o seu próprio store.
- Ilhas Angular renderizam de novo por cima do DOM do servidor em vez de hidratá-lo de forma não destrutiva; veja [Angular](/pt/guide/angular).
- Nada disso funciona sem uma etapa de renderização no servidor. Para ilhas somente no cliente, omita `ssrHtml` e use os adaptadores sem `Ssr`.
