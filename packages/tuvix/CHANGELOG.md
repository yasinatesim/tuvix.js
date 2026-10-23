# tuvix.js

## 0.5.0

### Minor Changes

- 5d40f9c: Re-export the new router, lifecycle and sandbox APIs.

  - From `@tuvix.js/router`: `matchPath`, `interceptLinks`, `resolveLink`, and the types `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions`.
  - From `@tuvix.js/loader`: `whenMounted`, `onLifecycle`, `isMounted`, and the types `LifecycleType`, `LifecycleDetail`, `LifecycleEvent`.
  - From `@tuvix.js/core`: the types `RouterSource`, `AppSandboxOption`, `AppErrorEvent` and `AppErrorPhase`.
  - From `@tuvix.js/sandbox`: the types `AdoptStylesOptions` and `AdoptedStyles`.

  The behaviour changes in `@tuvix.js/core` and `@tuvix.js/router` apply here too, including the breaking ones listed in their changelogs.

### Patch Changes

- c131086: Fix `require()` for five packages and give every package the same `dist/` layout.

  In 0.4, `tuvix.js`, `@tuvix.js/core`, `@tuvix.js/event-bus`, `@tuvix.js/loader` and `@tuvix.js/router` pointed `main` and `exports.require` at `dist/index.cjs` and `dist/index.d.cts`, but the build wrote `dist/index.js` and `dist/index.d.ts`. `require('@tuvix.js/core')` threw `Cannot find module`, and TypeScript projects using CommonJS resolution got no types.

  Every package now ships the same layout:

  - `dist/<entry>.cjs` with `dist/<entry>.d.ts` for `require`
  - `dist/<entry>.mjs` with `dist/<entry>.d.mts` for `import`

  `@tuvix.js/vue`, `@tuvix.js/svelte` and `@tuvix.js/angular` use the same layout for their `./server` entry and add `typesVersions`, so TypeScript with `moduleResolution: "node"` finds `@tuvix.js/<adapter>/server` types. Each package also exports `./package.json`.

- Updated dependencies [5d40f9c]
- Updated dependencies [5d40f9c]
- Updated dependencies [5d40f9c]
- Updated dependencies [1ec8e77]
- Updated dependencies [1ec8e77]
- Updated dependencies [c131086]
- Updated dependencies [5d40f9c]
- Updated dependencies [1ec8e77]
  - @tuvix.js/core@0.5.0
  - @tuvix.js/event-bus@0.5.0
  - @tuvix.js/loader@0.5.0
  - @tuvix.js/router@0.5.0
  - @tuvix.js/sandbox@0.5.0

## 0.1.6

### Patch Changes

- Updated dependencies [e8f0731]
  - @tuvix.js/loader@0.4.4
  - @tuvix.js/router@0.4.4
  - @tuvix.js/sandbox@0.4.4
  - @tuvix.js/core@0.4.4

## 0.1.5

### Patch Changes

- Updated dependencies [b5a7081]
  - @tuvix.js/core@0.4.2
  - @tuvix.js/sandbox@0.4.2
  - @tuvix.js/loader@0.4.2
  - @tuvix.js/event-bus@0.4.2
  - @tuvix.js/router@0.4.2

## 0.1.4

### Patch Changes

- Updated dependencies [6826b4d]
  - @tuvix.js/core@0.3.2

## 0.1.3

### Patch Changes

- Updated dependencies [9e55cc9]
  - @tuvix.js/core@0.1.3
  - @tuvix.js/router@0.1.3
  - @tuvix.js/loader@0.1.3
  - @tuvix.js/sandbox@0.1.3

## 0.1.2

### Patch Changes

- fix: provide NODE_AUTH_TOKEN to CI pipeline
- Updated dependencies
  - @tuvix.js/core@0.1.2
  - @tuvix.js/event-bus@0.1.2
  - @tuvix.js/loader@0.1.2
  - @tuvix.js/router@0.1.2
  - @tuvix.js/sandbox@0.1.2

## 0.1.1

### Patch Changes

- fix: bump versions to trigger CI release flow
- Updated dependencies
  - @tuvix.js/core@0.1.1
  - @tuvix.js/event-bus@0.1.1
  - @tuvix.js/loader@0.1.1
  - @tuvix.js/router@0.1.1
  - @tuvix.js/sandbox@0.1.1
