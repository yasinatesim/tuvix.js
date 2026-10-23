# @tuvix.js/angular

> Bindings do Angular 15+ para o framework de microfrontend Tuvix.js

Parte do framework de microfrontend [Tuvix.js](https://github.com/yasinatesim/tuvix.js).

## Instalação

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Adicione `@angular/compiler` para componentes JIT, e `@angular/platform-server` junto com `@angular/compiler` no servidor para usar `renderAngularToString` (Angular 16+).

## Início Rápido

```ts
import { Component, Input } from '@angular/core';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

O adaptador registra o módulo com `registerModule` de `@tuvix.js/loader`. As props vindas do orquestrador se tornam inputs do componente:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'greeting', entry: () => import('./greeting-app'), container: '#greeting', props: { name: 'Ada' } });
await orchestrator.start();
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

## API

### `createAngularMicroApp(config)`

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome do app, registrado com `registerModule` |
| `component` | `Type<C>` | obrigatório | Componente raiz |
| `module` | `Type<unknown>` | nenhum | NgModule que declara `component`; os providers dele são adicionados com `importProvidersFrom` |
| `providers` | `AngularProviders` | `[]` | Providers de ambiente, como `provideHttpClient()` |
| `selector` | `string` | parte de elemento do seletor do componente, senão `'div'` | Nome da tag do elemento host |
| `zone` | `boolean` | `false` | Usa zone.js; a sua entry precisa importar `zone.js` primeiro |
| `ssr` | `boolean` | `false` | Adota o markup gerado por `renderAngularToString` |
| `bootstrap` | `() => void \| Promise<void>` | nenhum | Configuração executada uma única vez |

- Cada montagem chama `createApplication` e faz o bootstrap do componente no próprio elemento host dentro do container, então dois apps Angular (ou duas cópias do mesmo app) nunca entram em conflito em um único `app-root`.
- As props são definidas com `ComponentRef.setInput` antes da primeira detecção de mudanças, então o `ngOnInit` as enxerga. Chaves que não são inputs são ignoradas.
- `update({ props, container? })` define os novos inputs e executa `appRef.tick()` para um container ou para todas as montagens. Inputs ausentes nas novas props voltam para `undefined`.
- Componentes JIT (sem `ɵcmp`) recebem `@angular/compiler` carregado antes de `@angular/platform-browser`. Isso só ajuda quando o adaptador é o primeiro código a carregar um pacote Angular além de `@angular/core`. Se os arquivos dos seus componentes importam `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` ou outra biblioteca Angular, esses pacotes são avaliados antes de o adaptador rodar e falham com "JIT compilation failed". Mantenha `import '@angular/compiler'` como a primeira linha da sua entry de cliente, ou faça o build com AOT.
- `unmount` destrói a aplicação, esvazia o container e dispara `tuvix:unmounted`. Se for chamado enquanto o `mount` ainda está carregando, ele cancela a montagem.

### `createSsrAngularMicroApp(config)`

Igual a `createAngularMicroApp({ ...config, ssr: true })`. Quando o container contém markup do servidor, o Angular renderiza no elemento host do servidor e o adaptador remove as tags `<style>` inline do servidor. `tuvix:mounted` informa `hydrated: true`.

Isso renderiza de novo por cima do DOM do servidor. A hidratação não destrutiva do Angular (`provideClientHydration`) precisa de um comentário marcador de hidratação diretamente dentro de `<body>`, algo que uma ilha dentro de outra página não consegue fornecer, por isso o adaptador não o adiciona.

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString(component, options?)` de `@tuvix.js/angular/server`

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `providers` | `AngularProviders` | `[]` | Providers para a renderização no servidor |
| `appId` | `string` | `'ng'` | `APP_ID` do Angular |
| `document` | `string` | documento vazio com o elemento host | Documento no qual renderizar |
| `selector` | `string` | parte de elemento do seletor do componente, senão `'app-root'` | Tag host para o documento padrão |
| `props` | `Record<string, unknown>` | `{}` | Valores para os inputs do componente, definidos antes da primeira detecção de mudanças |

Retorna as tags `<style>` do componente seguidas do markup do body. Roda sem zone (zoneless), nunca altera `Promise` e não espera as requisições HTTP que o componente inicia. Chame a partir de uma função de servidor; no navegador, retorna `''`.

`props` funciona como as props do cliente: as chaves são nomes de inputs (ou aliases), chaves que não são inputs são ignoradas, e o `ngOnInit` enxerga os valores. Passe o mesmo objeto para a renderização no servidor e para o `mount`, para que os dois lados renderizem o mesmo markup.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

const props = { name: 'Ada' };
const aboutHtml = await renderAngularToString(AboutComponent, { appId: 'about', props });
// Client: aboutApp.mount({ container, props })
```

### Tipos

`AngularMicroAppConfig<C>`, `AngularSsrMicroAppConfig<C>`, `AngularSsrOptions`, `AngularProviders` (todos de `@tuvix.js/angular`).

## Detecção de Mudanças

O adaptador nunca importa zone.js. Sem `zone: true`, ele adiciona `provideZonelessChangeDetection()` no Angular 20+, `provideExperimentalZonelessChangeDetection()` no 18-19, e substitui `NgZone` por `ɵNoopNgZone` no 15-17.

- Angular 18+: event listeners, signals, `markForCheck()` e `AsyncPipe` agendam a detecção de mudanças. Um campo comum alterado em um timer ou em um callback de `fetch` não agenda; use um signal ou `markForCheck()`.
- Angular 15-17: eventos DOM não disparam a detecção de mudanças. Chame `ChangeDetectorRef.detectChanges()` depois de alterar o estado, ou passe `zone: true`.

## Casos Extremos

- `zone: true` sem zone.js carregado rejeita a montagem e dispara `tuvix:error`.
- `unmount` em um container que este módulo nunca montou não faz nada.
- No Angular 16, `@angular/platform-server` copia as classes DOM do Domino (`Event`, `Node`, ...) para o objeto global do Node durante uma renderização no servidor. Quem faz isso é o Angular, não o adaptador.
- Componentes com seletor de atributo precisam de um `document` com um elemento host correspondente no servidor.

## O Que Ele Não Faz

- Ele não carrega zone.js, não adiciona `provideClientHydration()` e não preserva nós do DOM do servidor nem o estado de formulários.
- Ele não grava `window.__TUVIX_ANGULAR_PROPS__`; declare inputs.

Documentação completa: [tuvix.js.org/packages/angular](https://tuvix.js.org/packages/angular)

## Licença

MIT
