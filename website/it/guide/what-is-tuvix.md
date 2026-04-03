# Cos'è Tuvix.js?

Tuvix.js è un **orchestratore di microfrontend leggero e indipendente dal framework** per costruire applicazioni frontend scalabili composte da parti distribuibili indipendentemente.

## Il Problema

Man mano che i frontend crescono, le applicazioni monolitiche a pagina singola diventano:

- Difficili da scalare tra più team
- Lente da compilare e distribuire - una modifica ricostruisce tutto
- Legate a un singolo framework o versione
- Difficili da testare e comprendere in isolamento

## La Soluzione: i Microfrontend

I microfrontend applicano i principi dei microservizi al frontend. Ogni **micro app** è:

- **Sviluppata indipendentemente** - codebase separata, team separato
- **Distribuita indipendentemente** - la propria pipeline CI/CD
- **Indipendente dal framework** - un team usa React, un altro Vue, un altro Svelte

Tuvix.js fornisce la **shell** - il sottile livello di orchestrazione che carica, monta e coordina tutte le micro app a runtime.

## Architettura

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

## Concetti Chiave

| Concetto | Descrizione |
|----------|-------------|
| **Shell** | L'applicazione host - carica e coordina le micro app |
| **Orchestrator** | Motore centrale che gestisce la registrazione e il ciclo di vita delle micro app |
| **Micro App** | Un'applicazione frontend distribuita indipendentemente |
| **Entry** | L'URL del bundle JavaScript di una micro app |
| **Lifecycle** | Hook mount, unmount, update che ogni micro app implementa |
| **Event Bus** | Ponte pub/sub tipizzato tra le micro app |
| **Sandbox** | Isolamento CSS + JS per prevenire conflitti |

## Confronto

| Funzionalità | Tuvix.js | single-spa | Module Federation |
|--------------|----------|------------|-------------------|
| Zero dipendenze runtime | ✅ | ❌ | ✅ |
| Event Bus integrato | ✅ | ❌ | ❌ |
| CSS Sandbox | ✅ | ❌ | ❌ |
| Supporto SSR | ✅ | Parziale | ✅ |
| TypeScript-first | ✅ | Parziale | ✅ |
| Binding framework | React, Vue, Svelte, Angular | React, Vue | Qualsiasi |

## Prossimo Passo

→ [Per Iniziare](/it/guide/getting-started)
