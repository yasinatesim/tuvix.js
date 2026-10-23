# create-tuvix-app

> Gere um projeto Vite para um shell Tuvix.js ou para um micro app React, Vue, Svelte, Angular ou vanilla

Parte do framework de microfrontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Uso

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app

# npm create forwards flags only after --
npm create tuvix-app@latest my-app -- --template react-app --typescript
```

A CLI pergunta cada valor que você omitir (nome do projeto, template, TypeScript), escreve os arquivos em `./<project-name>` e depois instala as dependências.

## Início rápido

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

## Opções

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `project-name` | posicional | pergunta | Nome da pasta e do `package.json` |
| `--template`, `-t` | `string` | pergunta | `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app` ou `vanilla-app` |
| `--typescript` / `--no-typescript` | flag | pergunta (`Yes` pré-selecionado) | Arquivos TypeScript mais `tsconfig.json`, ou JavaScript. `angular-app` é sempre TypeScript. |
| `--example`, `-e` | `string` | nenhum | Baixa `examples/<name>` do repositório no GitHub (`master`). Pula as perguntas e a instalação. |
| `--help`, `-h` | flag | `false` | Imprime o uso |
| `--version`, `-v` | flag | `false` | Imprime `create-tuvix-app v<version>`, lido do `package.json` da CLI |

## Templates

Cada projeto recebe `index.html`, `src/main.<ext>` e um `package.json` com os scripts Vite `dev`/`build`/`preview`, `tuvix.js@^0.5.0` e `vite@^6.0.0` (mais `typescript@^5.7.0` no modo TS).

| Template | Gera | Dependências extras |
| --- | --- | --- |
| `shell` | `createOrchestrator` com um roteador history (`/dashboard/*`, `/settings/*`) e um app `dashboard` registrado apontando para uma URL de CDN fictícia | nenhuma |
| `react-app` | `createReactMicroApp({ name, App })`, `App.tsx` e um `vite.config.ts` com `@vitejs/plugin-react` | `react`, `react-dom` `^19`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3` |
| `vue-app` | `createVueMicroApp({ name, App })`, `App.vue` que lê as props com `inject(TUVIX_PROPS_KEY)`, `vite.config.ts` com `@vitejs/plugin-vue` e, no modo TS, `src/vite-env.d.ts` declarando os módulos `*.vue` | `vue@^3.5`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2` |
| `svelte-app` | `createSvelteMicroApp({ name, App, SvelteMap })` com `SvelteMap` de `svelte/reactivity`, para que `update()` renderize novamente no lugar. `App.svelte` em Svelte 5 lendo `$props()`, `vite.config.ts`, `svelte.config.js` com `vitePreprocess()` e, no modo TS, `src/vite-env.d.ts` mais um script `check` | `svelte@^5`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5`, `svelte-check@^4` (modo TS) |
| `angular-app` | `createSsrAngularMicroApp({ name, component })` com um `AppComponent` standalone, Angular 20 zoneless. `src/main.ts` importa `@angular/compiler` primeiro para que os componentes JIT compilem. | `@angular/{common,compiler,core,platform-browser}@^20`, `rxjs`, `tslib`, `@tuvix.js/angular` |
| `vanilla-app` | `defineMicroApp` com `mount`/`unmount` escrevendo `innerHTML` | nenhuma |

## Gerenciador de pacotes e instalação

A CLI escolhe `bun` quando roda no Bun, depois verifica `npm_execpath` em busca de `pnpm`/`yarn`, depois `npm_config_user_agent` em busca de `pnpm`/`yarn`/`bun/`, e usa `npm` como fallback. Depois de gerar um template, ela roda `<pm> install` com a saída oculta. Se isso falhar, ela imprime `Install failed. Run manually:` com os comandos e ainda assim sai com código 0.

## Casos extremos

- Uma pasta de destino que já existe falha com `Directory "<name>" already exists.` (código de saída 1).
- Nomes que resolvem para fora do diretório atual, como `../app`, falham.
- Um `--template` desconhecido falha com a lista de templates disponíveis.
- O nome do projeto é usado como foi escrito; as regras de nomenclatura do npm não são verificadas.
- Os exemplos dependem de `workspace:*`. Substitua essas dependências por `^0.5.0` antes de instalar.
- Um exemplo inexistente deixa uma pasta vazia para trás; apague-a antes de tentar de novo.

## O que ele não faz

- Os templates de micro app exportam um módulo e nunca o montam, então `pnpm run dev` mostra um `#app` vazio até que um shell o carregue.
- Sem configuração de build em modo biblioteca, git init, linter, testes ou setup de monorepo.
- Sem `--no-install` nem flag de gerenciador de pacotes, e sem API programática.

Documentação completa: [tuvix.js.org/packages/create-tuvix-app](https://tuvix.js.org/packages/create-tuvix-app)

## Licença

MIT
