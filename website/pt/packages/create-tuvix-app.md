---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="CLI scaffolding tool. Instantly bootstrap a Tuvix.js project with your choice of framework and tooling."
  icon="🚀"
  github="create-tuvix-app"
/>

## Uso

```bash
npx create-tuvix-app my-app
```

Or with a specific package manager:

```bash
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
```

## Modelos

| Modelo | Descrição |
|--------|-------------|
| `shell` | Orquestrador shell para microfrontends |
| `react-app` | Aplicativo micro React |
| `vue-app` | Aplicativo micro Vue |
| `vanilla-app` | Aplicativo micro Vanilla JS/TS |

## Especificar modelo diretamente

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-react --template react-app
npx create-tuvix-app my-vue --template vue-app
npx create-tuvix-app my-vanilla --template vanilla-app
```

## Exemplos

Aplicações de exemplo pré-construídas podem ser criadas usando a flag `--example`:

| Exemplo | Descrição |
|---------|-------------|
| `with-react` | Exemplo de microfrontend React |
| `with-vue` | Exemplo de microfrontend Vue |
| `with-svelte` | Exemplo de microfrontend Svelte |
| `with-angular` | Exemplo de microfrontend Angular |
| `with-ssr-react` | Renderização do lado do servidor com React |
| `with-react-devtools` | Integração React com DevTools |
| `with-react-event-bus` | Exemplo de integração Event-Bus |
| `with-react-router` | Exemplo de integração Router |
| `with-react-sandbox` | Exemplo de isolamento Sandbox/CSS |
| `with-module-federation-react` | Module Federation com React |
| `with-vanilla` | Exemplo de microfrontend Vanilla JS |
| `with-ssr-vanilla` | Renderização do lado do servidor com Vanilla JS |
| `with-multiple-frameworks` | Integração de múltiplos frameworks |

## Criar um exemplo

```bash
npx create-tuvix-app my-app --example with-react
npx create-tuvix-app my-app --example with-vue
npx create-tuvix-app my-app --example with-multiple-frameworks
```
