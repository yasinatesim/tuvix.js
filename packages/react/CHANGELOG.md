# @tuvix.js/react

## 0.3.1

### Patch Changes

- 53189df: Fix `TuvixApp` return type for React 19 JSX strict mode compatibility

  Changed return type from `ReactNode` to `ReactElement<any>` so `TuvixApp`
  can be used as a JSX component in projects with React 19 strict TypeScript
  settings (e.g. TanStack Start, Next.js 15+).

  Previously, using `<TuvixApp ... />` in these projects caused:

  ```
  error TS2786: 'TuvixApp' cannot be used as a JSX component.
    Type '...ReactNode' is not assignable to type 'ReactNode | Promise<ReactNode>'.
  ```

## 0.3.0

### Minor Changes

- e46a26e: Add SSR hydration support and `TuvixApp` component

  **New exports:**
  - `TuvixApp` — A React component that renders a micro app inline. Use this in SSR frameworks (TanStack Start, Next.js, Remix) so micro app content is server-rendered and SEO-indexed. The orchestrator can later hydrate the rendered HTML when the IIFE bundle loads.
  - `createSsrReactMicroApp` — Convenience wrapper around `createReactMicroApp` with `ssr: true`. Uses `hydrateRoot()` instead of `createRoot()` when the container already contains server-rendered HTML.

  **Updated API:**
  - `ReactMicroAppConfig.ssr?: boolean` — When `true`, `mount()` detects existing SSR content in the container and uses `hydrateRoot()` for hydration instead of replacing it with `createRoot()`.

  **Usage with TanStack Start:**

  ```tsx
  // src/routes/github.tsx
  import { TuvixApp } from '@tuvix.js/react';
  import { GithubPage } from '~/components/GithubPage';

  export const Route = createFileRoute('/github')({
    head: () => ({ meta: [...seo({ title: 'GitHub' })] }),
    component: () => <TuvixApp name="github-app" App={GithubPage} />,
  });
  ```

  ```ts
  // src/micro-apps/github/index.ts — uses hydrateRoot when SSR content present
  export default createSsrReactMicroApp({ name: 'github-app', App });
  ```

## 0.1.2

### Patch Changes

- fix: provide NODE_AUTH_TOKEN to CI pipeline
- Updated dependencies
  - @tuvix.js/event-bus@0.1.2
  - @tuvix.js/loader@0.1.2

## 0.1.1

### Patch Changes

- fix: bump versions to trigger CI release flow
- Updated dependencies
  - @tuvix.js/event-bus@0.1.1
  - @tuvix.js/loader@0.1.1
