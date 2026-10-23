---
"tuvix.js": minor
---

Re-export the new router, lifecycle and sandbox APIs.

- From `@tuvix.js/router`: `matchPath`, `interceptLinks`, `resolveLink`, and the types `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions`.
- From `@tuvix.js/loader`: `whenMounted`, `onLifecycle`, `isMounted`, and the types `LifecycleType`, `LifecycleDetail`, `LifecycleEvent`.
- From `@tuvix.js/core`: the types `RouterSource`, `AppSandboxOption`, `AppErrorEvent` and `AppErrorPhase`.
- From `@tuvix.js/sandbox`: the types `AdoptStylesOptions` and `AdoptedStyles`.

The behaviour changes in `@tuvix.js/core` and `@tuvix.js/router` apply here too, including the breaking ones listed in their changelogs.
