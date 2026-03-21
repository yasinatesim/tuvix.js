---
"@tuvix.js/react": patch
---

Fix `TuvixApp` return type for React 19 JSX strict mode compatibility

Changed return type from `ReactNode` to `ReactElement<any>` so `TuvixApp`
can be used as a JSX component in projects with React 19 strict TypeScript
settings (e.g. TanStack Start, Next.js 15+).

Previously, using `<TuvixApp ... />` in these projects caused:
```
error TS2786: 'TuvixApp' cannot be used as a JSX component.
  Type '...ReactNode' is not assignable to type 'ReactNode | Promise<ReactNode>'.
```
