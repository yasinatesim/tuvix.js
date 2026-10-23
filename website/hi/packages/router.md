---
title: '@tuvix.js/router'
---

<PackageHeader
  name="@tuvix.js/router"
  title="राउटर"
  description="माइक्रो ऐप्स के लिए history और hash रूटिंग, core और सर्वर के साथ साझा एक path matcher, और क्लाइंट-साइड नेविगेशन के लिए link interception।"
  icon="🔀"
  npm="true"
/>

## इंस्टॉलेशन {#installation}

```bash
npm install @tuvix.js/router
# or pnpm add @tuvix.js/router
```

`@tuvix.js/core` इस पैकेज पर निर्भर है और `createRouter`, `matchPath` और `interceptLinks` को re-export करता है, इसलिए आप ये तीनों core से भी import कर सकते हैं।

## इसे कब इस्तेमाल करें {#when-to-use-it}

राउटर URL paths को माइक्रो ऐप के नामों से जोड़ता है और path बदलने पर आपको बताता है। इसे तब इस्तेमाल करें जब नेविगेशन shell के हाथ में हो और shell तय करे कि किसी URL के लिए कौन सा माइक्रो ऐप active है। जब आप `createOrchestrator` को `router` देते हैं, तो orchestrator आपके लिए एक राउटर बना देता है, इसलिए ज़्यादातर shells को इसे खुद बनाने की ज़रूरत नहीं पड़ती।

`matchPath` Tuvix.js का अकेला pattern matcher है। Core इसे `activeWhen` strings के लिए इस्तेमाल करता है और `@tuvix.js/server` इसे ऐप `routes` के लिए इस्तेमाल करता है, इसलिए तीनों जगह एक pattern का मतलब एक ही होता है। आप इसे राउटर के बिना, अलग से भी कॉल कर सकते हैं।

अगर आपका shell पहले से React Router, TanStack Router या किसी दूसरे फ्रेमवर्क का राउटर चलाता है, तो उसे रहने दें। उसे `@tuvix.js/core` के `orchestrator.connectRouter({ subscribe, getPath })` से orchestrator से जोड़ें और इस राउटर को छोड़ दें। उसके साथ आप `matchPath` और `interceptLinks` फिर भी इस्तेमाल कर सकते हैं।

## क्विक स्टार्ट {#quick-start}

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({
  mode: 'history',
  base: '/app',
  routes: [
    { path: '/dashboard/*', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
    { path: '/settings', app: 'settings' },
  ],
});

router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} -> ${to}`, toRoute?.route.app, toRoute?.params);
});

router.beforeEach(({ from }) => !from.startsWith('/settings') || confirm('Discard unsaved settings?'));

// <a href="/app/users/42"> now calls router.push('/users/42') instead of reloading.
const stopLinks = interceptLinks({
  navigate: (path) => router.push(path),
  base: '/app',
});

await router.push('/users/42?tab=posts');
console.log(router.currentPath); // '/users/42?tab=posts'
console.log(router.currentRoute?.params); // { id: '42' }
console.log(window.location.pathname); // '/app/users/42'

// On teardown:
stopLinks();
router.destroy();
```

राउटर अपना `popstate` (history mode) या `hashchange` (hash mode) listener constructor में ही जोड़ देता है। कोई `start()` कॉल नहीं है।

Orchestrator के साथ, वही config `router` के रूप में दें और नेविगेशन orchestrator से करें:

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { interceptLinks } from '@tuvix.js/router';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [{ path: '/dashboard/*', app: 'dashboard' }],
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
});

await orchestrator.start();

interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

`activeWhen` के बिना कोई ऐप उन `routes` को follow करता है जिनमें उसका नाम है। `orchestrator.getRouter()` `IRouter` instance लौटाता है।

## API {#api}

### `createRouter`

```ts
import type { IRouter, RouterConfig } from '@tuvix.js/router';

declare function createRouter(config: RouterConfig): IRouter;
```

`IRouter` type के साथ `new Router(config)` लौटाता है।

| विकल्प | Type | Default | मतलब |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | ज़रूरी | Route table। राउटर routes को array के क्रम में जाँचता है और पहला match जीतता है। |
| `mode` | `'history' \| 'hash'` | `'history'` | `history` `location.pathname + location.search` पढ़ता है और `pushState` से लिखता है। `hash` `#/path` पढ़ता और लिखता है। |
| `base` | `string` | `'/'` | वह path prefix जिसके नीचे ऐप serve होता है, सिर्फ़ history mode में। राउटर URL पढ़ते समय इसे हटाता है और लिखते समय जोड़ता है। Hash mode इसे अनदेखा करता है। |

हर `RouteConfig`:

| विकल्प | Type | Default | मतलब |
| --- | --- | --- | --- |
| `path` | `string` | ज़रूरी | `matchPath` syntax में pattern, जो पूरे path से match होता है। `'/'` सिर्फ़ होम पेज से match होता है, `'/*'` हर path से match होता है, `'/blog/*'` `/blog` और उसके नीचे की हर चीज़ से match होता है। |
| `app` | `string` | ज़रूरी | Active करने वाले माइक्रो ऐप का नाम। |
| `meta` | `Record<string, unknown>` | कोई नहीं | आपका डेटा। राउटर इसे `MatchedRoute.route.meta` पर आगे भेज देता है। |

### `Router`

```ts
import { Router } from '@tuvix.js/router';

const router = new Router({ routes: [{ path: '/cart', app: 'cart' }] });
```

`createRouter` के पीछे की class। यह `IRouter` implement करती है:

| Member | Signature | व्यवहार |
| --- | --- | --- |
| `currentPath` | `readonly string` | `base` के बिना ऐप-relative path। History mode में इसमें query string भी होती है। |
| `currentRoute` | `readonly MatchedRoute \| null` | `match(currentPath)` का नतीजा। |
| `push` | `(path: string) => Promise<void>` | Guards चलाता है, `history.pushState` से URL लिखता है (history mode में `base + path`, hash mode में `#path`), फिर `onChange` handlers चलाता है। |
| `replace` | `(path: string) => Promise<void>` | `push` जैसा ही, पर `history.replaceState` के साथ। |
| `back` | `() => void` | `window.history.back()` कॉल करता है। |
| `forward` | `() => void` | `window.history.forward()` कॉल करता है। |
| `onChange` | `(handler: RouteChangeHandler) => () => void` | हर पूरे हुए नेविगेशन के बाद `handler` चलाता है। एक unsubscribe function लौटाता है। |
| `beforeEach` | `(guard: NavigationGuard) => () => void` | एक guard जोड़ता है। उसे हटाने वाला function लौटाता है। |
| `match` | `(path: string) => MatchedRoute \| null` | `path` से match होने वाला पहला route, या `null`। |
| `getActiveApps` | `(path?: string) => string[]` | पूरे `path` (default: `currentPath`) से match होने वाले हर route के ऐप नाम, route के क्रम में, बिना duplicates के। |
| `destroy` | `() => void` | Window listener हटाता है और handlers व guards साफ़ करता है। |

`push` और `replace` को `base` के relative path दें। `base: '/app'` के साथ `router.push('/x')` `/app/x` लिखता है और `currentPath` `/x` हो जाता है।

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  base: '/app',
  routes: [
    { path: '/*', app: 'header' },
    { path: '/docs/*', app: 'docs' },
    { path: '/docs/:page', app: 'doc-sidebar' },
  ],
});

router.match('/docs/intro')?.route.app; // 'header' (first match wins)
router.getActiveApps('/docs/intro'); // ['header', 'docs', 'doc-sidebar']
router.getActiveApps('/'); // ['header']
await router.replace('/docs/intro'); // URL: /app/docs/intro, no new history entry
router.back();
```

`match`, `getActiveApps` और `isPathActive` पूरे path वाले एक जैसे नियम लागू करते हैं। `'/'` route सिर्फ़ `/` पर active होता है। जो ऐप हर पेज पर दिखना चाहिए, उसके लिए `'/*'` इस्तेमाल करें।

#### Guards {#guards}

Guards उसी क्रम में चलते हैं जिसमें आपने उन्हें जोड़ा था, एक-एक करके, URL बदलने से पहले। `false` पर resolve होने से नेविगेशन रद्द हो जाता है और बाकी guards नहीं चलते। कोई भी दूसरी value नेविगेशन को जारी रहने देती है। अगर कोई guard throw या reject करता है, तो नेविगेशन रद्द हो जाता है और राउटर `console.error` से एरर log करता है।

```ts
import { createRouter } from '@tuvix.js/router';

declare function isAdmin(): Promise<boolean>;

const router = createRouter({
  routes: [{ path: '/admin/*', app: 'admin' }],
});

const removeGuard = router.beforeEach(async ({ to }) => {
  if (to.startsWith('/admin')) return isAdmin();
  return true;
});

removeGuard();
```

Guards back और forward बटन के लिए भी चलते हैं। तब तक ब्राउज़र आगे बढ़ चुका होता है, इसलिए जब कोई guard नेविगेशन रद्द करता है, तो राउटर `history.replaceState` कॉल करके पिछला URL (`base` के साथ) address bar में वापस रख देता है। History entry वहीं रहती है जहाँ ब्राउज़र उसे ले गया था।

### `matchPath`

```ts
import type { MatchPathOptions, PathMatch } from '@tuvix.js/router';

declare function matchPath(
  pattern: string,
  path: string,
  options?: MatchPathOptions
): PathMatch;
```

| विकल्प | Type | Default | मतलब |
| --- | --- | --- | --- |
| `end` | `boolean` | `false` | `true` होने पर `/*` के बिना वाले pattern को पूरे path से match होना होता है। `false` हर sub-path से भी match करता है। |

`{ matched, params }` लौटाता है। नियम:

- Matcher `path` से `?query` और `#hash` हटा देता है और दोनों तरफ़ के trailing slash को अनदेखा करता है।
- `:name` एक non-empty segment को URI-decode करके `params.name` में capture करता है। गलत percent-encoding वाली value जैसी लिखी है वैसी ही रहती है। एक segment में text और params दोनों हो सकते हैं: `/v:version` `/v2` से match होता है।
- आखिर का `/*` base path और उसके नीचे की हर चीज़ से match होता है: `/docs/*` `/docs` और `/docs/a/b` से match होता है। बाकी हिस्सा `params` में capture नहीं होता।
- Pattern के बीच का `*` एक segment से match होता है।
- Default रूप से एक साधारण pattern segment boundary पर अपने sub-paths से match होता है: `/docs` `/docs/intro` से match होता है और `/docsify` से match नहीं होता।
- Default रूप से `'/'` हर path से match होता है। `{ end: true }` के साथ यह सिर्फ़ `/` से match होता है। राउटर routes हमेशा `end: true` वाले नियम इस्तेमाल करते हैं। Core की `activeWhen` strings और `@tuvix.js/server` के ऐप `routes` default prefix नियम इस्तेमाल करते हैं।
- Pattern में बाकी regex characters शब्दशः match होते हैं। Matching case-sensitive है।

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts#bio'); // { matched: true, params: { id: '42' } }
matchPath('/files/:name', '/files/a%20b.txt').params.name; // 'a b.txt'
matchPath('/docs', '/docs/intro').matched; // true
matchPath('/docs', '/docs/intro', { end: true }).matched; // false
matchPath('/docs', '/docsify').matched; // false
matchPath('/', '/anything').matched; // true
matchPath('/a/*/c', '/a/b/c').matched; // true
```

Matcher हर pattern को एक बार compile करता है और `RegExp` को cache करता है, इसलिए आप इसे हर नेविगेशन पर कॉल कर सकते हैं।

### `matchRoute`

```ts
import type { MatchedRoute, RouteConfig } from '@tuvix.js/router';

declare function matchRoute(path: string, routes: RouteConfig[]): MatchedRoute | null;
```

वह पहला route लौटाता है जिसका `path` पूरे `path` से match होता है (`end: true` नियम), साथ में साफ़ किया हुआ path, decode किए हुए params और parse की हुई query। यह `#hash` को अनदेखा करता है। `Router.match` इसे कॉल करता है।

```ts
import { matchRoute } from '@tuvix.js/router';

matchRoute('/users/42?tab=info', [{ path: '/users/:id', app: 'users' }]);
// { route: { path: '/users/:id', app: 'users' }, path: '/users/42', params: { id: '42' }, query: { tab: 'info' } }
```

### `isPathActive`

```ts
declare function isPathActive(path: string, pattern: string): boolean;
```

`matchPath(pattern, path, { end: true }).matched`: वही पूरे path वाले नियम जो routes इस्तेमाल करते हैं, इसलिए `'/'` सिर्फ़ `/` पर active होता है। `Router.getActiveApps` इसे इस्तेमाल करता है।

```ts
import { isPathActive } from '@tuvix.js/router';

isPathActive('/settings/profile', '/settings'); // false
isPathActive('/settings/profile', '/settings/*'); // true
isPathActive('/settings/profile', '/'); // false
isPathActive('/settings/profile', '/*'); // true
```

### `pathToRegex`

```ts
declare function pathToRegex(pattern: string): { regex: RegExp; paramNames: string[] };
```

किसी pattern के लिए compile किया हुआ full-match `RegExp` और क्रम में उसके param नाम लौटाता है। `regex` object साझा cache से आता है: उसका `lastIndex` या कोई दूसरी state न बदलें। Regex बिना query या hash वाले normalized path पर चलता है। जब path में ये हो सकते हैं, तब `matchPath` इस्तेमाल करें।

```ts
import { pathToRegex } from '@tuvix.js/router';

const { regex, paramNames } = pathToRegex('/posts/:slug');
regex.test('/posts/hello'); // true
paramNames; // ['slug']
```

### `parseQuery`

```ts
declare function parseQuery(queryString: string): Record<string, string>;
```

`a=1&b=2` को parse करता है, शुरुआती `?` के साथ या उसके बिना। यह हर pair को पहले `=` पर बाँटता है ताकि JWT जैसी values के `=` characters बने रहें, keys और values को decode करता है, और decoding fail होने पर raw text रखता है। बिना `=` वाली key `''` पर map होती है। दोहराई गई key आखिरी value रखती है।

```ts
import { parseQuery } from '@tuvix.js/router';

parseQuery('?token=abc.def=ghi&debug'); // { token: 'abc.def=ghi', debug: '' }
```

### `normalizePath`

```ts
declare function normalizePath(path: string): string;
```

शुरू में slash जोड़ता है और आखिर का एक slash हटाता है। यह query या hash को नहीं छूता।

```ts
import { normalizePath } from '@tuvix.js/router';

normalizePath('users/42/'); // '/users/42'
```

### `interceptLinks`

```ts
import type { InterceptLinksOptions } from '@tuvix.js/router';

declare function interceptLinks(options: InterceptLinksOptions): () => void;
```

`root` के नीचे `<a href>` elements पर clicks सुनता है, जिन्हें handle करता है उन पर `preventDefault()` कॉल करता है और उनका path `navigate` को देता है। एक function लौटाता है जो इसके जोड़े हुए हर listener को हटा देता है।

| विकल्प | Type | Default | मतलब |
| --- | --- | --- | --- |
| `navigate` | `(path: string, event: MouseEvent) => void \| Promise<void>` | ज़रूरी | `base` हटाकर `pathname + search + hash` पाता है। Function throw हुए एरर या rejected promise को `console.error` से log करता है। |
| `root` | `Document \| HTMLElement` | `document` | वह element जिस पर click listener लगता है। |
| `base` | `string` | `'/'` | वह path prefix जिसके नीचे ऐप serve होता है। इसके बाहर के links ब्राउज़र को जाते हैं। Function `navigate` और `prefetch` कॉल करने से पहले इसे हटा देता है। |
| `shouldIntercept` | `(anchor: HTMLAnchorElement, url: URL, event: MouseEvent) => boolean` | कोई नहीं | Built-in जाँचों के बाद चलता है। Click ब्राउज़र को handle करने देने के लिए `false` लौटाएँ। |
| `prefetch` | `(path: string, anchor: HTMLAnchorElement) => void` | कोई नहीं | किसी eligible link पर `pointerenter` या `focusin` होने पर चलता है, हर `pathname + search` के लिए एक बार। Path में hash नहीं होता। |

इनमें से कोई भी बात सच हो, तो `interceptLinks` click ब्राउज़र पर छोड़ देता है:

- किसी दूसरे handler ने पहले ही `preventDefault()` कॉल कर दिया है।
- बटन primary बटन नहीं है, या Ctrl, Meta, Shift या Alt दबा हुआ है।
- Anchor में `_self` के अलावा कोई `target`, `download` attribute, `external` वाला `rel`, या `data-tuvix-reload` attribute है।
- Resolve हुए URL का origin पेज से अलग है।
- URL path `base` के बाहर है (`/app` में `/app` और `/app/...` आते हैं, `/application` नहीं)।
- Link में hash है और उसका path और query मौजूदा पेज जैसे ही हैं। ब्राउज़र anchor तक scroll करता है।
- `shouldIntercept` `false` लौटाता है।

`prefetch` attribute, origin और `base` वाली जाँचें लागू करता है। यह modifier keys और सिर्फ़-hash वाले नियम को अनदेखा करता है, और मौजूदा पेज के link के लिए भी चलता है।

```ts
import { createRouter, interceptLinks } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/shop/*', app: 'shop' }] });
const nav = document.querySelector('nav') ?? document;

const stop = interceptLinks({
  navigate: (path) => router.push(path),
  root: nav,
  shouldIntercept: (anchor) => !anchor.closest('[data-legacy]'),
  prefetch: (path) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.append(link);
  },
});

stop();
```

`interceptLinks` anchor को [`resolveLink`](#resolvelink) से ढूँढता है, इसलिए open shadow roots के अंदर के links भी काम करते हैं और SVG `<a>` elements ब्राउज़र पर छोड़ दिए जाते हैं। जिस environment में `document` या `window` नहीं है, वहाँ यह no-op cleanup function लौटाता है।

### `resolveLink`

```ts
import type { ResolvedLink, ResolveLinkOptions } from '@tuvix.js/router';

declare function resolveLink(
  event: Event,
  options?: ResolveLinkOptions
): ResolvedLink | null;
```

जिस `<a href>` पर event हुआ, उसे ढूँढता है और उसके absolute URL और ऐप-relative path के साथ लौटाता है। जब link ब्राउज़र को handle करना चाहिए, तब यह `null` लौटाता है। `interceptLinks` और orchestrator का `prefetch: { strategy: 'hover' }` इसे इस्तेमाल करते हैं। जब आपको link के यही नियम चाहिए, तब इसे अपने listeners से कॉल करें, उदाहरण के लिए hover पर डेटा पहले से तैयार करने या ऐप के अंदर के नेविगेशन को log करने के लिए।

| विकल्प | Type | Default | मतलब |
| --- | --- | --- | --- |
| `base` | `string` | `'/'` | वह path prefix जिसके नीचे ऐप serve होता है। इसके बाहर का link `null` लौटाता है। Function इसे `path` से हटा देता है। |

| Field | Type | मतलब |
| --- | --- | --- |
| `anchor` | `HTMLAnchorElement` | `<a>` element। |
| `url` | `URL` | Link का absolute URL। |
| `path` | `string` | `base` हटाकर `pathname + search + hash`। |

```ts
import { resolveLink } from '@tuvix.js/router';

const warmed = new Set<string>();

function warmUp(event: Event): void {
  const link = resolveLink(event, { base: '/app' });
  if (!link || warmed.has(link.url.pathname)) return;
  warmed.add(link.url.pathname);
  void fetch(`/api/page-data?path=${encodeURIComponent(link.path)}`);
}

// pointerenter does not bubble, so listen in the capture phase.
document.addEventListener('pointerenter', warmUp, true);
document.addEventListener('focusin', warmUp);
```

इनमें से कोई भी बात सच हो, तो `resolveLink` `null` लौटाता है:

- Event path पर सबसे नज़दीकी `<a>` एक SVG `<a>` है, या `href` के बिना HTML `<a>` है, या कोई `<a>` है ही नहीं। खोज पहले मिले `<a>` पर रुक जाती है।
- Anchor में `_self` के अलावा कोई `target`, `download` attribute, `external` वाला `rel`, या `data-tuvix-reload` attribute है।
- URL का origin पेज से अलग है।
- URL path `base` के बाहर है (`/app` में `/app` और `/app/...` आते हैं, `/application` नहीं)।
- `window` नहीं है, जैसे सर्वर पर।

यह `event.composedPath()` पढ़ता है, इसलिए `document` पर लगा listener open shadow roots के अंदर के links ढूँढ लेता है। Closed shadow roots के अंदर के links इससे छिपे रहते हैं। इसे event dispatch होते समय ही कॉल करें: dispatch खत्म होने के बाद composed path खाली होता है और function `event.target.closest('a')` पर लौट आता है, जो shadow root के अंदर नहीं देख सकता।

यह mouse बटन, modifier keys, `defaultPrevented` या सिर्फ़-hash वाले नियम की जाँच नहीं करता। Clicks के लिए `interceptLinks` ये जाँचें ऊपर से लागू करता है।

### Types {#types}

| Type | मतलब |
| --- | --- |
| `RouterMode` | `'history' \| 'hash'`। |
| `RouterConfig` | `{ mode?, base?, routes }`, `createRouter` के विकल्प। |
| `RouteConfig` | `{ path, app, meta? }`, एक route। |
| `MatchedRoute` | `{ route, path, params, query }`। `path` साफ़ किया हुआ pathname है, `params` decode की हुई `:param` values, `query` parse की हुई query string। |
| `NavigationEvent` | `{ from, to, fromRoute, toRoute }`। `from` और `to` `base` के बिना ऐप-relative paths हैं। |
| `NavigationGuard` | `(event: NavigationEvent) => boolean \| Promise<boolean>`। |
| `RouteChangeHandler` | `(event: NavigationEvent) => void`। |
| `IRouter` | वह interface जिसे `Router` implement करता है और `createRouter` लौटाता है। |
| `PathMatch` | `{ matched: boolean; params: Record<string, string> }`, `matchPath` का नतीजा। कुछ match न होने पर `params` `{}` होता है। |
| `MatchPathOptions` | `{ end?: boolean }`। |
| `InterceptLinksOptions` | `interceptLinks` के विकल्प। |
| `ResolveLinkOptions` | `{ base?: string }`, `resolveLink` के विकल्प। |
| `ResolvedLink` | `{ anchor: HTMLAnchorElement; url: URL; path: string }`, `resolveLink` का नतीजा। |

## Edge cases {#edge-cases}

- जिस path पर आप पहले से हैं (वही string, query समेत), उस पर `push` और `replace` guards या handlers चलाए बिना लौट आते हैं।
- नया नेविगेशन शुरू करने पर राउटर pending नेविगेशन को रद्द नहीं करता। हर `push` अपने guards का इंतज़ार करता है, फिर URL लिखता है, इसलिए जो guard chain आखिर में पूरी होती है, वही जीतती है।
- राउटर को URL बदलाव की जानकारी अपने `push`/`replace` से और `popstate`/`hashchange` से मिलती है। अगर कोई दूसरा code `history.pushState` कॉल करता है, तो अगले event या राउटर नेविगेशन तक `currentPath` पुराना रहता है।
- `destroy()` के बाद `push`, `replace`, `back`, `forward`, `onChange` और `beforeEach` `[Tuvix Router] Cannot use a destroyed Router. Create a new one.` throw करते हैं। `match` और `getActiveApps` काम करते रहते हैं।
- अगर कोई `onChange` handler throw करता है, तो राउटर उसे `console.error` से log करता है और बाकी handlers को फिर भी कॉल करता है।
- `base: '/app'` के साथ राउटर `/application` को `/application` ही पढ़ता है: यह base को सिर्फ़ segment boundary पर हटाता है। History mode में URL पढ़ते समय यह `#hash` हटा देता है।
- सर्वर पर (जहाँ `window` नहीं है), constructor `currentPath` को `'/'` पर सेट करता है और कोई listener नहीं जोड़ता। `push`, `replace`, `back` और `forward` को `window` चाहिए।
- `/*` pattern के साथ `matchPath` base path से भी match होता है: `/dashboard/*` `/dashboard` से match होता है।
- `<svg>` के अंदर के `<a>` पर हुआ event `null` पर resolve होता है, तब भी जब कोई HTML `<a>` SVG को घेरे हो। `interceptLinks` और orchestrator का hover prefetch उस link को ब्राउज़र पर छोड़ देते हैं, जो पूरा पेज load करता है।

## यह क्या नहीं करता {#what-it-does-not-do}

- यह माइक्रो ऐप्स को mount या unmount नहीं करता। यह matches और बदलावों की जानकारी देता है। `@tuvix.js/core` का orchestrator उन पर काम करता है।
- जब तक आप `interceptLinks` कॉल नहीं करते, यह link clicks intercept नहीं करता।
- इसमें nested routes, named routes, redirects या per-route guards नहीं हैं। `beforeEach` इस्तेमाल करें और `to` या `toRoute` जाँचें।
- यह path के `/*` वाले बाकी हिस्से को `params` में capture नहीं करता।
- यह scroll position वापस नहीं लाता।

## 0.4 से माइग्रेशन {#migrating-from-0-4}

`push()` और `replace()` अब `base` prefix जोड़ते हैं। `base` के relative paths दें:

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ base: '/app', routes: [] });

// 0.4: router.push('/app/x') wrote /app/x, router.push('/x') wrote /x
// 0.5: router.push('/x') writes /app/x
await router.push('/x');
```

दूसरे breaking changes:

- `base` सिर्फ़ segment boundary पर हटता है: `/application` अब `/lication` नहीं पढ़ा जाता।
- `match`, `getActiveApps` और `isPathActive` में routes पूरे path से match होते हैं। 0.4 में `getActiveApps` और `isPathActive` `'/'` route को हर path पर active मानते थे। Catch-all `{ path: '/', app }` को `{ path: '/*', app }` में बदलें।
- `RouteConfig.exact` हटा दिया गया है। यह स्वीकार होता था पर अनदेखा होता था। इसे अपने route objects से हटा दें।
- `pathToRegex(pattern)` का दूसरा `exact` argument हट गया है और यह cache किया हुआ `RegExp` लौटाता है।
- Patterns में regex characters शब्दशः match होते हैं, और pattern के बीच का `*` एक segment से match होता है।
- `matchRoute()` और `isPathActive()` path में `#hash` को अनदेखा करते हैं।
- 0.4 docs में `navigate`, `go` और `onRouteChange`, राउटर का `orchestrator` विकल्प और per-route `guard` दिए गए थे। इनमें से कोई मौजूद नहीं है। `push`, `back`/`forward`, `onChange`, orchestrator का `router` config और `beforeEach` इस्तेमाल करें।
