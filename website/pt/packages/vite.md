---
title: '@tuvix.js/vite'
---

<PackageHeader
  name="@tuvix.js/vite"
  title="Assets de ilhas para Vite"
  description="Plugin do Vite que informa ao seu renderizador de servidor quais folhas de estilo e chunks JS uma ilha precisa, para que o head renderizado no servidor os vincule e a ilha já tenha estilo na primeira pintura."
  icon="⚡"
  npm="true"
/>

## Instalação

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

O plugin precisa do Vite 6 ou 7 (faixa de peer `^6.0.0 || ^7.0.0`). A suíte de testes roda no Vite 6.

## Quando usar

Você renderiza uma ilha no servidor (React, Vue, Svelte, Angular ou DOM puro) e o markup dela chega ao navegador antes do JavaScript. O Vite entrega CSS Modules, blocos `<style>` de SFCs Vue e estilos Svelte por meio desse JavaScript, então o navegador pinta a ilha sem estilo até o bundle rodar. Com `@tuvix.js/vite`, seu servidor pergunta "de quais folhas de estilo `src/islands/footer/index.ts` precisa?" e escreve as tags `<link>` correspondentes no `<head>`.

Dispense o plugin quando suas ilhas forem renderizadas apenas no cliente, ou quando você vincular uma única folha de estilo global que já cobre todas as ilhas.

## Início rápido

Adicione o plugin à config do Vite que você usa para o build do cliente e para o build SSR:

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

Peça os assets na entry do servidor e escreva-os no `<head>`:

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

Faça o build do cliente primeiro e depois o do servidor. O build SSR lê o manifest do cliente:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?)`

```ts no-check
function tuvix(options?: TuvixViteOptions): Plugin[];
```

Retorna três plugins do Vite:

- `tuvix:assets` fornece `virtual:tuvix/assets`.
- `tuvix:client-build-info` (apenas em builds) escreve `.vite/tuvix-client.json` ao lado do manifest do cliente. Veja [Builds de produção](#builds-de-producao).
- `tuvix:dev-css-handoff` (apenas no servidor de desenvolvimento) passa a responsabilidade pelos estilos do `<link>` renderizado no servidor para as próprias tags `<style>` do Vite.

Coloque o array retornado em `plugins` como mostrado acima; o Vite achata arrays de plugins aninhados.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | Diretório de saída do build do cliente, relativo à raiz do Vite ou absoluto. O build SSR lê `<clientOutDir>/.vite/manifest.json` e, como fallback, `<clientOutDir>/manifest.json`. |
| `base` | `string` | `base` do Vite no build ou servidor de desenvolvimento que carrega o módulo virtual | Base pública a partir da qual o navegador carrega os assets do cliente. Defina quando o cliente é servido a partir de uma base diferente da do bundle do servidor, como o `/_build` do vinxi. |

O TanStack Start e o vinxi escrevem o build do roteador do cliente em uma pasta separada sob `/_build`:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries)`

Exportado por `virtual:tuvix/assets`.

```ts no-check
function getAssets(entries: string[]): Promise<TuvixAssets>;
```

Passe os módulos de entry das ilhas como caminhos relativos à raiz do Vite, como `'src/islands/footer/index.ts'`. A função ignora um `./` ou `/` inicial. Com várias entries, ela junta as listas na ordem das entries e remove duplicatas.

`getAssets` retorna uma promise porque o servidor de desenvolvimento precisa transformar cada módulo antes de conseguir ler os imports dele. Chame-a apenas a partir de código de servidor.

### `renderAssetTags(assets)`

Exportado por `virtual:tuvix/assets`.

```ts no-check
function renderAssetTags(assets: TuvixAssets): string;
```

Retorna uma tag `<link rel="stylesheet">` para cada URL em `assets.css` e, em seguida, uma tag `<link rel="modulepreload" crossorigin>` para cada URL em `assets.modulepreload`. Ela escapa os valores de `href` para HTML. Funciona no servidor e no navegador.

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

| Tipo | Exportado de | Significado |
| --- | --- | --- |
| `TuvixViteOptions` | `@tuvix.js/vite` | Opções de `tuvix()`: `clientOutDir?`, `base?`. |
| `TuvixAssets` | `@tuvix.js/vite`, `virtual:tuvix/assets` | `{ css: string[]; modulepreload: string[] }`. `css` está na ordem da cascata. `modulepreload` fica vazio em desenvolvimento. |
| `@tuvix.js/vite/client` | entry de tipos | Declara o módulo `virtual:tuvix/assets`. Adicione-o a `compilerOptions.types` ou referencie-o com `/// <reference types="@tuvix.js/vite/client" />`. |

## Builds de produção {#builds-de-producao}

- No build do cliente, o plugin ativa `build.manifest`, a menos que você mesmo defina `build.manifest`.
- O build do cliente também escreve `.vite/tuvix-client.json` ao lado do manifest, no formato `{ modules, sharedCss }`. `modules` mapeia cada entry e cada alvo de `import()`, relativos à raiz do Vite, para o chunk em que o Rollup os colocou. `sharedCss` lista a folha de estilo única de um build com `build.cssCodeSplit: false`.
- No build SSR, ele lê o manifest do cliente e o `tuvix-client.json`, e embute um mapa de cada chave do manifest que seja uma entry (`isEntry`) ou uma entry dinâmica (`isDynamicEntry`) para as URLs dela.
- Às vezes o Rollup junta duas entries dinâmicas em um único chunk, por exemplo uma página e um runtime de framework que um adaptador carrega com `import()`. O manifest do Vite então usa a chave `_Page-<hash>.js` para esse chunk e não lista nenhuma das duas fontes. O plugin encontra o chunk por meio de `modules` no `tuvix-client.json`.
- Com `build.cssCodeSplit: false`, o Vite escreve todo o CSS em um único `style-<hash>.css` que nenhum chunk do manifest lista. `getAssets` retorna esse arquivo para todas as entries, antes do CSS da própria entry.
- Sem `tuvix-client.json` (um cliente cujo build foi feito sem `tuvix()`), só resolvem os módulos que têm a própria chave no manifest. Um asset `style.css` do manifest que nenhum chunk lista continua contando como a folha de estilo única de `cssCodeSplit: false`.
- Para cada entry, ele coleta o chunk da entry e todos os chunks que ela importa estaticamente, de forma transitiva, além do CSS deles. O CSS dos chunks importados vem antes do CSS da própria entry, que é a ordem em que o Vite os carrega.
- `modulepreload` lista o chunk da entry e os imports estáticos dele. As URLs são `base + file`.
- O mapa ignora alvos de `import()`, porque o Vite carrega esses chunks e o CSS deles só quando o import é executado. Se um módulo lazy é renderizado no servidor, passe o caminho dele para `getAssets` como uma entry separada.
- Quando o navegador carrega o chunk da ilha depois, o helper de preload do Vite encontra o `<link>` que seu servidor escreveu e não adiciona um segundo.

## Servidor de desenvolvimento

- `getAssets` percorre o grafo de módulos do cliente no servidor de desenvolvimento a partir de cada entry, seguindo os imports estáticos, na ordem dos imports. Ele retorna URLs como `/src/islands/footer/footer.module.css?direct`; o Vite responde requisições `?direct` com CSS puro. Blocos Vue voltam como `/src/App.vue?direct&vue&type=style&index=0&...&lang.css`.
- O CSS que uma ilha alcança por meio de um módulo virtual também é coletado. Uma folha de estilo virtual como `\0virtual:theme.css` volta como `/@id/__x00__virtual:theme.css?direct`, então o plugin que a fornece precisa carregar ids que trazem uma query.
- Assim que o JavaScript da ilha roda, o Vite injeta seu próprio `<style>` para cada módulo CSS. O plugin `tuvix:dev-css-handoff` então define `link.sheet.disabled = true` no `<link>` renderizado no servidor com o mesmo href, para que uma cópia desatualizada das regras não sobrescreva suas edições via HMR. O elemento `<link>` continua no DOM, então um `<head>` React hidratado não vê nenhuma mudança.
- Em uma edição de CSS, `tuvix:dev-css-handoff` deixa a folha de estilo `?direct` fora da atualização de HMR. O Vite então atualiza seu `<style>` sem recarregar a página e sem trocar o `<link>`. Há dois limites:
  - Uma edição em CSS Modules muda os nomes de classe com hash, então o próprio HMR da ilha (React Fast Refresh, Vue) precisa renderizá-la de novo.
  - Uma ilha cujo JavaScript a página ainda não carregou mantém a folha de estilo do servidor até você recarregar.
- `modulepreload` fica sempre vazio em desenvolvimento.
- `getAssets` conversa com o servidor de desenvolvimento no mesmo processo Node. Funciona com `ssrLoadModule` e com o module runner padrão do Vite, e continua funcionando depois de `server.restart()`.

## Casos extremos

- Uma entry que não é input do build nem alvo de `import()` no build do cliente rejeita com `[tuvix] "<key>" is not an entry or a dynamically imported module in <manifest>`. Adicione a ilha a `build.rollupOptions.input`, ou carregue-a com `import()` a partir do código do cliente.
- A ausência do manifest do cliente faz o build SSR falhar com `[tuvix] No client manifest in <dir>`. Faça o build do cliente primeiro, ou corrija `clientOutDir`.
- Em desenvolvimento, `getAssets` rejeita com `found no running Vite dev server with the tuvix() plugin in this process` quando seu código SSR roda em outro processo ou em um runtime de worker, ou depois que o servidor de desenvolvimento foi fechado.
- No build para navegador de `virtual:tuvix/assets`, `getAssets` rejeita com `runs during server rendering only`. O bundle do cliente não tem como conhecer o próprio manifest.
- Em desenvolvimento, o percurso não desce em módulos sob `/node_modules/`. Uma folha de estilo que seu próprio código importa de um pacote é coletada; uma folha de estilo que um pacote importa a partir do próprio JavaScript não é.
- Uma `base` relativa, como `'./'`, gera URLs relativas, que quebram em rotas aninhadas. Use uma base absoluta.
- Svelte: mantenha o padrão `emitCss: true` do `vite-plugin-svelte`. Com `compilerOptions.css: 'injected'`, os estilos ficam dentro do JavaScript e o plugin não encontra nenhuma folha de estilo para vincular.

## O que ele não faz

- Não escreve tags no seu HTML. Você decide onde a saída de `renderAssetTags` vai.
- Não segue cadeias de `import()`. Passe módulos lazy que são renderizados no servidor como entries próprias.
- Não suporta um nome de arquivo de manifest personalizado (`build.manifest: 'name.json'`). Use `true`.
- Não renderiza nem hidrata ilhas. Combine-o com um adaptador como [`@tuvix.js/react`](/pt/packages/react) (`TuvixIsland`), [`@tuvix.js/vue`](/pt/packages/vue) ou [`@tuvix.js/svelte`](/pt/packages/svelte).
