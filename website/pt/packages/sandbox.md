---
title: '@tuvix.js/sandbox'
---

<PackageHeader
  name="@tuvix.js/sandbox"
  title="Sandbox"
  description="Isolamento de CSS em uma raiz Shadow DOM reutilizável, adoção de folhas de estilo nessa raiz e um window Proxy que mantém as variáveis globais dos scripts fora do window real."
  icon="🔒"
  npm="true"
/>

## Instalação

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Quando usar

Use `CssSandbox` quando o CSS de um micro app e o CSS da página não podem interferir um no outro. Ele move o DOM do app para uma shadow root aberta no container, então os seletores do app ficam dentro e os seletores da página ficam fora. O orquestrador de `@tuvix.js/core` faz isso por você quando você registra um app com `sandbox: true`. Chame este pacote diretamente quando montar apps sem o orquestrador.

Use `JsSandbox` quando você executa texto de script de terceiros e quer manter as escritas globais dele fora do `window` real. Você executa o código por meio de `execScript`, que resolve `window`, `this` e identificadores livres por meio de um Proxy. O orquestrador não aplica esse sandbox.

Escolha outra solução quando precisar de isolamento forte para código não confiável. Um `<iframe>` com o atributo `sandbox` dá ao código o próprio objeto global e a própria origem; este pacote não faz isso.

## Início rápido

Por meio do orquestrador (apenas CSS):

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'cart',
  entry: { scripts: ['/apps/cart/main.js'], styles: ['/apps/cart/style.css'] },
  container: '#cart',
  activeWhen: '/cart/*',
  sandbox: true,
});

await orchestrator.start();
```

O orquestrador envolve `#cart` em uma shadow root, renderiza o app em um `<div data-tuvix-sandbox-root="cart">` dentro dela e carrega `style.css` na shadow root em vez do `<head>`. A montagem espera essas folhas de estilo, até o `timeout` do loader (10000 ms por padrão). O orquestrador reutiliza a shadow root quando o app é montado de novo.

Manualmente:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container);
const target = shadowRoot ?? container;

const adopted = sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });
await adopted.ready;
target.append(Object.assign(document.createElement('p'), { textContent: 'Cart' }));

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox`

```ts
import type { ISandbox, SandboxOptions } from '@tuvix.js/sandbox';

declare function createSandbox(options?: SandboxOptions): ISandbox;
```

Retorna `new Sandbox(options)`.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` envolve o container em uma shadow root. Com `false`, `activate` retorna `null` e não anexa nada. |
| `js` | `boolean` | `true` | `activate`/`deactivate` alternam `sandbox.js.active`. O proxy em `sandbox.js.proxyWindow` mantém as escritas fora do `window` real de qualquer forma. |
| `allowedGlobals` | `string[]` | `[]` | Nomes globais extras que o modo estrito deixa o código isolado atribuir. As escritas neles continuam indo para o proxy. |
| `strict` | `boolean` | `false` | Lança um `TypeError` quando o código isolado atribui ou define uma variável global fora da allowlist embutida e de `allowedGlobals`. |

### `Sandbox`

```ts
import { Sandbox } from '@tuvix.js/sandbox';

const sandbox = new Sandbox({ css: false, js: true });
console.log(sandbox.activate(document.body)); // null
```

A classe por trás de `createSandbox`. Ela implementa `ISandbox`:

| Membro | Assinatura | Comportamento |
| --- | --- | --- |
| `css` | `readonly ICssSandbox` | A instância de `CssSandbox` que ela usa. |
| `js` | `readonly IJsSandbox` | A instância de `JsSandbox` que ela usa. |
| `activate` | `(container: HTMLElement) => ShadowRoot \| null` | `css.wrap(container)` quando `css` está ativo, depois `js.activate()` quando `js` está ativo. Retorna a shadow root ou `null`. |
| `deactivate` | `(container: HTMLElement) => void` | `js.deactivate()`, depois `css.unwrap(container)`. |
| `destroy` | `(container: HTMLElement) => void` | `deactivate(container)`, depois `js.reset()`, que apaga todas as variáveis globais armazenadas. |

### `CssSandbox`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const container = document.querySelector<HTMLElement>('#widget')!;

const shadowRoot = cssSandbox.wrap(container);
const style = cssSandbox.addStyle(shadowRoot, ':host { display: block; } p { color: teal; }');
cssSandbox.unwrap(container); // the <style> leaves the DOM and waits for the next wrap
cssSandbox.removeStyle(shadowRoot, style); // removed for good: the next wrap does not restore it
```

| Método | Assinatura | Comportamento |
| --- | --- | --- |
| `wrap` | `(container: HTMLElement) => ShadowRoot` | Move os filhos do container para uma shadow root aberta e a retorna. |
| `unwrap` | `(container: HTMLElement) => void` | Move os filhos de volta para o light DOM, guarda à parte as folhas de estilo da shadow root e deixa um `<slot>` na shadow root. |
| `addStyle` | `(shadowRoot: ShadowRoot, css: string) => HTMLStyleElement` | Adiciona um `<style>` com `css` ao final da shadow root. |
| `removeStyle` | `(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement) => void` | Remove `styleEl`. Quando o host está desembrulhado, também tira `styleEl` da lista guardada à parte, para que o próximo `wrap` não o restaure. |
| `adoptStyles` | `(shadowRoot: ShadowRoot, styles: AdoptStylesOptions) => AdoptedStyles` | Insere elementos `<link>` e `<style>` no início da shadow root. |

#### `wrap` e remontagens

Um elemento DOM não pode perder sua shadow root depois que ela é anexada. `wrap` lida com isso:

1. Se esta instância de `CssSandbox` já envolveu o container e ainda não o desembrulhou, `wrap` retorna a mesma shadow root e não move nada.
2. Se o container tem uma `shadowRoot` aberta (de um `wrap` anterior, de um `unwrap` ou de outra instância de `CssSandbox`), `wrap` remove o `<slot>` que `unwrap` deixou, devolve as folhas de estilo que `unwrap` guardou à parte (no início, na ordem original) e reutiliza a raiz.
3. Caso contrário, chama `container.attachShadow({ mode: 'open' })`.

Em seguida, move todos os filhos do light DOM para a shadow root. `wrap` só lança um erro quando `attachShadow` falha, por exemplo em um elemento que não pode hospedar uma shadow root (`<img>`, `<input>`) ou que já tem uma raiz fechada: `[Tuvix Sandbox] Cannot attach Shadow DOM to <img>: ...`.

#### `unwrap` e o slot

`unwrap` move os filhos da shadow root de volta para o container. Ele tira do DOM os nós `<style>` e `<link rel="stylesheet">`, venham eles de `addStyle`, de `adoptStyles` ou do app, para que o CSS do app deixe de ser aplicado e nunca chegue à página. Ele os mantém junto com a shadow root. A shadow root permanece e contém um `<slot data-tuvix-sandbox-slot>`, para que o navegador renderize os filhos restaurados por meio dele. `unwrap` não faz nada para um container que esta instância não envolveu.

O próximo `wrap` desse host, feito por esta ou por qualquer outra instância de `CssSandbox`, remove o slot, devolve em ordem as folhas de estilo guardadas à parte e move os filhos de volta para dentro. Você não precisa adotar os estilos de novo depois de uma remontagem. Chamar `removeStyle(shadowRoot, el)` ou `adopted.remove()` enquanto o host está desembrulhado remove essas folhas de vez.

#### `adoptStyles`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const shadowRoot = cssSandbox.wrap(document.querySelector<HTMLElement>('#cart')!);

const adopted = cssSandbox.adoptStyles(shadowRoot, {
  urls: ['/apps/cart/style.css', '/shared/tokens.css'],
  cssText: ':host { display: block; }',
});

await adopted.ready; // every <link> fired load or error
console.log(adopted.elements.length); // 3

adopted.remove();
```

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `urls` | `readonly string[]` | `[]` | Cada URL vira um `<link rel="stylesheet" data-tuvix-style>`, na ordem. |
| `cssText` | `string \| readonly string[]` | nenhum | Cada string vira um `<style data-tuvix-style>`, colocado depois dos links. |

Comportamento:

- Os elementos vão para o início da shadow root, depois dos estilos adotados antes, então o conteúdo do app e os estilos de `addStyle` vêm depois na cascata.
- Uma URL já adotada nesta shadow root é ignorada e não aparece em `elements`. Isso inclui os links que `unwrap` guardou à parte. `ready` continua esperando por esse link existente quando uma chamada anterior o criou.
- `ready` resolve quando cada link dispara `load` ou `error`. Ele nunca rejeita, então uma folha de estilo com 404 não bloqueia você. O jsdom não dispara nenhum dos dois eventos, então não aguarde `ready` em testes com jsdom.
- `remove()` remove apenas os elementos que esta chamada inseriu, incluindo os guardados à parte, para que o próximo `wrap` não os restaure.

### `JsSandbox`

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const jsSandbox = new JsSandbox(['analyticsQueue'], true);
jsSandbox.activate();

jsSandbox.execScript('window.analyticsQueue = []'); // allowed, stored on the proxy
console.log('analyticsQueue' in window); // false
console.log(Reflect.get(jsSandbox.proxyWindow, 'analyticsQueue')); // []

try {
  jsSandbox.execScript('window.tracker = {}');
} catch (error) {
  console.log(error instanceof TypeError); // true
}

jsSandbox.reset();
```

Construtor: `new JsSandbox(allowedGlobals: string[] = [], strict = false)`.

| Membro | Assinatura | Comportamento |
| --- | --- | --- |
| `proxyWindow` | `readonly WindowProxy` | Proxy sobre o `window` real. |
| `active` | `readonly boolean` | Flag definida por `activate` e limpa por `deactivate`/`reset`. |
| `activate` | `() => void` | Define `active` como `true`. |
| `deactivate` | `() => void` | Define `active` como `false`. As variáveis globais armazenadas permanecem. |
| `execScript` | `(code: string) => unknown` | Executa `code` como um script em modo não estrito (sloppy mode) dentro de `with (scope)` por meio de `new Function`. `window`, `self`, `globalThis` e o `this` do nível superior são o proxy, e os identificadores livres são resolvidos por meio dele. `eval("...")` continua sendo um eval direto dentro desse escopo. Retorna o que o código retornar. |
| `reset` | `() => void` | Apaga todas as variáveis globais armazenadas e define `active` como `false`. |

O proxy:

- As leituras consultam primeiro o armazenamento do próprio sandbox e depois caem no `window` real. Funções do `window` real sem `prototype` (`fetch`, `setTimeout`) voltam vinculadas ao `window` real, uma vez por função, então `proxyWindow.fetch === proxyWindow.fetch`.
- `proxyWindow.window`, `.self`, `.globalThis`, e `.top`/`.parent`/`.frames` quando a página não está em um iframe, retornam o próprio proxy. Em um iframe, `top` e `parent` continuam sendo os reais.
- Atribuições e `Object.defineProperty` armazenam o valor no proxy. O `window` real nunca muda. Um descritor sem `value` (`{ enumerable: false }`) mantém o valor armazenado. Descritores de acesso (`get`/`set`) e `configurable: false` fazem `Object.defineProperty` lançar um `TypeError`.
- `delete proxyWindow.x` remove um valor armazenado. Para uma propriedade do `window` real, retorna `false`, o que lança um `TypeError` em código no modo estrito.
- `in` verifica o armazenamento e o `window` real.

Modo estrito (`strict: true`): uma atribuição (`window.x = 1` ou um `x = 1` sem declaração), um `var x = 1` no nível superior ou uma chamada `Object.defineProperty` para um nome fora da allowlist embutida e de `allowedGlobals` lança `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "tracker". Add it to allowedGlobals to permit it.` e não armazena nada. A verificação roda com o sandbox ativo ou não. Chaves do tipo Symbol sempre contam como bloqueadas. A allowlist embutida cobre globais padrão como `console`, timers, `Promise`, `Map`, `JSON`, `fetch`, `URL`, `navigator`, `document`, `location` e `history`. As escritas permitidas, incluindo as escritas nesses nomes, ficam no proxy.

### Tipos

| Tipo | Significado |
| --- | --- |
| `SandboxOptions` | `{ css?, js?, allowedGlobals?, strict? }`, as opções de `createSandbox`. |
| `ISandbox` | Interface que `Sandbox` implementa: `css`, `js`, `activate`, `deactivate`, `destroy`. |
| `ICssSandbox` | Interface que `CssSandbox` implementa. |
| `IJsSandbox` | Interface que `JsSandbox` implementa. |
| `AdoptStylesOptions` | `{ urls?, cssText? }` para `adoptStyles`. |
| `AdoptedStyles` | `{ elements, ready, remove }` retornado por `adoptStyles`. |

## Casos extremos

- Dentro de `execScript`, `x = 1`, `var x = 1` no nível superior, `window.x = 1`, `window.window.x = 1`, `top.x = 1` e essas mesmas instruções dentro de `eval("...")` armazenam `x` no proxy, nunca no `window` real. `let` e `const` continuam locais ao script.
- Ler um identificador não declarado dentro de `execScript` retorna `undefined` em vez de lançar um `ReferenceError`, e uma diretiva `"use strict"` em `code` não tem efeito, já que `with` exige o modo não estrito.
- Dentro de uma chamada de função simples como `f()`, `this` é o objeto global real, como o JavaScript em modo não estrito define. `this.x = 1` em uma função assim escreve no `window` real. Escreva `window.x = 1` no código que você executa por meio de `execScript`.
- `execScript` usa `new Function`, então uma Content Security Policy sem `'unsafe-eval'` o bloqueia.
- Construir `JsSandbox`, `Sandbox` ou `createSandbox()` lê `window`, então eles lançam um `ReferenceError` no servidor. `CssSandbox` só precisa de `document` quando você chama os métodos dele.
- Duas instâncias de `CssSandbox` podem compartilhar um host. O segundo `wrap` reutiliza a shadow root da primeira instância.
- Filhos do light DOM que você adiciona enquanto o container está envolvido ficam fora da shadow root e não são renderizados por nenhum slot, então não aparecem. Adicione-os dentro da shadow root.
- `Sandbox({ css: false }).activate()` retorna `null`. Renderize no container.

## O que ele não faz

- Não altera timers, event listeners, `document` nem tags `<script>`. Código que não passa por `proxyWindow` afeta a página real.
- Não limpa intervalos nem listeners que um app deixa para trás. Limpe-os no `unmount` do app.
- Não dá ao código uma origem ou um objeto global separado. Use um `<iframe sandbox>` para código não confiável.
- Não desanexa uma shadow root. O DOM não tem API para isso; `unwrap` deixa um slot no lugar.
- Não impede a herança. `color`, `font-family` e propriedades CSS personalizadas definidas no host ou nos ancestrais dele continuam fluindo para dentro da shadow root.

## Migração a partir da 0.4

- `Sandbox({ css: false }).activate(container)` retorna `null` e não anexa nenhuma shadow root. Na 0.4, ele anexava uma e ocultava os filhos do container. `ISandbox.activate` agora retorna `ShadowRoot | null`:

  ```ts
  import { createSandbox } from '@tuvix.js/sandbox';

  const container = document.querySelector<HTMLElement>('#app')!;
  const sandbox = createSandbox({ css: false });

  // 0.4: const root: ShadowRoot = sandbox.activate(container);
  const root = sandbox.activate(container) ?? container;
  ```

- `strict: true` lança um `TypeError` em uma escrita bloqueada. Na 0.4, ele registrava um aviso e armazenava o valor. Adicione a `allowedGlobals` os nomes que seus scripts definem.
- `execScript` executa o código dentro de um bloco `with`. O código não pode estar no modo estrito, ler um identificador não declarado retorna `undefined` em vez de lançar um erro, e um `x = 1` sem declaração agora vai para o proxy em vez do `window` real.
- `unwrap` mantém as folhas de estilo da shadow root e o próximo `wrap` as restaura. Na 0.4, `unwrap` as apagava. Remova o código que adiciona de novo estilos de `cssText` ou `addStyle` depois de uma remontagem, senão você terá duplicatas.
- A documentação da 0.4 dizia que `js: true` intercepta `addEventListener`, timers e `document.createElement`. Isso nunca aconteceu, e a 0.5 também não faz isso.
