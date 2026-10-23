---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Bindings para Angular"
  description="Transforma um componente Angular 15+ em um micro app Tuvix.js: zoneless por padrão, uma aplicação por container, props como inputs do componente e renderização no servidor com estilos."
  icon="🔺"
  npm="true"
/>

## Instalação

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Adicione `@angular/compiler` quando os seus componentes não forem compilados com AOT (JIT), e `@angular/platform-server` mais `@angular/compiler` no servidor quando você chamar `renderAngularToString`. O adaptador de cliente requer Angular 15 ou mais recente; o renderizador de servidor requer Angular 16 ou mais recente.

## Quando usar

Use este pacote quando um componente Angular deve rodar como um micro app entre outros: o orquestrador o monta em um container em uma rota, passa props, as atualiza e o desmonta na saída. Vários apps Angular, ou várias cópias de um mesmo app, podem dividir uma página porque cada montagem recebe sua própria aplicação Angular e seu próprio elemento host. O adaptador nunca carrega o zone.js, então uma ilha Angular não modifica `Promise` nem `addEventListener` para os apps React ou Vue ao lado dela.

Se o Angular controla a página inteira, faça o bootstrap da forma usual com `bootstrapApplication`. Nesse caso o adaptador não traz nenhum ganho.

## Início rápido

Um componente standalone com um input:

```ts
// greeting.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}
```

A entry do micro app o envolve:

```ts
// greeting-app.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { GreetingComponent } from './greeting.component';

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

O shell registra o app e inicia o orquestrador:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'greeting',
  entry: () => import('./greeting-app'),
  container: '#greeting',
  activeWhen: '/hello',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Later: setInput('name', 'Grace') and one change detection pass.
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

O adaptador cria um elemento host `<app-greeting>` dentro de `#greeting` e, após a atualização, ele exibe "Hello Grace".

## API

### `createAngularMicroApp`

```ts no-check
function createAngularMicroApp<C>(config: AngularMicroAppConfig<C>): MicroAppModule;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `name` | `string` | obrigatório | Nome do app. O adaptador registra o módulo com esse nome usando `registerModule` de `@tuvix.js/loader`. |
| `component` | `Type<C>` | obrigatório | Componente raiz. Componentes standalone funcionam sozinhos. |
| `module` | `Type<unknown>` | nenhum | NgModule que declara `component`. O adaptador adiciona os providers dele com `importProvidersFrom`. |
| `providers` | `AngularProviders` | `[]` | Providers de ambiente da aplicação, como `provideHttpClient()`. |
| `selector` | `string` | parte de elemento do seletor do componente, senão `'div'` | Nome da tag do elemento host que o adaptador cria dentro do container. |
| `zone` | `boolean` | `false` | Usa a detecção de mudanças do zone.js. A sua entry de cliente precisa importar `zone.js` primeiro. |
| `ssr` | `boolean` | `false` | Adota a marcação de `renderAngularToString`. Veja `createSsrAngularMicroApp`. |
| `bootstrap` | `() => void \| Promise<void>` | nenhum | Configuração executada uma única vez. O `bootstrap()` do módulo aguarda sua conclusão. |

Cada `mount({ container, props })`:

1. Carrega `@angular/compiler` primeiro quando `component` ou `module` não tem definição AOT (`ɵcmp` / `ɵmod`), depois `@angular/core` e `@angular/platform-browser`. Isso só ajuda quando o adaptador é o primeiro código a carregar um pacote Angular além de `@angular/core`. Se os arquivos dos seus componentes importam `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` ou outra biblioteca Angular, esses pacotes são avaliados antes de o adaptador rodar e falham com "JIT compilation failed". Mantenha `import '@angular/compiler'` como a primeira linha da sua entry de cliente, ou faça o build com AOT.
2. Chama `createApplication({ providers })` com os providers de detecção de mudanças da sua versão do Angular (veja [Detecção de mudanças](#deteccao-de-mudancas)), os providers do módulo e `providers`.
3. Cria o elemento host (`<app-greeting>` para o seletor `'app-greeting'`, `<div>` para um seletor de atributo como `'[card]'`), o coloca no container e faz o bootstrap do componente nele.
4. Define as props como inputs do componente com `ComponentRef.setInput` antes da primeira detecção de mudanças, então `ngOnInit` já as enxerga. Em versões do Angular sem `ComponentFactoryResolver`, os inputs são definidos logo após o bootstrap, seguidos de um tick.
5. Dispara `tuvix:mounted` no container. Uma falha dispara `tuvix:error` e rejeita com o erro original.

`update({ props, container? })` escreve os novos valores com `setInput` e executa `appRef.tick()`, para um container ou para todas as montagens quando você omite `container`. Isso renderiza em todas as versões do Angular, com ou sem zone.

`unmount({ container })` destrói a aplicação, esvazia o container e dispara `tuvix:unmounted`.

Um componente declarado em um NgModule:

```ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin/admin.component';
import { AdminModule } from './admin/admin.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  module: AdminModule,
  providers: [provideHttpClient()],
});
```

### `createSsrAngularMicroApp`

```ts no-check
function createSsrAngularMicroApp<C>(config: AngularSsrMicroAppConfig<C>): MicroAppModule;
```

Mesmas opções de `createAngularMicroApp`, sem `ssr`; ele se comporta como `createAngularMicroApp({ ...config, ssr: true })`. Use-o no cliente para ilhas que o servidor renderizou com `renderAngularToString`.

Quando o container contém marcação do servidor, o adaptador reutiliza o elemento host se ele for filho direto do container com a tag esperada. O Angular renderiza nesse elemento, substituindo os filhos vindos do servidor. Depois que o Angular adiciona os estilos do componente ao `<head>`, o adaptador remove as tags `<style>` inline do servidor e qualquer outra coisa ao lado do host. `tuvix:mounted` reporta `hydrated: true`. Um container vazio recebe uma renderização normal no cliente.

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString`

```ts no-check
// import from '@tuvix.js/angular/server'
function renderAngularToString(component: unknown, options?: AngularSsrOptions): Promise<string>;
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `props` | `Record<string, unknown>` | `{}` | Valores de input indexados pelo nome do input (ou alias). Definidos antes da primeira detecção de mudanças, como na montagem no cliente. Chaves que não são inputs são ignoradas. |
| `providers` | `AngularProviders` | `[]` | Providers de ambiente para a renderização no servidor. |
| `appId` | `string` | `'ng'` (padrão do Angular) | `APP_ID` do Angular. O Angular o escreve no atributo `ng-app-id` das tags de estilo. |
| `document` | `string` | um documento vazio com o elemento host no `<body>` | Documento HTML no qual renderizar. Ele precisa conter o elemento host. |
| `selector` | `string` | parte de elemento do seletor do componente, senão `'app-root'` | Tag do elemento host para o documento padrão; o Angular faz o bootstrap no elemento que corresponde a ela. |

Renderiza um componente standalone com `renderApplication` de `@angular/platform-server` e retorna um único fragmento: as tags `<style>` do componente vindas do `<head>` renderizado, seguidas do HTML interno do `<body>`. Coloque o fragmento no container em que `createSsrAngularMicroApp` monta; a ilha já tem seus estilos na primeira pintura.

As `props` chegam ao componente por meio de `setInput` antes da primeira detecção de mudanças, da mesma forma que o `mount` do cliente as define, então `ngOnInit` as enxerga dos dois lados. Passe o mesmo objeto para a renderização no servidor e para a montagem no cliente e ambos produzem a mesma marcação.

A renderização roda sem zone e nunca modifica o `Promise` global. Ela sempre carrega `@angular/compiler` primeiro, porque o Node carrega os pacotes Angular de `node_modules` sem o linker do Angular. Chame-a a partir de uma função de servidor, não de código que também roda no navegador: no navegador ela retorna `''`.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAboutIsland(): Promise<string> {
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props: { title: 'About us' } });
  return `<section id="about" data-tuvix-app="about">${html}</section>`;
}
```

### Tipos

| Tipo | Significado |
| --- | --- |
| `AngularMicroAppConfig<C>` | Opções de `createAngularMicroApp`. |
| `AngularSsrMicroAppConfig<C>` | `AngularMicroAppConfig<C>` sem `ssr`; opções de `createSsrAngularMicroApp`. |
| `AngularSsrOptions` | Opções de `renderAngularToString`. Importe o tipo de `@tuvix.js/angular`. |
| `AngularProviders` | `Array<Provider \| EnvironmentProviders>`, o que `createApplication` e `bootstrapApplication` aceitam. |

## Detecção de mudanças {#deteccao-de-mudancas}

O adaptador nunca importa o zone.js. A menos que você passe `zone: true`, ele escolhe a configuração zoneless que a sua versão do Angular suporta:

| Angular | Provider que o adaptador adiciona | O que dispara a detecção de mudanças |
| --- | --- | --- |
| 20 e mais recentes | `provideZonelessChangeDetection()` | Listeners de eventos do template, escritas em signals, `markForCheck()`, `AsyncPipe`, `setInput` |
| 18 e 19 | `provideExperimentalZonelessChangeDetection()` | O mesmo que no 20 |
| 15 a 17 | `NgZone` substituído por `ɵNoopNgZone` | Nada por conta própria. O `update()` vindo do host ainda renderiza. |

No Angular 18 e mais recentes, um campo comum que você altera em um callback de `setTimeout` ou `fetch` não re-renderiza o template. Mantenha esse state em um signal ou chame `ChangeDetectorRef.markForCheck()`:

```ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  standalone: true,
  template: `<time>{{ now() }}</time>`,
})
export class ClockComponent {
  readonly now = signal(new Date().toLocaleTimeString());

  constructor() {
    setInterval(() => this.now.set(new Date().toLocaleTimeString()), 1000);
  }
}
```

No Angular 15 a 17, cliques e outros eventos do DOM também não disparam a detecção de mudanças. Chame `ChangeDetectorRef.detectChanges()` depois de alterar o state:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="increment()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  increment(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

Para manter a detecção de mudanças baseada em zone, importe o zone.js na sua entry de cliente antes de o adaptador montar e passe `zone: true`. O adaptador então mantém o `NgZone` padrão do Angular e faz o bootstrap dentro dele:

```ts
import 'zone.js';
import { createAngularMicroApp } from '@tuvix.js/angular';
import { DashboardComponent } from './dashboard.component';

export default createAngularMicroApp({ name: 'dashboard', component: DashboardComponent, zone: true });
```

O zone.js modifica `Promise`, timers e listeners do DOM para a página inteira, incluindo os apps dos outros frameworks.

## Renderização no servidor

1. No servidor, chame `renderAngularToString(Component)` e coloque o fragmento no elemento container.
2. No cliente, exporte `createSsrAngularMicroApp({ name, component })` a partir da entry da ilha.
3. O orquestrador monta o app nesse container. O Angular renderiza no elemento host vindo do servidor e o adaptador descarta os estilos do servidor.

O adaptador re-renderiza por cima do DOM do servidor. Ele não usa a hidratação não destrutiva do Angular (`provideClientHydration`), porque essa hidratação espera uma página que o Angular renderizou de ponta a ponta: ela procura o comentário marcador de hidratação do Angular como filho direto de `<body>` e anotações `ngh` nos componentes. Uma ilha dentro de uma página renderizada por React, Vue ou um template de servidor simples não tem nenhum dos dois. A contrapartida: a marcação visível e os estilos chegam com o HTML, mas o state dentro da ilha (foco, um valor digitado, posição de rolagem) é reiniciado quando o Angular assume, e cliques antes desse momento não fazem nada.

Passe as mesmas props para a renderização no servidor e para a montagem no cliente, para que a renderização no cliente corresponda à marcação do servidor. A renderização não aguarda requisições HTTP nem timers que o componente inicia: carregue os dados antes e entregue-os como props.

```ts
// server.ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<{ html: string; props: { text: string } }> {
  const response = await fetch('https://api.example.com/about');
  const props = { text: await response.text() };
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props });
  return { html, props };
}
```

Envie `props` ao navegador junto com a página (por exemplo, como JSON em uma tag `<script type="application/json">`) e registre o app com elas:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const props = JSON.parse(document.getElementById('about-props')?.textContent ?? '{}') as Record<string, unknown>;
const orchestrator = createOrchestrator();

orchestrator.register({ name: 'about', entry: () => import('./about-app'), container: '#about', props });
await orchestrator.start();
```

Para valores que não são inputs, como a URL base de uma API, passe `providers` dos dois lados.

## Casos extremos

- `zone: true` sem zone.js na página rejeita a montagem com `[tuvix.js/angular] "<name>" sets zone: true, but zone.js is not loaded. Import 'zone.js' in your client entry before mounting, or drop zone: true.` e dispara `tuvix:error`.
- Props cujas chaves não são inputs do componente são ignoradas, então o Angular não registra o NG0303. Os inputs são associados pelo nome público (o alias, se você definiu um).
- Um input presente nas props antigas e ausente nas novas props é definido como `undefined`. O inicializador do campo (`name = ''`) não roda de novo.
- `update` antes de a montagem terminar guarda as props; o bootstrap pendente usa as mais recentes. `update({ container })` para um container que este módulo não montou não faz nada.
- `unmount` enquanto `mount` ainda está carregando o Angular a cancela: a aplicação é destruída, o container fica vazio e nenhum `tuvix:mounted` é disparado. Se o cancelamento chegar depois do bootstrap, você recebe `tuvix:mounted` seguido de `tuvix:unmounted`.
- Um segundo `mount` no mesmo container destrói a primeira aplicação antes de fazer o bootstrap da nova.
- `unmount` em um container que este módulo nunca montou não faz nada.
- Se a destruição da aplicação lançar um erro, o adaptador esvazia o container, dispara `tuvix:error` e relança o erro.
- Com SSR, um container cuja marcação não tem um filho direto correspondente à tag do host recebe um novo elemento host. `hydrated` ainda é `true`, porque o container continha marcação.
- No servidor, um componente com seletor de atributo (`'[card]'`) recorre a um host `<app-root>`, que o seletor não corresponde. Passe um `document` cujo `<body>` contenha um elemento correspondente.
- No Angular 16, `@angular/platform-server` copia as classes de DOM do Domino (`Event`, `Node` e outras) para o objeto global do Node durante uma renderização no servidor. Quem faz isso é o Angular, não o adaptador.
- Componentes JIT sem o plugin do compilador Angular ainda precisam de `experimentalDecorators` do TypeScript; o Angular não suporta a proposta padrão de decorators.

## O que ele não faz

- Ele não carrega o zone.js nem qualquer outro polyfill.
- Ele não adiciona `provideClientHydration()` e não realiza hidratação não destrutiva.
- Ele não envia as props do servidor ao navegador. Serialize-as na página você mesmo e passe o mesmo objeto para a montagem no cliente.
- Ele não aguarda chamadas HTTP, timers ou `PendingTasks` que o componente inicia durante uma renderização no servidor.
- Ele não mantém os nós do DOM do servidor, o foco ou o state de formulários quando o cliente assume.
- Ele não fornece ao componente um serviço de props ou um bus do Tuvix. Declare inputs para as props e use [`@tuvix.js/event-bus`](/pt/packages/event-bus) para se comunicar com outros apps.

## Migração a partir da 0.4

**`createAngularMicroApp` recebe um componente.** `platform` e `compilerOptions` foram removidos. Passe o componente raiz como `component` e, se ele for declarado em um NgModule, o módulo como `module`.

```ts no-check
// 0.4
createAngularMicroApp({
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

export default createAngularMicroApp({ name: 'admin', component: AppComponent, module: AppModule });
```

**Props são inputs.** `update()` não escreve mais `window.__TUVIX_ANGULAR_PROPS__`. Apague os serviços que leem essa global e declare campos `@Input()` com os nomes das props.

**Zoneless por padrão.** Os apps rodam sem zone.js, a menos que você passe `zone: true`. No Angular 15 a 17, eventos do DOM não disparam mais a detecção de mudanças; chame `ChangeDetectorRef.detectChanges()` nos handlers ou opte pelo zone.js. Você pode remover `provideZonelessChangeDetection()` da sua entry. Remova `import '@angular/compiler'` apenas quando os arquivos dos seus componentes não importam nada do Angular além de `@angular/core`; caso contrário, mantenha-o como a primeira linha da entry de cliente, ou faça o build com AOT.

**Sem `provideClientHydration()` automático.** `createSsrAngularMicroApp` re-renderiza por cima da marcação do servidor. Deixe `provideClientHydration()` fora dos `providers` dele.

**`appId` passa a ter efeito.** Na 0.4, `renderAngularToString` aceitava `appId` e o ignorava. Agora ele define o `APP_ID` do Angular, então o atributo `ng-app-id` das tags de estilo muda de `ng` para o seu valor.

**Elemento host.** No cliente e no servidor, a tag do host vem do seletor do componente em vez de um `'app-root'` fixo, e o adaptador de cliente a cria dentro do container. `unmount` em um container que o módulo nunca montou não o limpa mais.

Veja o [guia de Angular](/pt/guide/angular) para um app completo.
