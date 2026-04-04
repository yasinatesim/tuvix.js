# Arquitetura

## Visão Geral

Tuvix.js é estruturado como um monorepo de pacotes pequenos e combináveis. Você só importa o que usa.

```
@tuvix.js/core          ← Orchestrator, lifecycle, registro
@tuvix.js/router        ← Roteamento baseado em URL
@tuvix.js/event-bus     ← Pub/sub entre aplicações
@tuvix.js/loader        ← Carregamento dinâmico de bundles
@tuvix.js/sandbox       ← Isolamento CSS + JS
@tuvix.js/react         ← Bindings React
@tuvix.js/vue           ← Bindings Vue
@tuvix.js/svelte        ← Bindings Svelte
@tuvix.js/angular       ← Bindings Angular
@tuvix.js/devtools      ← Painel de depuração
@tuvix.js/server        ← Composição SSR
@tuvix.js/module-federation  ← Integração Webpack 5
create-tuvix-app        ← Scaffolding CLI
tuvix.js                ← Pacote guarda-chuva (tudo em um)
```

## Fluxo de Requisição

```
Mudança de URL
    │
    ▼
@tuvix.js/router         ← Associa o caminho ao nome da micro app
    │
    ▼
@tuvix.js/core           ← Orchestrator decide montar/desmontar
    │
    ▼
@tuvix.js/loader         ← Busca e executa o bundle da micro app
    │
    ▼
@tuvix.js/sandbox        ← Envolve a app em um escopo isolado (opcional)
    │
    ▼
Micro App .mount()       ← App renderiza em seu elemento contêiner
```

## Ciclo de Vida

Toda micro app deve implementar a interface `MicroApp`:

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

O orchestrator chama estes hooks no momento certo:

1. **`mount`** - chamado quando a rota da app se torna ativa
2. **`unmount`** - chamado ao navegar para longe da rota da app
3. **`update`** - chamado quando as props mudam sem uma remontagem completa

## Modelo de Isolamento

### Isolamento CSS (Shadow DOM)

Quando `sandbox.css = true`, o contêiner da micro app se torna um host Shadow DOM. Estilos definidos dentro não podem vazar para fora, e estilos globais não podem vazar para dentro.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true },
});
```

### Isolamento JS (Proxy Scope)

Quando `sandbox.js = true`, o escopo global da micro app é envolvido em um `Proxy`. Acesso a `window.localStorage`, `window.addEventListener`, etc. é interceptado e limpo na desmontagem.

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: { css: true, js: true },
});
```

## Event Bus

O event bus é um canal pub/sub desacoplado compartilhado entre todas as micro apps:

```ts
// Publicador (qualquer micro app)
import { getGlobalBus } from '@tuvix.js/event-bus';
eventBus.emit('user:login', { userId: '42' });

// Assinante (outra micro app)
eventBus.on('user:login', ({ userId }) => {
  console.log('User logged in:', userId);
});
```

Os eventos são tipados - TypeScript impõe a forma do payload do evento.
