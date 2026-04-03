# O que é Tuvix.js?

Tuvix.js é um **orquestrador de microfrontends leve e agnóstico de framework** para construir aplicações frontend escaláveis compostas por partes implantáveis de forma independente.

## O Problema

À medida que os frontends crescem, as aplicações monolíticas de página única tornam-se:

- Difíceis de escalar entre múltiplas equipes
- Lentas para compilar e implantar - uma alteração reconstrói tudo
- Presas a um único framework ou versão
- Difíceis de testar e compreender de forma isolada

## A Solução: Microfrontends

Microfrontends aplicam princípios de microsserviços ao frontend. Cada **micro app** é:

- **Desenvolvida independentemente** - base de código separada, equipe separada
- **Implantada independentemente** - seu próprio pipeline de CI/CD
- **Agnóstica de framework** - uma equipe usa React, outra Vue, outra Svelte

Tuvix.js fornece o **shell** - a camada fina de orquestração que carrega, monta e coordena todas as micro apps em tempo de execução.

## Arquitetura

```
┌─────────────────────────────────────────────┐
│                Tuvix.js Shell               │
│                                             │
│  ┌────────────┐  ┌──────────┐  ┌────────┐  │
│  │ Orchestrator│  │  Router  │  │ Loader │  │
│  └────────────┘  └──────────┘  └────────┘  │
│                                             │
│  ┌─────────┐  ┌────────┐  ┌──────────────┐ │
│  │  React  │  │  Vue   │  │   Angular    │ │
│  │  Micro  │  │  Micro │  │    Micro     │ │
│  │   App   │  │   App  │  │     App      │ │
│  └─────────┘  └────────┘  └──────────────┘ │
└─────────────────────────────────────────────┘
```

## Conceitos Chave

| Conceito | Descrição |
|----------|-----------|
| **Shell** | A aplicação hospedeira - carrega e coordena as micro apps |
| **Orchestrator** | Motor central que gerencia o registro e ciclo de vida das micro apps |
| **Micro App** | Uma aplicação frontend implantada de forma independente |
| **Entry** | A URL do bundle JavaScript de uma micro app |
| **Lifecycle** | Hooks mount, unmount, update que cada micro app implementa |
| **Event Bus** | Ponte pub/sub tipada entre micro apps |
| **Sandbox** | Isolamento CSS + JS para prevenir conflitos |

## Comparação

| Recurso | Tuvix.js | single-spa | Module Federation |
|---------|----------|------------|-------------------|
| Zero dependências runtime | ✅ | ❌ | ✅ |
| Event Bus integrado | ✅ | ❌ | ❌ |
| CSS Sandbox | ✅ | ❌ | ❌ |
| Suporte SSR | ✅ | Parcial | ✅ |
| TypeScript-first | ✅ | Parcial | ✅ |
| Bindings de framework | React, Vue, Svelte, Angular | React, Vue | Qualquer |

## Próximo Passo

→ [Começando](/pt/guide/getting-started)
