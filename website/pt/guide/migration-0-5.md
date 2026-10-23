# Migração para a 0.5

A 0.5 corrige bugs que alteravam o comportamento observável, então algumas dessas correções quebram código da 0.4. Esta página lista cada breaking change por pacote, com o código a alterar. Atualize todos os pacotes `tuvix.js` e `@tuvix.js/*` para `^0.5.0` juntos; misturar adaptadores 0.4 e 0.5 na mesma página não é suportado.

```bash
pnpm up --latest "tuvix.js" "@tuvix.js/*"
```

Projetos criados com `create-tuvix-app` antes da 0.5 dependem de `^0.1.0`, que nunca resolve para 0.4 ou 0.5. Edite esses intervalos manualmente.

## Core

### O orquestrador usa o bus global

A 0.4 dava a cada orquestrador um bus privado, separado de `getGlobalBus()`. Na 0.5, o bus do orquestrador é `getGlobalBus()`, a menos que você passe opções em `eventBus`, e `destroy()` mantém o bus global ativo.

```ts no-check
// 0.4: two buses; apps listening on getGlobalBus() missed orchestrator events
const orchestrator = createOrchestrator();
orchestrator.getEventBus() === getGlobalBus(); // false
```

```ts
// 0.5
import { createOrchestrator, getGlobalBus } from 'tuvix.js';

const shared = createOrchestrator();
console.log(shared.getEventBus() === getGlobalBus()); // true

const isolated = createOrchestrator({ eventBus: {} }); // private bus, as in 0.4
console.log(isolated.getEventBus() === getGlobalBus()); // false
```

Se você expunha o bus do orquestrador em `window` para que os apps o encontrassem, pode remover isso e usar o `bus` do contexto de montagem ou `getGlobalBus()`.

### Mudanças de rota não afetam apps manuais

A 0.4 desmontava, na mudança de rota seguinte, um app que não tinha nem `activeWhen` nem uma rota do roteador, e também os apps com `mountWhenVisible`. Na 0.5, a reconciliação só mexe em apps controlados por `activeWhen` ou por uma rota. Se você dependia de uma navegação para remover um app montado manualmente, desmonte-o você mesmo:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.unmountApp('cookie-banner');
```

### sandbox: true renderiza em uma shadow root

Na 0.4, `sandbox` em `register` não fazia nada. Na 0.5, `sandbox: true` monta o app dentro de uma shadow root e carrega os `styles` da entry dele ali. O CSS da página deixa de alcançar o app, e os estilos da entry do app deixam de alcançar a página. Remova `sandbox: true` dos apps que dependem dos estilos da página. Veja [Sandbox](/pt/guide/sandbox).

### prefetch: 'hover'

A 0.4 fazia prefetch de todos os apps no primeiro movimento do mouse em qualquer ponto da página. A 0.5 faz prefetch de um app quando o ponteiro entra em um link da mesma origem cujo path ativa esse app, ou quando o foco chega a ele. Use `'idle'` ou `'immediate'` para buscar todos os apps de antemão.

### OrchestratorConfig.shared foi removido

O orquestrador nunca lia `shared`. Remova-o e compartilhe dependências com `@tuvix.js/module-federation` ou import maps.

### Padrões de activeWhen

Strings de `activeWhen` agora usam `matchPath`. Uma query string ou hash não desmonta mais um app, segmentos `:param` funcionam e caracteres como `.` e `(` são comparados literalmente.

```ts no-check
// 0.4: `.` was a regex wildcard and matched '/v1x0'
activeWhen: '/v1.0/*'
// 0.4: query strings broke matching, so people wrote functions
activeWhen: (path) => path.split('?')[0].startsWith('/dashboard')
```

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'dashboard',
  entry: () => import('./apps/dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*', // also active on /dashboard?tab=1
});
```

## Roteador

### A rota '/' e RouteConfig.exact

Os paths de rota correspondem ao path inteiro em todos os lugares. Uma rota `'/'` agora só é ativada em `/`; na 0.4, `getActiveApps()` a tratava como qualquer path, enquanto `match()` a tratava como exata. `RouteConfig.exact` foi removido, porque nunca alterava nada.

```ts no-check
// 0.4
routes: [{ path: '/', app: 'shell-nav' }, { path: '/settings', app: 'settings', exact: true }]
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({
  routes: [
    { path: '/*', app: 'shell-nav' }, // every path
    { path: '/settings', app: 'settings' }, // /settings only
  ],
});
void router;
```

`activeWhen: '/'` em `register` continua correspondendo a qualquer path, porque strings de `activeWhen` usam correspondência por prefixo.

### push e replace adicionam a base

```ts no-check
// 0.4 with base: '/app'
router.push('/app/settings'); // you had to add the base yourself
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({ base: '/app', routes: [] });
await router.push('/settings'); // URL: /app/settings
```

Passar `/app/settings` na 0.5 grava `/app/app/settings`. Um guard que cancela a navegação de voltar/avançar também restaura a URL com a base.

### Outras mudanças no roteador

- `base` só é removida em um limite de segmento. Com `base: '/app'`, `/application` continua `/application`.
- `pathToRegex()` retorna um `RegExp` em cache; não o modifique. O segundo argumento, `exact`, foi removido.
- Caracteres de regex nos padrões são comparados literalmente. Um `*` no meio de um padrão corresponde a um segmento.
- `matchRoute()` e `isPathActive()` ignoram um `#hash` no path.

## Loader

### Opções removidas

`LoaderOptions.fetch` e `EntryConfig.html` foram removidos. O loader nunca os lia; remova-os da sua configuração.

```ts no-check
// 0.4
new ModuleLoader({ fetch: myFetch });
orchestrator.register({ name: 'x', entry: { scripts: ['/x.js'], html: '<div></div>' }, container: '#x' });
```

```ts
// 0.5
import { ModuleLoader } from '@tuvix.js/loader';

const loader = new ModuleLoader({ timeout: 10000 });
void loader;
```

### Scripts de módulo rodam uma vez por URL

Depois de `unload(name)`, um app cujo script `type: 'module'` se registrou sozinho não carrega de novo a partir da mesma URL, porque os navegadores executam um script de módulo uma vez por URL. Use uma entry do tipo função loader para apps que você descarrega e recarrega:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

`load()` para um módulo em cache agora informa a `duration` real em vez de `0`.

## Module Federation

`federatedEntry` e `createFederatedEntry` retornam uma função loader em vez de `{ scripts: [remoteEntry.js] }`. O entry da 0.4 carregava o script do container e depois falhava com "no exports found".

```ts no-check
// 0.4
orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }),
  container: '#main',
});
```

```ts
// 0.5
import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader, federatedEntry } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry(
    { name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' },
    './App', // exposed module path
  ),
  container: '#main',
  activeWhen: '/dashboard/*',
});

const remotes = createFederatedLoader({
  remotes: [{ name: 'settings', url: 'https://cdn.example.com/settings/remoteEntry.js' }],
  shareScope: {}, // replaces 0.4 `shared`
});

orchestrator.register({
  name: 'settings',
  entry: remotes.createFederatedEntry('settings', './App'),
  container: '#main',
  activeWhen: '/settings/*',
});
```

- `FederatedLoaderConfig.shared` foi substituído por `shareScope`. A 0.4 nunca lia `shared`.
- `loadRemoteContainer` retorna `FederatedContainer` em vez de `any`.

## React

- O HTML de servidor do `TuvixReactApp` agora contém marcadores de comentário do Suspense (`<!--$-->...<!--/$-->`). Renderize e hidrate com `@tuvix.js/react` 0.5 nos dois lados.
- `mount` rejeita quando a primeira renderização lança um erro. Na 0.4, o erro chegava ao handler de erros da raiz do React e `mount` resolvia. Agora o orquestrador mostra o `fallback` do app e chama `onError`.
- `unmount` em um container que o módulo nunca montou não faz nada. A 0.4 o limpava.

## Vue

`update()` não grava mais `app.config.globalProperties.$tuvixProps`. As props agora são reativas:

```vue
<!-- 0.4 -->
<template>{{ $tuvixProps.theme }}</template>
```

```vue
<!-- 0.5 -->
<script setup lang="ts">
defineProps<{ theme?: string }>();
</script>

<template>{{ theme }}</template>
```

Os descendentes podem usar `inject('tuvixProps')`, que retorna o mesmo objeto reativo.

- `VueSsrMicroAppConfig` não aceita mais `ssr`. `createSsrVueMicroApp` o define.
- `unmount` em um container que o módulo nunca montou não faz nada.

## Svelte

- Sem `ssr`, `createSvelteMicroApp` esvazia o container antes de renderizar. A 0.4 anexava componentes Svelte 3/4 depois do markup existente. Use `createSsrSvelteMicroApp` para manter e hidratar o markup do servidor.
- `unmount` em um container que o módulo nunca montou, ou cuja montagem falhou, não faz nada. A 0.4 o esvaziava. Os quatro adaptadores agora se comportam assim.
- `renderSvelteToString` não recorre mais a `App.render` quando `svelte/server` não carrega. Com `render` passado, ele usa o Svelte 5; caso contrário, segue o caminho do Svelte 5 quando `svelte` exporta `mount` e chama `App.render` apenas para Svelte 3/4. Um erro de import ou de renderização do Svelte 5 chega até você.

Componentes Svelte 5 funcionam na 0.5; na 0.4, `createSvelteMicroApp` falhava com eles. Um `update()` no Svelte 5 remonta o componente, a menos que você passe `SvelteMap` de `svelte/reactivity` na configuração, o que atualiza as props no lugar:

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

## Angular

### Novo formato de configuração

```ts no-check
// 0.4
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

export default createAngularMicroApp({
  name: 'admin',
  module: AppModule,
  platform: platformBrowserDynamic,
  selector: 'app-root',
});
```

```ts
// 0.5
import { createAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AppComponent, // required
  module: AppModule, // only when AppComponent is declared in an NgModule
});
```

`platform` e `compilerOptions` foram removidos. Remova `import '@angular/compiler'` da sua entry; o adaptador carrega o compilador para componentes JIT.

### Zoneless por padrão

Os apps rodam sem zone.js, a menos que você passe `zone: true`. No Angular 15-17, eventos do DOM não disparam mais a detecção de mudanças; chame `ChangeDetectorRef.detectChanges()` nos handlers, ou importe `zone.js` na sua entry e passe `zone: true`. O Angular 18+ agenda a detecção de mudanças sem zone.js. Veja [Angular](/pt/guide/angular).

### Props são inputs

`update()` não grava mais `window.__TUVIX_ANGULAR_PROPS__`. Declare propriedades `@Input()` no lugar; o adaptador as define com `setInput`.

```ts no-check
// 0.4
ngOnInit() {
  this.userId = (window as any).__TUVIX_ANGULAR_PROPS__?.admin?.userId;
}
```

```ts
// 0.5
import { Component, Input } from '@angular/core';

@Component({ selector: 'app-admin', standalone: true, template: '{{ userId }}' })
export class AdminComponent {
  @Input() userId = '';
}
```

### Outras mudanças no Angular

- `createSsrAngularMicroApp` não adiciona mais `provideClientHydration()`. Ele renderiza de novo dentro do elemento host do servidor.
- `unmount` em um container que o módulo nunca montou não faz nada.

## Sandbox

- `Sandbox({ css: false }).activate(container)` retorna `null` e não anexa nenhuma shadow root. `ISandbox.activate` retorna `ShadowRoot | null`; verifique `null` antes de chamar `addStyle`.
- O modo strict do `JsSandbox` lança um `TypeError` em uma escrita bloqueada. A 0.4 registrava um aviso e armazenava o valor mesmo assim. Adicione a `allowedGlobals` os globais em que o seu código escreve.

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });
const shadow = sandbox.activate(container);
if (shadow) sandbox.css.addStyle(shadow, ':host { display: block; }');
```

## Servidor

- `createServerRenderer().render()` retorna `statusCode: 502` quando pelo menos um app correspondeu ao path e todas as buscas de fragmentos falharam. Ele continua retornando 200 quando nenhum app correspondeu ou quando um fragmento teve sucesso. `createMiddleware` envia esse status. O renderizador de streaming sempre envia 200.
- `createMiddleware` e `createStreamingMiddleware` chamam `next(error)` em vez de `next()` quando a renderização lança um erro, então o Express encaminha a requisição para o seu handler de erros.

## Correções sem breaking change que vale conhecer

- `require('@tuvix.js/core')` e os outros entry points CommonJS funcionam. Na 0.4, cinco pacotes apontavam `require` para arquivos que o build nunca gerava.
- `getGlobalBus()` mantém a instância em `window`, então micro apps empacotados separadamente compartilham um único bus.
- Os adaptadores e `defineMicroApp` disparam `tuvix:mounted`, `tuvix:unmounted` e `tuvix:error`. Veja [Eventos de ciclo de vida](/pt/guide/lifecycle-events).
- Um `bootstrap()` que lança um erro roda de novo na próxima montagem. A 0.4 passava a ignorá-lo a partir daí.
- `register()` depois de `start()` monta o app imediatamente quando o path atual o ativa, e começa a observar um app com `mountWhenVisible`.
- Toda falha de ciclo de vida emite `tuvix:app:error` no bus com `{ name, error, phase }`. A 0.4 só o emitia para falhas de carregamento e montagem.
- `maxListeners` avisa com `console.warn` uma vez por evento, com ou sem `debug`.
- `orchestrator.connectRouter()` substitui pontes com `setTimeout` + `reconcile()`. Veja [Roteador externo](/pt/guide/external-router).
