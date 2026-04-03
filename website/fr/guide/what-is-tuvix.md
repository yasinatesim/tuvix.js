# Qu'est-ce que Tuvix.js ?

Tuvix.js est un **orchestrateur de microfrontends léger et indépendant du framework** pour construire des applications frontend évolutives composées de pièces déployables indépendamment.

## Le Problème

À mesure que les frontends grandissent, les applications monolithiques à page unique deviennent :

- Difficiles à faire évoluer entre plusieurs équipes
- Lentes à compiler et déployer - un changement reconstruit tout
- Verrouillées sur un seul framework ou une seule version
- Difficiles à tester et à raisonner de manière isolée

## La Solution : les Microfrontends

Les microfrontends appliquent les principes des microservices au frontend. Chaque **micro app** est :

- **Développée indépendamment** - base de code séparée, équipe séparée
- **Déployée indépendamment** - son propre pipeline CI/CD
- **Indépendante du framework** - une équipe utilise React, une autre Vue, une autre Svelte

Tuvix.js fournit le **shell** - la couche d'orchestration légère qui charge, monte et coordonne toutes les micro apps au moment de l'exécution.

## Architecture

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

## Concepts Clés

| Concept | Description |
|---------|-------------|
| **Shell** | L'application hôte - charge et coordonne les micro apps |
| **Orchestrator** | Moteur central qui gère l'enregistrement et le cycle de vie des micro apps |
| **Micro App** | Une application frontend déployée indépendamment |
| **Entry** | L'URL du bundle JavaScript d'une micro app |
| **Lifecycle** | Les hooks mount, unmount, update que chaque micro app implémente |
| **Event Bus** | Pont pub/sub typé entre les micro apps |
| **Sandbox** | Isolation CSS + JS pour prévenir les conflits |

## Comparaison

| Fonctionnalité | Tuvix.js | single-spa | Module Federation |
|----------------|----------|------------|-------------------|
| Zéro dépendance runtime | ✅ | ❌ | ✅ |
| Event Bus intégré | ✅ | ❌ | ❌ |
| CSS Sandbox | ✅ | ❌ | ❌ |
| Support SSR | ✅ | Partiel | ✅ |
| TypeScript-first | ✅ | Partiel | ✅ |
| Bindings framework | React, Vue, Svelte, Angular | React, Vue | Tous |

## Étape Suivante

→ [Pour Commencer](/fr/guide/getting-started)
