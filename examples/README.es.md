<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Ejemplos de Tuvix.js

Este directorio contiene ejemplos de proyectos independientes y totalmente funcionales que demuestran varias características e integraciones de frameworks del orquestador **Tuvix.js**.

## Inicio Rápido

La forma más fácil de comenzar con cualquier ejemplo es usar el CLI `create-tuvix-app` con la bandera `--example`:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

*(También puedes clonar este repositorio y ejecutar manualmente `npm install` y `npm run dev` dentro de cualquier carpeta de ejemplo).*

## Ejemplos Disponibles

| Nombre del Ejemplo | Framework | Característica Clave Demostrada |
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

## Soporte Multilingüe

Cada ejemplo proporciona documentación en **10 idiomas** (inglés, turco, español, alemán, francés, japonés, chino, italiano, portugués e hindi). Abre la carpeta de cualquier ejemplo para ver los archivos README localizados.
