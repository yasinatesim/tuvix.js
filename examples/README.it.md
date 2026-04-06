<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Esempi Tuvix.js

Questa directory contiene esempi di progetto autonomi e completamente funzionanti che dimostrano varie funzionalità e integrazioni di framework dell'orchestrator **Tuvix.js**.

## Avvio Rapido

Il modo più semplice per iniziare con un esempio è utilizzare la CLI `create-tuvix-app` con il flag `--example`:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

*(Puoi anche clonare questo repository ed eseguire manualmente `npm install` e `npm run dev` all'interno di qualsiasi cartella di esempio).*

## Esempi Disponibili

| Nome dell'Esempio | Framework | Caratteristica Principale Dimostrata |
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

## Supporto Multilingue

Ogni esempio fornisce documentazione in **10 lingue** (inglese, turco, spagnolo, tedesco, francese, giapponese, cinese, italiano, portoghese e hindi). Apri la directory di qualsiasi esempio per visualizzare i file README localizzati.
