# ¿Qué es Tuvix.js?

Tuvix.js es un **orquestador de microfrontends ligero e independiente del framework** para construir aplicaciones frontend escalables compuestas por piezas desplegables de forma independiente.

## El Problema

A medida que los frontends crecen, las aplicaciones monolíticas de una sola página se vuelven:

- Difíciles de escalar entre múltiples equipos
- Lentas para compilar y desplegar - un cambio reconstruye todo
- Atadas a un único framework o versión
- Difíciles de probar y razonar de forma aislada

## La Solución: Microfrontends

Los microfrontends aplican los principios de microservicios al frontend. Cada **micro app** es:

- **Desarrollada de forma independiente** - código base separado, equipo separado
- **Desplegada de forma independiente** - su propio pipeline de CI/CD
- **Independiente del framework** - un equipo usa React, otro Vue, otro Svelte

Tuvix.js proporciona el **shell** - la capa de orquestación ligera que carga, monta y coordina todas las micro apps en tiempo de ejecución.

## Arquitectura

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

## Conceptos Clave

| Concepto | Descripción |
|----------|-------------|
| **Shell** | La aplicación anfitriona - carga y coordina las micro apps |
| **Orchestrator** | Motor central que gestiona el registro y ciclo de vida de las micro apps |
| **Micro App** | Una aplicación frontend desplegada de forma independiente |
| **Entry** | La URL del bundle JavaScript de una micro app |
| **Lifecycle** | Hooks mount, unmount, update que cada micro app implementa |
| **Event Bus** | Puente pub/sub tipado entre micro apps |
| **Sandbox** | Aislamiento CSS + JS para prevenir conflictos |

## Cómo se Compara

| Característica | Tuvix.js | single-spa | Module Federation |
|----------------|----------|------------|-------------------|
| Sin dependencias en tiempo de ejecución | ✅ | ❌ | ✅ |
| Event Bus integrado | ✅ | ❌ | ❌ |
| CSS Sandbox | ✅ | ❌ | ❌ |
| Soporte SSR | ✅ | Parcial | ✅ |
| TypeScript-first | ✅ | Parcial | ✅ |
| Bindings de framework | React, Vue, Svelte, Angular | React, Vue | Cualquiera |

## Siguiente Paso

→ [Primeros Pasos](/es/guide/getting-started)
