<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Tuvix.js-Beispiele

Dieses Verzeichnis enthält eigenständige, vollständig lauffähige Projektbeispiele, die verschiedene Features und Framework-Integrationen des **Tuvix.js**-Orchestrators demonstrieren.

## Schnellstart

Die einfachste Möglichkeit, mit einem Beispiel zu beginnen, ist die Verwendung der `create-tuvix-app` CLI mit dem Flag `--example`:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

*(Sie können auch dieses Repository klonen und `npm install` sowie `npm run dev` manuell in einem beliebigen Beispielordner ausführen).*

## Verfügbare Beispiele

| Beispielname | Framework | Demonstrierte Schlüsselfunktion |
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

## Mehrsprachige Unterstützung
Jedes Beispiel bietet Dokumentation in **10 Sprachen** (Englisch, Türkisch, Spanisch, Deutsch, Französisch, Japanisch, Chinesisch, Italienisch, Portugiesisch und Hindi). Öffnen Sie den Ordner eines beliebigen Beispiels, um die lokalisierten README-Dateien anzusehen.
