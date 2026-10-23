# @tuvix.js/devtools

> Overlay de depuração na página que lista os apps registrados e montados de um orquestrador, a rota atual e o tráfego recente do event bus

Parte do framework de microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Instalação

```bash
npm install -D @tuvix.js/devtools
# or
pnpm add -D @tuvix.js/devtools
```

## Início rápido

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [{ path: '/dashboard/*', app: 'dashboard' }] },
});

// Install before register() so the log records tuvix:app:registered.
if (process.env.NODE_ENV !== 'production') {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}

orchestrator.register({ name: 'dashboard', entry: '/apps/dashboard.js', container: '#main' });
await orchestrator.start();
```

Um botão redondo aparece no canto inferior direito. O painel acima dele é atualizado a cada segundo e mostra:

- **Apps**: todos os apps registrados, com um ponto verde quando o status é `mounted` e um ponto branco nos demais casos.
- **Route**: `orchestrator.getRouter()?.currentPath`, ou `/` sem roteador.
- **Events**: os 10 eventos mais recentes do bus (horário e nome), do mais novo para o mais antigo.

O overlay também define `window.__TUVIX_DEVTOOLS__ = { panel, logger, orchestrator }`. Execute `__TUVIX_DEVTOOLS__.logger.getEntries()` no console para ler os payloads dos eventos.

## API

### `installDevTools(orchestrator, options?): () => void`

Aceita qualquer objeto com `getRegisteredApps()`, `getMountedApps()`, `getEventBus()` e `getRouter()`, como um `Orchestrator`. Retorna uma função de limpeza que interrompe o polling, desconecta o logger, remove o painel e apaga a global.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `maxLogEntries` | `number` | `200` | Número máximo de eventos que o logger guarda |
| `autoOpen` | `boolean` | `true` | `false` monta o painel oculto; o botão de alternância o abre |
| `updateInterval` | `number` | `1000` | Milissegundos entre as atualizações do painel |

### `EventLogger`

`new EventLogger(maxEntries = 200)` registra todos os eventos de um bus por meio de `onAny`. As entradas são `{ timestamp, event, data }`.

| Método | Comportamento |
| --- | --- |
| `attach(bus)` | Inscreve-se em todos os eventos. Lança um erro em um bus destruído. |
| `detach()` | Cancela a inscrição e mantém as entradas |
| `getEntries()` | Log completo, do mais antigo para o mais novo |
| `getRecent(count = 20)` | Últimas `count` entradas, da mais antiga para a mais nova |
| `clear()` | Esvazia o log |

```ts
import { createEventBus } from '@tuvix.js/core';
import { EventLogger } from '@tuvix.js/devtools';

const bus = createEventBus();
const logger = new EventLogger(50);
logger.attach(bus);
bus.emit('cart:add', { sku: 'A-1' });
console.log(logger.getRecent(1)); // [{ timestamp, event: 'cart:add', data: { sku: 'A-1' } }]
```

### `DevToolsPanel`

O DOM do overlay sem polling. Você fornece o estado.

| Método | Comportamento |
| --- | --- |
| `mount()` | Adiciona `#tuvix-devtools` ao `document.body`, aberto. Uma segunda chamada não faz nada. |
| `unmount()` | Remove o painel |
| `toggle()` | Mostra ou oculta o corpo do painel; o botão permanece |
| `update({ registeredApps, mountedApps, currentRoute, events })` | Renderiza de novo as três seções |

### `DevToolsOptions`

Tipo das opções de `installDevTools` descritas acima.

## Casos extremos

- O logger vê apenas os eventos emitidos depois de `installDevTools`, e o painel é preenchido na primeira atualização, `updateInterval` ms depois.
- Somente no navegador: `installDevTools` lança um `ReferenceError` durante a renderização no servidor.
- Um app em `mounting` ou `error` mostra um ponto branco; o painel não exibe nomes de status.
- Com o bus global padrão, o logger continua registrando depois de `orchestrator.destroy()` até você chamar a função de limpeza.
- Duas chamadas a `installDevTools` criam dois overlays com os mesmos ids de elemento, e a segunda sobrescreve `window.__TUVIX_DEVTOOLS__`.

## O que ele não faz

- Sem atalho de teclado e sem opções de posição, tamanho ou tema.
- Sem payloads, URLs de entry, estado do loader ou tempos na interface.
- Sem extensão de navegador nem link para devtools de frameworks.
- Sem remoção automática em produção: proteja o import com uma flag de build, como no início rápido.

Documentação completa: [tuvix.js.org/packages/devtools](https://tuvix.js.org/packages/devtools)

## Licença

MIT
