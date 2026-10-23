---
"@tuvix.js/router": minor
---

One shared path matcher, link interception, and `base` on navigation.

- `matchPath(pattern, path, { end? })` returns `{ matched, params }`. It drops `?query` and `#hash`, ignores a trailing slash, captures `:param` segments (URI-decoded) and treats `/*` as "this path and everything below it". By default `/docs` also matches `/docs/intro` but not `/docsify`, and `'/'` matches every path. Pass `{ end: true }` for a full match. Core `activeWhen` and the server package use it, so all three agree on what a pattern means.
- The matcher compiles each pattern once and caches it. In 0.4 it rebuilt the `RegExp` on every match.
- `interceptLinks({ navigate, root?, base?, shouldIntercept?, prefetch? })` turns same-origin link clicks into `navigate(path)` calls and returns a cleanup function. It skips modified clicks (Ctrl, Meta, Shift, Alt), non-primary buttons, clicks another handler prevented, links with a `target` other than `_self`, `download`, `rel="external"` or `data-tuvix-reload`, links to another origin or outside `base`, and hash-only links on the current path. `prefetch(path)` runs on pointerenter or focus, once per path.
- `interceptLinks` follows the event's composed path, so it handles links inside open shadow roots. It ignores SVG `<a>` elements, whose `href` is not a URL string. `rel` must contain the token `external` to skip a link; `rel="external-help"` does not count.
- `resolveLink(event, { base? })` returns `{ anchor, url, path }` for the same-origin HTML link an event happened on, or `null` when the browser should handle it. `interceptLinks` and the core orchestrator's hover prefetch both use it.
- New exports: `matchPath`, `interceptLinks`, `resolveLink`, and the types `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions`.

Breaking:

- `push()` and `replace()` prefix the configured `base`. With `base: '/app'`, `push('/x')` now writes `/app/x`; 0.4 wrote `/x`. Pass paths relative to `base`. A guard that cancels a back/forward navigation restores the URL with the base too.
- `base` strips only on a segment boundary: with `base: '/app'`, the router reads `/application` as `/application`, not `/lication`.
- `pathToRegex()` returns a cached `RegExp`; do not mutate it. Its second `exact` argument is gone; it never changed the result.
- `RouteConfig.exact` is gone. 0.4 accepted it and ignored it. Route paths match the whole path; end a path with `/*` to match sub-paths.
- A `'/'` route activates only on `/`. In 0.4 `getActiveApps()` and `isPathActive()` treated `'/'` as "every path" while `match()` treated it as exact; now all three agree. Use `'/*'` for a route that matches every path. Core `activeWhen: '/'` keeps matching every path, because `activeWhen` strings use prefix matching.
- Regex characters in patterns match literally. A `*` segment in the middle of a pattern matches one path segment; 0.4 passed it into the regex as a quantifier.
- `matchRoute()` and `isPathActive()` ignore a `#hash` in the path.
