# रूटिंग

Tuvix.js मौजूदा path देखकर तय करता है कि कौन से ऐप्स mount होंगे। आप यह हर ऐप पर `activeWhen` से, built-in राउटर पर `routes` से, या दोनों से बताते हैं। हर pattern को एक ही matcher पढ़ता है: `@tuvix.js/router` का `matchPath`। इसलिए `activeWhen`, राउटर और `@tuvix.js/server` तीनों `/users/:id` का एक ही मतलब निकालते हैं।

## Pattern के नियम

`activeWhen` strings prefix matching इस्तेमाल करती हैं:

| Pattern | किससे match होता है | किससे match नहीं होता | Params |
| --- | --- | --- | --- |
| `/dashboard` | `/dashboard`, `/dashboard/`, `/dashboard/stats` | `/dashboards` | कोई नहीं |
| `/dashboard/*` | वही paths जो `/dashboard` से match होते हैं | `/dashboards` | कोई नहीं |
| `/users/:id` | `/users/42`, `/users/42/posts` | `/users` | `{ id: '42' }` |
| `/v:version/docs` | `/v2/docs` | `/2/docs` | `{ version: '2' }` |
| `/` | हर path | कोई नहीं | कोई नहीं |

- Matcher match करने से पहले `?query` और `#hash` हटा देता है, इसलिए `/dashboard?tab=1` भी `/dashboard` से match होता है।
- यह params को decode करता है: `/users/J%C3%BCrgen` से `{ id: 'Jürgen' }` मिलता है।
- `.` और `(` जैसे characters ज्यों के त्यों match होते हैं।
- Pattern के बीच में `*` एक segment से match होता है।

किसी pattern को खुद जाँचें:

```ts
import { matchPath } from '@tuvix.js/router';

matchPath('/users/:id', '/users/42?tab=posts'); // { matched: true, params: { id: '42' } }
matchPath('/settings', '/settings/profile').matched; // true
matchPath('/settings', '/settings/profile', { end: true }).matched; // false
matchPath('/', '/about', { end: true }).matched; // false
```

## activeWhen से ऐप्स activate करें

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  activeWhen: '/users/:id',
});

orchestrator.register({
  name: 'header',
  entry: () => import('./apps/header'),
  container: '#header',
  activeWhen: '/', // every page
});

await orchestrator.start();
```

Function को path मिलता है और वह boolean लौटाता है। Exact match, कई prefixes या feature flags के लिए इसे इस्तेमाल करें।

## Built-in राउटर

`createOrchestrator` को `router` दें। फिर राउटर जो भी navigation करता है, उसके बाद orchestrator reconcile करता है:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/settings', app: 'settings' },
      { path: '/billing/*', app: 'billing' },
    ],
  },
});

orchestrator.register({ name: 'settings', entry: () => import('./apps/settings'), container: '#app' });
orchestrator.register({ name: 'billing', entry: () => import('./apps/billing'), container: '#app' });

await orchestrator.start();
await orchestrator.navigateTo('/billing/invoices');
```

जिस ऐप पर `activeWhen` नहीं है, वह उन routes के हिसाब से चलता है जिनमें उसका नाम है। `activeWhen` से दो अंतर हैं:

- Route paths पूरे path से match होते हैं। `/settings` का match `/settings` और `/settings/` से होता है, `/settings/profile` से नहीं। Sub-paths के लिए `/*` जोड़ें।
- `/` path वाला route अपने ऐप को सिर्फ़ `/` पर activate करता है। हर path से match होने वाले route के लिए `/*` इस्तेमाल करें।

जब किसी ऐप पर `activeWhen` होता है, तो orchestrator उसी को इस्तेमाल करता है और `routes` को नज़रअंदाज़ करता है।

राउटर `popstate` (history mode) या `hashchange` (hash mode) को सुनता है। यह link clicks को intercept नहीं करता; अगला सेक्शन देखें।

## Link clicks

`interceptLinks` same-origin `<a href>` clicks को आपके `navigate` function की calls में बदलता है और एक cleanup function लौटाता है:

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

const stop = interceptLinks({
  navigate: (path) => orchestrator.navigateTo(path),
  prefetch: (path) => console.debug('user may open', path),
});

// later, when the shell leaves the page
stop();
```

ये clicks यह ब्राउज़र पर छोड़ देता है:

- कोई modifier key (Ctrl, Meta, Shift, Alt) दबी हो, या primary button के अलावा कोई और button;
- `event.defaultPrevented` पहले से true हो;
- `_self` के अलावा कोई `target`, `download` attribute, `rel="external"` या `data-tuvix-reload`;
- दूसरा origin, या `base` के बाहर का path;
- मौजूदा path पर सिर्फ़ hash वाला link, ताकि ब्राउज़र scroll करे।

`prefetch(path)` pointerenter या focus पर चलता है, हर path के लिए एक बार। `shouldIntercept(anchor, url, event)` से आप अपना filter जोड़ते हैं; click ब्राउज़र को सौंपने के लिए `false` लौटाएँ। `root` सुनने को एक element तक सीमित करता है।

## Navigation और guards

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ routes: [{ path: '/users/:id', app: 'user' }] });

const offGuard = router.beforeEach(async ({ to }) => {
  if (!to.startsWith('/admin')) return true;
  const response = await fetch('/api/me');
  return response.ok;
});

const offChange = router.onChange(({ from, to, toRoute }) => {
  console.log(`${from} → ${to}`, toRoute?.params);
});

await router.push('/users/42'); // pushState
await router.replace('/users/43'); // replaceState
router.back();

router.currentPath; // '/users/43'
router.currentRoute?.params; // { id: '43' }
router.currentRoute?.query; // parsed ?query
router.match('/users/7'); // MatchedRoute | null, no navigation
router.getActiveApps('/users/7'); // ['user']

offGuard();
offChange();
router.destroy();
```

- Guards `push`, `replace` और back/forward से पहले क्रम से चलते हैं। `false` navigation रद्द करता है। Throw करने वाला guard navigation रद्द करता है और एरर log करता है।
- रद्द हुआ back/forward navigation `replaceState` से पिछला URL वापस लगा देता है।
- मौजूदा path पर `push` कुछ नहीं करता।
- `router.match` match होने वाला पहला route लौटाता है; `getActiveApps` हर वह ऐप लौटाता है जिसका route match होता है।

## Base path

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { base: '/app', routes: [{ path: '/reports/*', app: 'reports' }] },
});

interceptLinks({ base: '/app', navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.navigateTo('/reports'); // URL becomes /app/reports
```

`base: '/app'` के साथ:

- राउटर match करने से पहले `/app` हटा देता है, इसलिए routes और `activeWhen` patterns में इसे न लिखें;
- `push('/x')` और `replace('/x')` `/app/x` लिखते हैं;
- `/application` `/application` ही रहता है: base सिर्फ़ segment boundary पर हटता है;
- `interceptLinks` को भी वही `base` चाहिए, वरना वह `/app/x` को `navigateTo` को देता है, और वह `/app/app/x` लिख देता है।

## Hash mode

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({ mode: 'hash', routes: [{ path: '/about', app: 'about' }] });
await router.push('/about'); // URL: /#/about
```

इसे उन static hosts पर इस्तेमाल करें जो हर path को `index.html` पर rewrite नहीं कर सकते। Hash mode में राउटर `base` को नज़रअंदाज़ करता है।

## ऐप में params पढ़ें

Mount context में params नहीं होते। उन्हें path से पढ़ें, या props के रूप में भेजें:

```ts
import { createOrchestrator, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { routes: [{ path: '/users/:id', app: 'user' }] },
});

orchestrator.register({
  name: 'user',
  entry: () => import('./apps/user'),
  container: '#app',
  props: { id: matchPath('/users/:id', location.pathname).params.id },
});

orchestrator.getRouter()?.onChange(({ toRoute }) => {
  if (toRoute?.route.app === 'user') {
    void orchestrator.updateAppProps('user', { id: toRoute.params.id });
  }
});

await orchestrator.start();
```

## बाहरी राउटर

अगर navigation TanStack Router, React Router या किसी दूसरे राउटर के हाथ में है, तो `config.router` छोड़ दें और `orchestrator.connectRouter({ subscribe, getPath })` call करें। [बाहरी राउटर](/hi/guide/external-router) देखें।

## रूटिंग क्या नहीं करती

- यह route components रेंडर नहीं करती। ऐप्स खुद को containers में रेंडर करते हैं।
- यह डेटा लोड नहीं करती। Guard, `onChange` या ऐप का अपना `mount` इस्तेमाल करें।
- जब तक आप `interceptLinks` call नहीं करते, राउटर link clicks नहीं संभालता।
