# @tuvix.js/sandbox

> Isolamento de CSS com shadow DOM que sobrevive a remontagens, adoção de folhas de estilo e um window Proxy para globais de script

Parte do framework de microfrontends [Tuvix.js](https://github.com/yasinatesim/tuvix.js). Documentação completa: [tuvix.js.org/packages/sandbox](https://tuvix.js.org/packages/sandbox).

`CssSandbox` move o DOM de um micro app para um shadow root aberto, para que o CSS dele e o CSS da página fiquem separados. O orquestrador de `@tuvix.js/core` o usa quando você registra um app com `sandbox: true`. `JsSandbox` impede que escritas `window.x = ...` do código que você executa por ele cheguem ao `window` real. Ele é um Proxy, não uma barreira de segurança; use um `<iframe sandbox>` para código não confiável.

## Instalação

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Início rápido

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container); // ShadowRoot, or null with css: false
sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox(options?)` e `Sandbox`

`createSandbox(options)` retorna `new Sandbox(options)` tipado como `ISandbox`.

| Opção | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` envolve o container em um shadow root. `false`: `activate` retorna `null` e não anexa nada. |
| `js` | `boolean` | `true` | `activate`/`deactivate` alternam `js.active`. O proxy mantém as escritas fora de `window` em qualquer caso. |
| `allowedGlobals` | `string[]` | `[]` | Nomes que o modo strict deixa o código em sandbox atribuir (ainda armazenados no proxy). |
| `strict` | `boolean` | `false` | Lança um `TypeError` em escritas ou `defineProperty` de globais fora da allowlist e de `allowedGlobals`. |

Membros: `css` (`CssSandbox`), `js` (`JsSandbox`), `activate(container): ShadowRoot | null`, `deactivate(container)`, `destroy(container)` (desativa e depois limpa os globais armazenados).

### `CssSandbox`

| Método | Comportamento |
| --- | --- |
| `wrap(container)` | Move os filhos para um shadow root aberto. Reutiliza `container.shadowRoot` quando já existe um (de um `wrap` anterior, de `unwrap`, de outra instância), remove o slot que `unwrap` deixou e devolve as folhas de estilo guardadas, na ordem. Só lança erro se `attachShadow` falhar. |
| `unwrap(container)` | Move os filhos de volta para o light DOM, tira do DOM os `<style>` e `<link rel="stylesheet">` (de `addStyle`, `adoptStyles` ou do app) e os guarda para o próximo `wrap`, deixando um `<slot>` para que os filhos sejam renderizados. Não faz nada em containers que esta instância não envolveu. |
| `addStyle(shadowRoot, css)` | Adiciona um `<style>` e o retorna. |
| `removeStyle(shadowRoot, styleEl)` | Remove `styleEl`. Com o container desembrulhado, o próximo `wrap` não o restaura. |
| `adoptStyles(shadowRoot, { urls?, cssText? })` | Insere `<link>`s e depois `<style>`s no início do shadow root, após os estilos adotados anteriormente. Ignora URLs já adotadas, inclusive links guardados. Retorna `{ elements, ready, remove }`. |

`ready` resolve quando cada link dispara `load` ou `error` e nunca rejeita. O jsdom não dispara nenhum dos dois, então não aguarde `ready` em testes com jsdom. `remove()` remove apenas os elementos daquela chamada; com o container desembrulhado, eles não voltam no próximo `wrap`.

### `JsSandbox`

`new JsSandbox(allowedGlobals = [], strict = false)`.

| Membro | Comportamento |
| --- | --- |
| `proxyWindow` | Proxy sobre `window`. As leituras consultam o armazenamento do sandbox e depois o `window` real (funções vinculadas uma única vez). `window`, `self`, `globalThis`, e `top`/`parent`/`frames` fora de um iframe, retornam o proxy. Escritas e `Object.defineProperty` vão para o armazenamento; um descritor sem `value` mantém o valor armazenado. Descritores de acesso e não configuráveis lançam um `TypeError`. |
| `execScript(code)` | Executa `code` como script em modo sloppy dentro de `with (scope)`. `window`, `self`, `globalThis` e o `this` do nível superior são o proxy, e identificadores livres são resolvidos por ele. `eval("...")` continua sendo um eval direto dentro desse escopo. |
| `activate()`, `deactivate()`, `active` | Um flag. Não muda o comportamento do proxy. |
| `reset()` | Limpa os globais armazenados e define `active` como `false`. |

O modo strict lança `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "x". Add it to allowedGlobals to permit it.` para uma atribuição, um `var x = 1` no nível superior ou um `defineProperty` de um nome fora da allowlist, e não armazena nada, esteja ativo ou não.

### Tipos

`SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles`.

## Casos extremos

- Em `execScript`, `x = 1`, `var x = 1`, `window.x = 1`, `window.window.x = 1`, `top.x = 1` e essas mesmas instruções dentro de `eval("...")` armazenam `x` no proxy, nunca no `window` real. `let`/`const` continuam locais.
- Ler um identificador não declarado em `execScript` retorna `undefined` em vez de lançar erro, e `"use strict"` em `code` não tem efeito.
- Dentro de uma chamada de função simples como `f()`, `this` é o objeto global real, como o JavaScript em modo sloppy define. `this.x = 1` ali escreve no `window` real; escreva `window.x = 1` em vez disso.
- `execScript` usa `new Function`; sua CSP precisa de `'unsafe-eval'`.
- `JsSandbox`, `Sandbox` e `createSandbox()` leem `window` no construtor e lançam erro no servidor.
- Filhos do light DOM adicionados enquanto o container está envolvido não são renderizados. Adicione-os dentro do shadow root.

## O que ele não faz

- Ele não modifica timers, event listeners, `document` nem tags `<script>`, e não limpa o que um app deixa para trás.
- Ele não dá ao código uma origem ou um objeto global próprios.
- Ele não impede que estilos herdados (`color`, fontes, custom properties) cheguem ao shadow root.

## Migração a partir da 0.4

- `Sandbox({ css: false }).activate()` retorna `null` e não anexa nenhum shadow root. `ISandbox.activate` retorna `ShadowRoot | null`.
- `strict: true` lança erro em escritas bloqueadas em vez de emitir um aviso.
- `execScript` executa o código em um bloco `with`: sem código em modo strict, leituras não declaradas retornam `undefined`, um `x = 1` solto fica no proxy.
- `unwrap` guarda as folhas de estilo para o próximo `wrap` em vez de apagá-las.

## Licença

MIT
