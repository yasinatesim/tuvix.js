---
"@tuvix.js/event-bus": patch
---

`getGlobalBus()` keeps its singleton on `window.__TUVIX_GLOBAL_BUS__`, so separately bundled micro apps that each ship their own copy of `@tuvix.js/event-bus` get the same bus. In 0.4 each copy created its own "global" bus. `resetGlobalBus()` from any copy resets it for all of them. On the server, without `window`, the singleton stays module-scoped.
