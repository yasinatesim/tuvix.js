<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Tuvix.js Examples

Runnable projects, one per feature or framework. Each example has a Playwright spec in its `e2e/` folder that runs in CI.

## Quick start

Start any example with the `create-tuvix-app` CLI:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

Inside a clone of this repository, run `pnpm install` at the root, then `pnpm dev` (or `pnpm start` for the server examples) in the example folder.

## Available examples

| Example | Framework | What it shows |
|---------|-----------|---------------|
| [`with-vanilla`](./with-vanilla/) | Plain JS | `defineMicroApp`, routing and `interceptLinks` with no framework |
| [`with-react`](./with-react/) | React 18 | Shell, routes, props via `@tuvix.js/react` |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | Apps publishing and receiving events on `getGlobalBus()` |
| [`with-react-router`](./with-react-router/) | React 18 | Route-to-app mapping and client-side link navigation |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | `sandbox: true` shadow-root CSS isolation, with an unsandboxed control |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | In-page debug panel from `@tuvix.js/devtools` |
| [`with-module-federation-react`](./with-module-federation-react/) | React (webpack 5) | Remote apps loaded through `createFederatedEntry` |
| [`with-ssr-vanilla`](./with-ssr-vanilla/) | Express | Server-side fragment composition with `composeHTML` |
| [`with-ssr-react`](./with-ssr-react/) | React (Express) | React `renderToString` fragments composed with `composeHTML` |
| [`with-ssr-islands`](./with-ssr-islands/) | React 19 shell, Vue 3, Svelte 5, Angular 20 (Express + Vite) | Server-rendered islands that hydrate on the client, an inline `TuvixReactApp`, and a failing island that falls back without breaking the page |
| [`with-vue`](./with-vue/) | Vue 3 | `createVueMicroApp` with props through `defineProps` |
| [`with-svelte`](./with-svelte/) | Svelte 4 | `createSvelteMicroApp` with `export let` props |
| [`with-angular`](./with-angular/) | Angular 16 | Standalone components, zoneless, `createAngularMicroApp` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React and Vue 3 | Two frameworks on one page sharing the event bus |

## Translations

The examples with a `README.md` also ship it in Turkish, Spanish, German, French, Japanese, Chinese, Italian, Portuguese and Hindi. The English README is the reference when they differ.
