---
"@tuvix.js/core": patch
---

feat: add public `reconcile(path?)` method to Orchestrator

Allows external routers (TanStack Router, Next.js App Router, etc.) to
trigger micro app reconciliation after navigation without relying on
tuvix.js's built-in popstate listener.

Also fixes a fallback in `reconcileApps` so it reads `window.location.pathname`
when no router is configured and no override path is provided.
