---
'@tuvix.js/core': patch
'@tuvix.js/angular': patch
'@tuvix.js/svelte': patch
'@tuvix.js/sandbox': patch
'@tuvix.js/loader': patch
'@tuvix.js/devtools': patch
'@tuvix.js/event-bus': patch
'@tuvix.js/module-federation': patch
'@tuvix.js/router': patch
'@tuvix.js/react': patch
'@tuvix.js/server': patch
'@tuvix.js/vue': patch
'create-tuvix-app': patch
---

Fix bugs, add missing READMEs to npm, and apply code review improvements

- core: catch errors in updateAppProps to prevent stuck 'updating' state; exclude 'error' apps from viewport remount loop; add ensureAlive() guard to unmountApp()
- angular: initialize __TUVIX_ANGULAR_PROPS__ before writing (was always falsy, causing silent prop update drops)
- svelte: warn instead of silent no-op when Svelte 5 $set() is missing
- sandbox: fix CssSandbox.unwrap() to restore app content nodes (not just discard styles); add reset() to IJsSandbox interface; fix README Quick Start example (wrong API)
- loader: remove unused createDeferred dead export
- devtools: wire up autoOpen option (was declared but never read)
- vue: wire up autoOpen option (was declared but never read)
- react: : sanitize example name before tar filter to prevent path traversal
- create-tuvix-app: sanitize example name before tar filter to prevent path traversal
- event-bus, module-federation, router, server: publish with README (packages were previously published without one)
