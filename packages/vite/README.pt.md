# @tuvix.js/vite

> Plugin do Vite que coloca o CSS das ilhas e links de modulepreload no `<head>` renderizado no servidor

Parte do framework de microfrontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentação completa: [tuvix.js.org/packages/vite](https://tuvix.js.org/packages/vite).

Quando você renderiza no servidor uma ilha de micro app, o markup dela chega ao navegador antes do JavaScript. O Vite entrega o CSS da ilha (CSS Modules, `<style>` de SFC Vue, estilos Svelte) dentro desse JavaScript, então a primeira pintura mostra markup sem estilo. Este plugin informa ao seu servidor de quais folhas de estilo cada ilha precisa, para que você possa vinculá-las no `<head>`.

Use-o quando renderizar ilhas no servidor com Vite. Dispense-o quando suas ilhas renderizarem apenas no cliente.

## Instalação

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Requer Vite 6 ou 7. A suíte de testes roda no Vite 6.

## Início rápido

Adicione o plugin à configuração do Vite que você usa para o build do cliente e para o build SSR:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

Adicione os tipos do módulo virtual ao `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@tuvix.js/vite/client"]
  }
}
```

Peça os assets na sua entry de servidor e escreva-os no `<head>`:

```ts
// src/entry-server.ts
/// <reference types="@tuvix.js/vite/client" />
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { renderFooter } from './islands/footer/render';

export async function render(): Promise<string> {
  const assets = await getAssets(['src/islands/footer/index.ts']);
  return `<!doctype html>
<html>
  <head>${renderAssetTags(assets)}</head>
  <body><footer data-tuvix-app="footer">${await renderFooter()}</footer></body>
</html>`;
}
```

Faça o build do cliente primeiro, depois o do servidor:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?: TuvixViteOptions): Plugin[]`

Retorna três plugins: `tuvix:assets` (fornece `virtual:tuvix/assets`), `tuvix:client-build-info` (só em builds; escreve `.vite/tuvix-client.json` no build do cliente) e `tuvix:dev-css-handoff` (apenas no servidor de desenvolvimento).

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | Diretório de saída do build do cliente, relativo à raiz do Vite ou absoluto. O build SSR lê `<clientOutDir>/.vite/manifest.json`, depois `<clientOutDir>/manifest.json`. |
| `base` | `string` | `base` do Vite | Base pública da qual o navegador carrega os assets do cliente. Defina-a quando o cliente for servido a partir de uma base diferente da do bundle do servidor. |

Para TanStack Start ou vinxi, aponte o plugin para a saída e a base do roteador do cliente:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries: string[]): Promise<TuvixAssets>`

De `virtual:tuvix/assets`. Passe os módulos de entry das ilhas como caminhos relativos à raiz do Vite, como `'src/islands/footer/index.ts'`. Um `./` ou `/` inicial é ignorado. Com várias entries, `getAssets` mescla as listas na ordem das entries e descarta duplicatas. Apenas no servidor.

### `renderAssetTags(assets: TuvixAssets): string`

De `virtual:tuvix/assets`. Retorna tags `<link rel="stylesheet">` para `css` e, em seguida, tags `<link rel="modulepreload" crossorigin>` para `modulepreload`. Escapa os valores dos atributos e funciona no servidor e no navegador.

Se o seu `<head>` for um componente React, renderize as listas você mesmo:

```tsx
import type { TuvixAssets } from '@tuvix.js/vite';

export function IslandAssets({ assets }: { assets: TuvixAssets }) {
  return (
    <>
      {assets.css.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {assets.modulepreload.map((href) => (
        <link key={href} rel="modulepreload" crossOrigin="" href={href} />
      ))}
    </>
  );
}
```

### Tipos

| Tipo | Significado |
| --- | --- |
| `TuvixViteOptions` | Opções de `tuvix()`. |
| `TuvixAssets` | `{ css: string[]; modulepreload: string[] }`. `css` está na ordem da cascata; `modulepreload` fica vazio em desenvolvimento. |

## Builds de produção

- O plugin ativa `build.manifest` no build do cliente, a menos que você mesmo defina `build.manifest`.
- No build SSR, ele lê o manifest do cliente e embute um mapa de cada entry e entry dinâmica para suas URLs.
- O build do cliente também escreve `.vite/tuvix-client.json` ao lado do manifest. Ele mapeia cada entry e cada alvo de `import()` para o chunk em que o Rollup o colocou. Às vezes o Rollup junta duas entries dinâmicas em um único chunk, por exemplo uma página e um runtime de framework que um adaptador carrega com `import()`. O manifest do Vite então indexa esse chunk como `_Page-<hash>.js` e não lista nenhuma das duas fontes, e o plugin usa `tuvix-client.json` para encontrá-lo. Sem esse arquivo (um cliente gerado sem `tuvix()`), só os módulos com sua própria chave no manifest são resolvidos.
- Com `build.cssCodeSplit: false`, o Vite escreve todo o CSS em um único `style-<hash>.css` que nenhum chunk do manifest lista. `getAssets` retorna esse arquivo para todas as entries.
- Para cada entry, ele coleta o chunk da entry e todos os chunks que ela importa estaticamente, junto com o CSS deles. O CSS dos chunks importados vem antes do CSS da própria entry, que é a ordem em que o Vite os carrega.
- Ele ignora alvos de `import()`, porque o Vite só carrega esses chunks e o CSS deles quando o import é executado. Se um módulo lazy renderizar no servidor, passe também o caminho dele para `getAssets`.
- As URLs começam com `base`. Quando o navegador depois carrega o chunk da ilha, o helper de preload do Vite encontra o `<link>` existente e não adiciona um segundo.

## Servidor de desenvolvimento

- `getAssets` percorre o grafo de módulos do cliente no servidor de desenvolvimento a partir de cada entry, seguindo os imports estáticos, e retorna URLs como `/src/islands/footer/footer.module.css?direct`. O Vite responde a requisições `?direct` com CSS puro.
- O CSS que uma ilha alcança por meio de um módulo virtual também funciona. Uma folha de estilo virtual como `\0virtual:theme.css` volta como `/@id/__x00__virtual:theme.css?direct`, então o plugin que a fornece precisa carregar ids que trazem uma query.
- Quando o JavaScript da ilha roda, o Vite injeta seu próprio `<style>` para cada módulo CSS. O plugin então desativa o `<link>` correspondente renderizado no servidor por meio de `link.sheet.disabled`, para que uma cópia desatualizada das regras não sobrescreva suas edições via HMR. O elemento `<link>` continua no DOM, e um `<head>` React hidratado não percebe nenhuma mudança.
- Em uma edição de CSS, o plugin deixa a folha de estilo `?direct` fora da atualização de HMR. O Vite então atualiza seu `<style>` sem recarregar a página e sem trocar o `<link>`. Uma edição em CSS Modules muda os nomes de classe com hash, então o próprio HMR da ilha (React Fast Refresh, Vue) precisa renderizá-la de novo. Uma ilha cujo JavaScript a página ainda não carregou mantém a folha de estilo do servidor até você recarregar.
- `modulepreload` fica sempre vazio em desenvolvimento.

## Casos extremos

- `getAssets` rejeita um caminho que não é nem input do build nem alvo de `import()` do build do cliente. Adicione a ilha a `build.rollupOptions.input` ou carregue-a com `import()` a partir do código do cliente.
- O build SSR falha com `[tuvix] No client manifest in <dir>` quando o manifest do cliente está ausente.
- Em desenvolvimento, `getAssets` precisa do servidor de desenvolvimento no mesmo processo Node (`ssrLoadModule` ou o module runner padrão do Vite). Ele rejeita quando o código SSR roda em outro processo ou em um runtime de worker, ou depois que o servidor de desenvolvimento foi fechado. Ele continua funcionando depois de `server.restart()`.
- O build de navegador de `virtual:tuvix/assets` exporta um `getAssets` que rejeita, porque o bundle do cliente não tem como conhecer o próprio manifest.
- Em desenvolvimento, o percurso não desce em módulos dentro de `/node_modules/`, então o CSS que um pacote importa a partir do próprio JavaScript não é coletado.
- Uma `base` relativa como `'./'` gera URLs relativas, que quebram em rotas aninhadas. Use uma base absoluta.
- Svelte: mantenha o padrão `emitCss: true` do `vite-plugin-svelte`. Com `compilerOptions.css: 'injected'`, os estilos ficam dentro do JavaScript e o plugin não encontra nenhuma folha de estilo para vincular.

## O que ele não faz

- Ele não escreve tags no seu HTML. Você escolhe onde elas ficam.
- Ele não segue cadeias de `import()`.
- Ele não suporta um nome de arquivo de manifest personalizado (`build.manifest: 'name.json'`). Use `true`.
- Ele não renderiza nem hidrata ilhas. Use um adaptador como `@tuvix.js/react` (`TuvixIsland`), `@tuvix.js/vue` ou `@tuvix.js/svelte`.

## Licença

MIT
