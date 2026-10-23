# @tuvix.js/router

> माइक्रो ऐप्स के लिए history और hash रूटिंग, साझा `matchPath` matcher, और link interception

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा। पूरा डॉक्यूमेंटेशन: [tuvix.js.org/hi/packages/router](https://tuvix.js.org/hi/packages/router)।

राउटर URL paths को माइक्रो ऐप नामों से map करता है और path बदलने पर आपको बताता है। `matchPath` वह pattern matcher है जिसे core का `activeWhen` और `@tuvix.js/server` भी इस्तेमाल करते हैं। अगर आपका shell पहले से React Router या TanStack Router चलाता है, तो उसकी जगह उसे `@tuvix.js/core` के `orchestrator.connectRouter()` से connect करें।

## इंस्टॉलेशन

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

## क्विक स्टार्ट

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

const stopLinks = interceptLinks({ navigate: (path) => router.push(path), base: '/app' });

await router.push('/users/42'); // URL: /app/users/42, currentPath: '/users/42'

stopLinks();
router.destroy();
```

Constructor `popstate` या `hashchange` listener जोड़ता है। कोई `start()` call नहीं है।

## API

### `createRouter(config)` और `Router`

`createRouter(config)` `IRouter` type के साथ `new Router(config)` लौटाता है।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | required | `{ path, app, meta? }`। क्रम से जांचे जाते हैं, पहला match जीतता है। Paths पूरे path से match होते हैं: `'/'` सिर्फ़ home page है, `'/*'` हर path, `'/blog/*'` `/blog` और उसके नीचे के paths। |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` `pushState` और `location.pathname + search` इस्तेमाल करता है। `hash` `#/path` इस्तेमाल करता है। |
| `base` | `string` | `'/'` | History mode का prefix। पढ़ते समय हटाया जाता है (सिर्फ़ segment boundary पर), लिखते समय जोड़ा जाता है। |

| Member | व्यवहार |
| --- | --- |
| `currentPath`, `currentRoute` | ऐप के सापेक्ष path (history mode में query शामिल) और उसका `MatchedRoute \| null`। |
| `push(path)`, `replace(path)` | `Promise<void>`। Guards चलाते हैं, `base + path` (या `#path`) लिखते हैं, `onChange` handlers चलाते हैं। वही path हो तो कुछ नहीं करते। |
| `back()`, `forward()` | `window.history.back()` / `forward()`। |
| `onChange(handler)` | हर पूरे हुए navigation के बाद चलता है। Unsubscribe function लौटाता है। |
| `beforeEach(guard)` | Guards क्रम से चलते हैं। `false`, throw या rejection navigation रद्द करता है। Back/forward पर राउटर `replaceState` से पिछला URL वापस लाता है। हटाने वाला function लौटाता है। |
| `match(path)` | पहला मेल खाने वाला route या `null`। |
| `getActiveApps(path?)` | पूरे path से मेल खाने वाले हर route के ऐप्स, बिना duplicates के। `'/'` route सिर्फ़ `/` पर active है। हर पेज के लिए `'/*'` इस्तेमाल करें। |
| `destroy()` | Listeners हटाता है। इसके बाद `push`, `replace`, `back`, `forward`, `onChange`, `beforeEach` throw करते हैं। |

### `matchPath(pattern, path, options?)`

`{ matched, params }` लौटाता है।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | `/*` के बिना वाले pattern को पूरे path से match करवाएं। |

- `?query` और `#hash` हटाता है, आख़िरी slash को ignore करता है।
- `:name` एक segment capture करता है, URI-decode करके। आख़िर का `/*` base path और उसके नीचे सब कुछ match करता है, बाकी हिस्सा capture नहीं होता। बीच का `*` एक segment match करता है।
- Default रूप से `/docs`, `/docs/intro` से match करता है पर `/docsify` से नहीं, और `'/'` हर path से match करता है। `{ end: true }` के साथ `'/'` सिर्फ़ `/` से match करता है। राउटर routes `end: true` के नियम इस्तेमाल करते हैं। Core `activeWhen` और `@tuvix.js/server` routes prefix वाला default इस्तेमाल करते हैं।
- Compile हुए patterns cache होते हैं। Matching case-sensitive है।

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
```

### Helpers

| Export | व्यवहार |
| --- | --- |
| `matchRoute(path, routes)` | पहला पूरा match `{ route, path, params, query }` के रूप में, या `null`। `#hash` को ignore करता है। |
| `isPathActive(path, pattern)` | `matchPath(pattern, path, { end: true }).matched`, यानी routes वाले पूरे path के नियम। |
| `pathToRegex(pattern)` | Cached, पूरे path से match करने वाला `{ regex, paramNames }`। `regex` को बदलें नहीं। |
| `parseQuery(query)` | `'?a=1&b'` से `{ a: '1', b: '' }`। पहले `=` पर बांटता है, decode करता है, गलत encoding पर raw text रखता है। |
| `normalizePath(path)` | आगे slash जोड़ता है, आख़िर का एक slash हटाता है। |

### `interceptLinks(options)`

Same-origin `<a href>` clicks को `navigate(path)` calls में बदलता है। Cleanup function लौटाता है।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | required | `base` के बिना `pathname + search + hash` पाता है। एरर log होते हैं। |
| `root` | `Document \| HTMLElement` | `document` | जहां click listener लगता है। |
| `base` | `string` | `'/'` | इसके बाहर के links ब्राउज़र संभालता है। `navigate`/`prefetch` से पहले हटाया जाता है। |
| `shouldIntercept` | `(anchor, url, event) => boolean` | none | Click ब्राउज़र को संभालने देने के लिए `false` लौटाएं। Built-in जांचों के बाद चलता है। |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | none | `pointerenter` या `focusin` पर, हर `pathname + search` के लिए एक बार। |

Click ब्राउज़र के पास रहता है जब: किसी दूसरे handler ने `preventDefault()` कॉल किया हो; primary के अलावा कोई button हो या Ctrl/Meta/Shift/Alt दबा हो; `target` `_self` के अलावा कुछ हो; `download` हो; `rel` में `external` हो; `data-tuvix-reload` हो; दूसरा origin हो; path `base` के बाहर हो; मौजूदा path और query का hash link हो; या `shouldIntercept` `false` लौटाए। खुले shadow roots के अंदर के links संभाले जाते हैं। SVG `<a>` elements ब्राउज़र पर छोड़ दिए जाते हैं।

### `resolveLink(event, options?)`

जिस HTML `<a href>` पर event हुआ, उसके लिए `{ anchor, url, path }` लौटाता है, या `null` जब link ब्राउज़र को संभालना चाहिए। `path` `base` के बिना `pathname + search + hash` है। `interceptLinks` और orchestrator का hover prefetch इसे इस्तेमाल करते हैं। यही नियम लागू करने के लिए इसे अपने listeners से कॉल करें।

```ts
import { resolveLink } from '@tuvix.js/router';

document.addEventListener('focusin', (event) => {
  const link = resolveLink(event, { base: '/app' });
  if (link) console.log('next page might be', link.path);
});
```

यह इन मामलों में `null` लौटाता है: SVG `<a>`, `href` के बिना `<a>` या कोई `<a>` न हो (event path पर सबसे नज़दीकी `<a>` तय करता है); `target` `_self` के अलावा कुछ हो; `download`; `rel` में `external`; `data-tuvix-reload`; दूसरा origin; `base` के बाहर का path; `window` न हो। यह `event.composedPath()` पढ़ता है, इसलिए खुले shadow roots में links ढूंढता है, बंद वालों में नहीं। इसे dispatch के दौरान कॉल करें। यह buttons, modifier keys या सिर्फ़ hash वाले links की जांच नहीं करता।

### Types

`RouterMode`, `RouterConfig`, `RouteConfig`, `MatchedRoute`, `NavigationEvent` (`{ from, to, fromRoute, toRoute }`, `base` के बिना paths), `NavigationGuard`, `RouteChangeHandler`, `IRouter`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolveLinkOptions` (`{ base? }`), `ResolvedLink` (`{ anchor, url, path }`)।

## Edge cases

- दूसरा navigation शुरू होने पर राउटर लंबित navigation को रद्द नहीं करता। जो guard chain आख़िर में पूरी होती है, वही URL लिखती है।
- अगर दूसरा code `history.pushState` कॉल करता है, तो अगले `popstate`, `hashchange` या राउटर navigation तक `currentPath` पुराना रहता है।
- सर्वर पर constructor `currentPath` को `'/'` सेट करता है और कुछ नहीं जोड़ता। Navigation methods को `window` चाहिए।
- Back/forward navigation रद्द करने वाला guard address bar ठीक करता है। History की position वहीं रहती है जहां ब्राउज़र ने उसे पहुंचाया।

## यह क्या नहीं करता

- यह ऐप्स mount नहीं करता। यह काम `@tuvix.js/core` का orchestrator `router` config या `connectRouter` से करता है।
- जब तक आप `interceptLinks` कॉल न करें, यह links intercept नहीं करता।
- Nested routes, redirects, हर route के अलग guards या scroll restoration नहीं।

## 0.4 से माइग्रेशन

- `push()`/`replace()` आगे `base` जोड़ते हैं: `base: '/app'` के साथ `push('/x')` `/app/x` लिखता है। `base` के सापेक्ष paths दें।
- `base` सिर्फ़ segment boundary पर हटता है।
- `match`, `getActiveApps` और `isPathActive` में routes पूरे path से match होते हैं। `'/'` route सिर्फ़ `/` पर active है। Catch-all के लिए `'/*'` इस्तेमाल करें।
- `RouteConfig.exact` हटा दिया गया है (इसे ignore किया जाता था)।
- `pathToRegex(pattern)` का `exact` argument हट गया है, और यह cached `RegExp` लौटाता है।
- Patterns में regex characters शब्दशः match होते हैं। बीच का `*` एक segment match करता है।
- `matchRoute()` और `isPathActive()` `#hash` को ignore करते हैं।

## लाइसेंस

MIT
