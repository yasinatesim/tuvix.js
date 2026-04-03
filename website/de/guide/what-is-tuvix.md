# Was ist Tuvix.js?

Tuvix.js ist ein **leichtgewichtiger, framework-unabhängiger Microfrontend-Orchestrator** zum Erstellen skalierbarer Frontend-Anwendungen, die aus unabhängig deploybare Teilen bestehen.

## Das Problem

Wenn Frontends wachsen, werden monolithische Single-Page-Anwendungen:

- Schwer über mehrere Teams hinweg zu skalieren
- Langsam zu bauen und zu deployen - eine Änderung baut alles neu
- An ein einzelnes Framework oder eine Version gebunden
- Schwierig isoliert zu testen und nachzuvollziehen

## Die Lösung: Microfrontends

Microfrontends wenden Microservice-Prinzipien auf das Frontend an. Jede **Micro App** ist:

- **Unabhängig entwickelt** - separate Codebasis, separates Team
- **Unabhängig deployed** - eigene CI/CD-Pipeline
- **Framework-unabhängig** - ein Team nutzt React, ein anderes Vue, ein anderes Svelte

Tuvix.js stellt die **Shell** bereit - die dünne Orchestrierungsschicht, die alle Micro Apps zur Laufzeit lädt, einbindet und koordiniert.

## Architektur

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

## Schlüsselkonzepte

| Konzept | Beschreibung |
|---------|-------------|
| **Shell** | Die Host-Anwendung - lädt und koordiniert Micro Apps |
| **Orchestrator** | Kernmotor, der die Registrierung und den Lebenszyklus von Micro Apps verwaltet |
| **Micro App** | Eine unabhängig deploybare Frontend-Anwendung |
| **Entry** | Die JavaScript-Bundle-URL einer Micro App |
| **Lifecycle** | mount, unmount, update Hooks, die jede Micro App implementiert |
| **Event Bus** | Typisierte Pub/Sub-Brücke zwischen Micro Apps |
| **Sandbox** | CSS + JS Isolation zur Vermeidung von Konflikten |

## Vergleich

| Merkmal | Tuvix.js | single-spa | Module Federation |
|---------|----------|------------|-------------------|
| Keine Laufzeitabhängigkeiten | ✅ | ❌ | ✅ |
| Event Bus integriert | ✅ | ❌ | ❌ |
| CSS Sandbox | ✅ | ❌ | ❌ |
| SSR-Unterstützung | ✅ | Teilweise | ✅ |
| TypeScript-first | ✅ | Teilweise | ✅ |
| Framework-Bindings | React, Vue, Svelte, Angular | React, Vue | Beliebig |

## Nächster Schritt

→ [Erste Schritte](/de/guide/getting-started)
