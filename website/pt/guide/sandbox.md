# Sandbox

`@tuvix.js/sandbox` tem duas ferramentas. `CssSandbox` coloca um app dentro de uma shadow root para que o CSS dele e o CSS da página fiquem separados. `JsSandbox` executa código contra um `window` proxy para que as escritas globais caiam no proxy. O orquestrador usa `CssSandbox` para apps que você registra com `sandbox: true`; ele nunca aplica `JsSandbox`.

## Isolamento de CSS por app

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'widget',
  entry: {
    scripts: ['https://cdn.example.com/widget/main.js'],
    styles: ['https://cdn.example.com/widget/main.css'],
    type: 'module',
  },
  container: '#widget',
  activeWhen: '/',
  sandbox: true, // same as { css: true }
});
```

Para esse app, o orquestrador:

1. anexa uma shadow root aberta a `#widget` (ou reutiliza a de uma montagem anterior);
2. cria um `<div data-tuvix-sandbox-root>` dentro dela e passa esse elemento para `mount` como `container`;
3. adiciona os `styles` da entry como tags `<link>` dentro da shadow root, e não em `document.head`, e espera até `loader.timeout` que eles carreguem antes de chamar `mount`.

O CSS da página deixa de alcançar o app, e o CSS do app deixa de alcançar a página. Propriedades herdadas como `color` e `font-family` ainda chegam a partir do elemento host; defina-as em `:host` no CSS do app para impedir isso.

Use quando um app traz seletores globais (`button { ... }`, um CSS reset) ou quando o CSS da página quebra o app.

### Casos extremos

- Estilos que um framework injeta em tempo de execução vão para `document.head`, fora da shadow root. A injeção de CSS do Vite, as bibliotecas de CSS-in-JS e os estilos de componentes do Angular fazem isso. Entregue um arquivo CSS e liste-o em `entry.styles`, ou adicione o CSS à shadow root você mesmo.
- Portals, modais e toasts que renderizam em `document.body` saem da shadow root e perdem os estilos do app.
- `document.querySelector` chamado de dentro do app não encontra elementos na shadow root. Faça a consulta a partir de `container`.
- Entries do tipo função loader não listam `styles`, então o seu bundler injeta o CSS delas em `document.head`, de onde a shadow root o mantém de fora. Registre apps com sandbox usando uma entry `{ scripts, styles, type }`.

## CssSandbox manualmente

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const css = new CssSandbox();
const shadow = css.wrap(container); // moves existing children into the shadow root

const adopted = css.adoptStyles(shadow, {
  urls: ['/widget/main.css'],
  cssText: ':host { display: block; font-family: system-ui; }',
});
await adopted.ready; // resolves once each <link> fired load or error

const button = document.createElement('button');
button.textContent = 'Buy';
shadow.append(button);

// Later
adopted.remove();
css.unwrap(container);
```

| Método | Efeito |
| --- | --- |
| `wrap(container)` | Anexa uma shadow root aberta, ou reutiliza uma aberta já existente, e move os filhos do container para dentro dela. |
| `adoptStyles(shadow, { urls, cssText })` | Insere elementos `<link>` e `<style>` no início da shadow root. Ignora uma URL já adotada ali. Retorna `{ elements, ready, remove }`. |
| `addStyle(shadow, css)` / `removeStyle(shadow, el)` | Adiciona ou remove um `<style>`. |
| `unwrap(container)` | Move os nós que não são de estilo de volta para o light DOM e deixa um `<slot>` para que sejam renderizados. Tira do DOM os nós `<style>` e `<link>` de folha de estilo (incluindo os de `addStyle` e `adoptStyles`); o próximo `wrap` desse container os devolve na ordem. |

`wrap` lança um erro quando o elemento não pode hospedar uma shadow root (por exemplo `<input>`) ou já tem uma fechada. `ready` nunca é rejeitada. O jsdom nunca dispara `load` em links, então não aguarde `ready` em testes com jsdom. Quando você chama `removeStyle` ou `adopted.remove()` enquanto o container está desembrulhado, essa folha de estilo não volta no próximo `wrap`.

## JsSandbox

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const js = new JsSandbox(['dataLayer'], /* strict */ true);

js.execScript('window.dataLayer = []'); // allowed, stored on the proxy
console.log('dataLayer' in window); // false, unless the page defined it

try {
  js.execScript('counter = 1'); // bare assignment to a global that is not allowed
} catch (error) {
  console.log(error instanceof TypeError); // true: strict mode blocked the write
}

const loose = new JsSandbox(); // not strict
loose.execScript('var version = 2; build = 7;');
console.log(Reflect.get(loose.proxyWindow, 'version'), 'version' in window); // 2 false

js.reset(); // forget every stored global
```

- Escritas e `Object.defineProperty` feitos através do proxy vão para um armazenamento no sandbox. As leituras consultam esse armazenamento e depois o `window` real.
- Com `strict: true`, atribuir, declarar com `var` no nível superior ou aplicar `Object.defineProperty` a um global fora da allowlist embutida e de `allowedGlobals` lança um `TypeError` e não armazena nada.
- `execScript(code)` executa `code` dentro de `with (scope)`, com `window`, `self`, `globalThis` e `this` ligados ao proxy. Atribuições diretas (`x = 1`), `var x` no nível superior e `window.x = 1` caem todos no proxy; `let` e `const` ficam locais ao script.
- Dentro de `execScript`, ler um identificador não declarado retorna `undefined` em vez de lançar um `ReferenceError`, e uma diretiva `"use strict"` não tem efeito, porque `with` exige o modo não estrito. Ele usa `new Function`, então a sua Content Security Policy precisa de `unsafe-eval`.
- `activate()` e `deactivate()` definem a flag `active`. O proxy armazena escritas nos dois estados.

`JsSandbox` cobre apenas código que acessa globais através de `proxyWindow`. Um script carregado com uma tag `<script>`, um módulo do bundle, timers e event listeners usam o `window` real. Trate-o como uma proteção contra escritas globais acidentais nos trechos que você executa, não como uma barreira de segurança.

## Sandbox combinado

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });

const shadow = sandbox.activate(container); // ShadowRoot | null
if (shadow) sandbox.css.addStyle(shadow, '.box { padding: 8px; }');

sandbox.deactivate(container); // unwrap
sandbox.destroy(container); // deactivate + reset the JS store
```

`activate` retorna `null` quando `css` é `false`; nesse caso, ele não anexa nada.

## Use dentro de um micro app

```ts
import { defineMicroApp } from '@tuvix.js/core';
import { CssSandbox } from '@tuvix.js/sandbox';

const css = new CssSandbox();

export default defineMicroApp({
  name: 'widget',
  mount({ container }) {
    const shadow = css.wrap(container);
    css.addStyle(shadow, 'p { color: rebeccapurple; }');
    const text = document.createElement('p');
    text.textContent = 'Isolated';
    shadow.append(text);
  },
  unmount({ container }) {
    container.shadowRoot?.replaceChildren();
    css.unwrap(container);
  },
});
```

Prefira `sandbox: true` em `register` quando o orquestrador monta o app; ele faz o mesmo trabalho e reutiliza a shadow root entre remontagens.

## Quando não usar sandbox

- O app usa portals em `document.body` e precisa dos seus estilos ali.
- O design system da página deve estilizar o app.
- Você precisa de isolamento real de JavaScript. Use um `<iframe>`.
