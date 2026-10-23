<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Exemplos do Tuvix.js

Projetos executáveis, um por funcionalidade ou framework. Cada exemplo tem uma spec do Playwright na pasta `e2e/`, que roda no CI.

## Início rápido

Inicie qualquer exemplo com a CLI `create-tuvix-app`:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

Dentro de um clone deste repositório, execute `pnpm install` na raiz e depois `pnpm dev` (ou `pnpm start` para os exemplos de servidor) na pasta do exemplo.

## Exemplos disponíveis

| Exemplo | Framework | O que mostra |
|---------|-----------|---------------|
| [`with-vanilla`](./with-vanilla/) | JS puro | `defineMicroApp`, roteamento e `interceptLinks` sem framework |
| [`with-react`](./with-react/) | React 18 | Shell, rotas e props via `@tuvix.js/react` |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | Apps publicando e recebendo eventos em `getGlobalBus()` |
| [`with-react-router`](./with-react-router/) | React 18 | Mapeamento de rotas para apps e navegação por links no cliente |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | Isolamento de CSS com shadow root via `sandbox: true`, com um controle sem sandbox |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | Painel de depuração na página do `@tuvix.js/devtools` |
| [`with-module-federation-react`](./with-module-federation-react/) | React (webpack 5) | Apps remotos carregados por meio de `createFederatedEntry` |
| [`with-ssr-vanilla`](./with-ssr-vanilla/) | Express | Composição de fragmentos no servidor com `composeHTML` |
| [`with-ssr-react`](./with-ssr-react/) | React (Express) | Fragmentos React gerados com `renderToString` e compostos com `composeHTML` |
| [`with-ssr-islands`](./with-ssr-islands/) | Shell React 19, Vue 3, Svelte 5, Angular 20 (Express + Vite) | Ilhas renderizadas no servidor que são hidratadas no cliente, um `TuvixReactApp` inline e uma ilha com falha que recorre ao fallback sem quebrar a página |
| [`with-vue`](./with-vue/) | Vue 3 | `createVueMicroApp` com props via `defineProps` |
| [`with-svelte`](./with-svelte/) | Svelte 4 | `createSvelteMicroApp` com props via `export let` |
| [`with-angular`](./with-angular/) | Angular 16 | Componentes standalone, zoneless, `createAngularMicroApp` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React e Vue 3 | Dois frameworks em uma mesma página compartilhando o event bus |

## Traduções

Os exemplos que têm um `README.md` também o oferecem em turco, espanhol, alemão, francês, japonês, chinês, italiano, português e hindi. O README em inglês é a referência quando houver divergências.
