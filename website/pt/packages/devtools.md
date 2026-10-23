---
title: '@tuvix.js/devtools'
---

<PackageHeader
  name="@tuvix.js/devtools"
  title="DevTools"
  description="Overlay de depuração na página para um orquestrador. Lista os micro apps registrados e montados, a rota atual e o tráfego mais recente do event bus."
  icon="🛠️"
  npm="true"
/>

## Instalação

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Quando usar

Instale em desenvolvimento quando você precisar ver quais micro apps o orquestrador conhece, quais deles estão montados no momento e quais eventos passam pelo bus. O overlay fica no canto inferior direito da página e é atualizado uma vez por segundo.

Prefira as DevTools do navegador ou uma extensão de devtools do framework quando precisar de árvores de componentes, tempos de rede ou payloads de eventos em uma interface. Este pacote mostra nomes de apps, uma string de rota e nomes de eventos com um timestamp. Os payloads ficam no logger, que você pode ler pelo console.

## Início rápido

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
orchestrator.register({ name: 'settings', entry: '/apps/settings.js', container: '#main' });

await orchestrator.start();
```

Abra `/dashboard` e o overlay lista `dashboard` com um ponto verde e `settings` com um ponto branco. A linha Route mostra `/dashboard`, e a lista Events mostra os eventos `tuvix:app:status-change` e `tuvix:app:mount` da montagem do dashboard.

## O que o painel mostra

`installDevTools` adiciona um `<div id="tuvix-devtools">` a `document.body`. Ele contém um botão redondo de alternância (fixo a 12px do canto inferior direito, `z-index: 99999`) e, acima dele, um painel de 280px de largura com três seções:

| Seção | Origem | Conteúdo |
| --- | --- | --- |
| Apps | `orchestrator.getRegisteredApps()` e `getMountedApps()` | Uma linha por app registrado. Um ponto verde significa que o status dele é `mounted`. Um ponto branco cobre todos os outros status, incluindo `loading` e `error`. |
| Route | `orchestrator.getRouter()?.currentPath` | O caminho atual do roteador: sem o prefixo `base`, com a query string. Mostra `/` quando o orquestrador não tem roteador. |
| Events | `EventLogger` conectado a `orchestrator.getEventBus()` | Os 10 eventos mais recentes, do mais novo para o mais antigo. Cada linha mostra o horário local, um traço e o nome do evento. |

Por padrão, o orquestrador usa `getGlobalBus()`, então a lista Events também mostra os eventos que seus micro apps emitem no bus compartilhado, junto com os eventos do próprio orquestrador:

| Evento | Emitido quando |
| --- | --- |
| `tuvix:app:registered` | `register()` adiciona um app |
| `tuvix:app:bootstrap`, `tuvix:app:mount`, `tuvix:app:unmount` | Um app passa por essa etapa do ciclo de vida |
| `tuvix:app:error` | O carregamento, o bootstrap ou a montagem de um app falha |
| `tuvix:app:status-change` | O status de um app muda. Espere vários por montagem. |
| `tuvix:route:change` | O roteador navega |
| `tuvix:started`, `tuvix:destroyed` | `start()` e `destroy()` terminam |

O painel também expõe `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`. Rode `__TUVIX_DEVTOOLS__.logger.getEntries()` no console do navegador para ler os payloads que o painel não exibe.

## API

### `installDevTools`

```ts
import type { DevToolsOptions } from '@tuvix.js/devtools';
import type { IEventBus } from '@tuvix.js/core';

declare function installDevTools(
  orchestrator: {
    getRegisteredApps(): string[];
    getMountedApps(): string[];
    getEventBus(): IEventBus;
    getRouter(): { currentPath: string } | null;
  },
  options?: DevToolsOptions
): () => void;
```

O primeiro argumento aceita qualquer objeto com esses quatro métodos. Um `Orchestrator` de `@tuvix.js/core` ou `tuvix.js` se encaixa.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Número máximo de eventos que o logger guarda. O painel exibe 10 deles; o restante continua acessível por `__TUVIX_DEVTOOLS__.logger`. |
| `autoOpen` | `boolean` | `true` | `false` monta o painel oculto. O botão de alternância continua visível e o abre. |
| `updateInterval` | `number` | `1000` | Milissegundos entre as atualizações do painel. |

A cada chamada, ele:

1. cria um `DevToolsPanel` e um `EventLogger(maxLogEntries)`,
2. conecta o logger a `orchestrator.getEventBus()` com `onAny`,
3. monta o painel e o oculta quando `autoOpen` é `false`,
4. inicia um `setInterval` que lê o orquestrador e chama `panel.update()`,
5. define `window.__TUVIX_DEVTOOLS__`.

Ele retorna uma função de limpeza que cancela o intervalo, desconecta o logger, remove o painel e apaga `window.__TUVIX_DEVTOOLS__`.

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator();
const removeDevTools = installDevTools(orchestrator, {
  autoOpen: false,
  updateInterval: 250,
  maxLogEntries: 500,
});

// Later, for example in a hot-module-replacement dispose hook:
removeDevTools();
await orchestrator.destroy();
```

### `EventLogger`

```ts no-check
class EventLogger {
  constructor(maxEntries?: number); // default 200
  attach(bus: IEventBus): void;
  detach(): void;
  getEntries(): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>;
  getRecent(count?: number): ReadonlyArray<{ timestamp: number; event: string; data: unknown }>; // default 20
  clear(): void;
}
```

`EventLogger` registra todos os eventos de um bus por meio de `bus.onAny`. Cada entrada contém `timestamp` (`Date.now()` no momento da emissão), `event` (o nome) e `data` (o payload como foi emitido, sem clonagem). Quando o log passa de `maxEntries`, o logger descarta as entradas mais antigas.

| Método | Comportamento |
| --- | --- |
| `attach(bus)` | Assina todos os eventos de `bus`. Lança um erro quando o bus foi destruído. |
| `detach()` | Cancela a assinatura. As entradas registradas permanecem. |
| `getEntries()` | Retorna o log inteiro, do mais antigo para o mais novo. |
| `getRecent(count)` | Retorna as últimas `count` entradas, da mais antiga para a mais nova. |
| `clear()` | Esvazia o log e mantém a assinatura. |

Use-o sem o painel para fazer asserções sobre o tráfego do bus em um teste ou para despejar os eventos de uma página:

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);

bus.emit('cart:add', { sku: 'A-1' });

console.log(logger.getRecent(1)); // [{ timestamp: 1761..., event: 'cart:add', data: { sku: 'A-1' } }]
logger.detach();
```

### `DevToolsPanel`

```ts no-check
class DevToolsPanel {
  constructor();
  mount(): void;
  unmount(): void;
  toggle(): void;
  update(state: {
    registeredApps: string[];
    mountedApps: string[];
    currentRoute: string;
    events: Array<{ timestamp: number; event: string }>;
  }): void;
}
```

`DevToolsPanel` é a parte DOM do overlay, sem nenhum polling. Você chama `update()` com o estado que quer exibir.

| Método | Comportamento |
| --- | --- |
| `mount()` | Adiciona `#tuvix-devtools` a `document.body`, aberto. Uma segunda chamada na mesma instância não faz nada. |
| `unmount()` | Remove o elemento. |
| `toggle()` | Mostra ou oculta o corpo do painel. O botão de alternância permanece. Não faz nada antes de `mount()`. |
| `update(state)` | Reconstrói as seções Apps, Route e Events. Exibe os últimos 10 itens de `events`, do mais novo para o mais antigo. Não faz nada antes de `mount()`. |

```ts
import { DevToolsPanel } from '@tuvix.js/devtools';

const panel = new DevToolsPanel();
panel.mount();
panel.update({
  registeredApps: ['header', 'cart'],
  mountedApps: ['header'],
  currentRoute: '/checkout',
  events: [{ timestamp: Date.now(), event: 'cart:open' }],
});
```

### Tipos

| Nome | Significado |
| --- | --- |
| `DevToolsOptions` | Opções de `installDevTools`: `maxLogEntries`, `autoOpen`, `updateInterval`. |

O formato do orquestrador e o formato da entrada de log não são exportados. Use `Parameters<typeof installDevTools>[0]` e `ReturnType<EventLogger['getEntries']>[number]` quando precisar deles como tipos.

## Builds de produção

O pacote declara `"sideEffects": false`, mas um `import { installDevTools } from '@tuvix.js/devtools'` estático que seu código chama continua indo parar no bundle. Carregue-o atrás de uma flag de build com um `import()` dinâmico, como no início rápido. Os bundlers substituem `process.env.NODE_ENV` por uma string e eliminam o ramo morto e o chunk dele. Em um app Vite, você pode testar `import.meta.env.DEV` no lugar.

Deixar o overlay ativo em produção custa um `setInterval` que reconstrói três seções do DOM a cada segundo, uma assinatura de todos os eventos do bus e uma variável global que entrega o orquestrador a qualquer script da página.

## Casos extremos

- Instale antes de `register()` e `start()`. O logger só vê eventos emitidos depois de `attach`, e o painel fica vazio até a primeira atualização, `updateInterval` milissegundos depois da chamada.
- `installDevTools` precisa de `document` e `window`. Chamá-lo durante a renderização no servidor lança um `ReferenceError`. Chame-o a partir de código que roda só no cliente.
- Com `connectRouter()` e sem a opção `router`, `getRouter()` retorna `null` e a linha Route mostra `/`.
- `getMountedApps()` conta apenas o status `mounted`. Um app em `mounting` ou `error` recebe um ponto branco, e o painel nunca exibe o nome do status.
- Um bus privado (`createOrchestrator({ eventBus: {...} })`) é destruído por `orchestrator.destroy()`. Instalar depois disso lança um erro a partir de `onAny`. Com o bus global padrão, o logger continua registrando depois de `destroy()` até você chamar a função de limpeza.
- Cada chamada cria um novo painel. Duas chamadas colocam na página dois overlays com os mesmos ids de elemento, e a segunda chamada sobrescreve `window.__TUVIX_DEVTOOLS__`. A primeira função de limpeza então apaga a variável global que a segunda chamada definiu.
- Chamar `EventLogger.attach()` duas vezes na mesma instância substitui a função de cancelamento de assinatura armazenada. `detach()` então remove apenas a segunda assinatura.
- Quando o log atinge `maxLogEntries`, o logger copia o array a cada novo evento. Mantenha `maxLogEntries` na casa das centenas em páginas com buses muito movimentados.
- O painel escreve nomes de apps, rotas e nomes de eventos com `textContent`, então markup em um nome de evento é renderizado como texto.

## O que ele não faz

- Nenhum atalho de teclado e nenhuma opção de posição, tamanho ou tema. O overlay fica sempre no canto inferior direito, com estilos inline.
- Nenhum payload de evento, URL de entry, estado do cache do loader ou tempo de montagem na interface. Leia os payloads em `__TUVIX_DEVTOOLS__.logger.getEntries()`.
- Nenhuma extensão de navegador e nenhuma conexão com as devtools do React, Vue, Svelte ou Angular.
- Nenhuma viagem no tempo nem replay de eventos. O logger registra e nunca reemite.
- Nenhuma remoção automática em builds de produção. Você mesmo controla o import.
