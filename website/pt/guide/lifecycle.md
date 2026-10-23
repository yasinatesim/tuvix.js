# Hooks de ciclo de vida

O orquestrador conduz cada app registrado por uma sequência fixa de hooks e status. Esta página cobre os hooks que o seu módulo implementa, os status que o shell pode ler e o que acontece em erros e em navegação rápida. Para descobrir, de fora, quando um app está na página, use [Eventos de ciclo de vida](/pt/guide/lifecycle-events).

## Ordem dos hooks

```text
register()
  └─ first activation: load entry → bootstrap() → mount()
       ├─ updateAppProps() while mounted → update()
       └─ deactivation → unmount()
  └─ next activation: mount()   (module cached, no bootstrap)
```

O orquestrador espera cada hook terminar. Ele nunca chama `mount` em um app que ainda está sendo montado e nunca chama `unmount` enquanto `mount` ainda está rodando: a desmontagem espera a montagem terminar.

## bootstrap

Roda uma vez por módulo carregado, depois que a entry carrega e antes do primeiro `mount`. Use-o para trabalho que deve sobreviver a remontagens, como ler configuração.

```ts
import { defineMicroApp } from '@tuvix.js/core';

let config: { apiUrl: string } | undefined;

export default defineMicroApp({
  name: 'reports',
  async bootstrap() {
    const response = await fetch('/reports/config.json');
    config = (await response.json()) as { apiUrl: string };
  },
  mount({ container }) {
    container.textContent = `API: ${config?.apiUrl ?? 'unknown'}`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Se `bootstrap` lançar um erro, o app vai para o status `error` e a montagem falha. A próxima tentativa de montagem chama `bootstrap` de novo. Depois de uma execução bem-sucedida, as remontagens o pulam.

## mount

Roda toda vez que o app se torna ativo, ou quando você chama `mountApp(name)`. O contexto contém:

| Campo | Valor |
| --- | --- |
| `container` | O elemento em que renderizar. Para apps com `sandbox: true`, um elemento dentro da shadow root. |
| `props` | As props registradas mescladas com cada chamada de `updateAppProps`. |
| `name` | O nome registrado do app. |
| `bus` | O event bus do orquestrador. |

`mountApp(name)` resolve depois que `mount` termina e rejeita com o erro de carregamento ou de montagem.

## update

Roda quando o shell chama `updateAppProps(name, props)` enquanto o app está montado:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('reports', { range: '7d' });
```

O contexto contém as `props` mescladas e o `container`. Se `update` não existir ou o app não estiver montado, o orquestrador guarda as props e as passa para o próximo `mount`. Ele nunca remonta um app porque as props mudaram.

`updateAppProps` espera primeiro uma montagem pendente, para que a atualização chegue à nova instância. Um `unmount` que chega durante uma atualização espera a atualização.

## unmount

Roda quando o app se torna inativo, em `unmountApp(name)`, `unregister(name)` e `destroy()`. Remova tudo o que `mount` criou: raízes de framework, listeners, timers, inscrições no bus.

Depois de `unmount`, o orquestrador remove as folhas de estilo da entry do app de `document.head`. A próxima montagem as adiciona de volta e espera que carreguem.

## Status do app

```ts
import { createOrchestrator, type AppStatus } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
const status: AppStatus | null = orchestrator.getAppStatus('reports');
// 'registered' | 'bootstrapping' | 'bootstrapped' | 'mounting' | 'mounted'
// | 'updating' | 'unmounting' | 'unmounted' | 'error' | null (not registered)
```

| Método | Retorna |
| --- | --- |
| `getAppStatus(name)` | O status, ou `null` para um nome desconhecido. |
| `getMountedApps()` | Nomes com status `mounted`. |
| `getRegisteredApps()` | Todos os nomes registrados. |

## Erros e fallback

Quando o carregamento, `bootstrap` ou `mount` falha, o orquestrador:

1. escreve o HTML de `fallback` do app no container dele, quando você define um;
2. define o status `error`;
3. emite `OrchestratorEvent.APP_ERROR` (`tuvix:app:error`) no bus com `{ name, error, phase }`;
4. chama `onError(error, name)`;
5. rejeita `mountApp`. Uma montagem que falha durante uma mudança de rota é registrada com `console.error`, e os outros apps continuam sendo montados.

Um `update` ou `unmount` que falha executa os passos 2 a 4 e rejeita `updateAppProps` ou `unmountApp`; ele não escreve HTML de fallback. `phase` é `'load'` (que inclui resolver o container), `'bootstrap'`, `'mount'`, `'update'` ou `'unmount'`.

```ts
import { createOrchestrator, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.getEventBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, phase, error }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

A próxima mudança de rota que ativar um app com status `error` tenta montá-lo de novo.

## Navegação rápida

As mudanças de rota passam por reconcile uma de cada vez. Os apps inativos são desmontados antes de os apps ativos serem montados. Quando os paths chegam mais rápido do que os apps são montados:

- apenas o path mais recente na fila roda em seguida;
- um app que se torna inativo enquanto sua entry carrega pula a montagem;
- um app que se torna inativo enquanto `mount` roda é desmontado assim que `mount` termina.

Assim, A → B → A em sequência rápida termina com apenas A montado, e nenhum app é renderizado em um container que outro app ainda ocupa.

## Hooks no nível do shell

```ts
import { createOrchestrator, OrchestratorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError: (error, name) => console.error(`[${name}]`, error),
  onStatusChange: (name, status) => console.debug(`[${name}] ${status}`),
});

const bus = orchestrator.getEventBus();
bus.on<{ name: string }>(OrchestratorEvent.APP_MOUNT, ({ name }) => {
  console.log('mounted', name);
});
bus.on<{ name: string }>(OrchestratorEvent.APP_UNMOUNT, ({ name }) => {
  console.log('unmounted', name);
});
bus.on<{ to: string }>(OrchestratorEvent.ROUTE_CHANGE, ({ to }) => {
  console.log('route', to);
});
```

| Evento | Payload | Emitido |
| --- | --- | --- |
| `tuvix:app:registered` | `{ name }` | `register()` |
| `tuvix:app:bootstrap` | `{ name }` | depois de `bootstrap` |
| `tuvix:app:mount` | `{ name }` | depois de `mount` |
| `tuvix:app:unmount` | `{ name }` | depois de `unmount` |
| `tuvix:app:error` | `{ name, error, phase }` | falha em load, bootstrap, mount, update ou unmount |
| `tuvix:app:status-change` | `{ name, status }` | a cada mudança de status |
| `tuvix:route:change` | `{ from, to, fromRoute, toRoute }` | apenas navegação do roteador embutido |
| `tuvix:started` | `{}` | fim de `start()` |
| `tuvix:destroyed` | `{}` | fim de `destroy()` |

Esses eventos do bus vêm do orquestrador. Os eventos DOM `tuvix:mounted` em [Eventos de ciclo de vida](/pt/guide/lifecycle-events) vêm dos adaptadores e de `defineMicroApp`, e também são disparados para ilhas montadas sem orquestrador.

## Encerramento

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.destroy();
```

`destroy()` espera um reconcile em execução, desmonta todos os apps, para o roteador, as inscrições de `connectRouter`, o prefetch e o observador de viewport, e limpa o cache do loader. Ele destrói um event bus privado e mantém o bus global ativo. Chamá-lo duas vezes é seguro. Depois dele, `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` e `connectRouter` lançam erro; crie um novo orquestrador.
