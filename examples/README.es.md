<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Ejemplos de Tuvix.js

Proyectos ejecutables, uno por característica o framework. Cada ejemplo tiene un spec de Playwright en su carpeta `e2e/` que se ejecuta en CI.

## Inicio rápido

Arranca cualquier ejemplo con la CLI `create-tuvix-app`:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

Dentro de un clon de este repositorio, ejecuta `pnpm install` en la raíz y después `pnpm dev` (o `pnpm start` para los ejemplos de servidor) en la carpeta del ejemplo.

## Ejemplos disponibles

| Ejemplo | Framework | Qué muestra |
|---------|-----------|---------------|
| [`with-vanilla`](./with-vanilla/) | JS puro | `defineMicroApp`, enrutamiento e `interceptLinks` sin framework |
| [`with-react`](./with-react/) | React 18 | Shell, rutas y props mediante `@tuvix.js/react` |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | Apps que publican y reciben eventos en `getGlobalBus()` |
| [`with-react-router`](./with-react-router/) | React 18 | Asignación de rutas a apps y navegación de enlaces en el cliente |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | Aislamiento de CSS con shadow root mediante `sandbox: true`, con un control sin sandbox |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | Panel de depuración en la página de `@tuvix.js/devtools` |
| [`with-module-federation-react`](./with-module-federation-react/) | React (webpack 5) | Apps remotas cargadas mediante `createFederatedEntry` |
| [`with-ssr-vanilla`](./with-ssr-vanilla/) | Express | Composición de fragmentos en el servidor con `composeHTML` |
| [`with-ssr-react`](./with-ssr-react/) | React (Express) | Fragmentos de React `renderToString` compuestos con `composeHTML` |
| [`with-ssr-islands`](./with-ssr-islands/) | Shell en React 19, Vue 3, Svelte 5, Angular 20 (Express + Vite) | Islas renderizadas en el servidor que se hidratan en el cliente, un `TuvixReactApp` en línea y una isla que falla y recurre a su fallback sin romper la página |
| [`with-vue`](./with-vue/) | Vue 3 | `createVueMicroApp` con props mediante `defineProps` |
| [`with-svelte`](./with-svelte/) | Svelte 4 | `createSvelteMicroApp` con props `export let` |
| [`with-angular`](./with-angular/) | Angular 16 | Componentes standalone, zoneless, `createAngularMicroApp` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React y Vue 3 | Dos frameworks en una página que comparten el event bus |

## Traducciones

Los ejemplos que tienen un `README.md` también lo incluyen en turco, español, alemán, francés, japonés, chino, italiano, portugués e hindi. El README en inglés es la referencia cuando difieren.
