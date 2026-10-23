# create-tuvix-app

> Genera un proyecto de Vite para una shell de Tuvix.js o para una micro app de React, Vue, Svelte, Angular o vanilla

Parte del framework de micro frontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Uso

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app

# npm create forwards flags only after --
npm create tuvix-app@latest my-app -- --template react-app --typescript
```

La CLI pregunta por cada valor que no indiques (nombre del proyecto, plantilla, TypeScript), escribe los archivos en `./<project-name>` y después instala las dependencias.

## Inicio rápido

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

## Opciones

| Opción | Tipo | Valor por defecto | Significado |
| --- | --- | --- | --- |
| `project-name` | posicional | pregunta | Nombre de la carpeta y de `package.json` |
| `--template`, `-t` | `string` | pregunta | `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app` o `vanilla-app` |
| `--typescript` / `--no-typescript` | flag | pregunta (`Yes` preseleccionado) | Archivos TypeScript más `tsconfig.json`, o JavaScript. `angular-app` siempre es TypeScript. |
| `--example`, `-e` | `string` | ninguno | Descarga `examples/<name>` del repositorio de GitHub (`master`). Omite las preguntas y la instalación. |
| `--help`, `-h` | flag | `false` | Muestra la ayuda de uso |
| `--version`, `-v` | flag | `false` | Muestra `create-tuvix-app v<version>`, leído del `package.json` de la CLI |

## Plantillas

Cada proyecto recibe `index.html`, `src/main.<ext>` y un `package.json` con los scripts de Vite `dev`/`build`/`preview`, `tuvix.js@^0.5.0` y `vite@^6.0.0` (más `typescript@^5.7.0` en modo TS).

| Plantilla | Genera | Dependencias adicionales |
| --- | --- | --- |
| `shell` | `createOrchestrator` con un router history (`/dashboard/*`, `/settings/*`) y una app `dashboard` registrada que apunta a una URL de CDN de ejemplo | ninguna |
| `react-app` | `createReactMicroApp({ name, App })`, `App.tsx` y un `vite.config.ts` con `@vitejs/plugin-react` | `react`, `react-dom` `^19`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3` |
| `vue-app` | `createVueMicroApp({ name, App })`, `App.vue` que lee las props con `inject(TUVIX_PROPS_KEY)`, `vite.config.ts` con `@vitejs/plugin-vue` y, en modo TS, `src/vite-env.d.ts` que declara los módulos `*.vue` | `vue@^3.5`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2` |
| `svelte-app` | `createSvelteMicroApp({ name, App, SvelteMap })` con `SvelteMap` de `svelte/reactivity`, para que `update()` vuelva a renderizar en el sitio. `App.svelte` de Svelte 5 que lee `$props()`, `vite.config.ts`, `svelte.config.js` con `vitePreprocess()` y, en modo TS, `src/vite-env.d.ts` más un script `check` | `svelte@^5`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5`, `svelte-check@^4` (modo TS) |
| `angular-app` | `createSsrAngularMicroApp({ name, component })` con un `AppComponent` standalone, Angular 20 sin zone. `src/main.ts` importa `@angular/compiler` primero para que los componentes JIT se compilen. | `@angular/{common,compiler,core,platform-browser}@^20`, `rxjs`, `tslib`, `@tuvix.js/angular` |
| `vanilla-app` | `defineMicroApp` con `mount`/`unmount` que escriben `innerHTML` | ninguna |

## Gestor de paquetes e instalación

La CLI elige `bun` cuando se ejecuta en Bun; si no, revisa `npm_execpath` buscando `pnpm`/`yarn`, después `npm_config_user_agent` buscando `pnpm`/`yarn`/`bun/`, y por último usa `npm`. Tras generar una plantilla ejecuta `<pm> install` con la salida oculta. Si falla, muestra `Install failed. Run manually:` con los comandos y aun así termina con código 0.

## Casos límite

- Si la carpeta de destino ya existe, falla con `Directory "<name>" already exists.` (código de salida 1).
- Los nombres que se resuelven fuera del directorio actual, como `../app`, fallan.
- Un `--template` desconocido falla y muestra la lista de plantillas disponibles.
- El nombre del proyecto se usa tal como lo escribes; no se comprueban las reglas de nombres de npm.
- Los ejemplos dependen de `workspace:*`. Reemplázalos por `^0.5.0` antes de instalar.
- Un ejemplo inexistente deja una carpeta vacía; bórrala antes de reintentar.

## Lo que no hace

- Las plantillas de micro app exportan un módulo y nunca lo montan, así que `pnpm run dev` muestra un `#app` vacío hasta que una shell lo carga.
- No incluye configuración de build en modo librería, git init, linter, tests ni configuración de monorepo.
- No hay `--no-install` ni flag de gestor de paquetes, ni API programática.

Documentación completa: [tuvix.js.org/packages/create-tuvix-app](https://tuvix.js.org/packages/create-tuvix-app)

## Licencia

MIT
