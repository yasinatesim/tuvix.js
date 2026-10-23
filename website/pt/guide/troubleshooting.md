# Solução de problemas

Cada item começa pelo que você vê, seguido da causa e da correção.

## Svelte: onMount nunca roda, ou mount() lança lifecycle_function_unavailable

**Sintoma.** Uma ilha Svelte é renderizada, mas os callbacks de `onMount` nunca disparam, ou o `mount()` do Svelte 5 lança `lifecycle_function_unavailable`.

**Causa.** O `svelte` distribui um runtime de navegador e um runtime de servidor sob o mesmo import. O seu bundle de cliente pegou o de servidor. Algumas configurações de SSR (Vinxi, ambientes Vite personalizados, Vitest em jsdom) resolvem o cliente sem a condição de export `browser`, e o otimizador de dependências do Vite então faz o pré-bundle do runtime de servidor. Nas devtools do navegador, você vê `svelte/src/index-server.js` (Svelte 5) ou `svelte/src/runtime/ssr.js` (Svelte 4) no lugar do arquivo de cliente.

**Correção.** Coloque `browser` de volta nas condições de resolução do cliente e reinicie o Vite com `--force` para que ele reconstrua as dependências otimizadas:

```ts
// vite.config.ts (the client build or client environment)
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  resolve: { conditions: ['browser', ...defaultClientConditions] },
});
```

Para o Vitest com jsdom, adicione a condição e faça o inline do Svelte para que o Vite o resolva:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['browser'] },
  test: { environment: 'jsdom', server: { deps: { inline: [/svelte/] } } },
});
```

Não exclua o `svelte` de `optimizeDeps`; nesse caso, o esbuild falha com "The entry point "svelte" cannot be marked as external".

## Vue: o alias ~ falha em arquivos .vue

**Sintoma.** O build de produção falha com `Rollup failed to resolve import "~/utils/x" from ".../Card.vue?vue&type=script..."`, enquanto o mesmo import funciona em arquivos `.ts` e `import type` a partir de `~/` funciona em arquivos `.vue`.

**Causa.** O `vite-tsconfig-paths` aplica aliases apenas aos arquivos que o `include` do tsconfig dele abrange. Um tsconfig que inclui `**/*.ts` e `**/*.tsx` deixa os arquivos `.vue` de fora. Imports somente de tipo são apagados antes da resolução, então nunca falham.

**Correção.** Inclua os arquivos `.vue` nesse tsconfig:

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

ou declare o alias no próprio Vite:

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
});
```

Use a extensão de editor Vue - Official (Volar). O Vetur não entende as macros de `<script setup>` nem `moduleResolution: "Bundler"`.

## Angular 15-17: cliques não atualizam a view

**Sintoma.** Uma ilha Angular é renderizada, mas um handler de botão altera um campo e o template não é atualizado.

**Causa.** O adaptador roda o Angular sem zone.js. O Angular 18+ agenda a detecção de mudanças por conta própria no modo zoneless; no 15-17, o adaptador substitui o `NgZone` por uma zone que não faz nada, e nada executa a detecção de mudanças depois de eventos do DOM.

**Correção.** Chame `detectChanges()` depois da alteração:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-like',
  standalone: true,
  template: `<button (click)="like()">{{ likes }}</button>`,
})
export class LikeComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  likes = 0;

  like(): void {
    this.likes += 1;
    this.cdr.detectChanges();
  }
}
```

Ou importe `zone.js` no topo da sua entry de cliente e passe `zone: true` para `createAngularMicroApp`. Mantenha o zone.js fora do servidor: ele modifica o `Promise` global e quebra o `fetch` no servidor.

## Divergência de hidratação causada por datas

**Sintoma.** O React reporta o erro #418 (ou o Vue e o Svelte registram uma divergência de hidratação) apenas para alguns usuários ou apenas perto da meia-noite. O diff mostra uma data com um dia de diferença, como `21 Mart 2026` contra `22 Mart 2026`.

**Causa.** O servidor formata as datas no fuso horário dele (normalmente UTC) e o navegador as formata no fuso do usuário. `new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })` sem `timeZone` gera um texto diferente em cada lado.

**Correção.** Passe um `timeZone` explícito em todo lugar onde você formata datas que o servidor renderiza:

```ts
const format = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Istanbul',
});

console.log(format.format(new Date('2026-03-21T22:30:00Z'))); // 22 Mart 2026 on server and client
```

O mesmo vale para `toLocaleString`, tempos relativos ("há 3 horas") e qualquer coisa que use `Date.now()` durante a renderização.

## Dados de uma requisição aparecem em outra

**Sintoma.** Uma ilha renderizada no servidor mostra dados desatualizados, ou dados da requisição de outro usuário, e o cliente então renderiza de novo com conteúdo diferente.

**Causa.** Um cache no nível do módulo, por exemplo `export const queryClient = new QueryClient()` importado por vários micro apps, existe durante toda a vida do processo do servidor. Todas as requisições leem e escrevem na mesma instância.

**Correção.** Crie o cache por requisição no servidor e passe o que a ilha precisa como props. Mantenha um client no nível do módulo apenas no código do navegador.

```ts
import { QueryClient } from '@tanstack/query-core';

export function createRequestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}
```

Veja [Estado por requisição](/pt/guide/ssr-islands#estado-por-requisicao).

## Um app de script de módulo não carrega depois de unload

**Sintoma.** Depois de `orchestrator.unregister(name)` ou `loader.unload(name)`, registrar e montar o mesmo app de novo falha com `Module "<name>" loaded but no exports found`.

**Causa.** Os navegadores executam um script de módulo uma vez por URL. O segundo `<script type="module" src="...">` para a mesma URL não faz nada, então o app nunca chama `registerModule` de novo.

**Correção.** Use uma entry do tipo função loader, que mantém o módulo no cache de módulos do bundler, ou mude a URL (por exemplo, com uma query string de versão):

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

## "loaded but no exports found"

**Sintoma.** `[Tuvix Loader] Module "dashboard" loaded but no exports found.`

**Causa e correção**, na ordem em que você deve verificar:

1. O nome que o bundle registra é diferente do nome registrado. `createReactMicroApp({ name: 'Dashboard' })` e `register({ name: 'dashboard' })` não correspondem. Use uma única string.
2. Um bundle de módulo ES foi carregado como script clássico. A saída ES do Vite termina em `.js`; adicione `type: 'module'` ao entry.
3. O bundle exporta o módulo, mas nunca o registra. Use um adaptador ou `defineMicroApp`, ou chame `registerModule(name, module)` você mesmo.

## Container não encontrado

**Sintoma.** `[Tuvix] Container "#app" not found in DOM.`

**Causa.** O orquestrador procura o container quando monta o app. Um componente de rota de um roteador externo pode ainda não tê-lo renderizado.

**Correção.** Mantenha os containers em um layout que exista antes da navegação, ou hospede esse app com `TuvixIsland` dentro do componente de rota. Veja [Roteador externo](/pt/guide/external-router#containers-renderizados-por-rotas).

## Primeira pintura sem estilo

**Sintoma.** Com o JavaScript desativado, ou por um instante em conexões lentas, as ilhas renderizadas no servidor aparecem sem o CSS.

**Causa.** O Vite injeta CSS Modules, `<style>` do Vue e estilos do Svelte a partir do JavaScript. O HTML do servidor não vincula nenhum deles.

**Correção.** Adicione `tuvix()` de `@tuvix.js/vite` à sua configuração do Vite e imprima `renderAssetTags(await getAssets([...]))` no `<head>`. Veja [Ilhas SSR](/pt/guide/ssr-islands).
