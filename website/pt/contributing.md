# Contribuindo para o Tuvix.js

Obrigado pelo seu interesse em contribuir! Seja uma correção de bug, nova funcionalidade, melhoria na documentação ou tradução, todas as contribuições são bem-vindas.

## Formas de Contribuir

- **Relatórios de bugs** - [Abra uma issue](https://github.com/yasinatesim/tuvix.js/issues/new?template=bug_report.md)
- **Solicitações de funcionalidades** - [Inicie uma discussão](https://github.com/yasinatesim/tuvix.js/discussions)
- **Código** - Corrija bugs, adicione funcionalidades, melhore testes
- **Documentação** - Corrija erros de digitação, adicione exemplos, melhore a clareza
- **Traduções** - Adicione ou melhore a documentação em outros idiomas

## Começando

### 1. Fork e Clone

```bash
git clone https://github.com/SEU_NOME_DE_USUARIO/tuvix.js.git
cd tuvix.js
```

### 2. Instalar Dependências

Usamos [pnpm](https://pnpm.io) e [Node.js ≥ 18](https://nodejs.org).

```bash
pnpm install
```

### 3. Compilar Todos os Pacotes

```bash
pnpm build
```

### 4. Executar Testes

```bash
pnpm test
```

### 5. Iniciar o Servidor de Desenvolvimento da Documentação

```bash
cd website
pnpm install
pnpm dev
```

Abra `http://localhost:5173` no seu navegador para visualizar a documentação.

## Estrutura do Projeto

```
tuvix.js/
├── packages/
│   ├── core/           @tuvix.js/core
│   ├── router/         @tuvix.js/router
│   ├── event-bus/      @tuvix.js/event-bus
│   ├── loader/         @tuvix.js/loader
│   ├── sandbox/        @tuvix.js/sandbox
│   ├── react/          @tuvix.js/react
│   ├── vue/            @tuvix.js/vue
│   ├── svelte/         @tuvix.js/svelte
│   ├── angular/        @tuvix.js/angular
│   ├── devtools/       @tuvix.js/devtools
│   ├── server/         @tuvix.js/server
│   ├── module-federation/
│   ├── create-tuvix-app/
│   └── tuvix/          tuvix.js umbrella
└── website/
    ├── .vitepress/     Configuração e tema do VitePress
    ├── guide/          Documentação em inglês
    ├── packages/       Documentação da API dos pacotes
    ├── tr/             Traduções em turco
    ├── es/             Traduções em espanhol
    └── ...             Outros idiomas
```

## Estilo de Código

- **TypeScript** - modo strict, todo o código deve ser tipado
- **Prettier** - execute `pnpm format` para formatar
- **Sem dependências de runtime** - os pacotes devem ter zero dependências de runtime
- **Exports nomeados** - evite exports padrão
- **Mensagens de erro** - prefixar com `[Tuvix ...]`

## Mensagens de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add hash mode to router
fix(sandbox): clean up event listeners on unmount
docs: add Angular guide example
chore: bump vitepress to 1.7.0
test(event-bus): add once() edge case tests
```

## Processo de Pull Request

1. Crie um branch a partir do `master`:
   ```bash
   git checkout -b feat/minha-funcionalidade
   ```

2. Faça suas alterações e adicione testes

3. Execute a suíte completa de testes:
   ```bash
   pnpm test
   pnpm check-types
   pnpm lint
   ```

4. Se sua alteração afeta um pacote publicado, adicione um changeset:
   ```bash
   pnpm changeset
   ```

5. Faça push e abra um PR contra `master`

6. Um mantenedor revisará seu PR. Por favor, responda ao feedback dentro de 7 dias.

## Adicionando uma Tradução

Toda a documentação está em Markdown sob `website/`. Cada idioma tem seu próprio diretório:

```
website/
├── index.md              ← Inglês (raiz)
├── guide/                ← Guias em inglês
├── tr/                   ← Turco
│   ├── index.md
│   ├── guide/
│   └── packages/
├── es/                   ← Espanhol
└── ...
```

### Passos para adicionar ou melhorar uma tradução

1. Copie os arquivos em inglês de `website/guide/` para `website/<lang>/guide/`
2. Traduza o conteúdo Markdown (mantenha os blocos de código em inglês)
3. Atualize a configuração da sidebar em `website/.vitepress/config/<lang>.ts`
4. Execute `cd website && pnpm dev` para visualizar

::: tip Dicas de Tradução
- Mantenha todos os exemplos de código em inglês
- Traduza rótulos da interface, descrições e texto explicativo
- Use terminologia nativa onde existam traduções padrão
:::

## Idiomas Suportados

| Idioma | Código | Status |
|--------|--------|--------|
| Inglês | `en` | Completo (referência) |
| Turco | `tr` | Em andamento |
| Espanhol | `es` | Em andamento |
| Alemão | `de` | Em andamento |
| Francês | `fr` | Em andamento |
| Japonês | `ja` | Em andamento |
| Chinês | `zh` | Em andamento |
| Italiano | `it` | Em andamento |
| Português | `pt` | Em andamento |
| Hindi | `hi` | Em andamento |

Se você gostaria de contribuir para algum desses idiomas, verifique as [issues de tradução abertas](https://github.com/yasinatesim/tuvix.js/labels/translation) ou abra uma nova.

## Código de Conduta

Este projeto segue o [Contributor Covenant](https://www.contributor-covenant.org/). Seja respeitoso e construtivo.

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a Licença MIT.
