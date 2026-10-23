---
"@tuvix.js/module-federation": minor
---

`federatedEntry` and `createFederatedEntry` return entries the orchestrator can load.

- Both return a loader function. On first mount it loads `remoteEntry.js`, initialises the container's share scope, calls `container.get(modulePath)` and returns the micro app (its own exports or its `default` export). In 0.4 they returned `{ scripts: [remoteEntry.js] }`, and the loader then failed with "no exports found", because a container only has `init` and `get`.
- `federatedEntry(remote, modulePath = './App', { shareScope })` takes the exposed module path. `createFederatedEntry(remoteName, modulePath = './App')` too.
- In a webpack host the package calls `__webpack_init_sharing__('default')` and passes `__webpack_share_scopes__.default` to `init`. In 0.4 it read `window.__webpack_share_scopes__`, which webpack never defines, so every remote got its own empty scope. Outside webpack, all remotes on the page now share one scope object.
- Each container is initialised once, even when several entries or loaders use it.
- `remoteEntry.js` loads through `loadScript` from `@tuvix.js/loader`: one tag per URL, the tag is removed on failure so a retry starts fresh, and the orchestrator's timeout aborts the wait.
- New exports: the `FederatedContainer`, `ShareScope` and `FederatedEntryOptions` types.

Breaking:

- `federatedEntry` and `createFederatedEntry` return an `EntryLoader` function instead of an `EntryConfig`.
- `FederatedLoaderConfig.shared` is replaced by `shareScope`. The package never read `shared`.
- `loadRemoteContainer` returns `FederatedContainer` instead of `any`.
