<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Esempi di Tuvix.js

Progetti eseguibili, uno per funzionalità o framework. Ogni esempio ha una spec Playwright nella cartella `e2e/` che viene eseguita in CI.

## Avvio rapido

Avvia qualsiasi esempio con la CLI `create-tuvix-app`:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

In un clone di questo repository, esegui `pnpm install` nella root, poi `pnpm dev` (o `pnpm start` per gli esempi server) nella cartella dell'esempio.

## Esempi disponibili

| Esempio | Framework | Cosa mostra |
|---------|-----------|---------------|
| [`with-vanilla`](./with-vanilla/) | JS puro | `defineMicroApp`, routing e `interceptLinks` senza framework |
| [`with-react`](./with-react/) | React 18 | Shell, route, props tramite `@tuvix.js/react` |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | App che pubblicano e ricevono eventi su `getGlobalBus()` |
| [`with-react-router`](./with-react-router/) | React 18 | Mappatura tra route e app e navigazione dei link lato client |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | Isolamento CSS con shadow root tramite `sandbox: true`, con un controllo senza sandbox |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | Pannello di debug nella pagina da `@tuvix.js/devtools` |
| [`with-module-federation-react`](./with-module-federation-react/) | React (webpack 5) | App remote caricate tramite `createFederatedEntry` |
| [`with-ssr-vanilla`](./with-ssr-vanilla/) | Express | Composizione lato server di frammenti con `composeHTML` |
| [`with-ssr-react`](./with-ssr-react/) | React (Express) | Frammenti React `renderToString` composti con `composeHTML` |
| [`with-ssr-islands`](./with-ssr-islands/) | Shell React 19, Vue 3, Svelte 5, Angular 20 (Express + Vite) | Island renderizzate lato server che eseguono la hydration sul client, un `TuvixReactApp` inline e un'island che fallisce e passa al fallback senza rompere la pagina |
| [`with-vue`](./with-vue/) | Vue 3 | `createVueMicroApp` con props tramite `defineProps` |
| [`with-svelte`](./with-svelte/) | Svelte 4 | `createSvelteMicroApp` con props `export let` |
| [`with-angular`](./with-angular/) | Angular 16 | Componenti standalone, zoneless, `createAngularMicroApp` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React e Vue 3 | Due framework in una pagina che condividono l'event bus |

## Traduzioni

Gli esempi con un `README.md` lo forniscono anche in turco, spagnolo, tedesco, francese, giapponese, cinese, italiano, portoghese e hindi. In caso di differenze, il riferimento è il README in inglese.
