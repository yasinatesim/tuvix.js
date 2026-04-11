---
"@tuvix.js/angular": patch
---

fix(angular): initialize `__TUVIX_ANGULAR_PROPS__` in `createSsrAngularMicroApp.update()`

`createSsrAngularMicroApp` had a conditional guard that silently dropped prop updates when the `__TUVIX_ANGULAR_PROPS__` global registry had not yet been initialized. The registry is now always initialized on first write (matching the behavior of `createAngularMicroApp`).

Before this fix, calling `orchestrator.updateAppProps('my-app', { ... })` on an SSR Angular micro app would silently no-op if the registry was absent — props would never reach the Angular app.
