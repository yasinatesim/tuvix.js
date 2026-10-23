---
"@tuvix.js/event-bus": patch
---

`maxListeners` prints a `console.warn` when an event gets more listeners than the limit, once per event name, with or without `debug`. In 0.4 the warning went through the debug logger, so you only saw it with `debug: true`. The listener is still added.
