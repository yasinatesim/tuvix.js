---
"@tuvix.js/loader": patch
---

Lifecycle runtime fixes for modules mounted in several containers and for containers a host framework removed.

- The runtime tracks mounted containers per app name. `isMounted(name)` stays true while any container of that app is mounted; unmounting one of two containers no longer flips it to false. `whenMounted(name)` resolves on the first mount, or right away with the earliest container still mounted.
- `emitLifecycle` dispatches on `document` when the container is no longer in the DOM, for example after React removed an island before the adapter reported `unmounted`. `detail.container` still points at the element, and `onLifecycle` listeners on `document` receive the event once.
