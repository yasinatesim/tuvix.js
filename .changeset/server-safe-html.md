---
"@tuvix.js/server": minor
---

Server: fragment HTML stays intact, shared route matching, 502 on total failure, valid Prometheus output.

- `composeHTML`, `compileShellTemplate().render` and `createServerRenderer` fill slots in one pass with a function replacer. A fragment containing `$&`, `$1`, `` $` `` or `$'` now appears as written. A `<tuvix-slot>` inside fragment HTML is no longer filled by a later slot.
- The streaming renderer escapes `<` and `>` (plus U+2028/U+2029) in the JSON it writes into inline scripts. A fragment containing `</script>` or `<!--` can no longer end the script and inject markup.
- Scripts inside a streamed fragment now run. After inserting the fragment, the inline swap script replaces each `<script>` with a fresh copy that keeps every attribute (`type`, `src`, `nonce`, ...) and its text, one at a time in document order. After an external script without `async`, the next one waits for its `load` or `error` event, so `<script src="/lib.js"></script><script>Lib.init()</script>` finds `Lib`. `async` scripts and data blocks do not wait. Before, `outerHTML` inserted them inert.
- `stream(path, res, { nonce })` and `createStreamingMiddleware(renderer, { nonce: (req, res) => ... })` put a CSP nonce on every inline script the renderer writes, so a policy without `'unsafe-inline'` lets the fragment swaps run. New exported types: `StreamOptions`, `StreamingMiddlewareOptions`, `StreamingMiddlewareResponse`, `MiddlewareRequest`. `StreamingResponse` gains an optional `statusCode`.
- Self-closing `<tuvix-slot name="x" />` gets a streaming placeholder (`<div id="tvx-slot-x">`). Before, only the paired form did, so the fragment had nowhere to go.
- The fragment URL is built with `URL`/`searchParams`: an `ssrUrl` such as `http://cart/render?v=2` keeps `v=2` and gains `path`. Before, the renderer appended a second `?`. `path` now carries the request query too (`/shop?sort=asc`), and the `#hash` is dropped. The `://` safety check looks at the pathname only, so `?next=https://...` no longer fails the request.
- Error comments (`<!-- SSR error: ... -->`) escape the app name and error message, so an error text with `-->` cannot close the comment.
- Apps match routes with `matchPath` from `@tuvix.js/router`, the same matcher core uses for `activeWhen`. `/dashboard?tab=1` and `/users/42#bio` now match `/dashboard/*` and `/users/:id`.
- `toPrometheusText()` writes one `# HELP` and one `# TYPE` line per metric family, without labels, followed by one sample per app. Label values escape `\`, `"` and newlines. Before, every app repeated HELP/TYPE with labels in the metric name, which Prometheus rejects.
- `createStreamingMiddleware` no longer calls `next()` after the shell went out. When streaming fails after the first write, it ends the response. When it fails before, it calls `next(error)`. Without `next`, it sends 500 through `res.status` (Express), or sets `res.statusCode = 500` and ends the response (Node `http`); before, a plain Node response hung.

Breaking:

- `createServerRenderer().render()` returns `statusCode: 502` when at least one app matched the path and every fragment fetch failed. It still returns 200 when no app matched or at least one fragment succeeded. `createMiddleware` sends that status. The streaming renderer always sends 200, since its headers go out before any fragment is fetched.
- `createMiddleware` and `createStreamingMiddleware` call `next(error)` instead of `next()` when rendering throws, so Express routes the request to your error handler.
- Both middlewares render `req.originalUrl ?? req.url` instead of `req.path ?? req.url`, so fragment services receive the query string in `path`, and under `app.use('/prefix', ...)` they see the full URL including `/prefix`.
- `ssrUrl` must be an absolute URL. A relative one now produces the error comment for that app instead of being fetched as-is.
- Fragment `<script>` elements in streamed output now execute. Strip them on the fragment service if you relied on them staying inert.
- `render` and `stream` answer `400 Bad Request` once for a request pathname containing `://` or starting with `//`, fetch nothing and record no fragment metrics. Before, the page came back with status 502 (or 200 when streaming) and one warning and one fragment error per app.
