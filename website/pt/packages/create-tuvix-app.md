---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="CLI que cria um projeto Vite para um shell Tuvix.js ou para um micro app React, Vue, Svelte, Angular ou vanilla e depois instala as dependências."
  icon="🚀"
  npm="true"
  github="cli"
/>

## Uso

O nome do pacote começa com `create-`, então o comando `create` de qualquer gerenciador de pacotes o encontra, e o `npx` executa o binário `create-tuvix-app`:

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app
```

O `npm create` repassa flags somente depois de `--`. Os outros comandos as repassam diretamente:

```bash
npm create tuvix-app@latest my-app -- --template react-app --typescript
pnpm create tuvix-app my-app --template react-app --typescript
```

O binário precisa do Node.js. Ele grava em uma nova pasta dentro do diretório atual.

## Quando usar

Use para começar do zero uma parte do Tuvix.js: um shell que registra micro apps, ou um micro app em um framework específico. Cada execução cria um projeto Vite com `tuvix.js` e o adaptador `@tuvix.js/*` correspondente na versão `^0.5.0`.

Escolha outra opção quando for adicionar o Tuvix.js a um app que já existe. Nesse caso, instale o adaptador com o seu gerenciador de pacotes e siga o [guia](/pt/guide/getting-started). Para ter uma configuração funcional com vários apps para ler ou copiar, use `--example` (veja [Exemplos](#exemplos)).

## Início rápido

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

A CLI grava seis arquivos, executa `pnpm install` em `checkout/` e mostra os próximos passos:

```text
checkout/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    └── main.tsx
```

`src/main.tsx` exporta o módulo do micro app que um shell carrega:

```tsx [src/main.tsx]
import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export default createReactMicroApp({
  name: 'my-react-app',
  App,
});
```

Renomeie `my-react-app` para o nome que o seu shell registra. A CLI não insere o nome do seu projeto ali.

## Opções

```text
create-tuvix-app [project-name] [options]
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `project-name` | posicional | prompt | Nome da pasta e `name` do `package.json`. O primeiro argumento que não começa com `-` define o valor; um argumento posterior o substitui. |
| `--template`, `-t` | `string` | prompt | Um de `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. |
| `--typescript` | flag | prompt (`Yes` pré-selecionado) | Gera arquivos TypeScript e um `tsconfig.json`. |
| `--no-typescript` | flag | prompt | Gera arquivos JavaScript. O `angular-app` ignora essa flag. |
| `--example`, `-e` | `string` | nenhum | Baixa uma pasta de `examples/` do repositório no GitHub em vez de um template. Pula os prompts e a etapa de instalação. |
| `--help`, `-h` | flag | `false` | Mostra o uso e encerra. |
| `--version`, `-v` | flag | `false` | Mostra `create-tuvix-app v<version>` e encerra. A CLI lê a versão do seu próprio `package.json`. |

Para cada valor que você omitir, a CLI pergunta por meio de um prompt interativo, nesta ordem: nome do projeto (`my-app` como placeholder, entrada vazia é rejeitada), template e, por fim, TypeScript. Passe os três para executar sem prompts:

```bash
npx create-tuvix-app admin --template angular-app --typescript
```

A CLI ignora flags que não reconhece.

## Templates

Todo template grava `index.html`, `package.json` e `src/main.<ext>`. O `package.json` gerado é `private`, tem `"type": "module"`, versão `0.1.0` e três scripts: `dev` (`vite`), `build` (`vite build`) e `preview` (`vite preview`). O `svelte-app` no modo TypeScript adiciona um quarto, `check`. Todo `package.json` lista `tuvix.js@^0.5.0` e `vite@^6.0.0`, além de `typescript@^5.7.0` no modo TypeScript.

| Template | Arquivos além de `index.html` e `package.json` | Dependências extras |
| --- | --- | --- |
| `shell` | `src/main.ts` | nenhuma |
| `react-app` | `src/main.tsx`, `src/App.tsx`, `vite.config.ts` | `react`, `react-dom` `^19.0.0`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3.0`; `@types/react`, `@types/react-dom` no modo TS |
| `vue-app` | `src/main.ts`, `src/App.vue`, `vite.config.ts`; `src/vite-env.d.ts` no modo TS | `vue@^3.5.0`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2.0` |
| `svelte-app` | `src/main.ts`, `src/App.svelte`, `vite.config.ts`, `svelte.config.js`; `src/vite-env.d.ts` no modo TS | `svelte@^5.0.0`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5.0.0`; `svelte-check@^4.0.0` no modo TS |
| `angular-app` | `src/main.ts`, `src/app/app.component.ts`, `vite.config.ts` | `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/platform-browser` `^20.0.0`, `rxjs@^7.8.0`, `tslib@^2.6.0`, `@tuvix.js/angular`, `typescript@~5.8.0` |
| `vanilla-app` | `src/main.ts` | nenhuma |

O modo TypeScript adiciona `tsconfig.json` (`ES2020`, módulos `ESNext`, resolução `bundler`, `strict`). Para `react-app`, `vue-app` e `svelte-app`, ele inclui o `vite.config.ts` ao lado de `src`. O modo JavaScript usa `.js` e `.jsx` e não grava `tsconfig.json`; o `vite.config.ts` continua em TypeScript, e o Vite o carrega de qualquer forma. Todos os pacotes `@tuvix.js/*` recebem `^0.5.0`.

### `shell`

Um orquestrador com um roteador em modo history. O `index.html` tem um `#header`, um `<nav>` com links para `/dashboard` e `/settings` e um `<main id="main">`. `src/main.ts`:

```ts [src/main.ts]
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
  onError(error, appName) {
    console.error(`App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

orchestrator.start();
```

Substitua a URL de `entry` pela entry gerada no build do seu app de dashboard e registre o `settings` você mesmo. O template registra apenas o `dashboard`.

### `react-app`

`createReactMicroApp({ name: 'my-react-app', App })` de `@tuvix.js/react`. O `App` renderiza um título e as props que recebe em formato JSON. O `vite.config.ts` adiciona o `@vitejs/plugin-react`, que compila JSX com o runtime automático, então o `App.jsx` não precisa importar `React` no modo JavaScript. O `tsconfig.json` do modo TS define `"jsx": "react-jsx"`.

### `vue-app`

`createVueMicroApp({ name: 'my-vue-app', App })` de `@tuvix.js/vue`, e o `vite.config.ts` adiciona o `@vitejs/plugin-vue`. O `App.vue` é um componente `<script setup>` que lê as props do shell com `inject`:

```vue [src/App.vue]
<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>Vue Micro App</h1>
    <p>This is a Tuvix.js micro frontend.</p>
    <pre>{{ JSON.stringify(props, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

// The props the shell passes to mount() and update(), kept reactive.
const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
</script>
```

No modo TS, o `src/vite-env.d.ts` referencia `vite/client` e declara os módulos `*.vue`, para que o `tsc` aceite o import de `App`.

### `svelte-app`

Um micro app Svelte 5. O `src/main.ts` passa o `SvelteMap` de `svelte/reactivity`, então `update({ props })` renderiza novamente no lugar em vez de remontar:

```ts [src/main.ts]
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({
  name: 'my-svelte-app',
  App,
  SvelteMap,
});
```

O `App.svelte` lê a prop `name` com `$props()`. O `vite.config.ts` adiciona o plugin do Svelte, e o `svelte.config.js` define `preprocess: vitePreprocess()` para que `<script lang="ts">` compile. No modo TS, o `src/vite-env.d.ts` referencia os tipos de `svelte` e `vite/client`, e o `package.json` recebe um script `check` (`svelte-check --tsconfig ./tsconfig.json`).

### `angular-app`

Angular 20 sem zone.js. O template sempre usa TypeScript, mesmo com `--no-typescript`, e mostra `Angular requires TypeScript. Switching to TypeScript automatically.` quando você escolhe JavaScript no prompt.

```ts [src/main.ts]
// Load the JIT compiler before any Angular package that ships partially
// compiled code (@angular/common, forms, router) is evaluated.
import '@angular/compiler';
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app/app.component';

export default createSsrAngularMicroApp({
  name: 'my-angular-app',
  component: AppComponent,
});
```

O `AppComponent` é um componente standalone com template inline. O `createSsrAngularMicroApp` o renderiza do zero em um container vazio e renderiza por cima do markup quando o container contém HTML gerado por `renderAngularToString`. O adaptador roda sem zone (zoneless). O Vite não faz compilação AOT do Angular, então os componentes são compilados no navegador: mantenha `import '@angular/compiler'` como a primeira linha de `src/main.ts` e mantenha o compilador como dependência de runtime. O `tsconfig.json` tem como alvo `ES2022`, com `experimentalDecorators` ativado e `useDefineForClassFields` desativado, e o `vite.config.ts` define o alvo do esbuild como `es2022`.

### `vanilla-app`

`defineMicroApp` de `tuvix.js` com um `mount` que grava um título em `container.innerHTML` e um `unmount` que o limpa.

## Exemplos

`--example <name>` baixa `https://codeload.github.com/yasinatesim/tuvix.js/tar.gz/master` e extrai `examples/<name>/` na pasta do seu projeto. Os prompts, `--template`, `--typescript` e a etapa de instalação são ignorados. A CLI mostra `<pm> install` e `<pm> run dev` como próximos passos.

```bash
npx create-tuvix-app my-app --example with-multiple-frameworks
```

Sem nome de projeto, a pasta se chama `my-app`. O nome deve conter apenas letras, dígitos e hifens. Estas pastas existem em `examples/`:

| Exemplo | Mostra |
| --- | --- |
| `with-react` | Micro apps React em um shell |
| `with-vue` | Micro apps Vue em um shell |
| `with-svelte` | Micro apps Svelte em um shell |
| `with-angular` | Micro apps Angular em um shell |
| `with-vanilla` | Micro apps sem framework |
| `with-multiple-frameworks` | Micro apps React e Vue em uma mesma página |
| `with-react-router` | `@tuvix.js/router` com apps React |
| `with-react-event-bus` | Apps se comunicando pelo `@tuvix.js/event-bus` |
| `with-react-sandbox` | Isolamento de CSS com `@tuvix.js/sandbox` |
| `with-react-devtools` | O overlay do [`@tuvix.js/devtools`](/pt/packages/devtools) |
| `with-module-federation-react` | `@tuvix.js/module-federation` com remotes React |
| `with-ssr-react` | `@tuvix.js/server` compondo fragmentos React |
| `with-ssr-vanilla` | `@tuvix.js/server` compondo fragmentos de HTML puro |
| `with-ssr-islands` | Ilhas renderizadas no servidor em vários frameworks com [`@tuvix.js/vite`](/pt/packages/vite) |

Os exemplos ficam dentro do monorepo, então os arquivos `package.json` deles dependem de `workspace:*`. Substitua cada `workspace:*` e `workspace:^` por `^0.5.0` antes de executar o comando de instalação, ou o gerenciador de pacotes vai parar com um erro de protocolo não suportado.

## Detecção do gerenciador de pacotes

A CLI escolhe o gerenciador de pacotes para a etapa de instalação e para os comandos exibidos com base em como você a iniciou. Ela verifica, nesta ordem:

1. `process.versions.bun` está definido: `bun`.
2. `npm_execpath` contém `pnpm` ou `yarn`: esse gerenciador.
3. `npm_config_user_agent` começa com `pnpm`, `yarn` ou `bun/`: esse gerenciador.
4. Caso contrário: `npm`.

`pnpm create tuvix-app` e `pnpm dlx create-tuvix-app` instalam com pnpm, `yarn create` com yarn, `npx` e `npm create` com npm. Nenhuma flag substitui essa escolha.

## Etapa de instalação

Depois de executar um template, a CLI roda `<pm> install` na nova pasta enquanto mostra um spinner (`Installing dependencies with <pm>`). Ela oculta a saída do gerenciador de pacotes.

- Código de saída 0: o spinner termina com `Dependencies installed`, e a CLI mostra `cd <name>` e `<pm> run dev`.
- Código de saída diferente de zero, ou binário ausente: o spinner termina com `Install failed. Run manually:` seguido de `cd <absolute path>` e `<pm> install`. Os arquivos do projeto permanecem, e a CLI ainda encerra com código 0.

Execuções com `--example` nunca instalam dependências.

## Casos extremos

- Uma pasta existente interrompe a execução com `Directory "<name>" already exists.` e código de saída 1. A CLI nunca grava em uma pasta existente nem mescla conteúdo com ela.
- Um nome cujo caminho resolvido não começa pelo diretório atual, como `../app`, interrompe a execução com `Project directory must be within the current working directory.`
- Um valor desconhecido em `--template` falha depois dos prompts com `Unknown template "<value>". Available: shell, react-app, vue-app, vanilla-app, svelte-app, angular-app`.
- `--template` ou `--example` como último argumento, sem valor, conta como não informado: você recebe o prompt de template ou uma execução normal de template.
- A CLI usa o nome do projeto exatamente como foi escrito, tanto para a pasta quanto para o `name` do `package.json`. Ela não verifica as regras de nomenclatura do npm, então `My App` gera um nome de pacote inválido.
- Cancelar um prompt (Ctrl+C) mostra `Operation cancelled.` e encerra com código 0.
- Um nome de exemplo que não existe em `master` deixa uma pasta vazia e falha com `Example "<name>" was not found or failed to extract.` Apague a pasta antes de tentar novamente.
- A CLI baixa o tarball inteiro do repositório para um único exemplo. Uma conexão lenta deixa o `--example` lento.

## O que ela não faz

- Os templates de micro app não se montam sozinhos. `src/main` exporta o módulo, e nada no `index.html` chama `mount`, então `pnpm run dev` mostra um `#app` vazio até que um shell carregue a entry.
- Nenhuma configuração do Vite em modo biblioteca. `vite build` gera um build de app comum com nomes de arquivos com hash, e você escolhe a entry que o seu shell carrega.
- Nenhuma configuração de monorepo, workspace ou múltiplos apps. Execute a CLI uma vez por app ou comece a partir de um `--example`.
- Sem git init, sem linter, sem test runner, sem configuração de CSS.
- Sem flag `--no-install` e sem flag de gerenciador de pacotes.
- Sem API programática. Importar o pacote executa a CLI.
