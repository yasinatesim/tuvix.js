<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Exemplos Tuvix.js

Este diretório contém exemplos de projetos autossuficientes e totalmente funcionais que demonstram vários recursos e integrações de frameworks do orquestrador **Tuvix.js**.

## Início Rápido

A forma mais fácil de começar com qualquer exemplo é usar a CLI `create-tuvix-app` com a bandeira `--example`:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

*(Você também pode clonar este repositório e executar manualmente `npm install` e `npm run dev` dentro de qualquer pasta de exemplo).*

## Exemplos Disponíveis

| Nome do Exemplo | Framework | Recurso Chave Demonstrado |
|--------------|-----------|--------------------------|
| [`with-react`](./with-react/) | React 18 | Basic Shell, Routing, and Prop passing via `@tuvix.js/react` |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | Cross-app pub/sub communication using `@tuvix.js/event-bus` |
| [`with-react-router`](./with-react-router/) | React 18 | URL-based active routing using `@tuvix.js/router` |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | Strict Shadow DOM CSS isolation via `@tuvix.js/sandbox` |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | In-page orchestrator debugging via `@tuvix.js/devtools` |
| [`with-module-federation-react`](./with-module-federation-react/) | React (Webpack 5) | Dynamic remote module loading via `@tuvix.js/module-federation` |
| [`with-ssr-react`](./with-ssr-react/) | React (Express) | Asynchronous SSR HTML fragment composition via `@tuvix.js/server` |
| [`with-vue`](./with-vue/) | Vue 3 | Vue 3 composition API integration via `@tuvix.js/vue` |
| [`with-svelte`](./with-svelte/) | Svelte 4 | Svelte integration and Context API props via `@tuvix.js/svelte` |
| [`with-angular`](./with-angular/) | Angular 15+ | Angular CLI setup and `@Input()` injection via `@tuvix.js/angular` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React & Vue 3 | Polyglot architecture (sharing a single shell across frameworks) |

## Suporte Multilíngue

Cada exemplo fornece documentação em **10 idiomas** (inglês, turco, espanhol, alemão, francês, japonês, chinês, italiano, português e hindi). Abra o diretório de qualquer exemplo para ver os arquivos README localizados.
