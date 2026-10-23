# Primeiros passos

Esta página monta um shell com dois micro apps: uma página inicial e um dashboard. Você vai registrar os apps, deixar o roteador montá-los e enviar novas props para um app montado.

## Instalação

Instale o pacote guarda-chuva. Ele contém o orquestrador, o roteador, o loader, o event bus e o sandbox:

```bash
pnpm add tuvix.js
```

Adicione um adaptador para cada framework que seus micro apps usam:

```bash
pnpm add @tuvix.js/react react react-dom
pnpm add @tuvix.js/vue vue
pnpm add @tuvix.js/svelte svelte
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
```

## Criar um projeto

`create-tuvix-app` gera um projeto de shell ou de micro app que depende dos pacotes 0.5:

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-dashboard --template react-app
```

Templates: `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`. Passe `--example <name>` para copiar um dos exemplos do repositório no lugar de um template.

## Montar um shell

O shell controla o layout da página e decide qual app vai em qual lugar. Dê a ele um elemento container:

```html
<nav>
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
</nav>
<main id="app"></main>
<script type="module" src="/src/main.ts"></script>
```

Depois crie o orquestrador, registre os apps e inicie-o:

```ts
// src/main.ts
import { createOrchestrator, interceptLinks, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  // '/' alone would match every path; `end: true` makes it exact.
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
});

// Turn <a href> clicks into router navigations instead of page loads.
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

O que acontece:

1. `start()` lê o path atual e monta todos os apps cujo `activeWhen` corresponde a ele.
2. Um clique em `<a href="/dashboard">` chama `navigateTo('/dashboard')`. O roteador adiciona a URL ao histórico, e o orquestrador desmonta `home` e depois monta `dashboard`.
3. A primeira montagem de `dashboard` carrega seu script e sua folha de estilo. As montagens seguintes reutilizam o módulo já carregado.

O roteador nunca intercepta cliques por conta própria. Sem `interceptLinks`, um clique em um link recarrega a página, e o orquestrador monta o app certo no novo carregamento da página.

## Escrever um micro app

Um micro app é um objeto com `mount` e `unmount`. `defineMicroApp` verifica o formato e registra o módulo com o nome dele, para que o loader possa encontrá-lo depois que o script for executado:

```ts
// apps/home.ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'home',

  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Welcome, ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },

  update({ props, container }) {
    const title = container?.querySelector('h1');
    if (title) title.textContent = `Welcome, ${String(props.user ?? 'Guest')}`;
  },

  unmount({ container }) {
    container.replaceChildren();
  },
});
```

O `name` que você passa para `defineMicroApp` deve ser igual ao nome que você registra no shell. O loader procura o módulo por esse nome.

## Usar um adaptador de framework

Os adaptadores criam o mesmo módulo a partir de um componente raiz. Eles registram o módulo, mantêm uma instância do framework por container e disparam eventos de ciclo de vida.

```tsx
// dashboard/src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Dashboard for {user}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

```ts
// settings/src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Settings from './Settings.vue';

export default createVueMicroApp({ name: 'settings', App: Settings });
```

Páginas dos frameworks: [React](/pt/guide/react), [Vue](/pt/guide/vue), [Svelte](/pt/guide/svelte), [Angular](/pt/guide/angular).

Faça o build de cada micro app como um bundle ES module e publique-o. Um build de biblioteca do Vite funciona:

```ts
// dashboard/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.tsx', formats: ['es'], fileName: 'main' },
  },
});
```

A saída ES do Vite termina em `.js`, que o loader trata como script clássico, a menos que a entry indique `type: 'module'`. Mantenha `type: 'module'` na entry do shell, como acima.

## Atualizar props em tempo de execução

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

`updateAppProps` mescla as novas props com as registradas. Se o app estiver montado e tiver `update`, o orquestrador o chama com as props mescladas e o app é renderizado de novo no lugar. Se o app não estiver montado, o orquestrador guarda as props para a próxima montagem.

## O que o shell não faz

- Ele não renderiza o seu layout. O HTML do próprio shell contém os containers.
- Ele não compartilha instâncias de framework entre apps. Dois apps React recebem duas raízes React.
- Ele não isola JavaScript em sandbox. Todos os apps rodam no `window` da página.

## Próximos passos

- [Arquitetura](/pt/guide/architecture): o caminho da navegação até `mount`.
- [Roteamento](/pt/guide/routing): padrões de `activeWhen`, o roteador embutido, guards.
- [Roteador externo](/pt/guide/external-router): acompanhe o TanStack Router ou o React Router.
- [Ilhas SSR](/pt/guide/ssr-islands): renderize micro apps no servidor dentro de uma página React.
