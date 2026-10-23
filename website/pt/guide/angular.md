# Com Angular

`@tuvix.js/angular` faz o bootstrap de um componente Angular como micro app, sem zone.js por padrão. Ele também renderiza componentes standalone para HTML no servidor.

Suporta Angular 15 ou posterior. `renderAngularToString` precisa do Angular 16 ou posterior com `@angular/platform-server`.

## Instalação

```bash
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
# JIT components (no AOT build step) also need the compiler
pnpm add @angular/compiler
# for renderAngularToString
pnpm add @angular/platform-server
```

## Transforme um componente em micro app

```ts
// src/main.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin.component';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  providers: [provideHttpClient()],
});
```

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `name` | `string` | Obrigatório. Deve ser igual ao nome do app registrado. |
| `component` | `Type<C>` | Obrigatório. Componente raiz, standalone ou declarado em `module`. |
| `module` | `Type<unknown>` | NgModule que declara `component`. Os providers dele são importados com `importProvidersFrom`. |
| `providers` | `Array<Provider \| EnvironmentProviders>` | Providers de ambiente. |
| `selector` | `string` | Tag do elemento host. Padrão: a parte de elemento do seletor do componente, ou `div`. |
| `zone` | `boolean` | Usa a detecção de mudanças do zone.js. Padrão `false`. |
| `ssr` | `boolean` | Adota o markup de `renderAngularToString`. `createSsrAngularMicroApp` define essa opção. |
| `bootstrap` | `() => void \| Promise<void>` | Roda uma vez antes da primeira montagem. |

Cada montagem chama `createApplication` e faz o bootstrap do componente no seu próprio elemento host dentro do container. Dois apps Angular em uma página, ou um módulo em dois containers, não entram em conflito em um `app-root` compartilhado.

Quando o componente não tem um `ɵcmp` compilado (JIT), o adaptador carrega `@angular/compiler` antes de `@angular/platform-browser`. Isso só ajuda quando o adaptador é o primeiro código a carregar um pacote Angular além de `@angular/core`. Se os arquivos dos seus componentes importam `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` ou outra biblioteca Angular, esses pacotes são avaliados antes de o adaptador rodar e falham com "JIT compilation failed". Mantenha `import '@angular/compiler'` como a primeira linha da sua entry de cliente, ou faça o build com AOT.

## Inputs a partir das props

Declare as props como inputs do componente:

```ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `<h1>Admin for {{ userId }}</h1>`,
})
export class AdminComponent {
  @Input() userId = '';
}
```

- A montagem define os inputs com `ComponentRef.setInput` antes da primeira detecção de mudanças, então `ngOnInit` já os enxerga.
- `update({ props })` define os novos valores e roda a detecção de mudanças. Com `container`, atualiza apenas aquela montagem.
- Chaves que não são inputs são ignoradas. Inputs ausentes nas novas props voltam a `undefined`.

## Detecção de mudanças sem zone.js

O adaptador nunca importa o zone.js, então ele não altera `Promise`, timers nem eventos de DOM na página ou no servidor. Ele escolhe o provider pela versão do Angular:

| Angular | Provider | Eventos de DOM disparam detecção de mudanças |
| --- | --- | --- |
| 20+ | `provideZonelessChangeDetection()` | sim |
| 18-19 | `provideExperimentalZonelessChangeDetection()` | sim |
| 15-17 | `NgZone` substituído por uma zone no-op | não |

No Angular 15-17, nada roda a detecção de mudanças depois de um clique. Chame `detectChanges()` nos seus handlers:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="add()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  add(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

Para manter a detecção de mudanças baseada em zone, importe `zone.js` no topo da sua entry de cliente e passe `zone: true`. Sem o zone.js carregado, `mount` é rejeitado.

## Renderização no servidor

```ts
// server-only module
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<string> {
  return renderAngularToString(AboutComponent, { appId: 'about', props: { userId: '42' } });
}
```

```ts
// client
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export const about = createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

- `renderAngularToString(component, { props?, providers?, appId?, document?, selector? })` retorna as tags `<style>` do componente seguidas do elemento host, para que a ilha já tenha estilo na primeira pintura. Ele roda sem zone.
- `props` define os inputs do componente antes da primeira detecção de mudanças, como `mount` faz no cliente. Chaves que não são inputs são ignoradas. Passe as mesmas props para a ilha no cliente, senão a hidratação mostra um conteúdo diferente.
- Ele não espera requisições HTTP nem timers que o componente inicia. Carregue os dados antes e forneça-os.
- Chame-o a partir de código de servidor. No navegador, ele retorna `''`.

No cliente, `createSsrAngularMicroApp` renderiza dentro do elemento host do servidor e, depois que o Angular adiciona as suas próprias tags `<style>`, remove as tags `<style>` inline do servidor. O evento `tuvix:mounted` informa `hydrated: true`. Isso substitui o DOM do servidor. A hidratação não destrutiva do Angular precisa de um marcador diretamente sob `<body>`, o que uma ilha dentro de outra página não consegue fornecer, então o adaptador não adiciona `provideClientHydration()`.

## Event bus

```ts
import { Component, OnDestroy, signal } from '@angular/core';
import { getGlobalBus } from '@tuvix.js/event-bus';

@Component({
  selector: 'app-cart-badge',
  standalone: true,
  template: `<span>{{ count() }}</span>`,
})
export class CartBadgeComponent implements OnDestroy {
  readonly count = signal(0);
  private readonly off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) =>
    this.count.set(itemCount),
  );

  ngOnDestroy(): void {
    this.off();
  }
}
```

Os signals agendam a detecção de mudanças no Angular 18+ sem zone. No 15-17, chame `ChangeDetectorRef.detectChanges()` depois de `set`.

## O que o adaptador não faz

- Ele não carrega o zone.js nem o `@angular/localize`. Importe-os na sua entry quando precisar deles.
- Ele não faz hidratação não destrutiva; veja acima.
- Ele não compartilha state entre montagens. Cada montagem é uma aplicação Angular própria com o seu próprio injector raiz, então um serviço `providedIn: 'root'` existe uma vez por montagem.

## API

| Export | Finalidade |
| --- | --- |
| `createAngularMicroApp({ name, component, module?, providers?, selector?, zone?, ssr?, bootstrap? })` | Módulo de micro app Angular |
| `createSsrAngularMicroApp(config)` | O mesmo com `ssr: true` |
| `renderAngularToString(component, options?)` de `@tuvix.js/angular/server` | Estilos + HTML do elemento host |
