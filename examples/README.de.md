<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Tuvix.js-Beispiele

Lauffähige Projekte, eines pro Feature oder Framework. Jedes Beispiel hat in seinem Ordner `e2e/` eine Playwright-Spec, die in der CI läuft.

## Schnellstart

Starte ein beliebiges Beispiel mit der CLI `create-tuvix-app`:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

In einem Klon dieses Repositorys führst du `pnpm install` im Root aus und danach `pnpm dev` (oder `pnpm start` für die Server-Beispiele) im Ordner des Beispiels.

## Verfügbare Beispiele

| Beispiel | Framework | Was es zeigt |
|---------|-----------|---------------|
| [`with-vanilla`](./with-vanilla/) | Reines JS | `defineMicroApp`, Routing und `interceptLinks` ohne Framework |
| [`with-react`](./with-react/README.de.md) | React 18 | Shell, Routen, Props über `@tuvix.js/react` |
| [`with-react-event-bus`](./with-react-event-bus/README.de.md) | React 18 | Apps, die Events auf `getGlobalBus()` veröffentlichen und empfangen |
| [`with-react-router`](./with-react-router/README.de.md) | React 18 | Zuordnung von Routen zu Apps und clientseitige Link-Navigation |
| [`with-react-sandbox`](./with-react-sandbox/README.de.md) | React 18 | CSS-Isolation per Shadow Root mit `sandbox: true`, dazu eine Vergleichs-App ohne Sandbox |
| [`with-react-devtools`](./with-react-devtools/README.de.md) | React 18 | Debug-Panel direkt in der Seite aus `@tuvix.js/devtools` |
| [`with-module-federation-react`](./with-module-federation-react/README.de.md) | React (webpack 5) | Remote-Apps, geladen über `createFederatedEntry` |
| [`with-ssr-vanilla`](./with-ssr-vanilla/) | Express | Serverseitige Komposition von Fragmenten mit `composeHTML` |
| [`with-ssr-react`](./with-ssr-react/README.de.md) | React (Express) | Fragmente aus React `renderToString`, komponiert mit `composeHTML` |
| [`with-ssr-islands`](./with-ssr-islands/) | React-19-Shell, Vue 3, Svelte 5, Angular 20 (Express + Vite) | Serverseitig gerenderte Islands, die auf dem Client hydrieren, eine Inline-`TuvixReactApp` und eine fehlschlagende Island, die auf ihren Fallback zurückfällt, ohne die Seite zu beschädigen |
| [`with-vue`](./with-vue/README.de.md) | Vue 3 | `createVueMicroApp` mit Props über `defineProps` |
| [`with-svelte`](./with-svelte/README.de.md) | Svelte 4 | `createSvelteMicroApp` mit Props über `export let` |
| [`with-angular`](./with-angular/README.de.md) | Angular 16 | Standalone-Komponenten, zoneless, `createAngularMicroApp` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/README.de.md) | React und Vue 3 | Zwei Frameworks auf einer Seite, die sich den Event Bus teilen |

## Übersetzungen

Die Beispiele mit einer `README.md` liefern sie auch auf Türkisch, Spanisch, Deutsch, Französisch, Japanisch, Chinesisch, Italienisch, Portugiesisch und Hindi. Bei Abweichungen ist die englische README die Referenz.
