# बाहरी राउटर

अगर आपके shell में navigation पहले से TanStack Router, React Router या किसी दूसरे राउटर के पास है, तो यह काम उसी के पास रहने दें। `orchestrator.connectRouter()` orchestrator को उस राउटर के पीछे चलाता है, और `interceptLinks()` माइक्रो ऐप्स के सादे `<a href>` clicks को उसी राउटर तक भेजता है।

## इसे कब इस्तेमाल करें

- आपका shell अपने राउटर वाला React ऐप है, और कुछ routes माइक्रो ऐप्स होस्ट करते हैं।
- आपके माइक्रो ऐप्स सादे links रेंडर करते हैं (Vue, Svelte, Angular या HTML templates), और इन links को page load के बिना navigate करना चाहिए।

अगर shell का अपना कोई राउटर नहीं है, तो built-in राउटर इस्तेमाल करें; [रूटिंग](/hi/guide/routing) देखें।

## connectRouter

```ts
import { createOrchestrator, type RouterSource } from 'tuvix.js';

const source: RouterSource = {
  // Call `callback` after every navigation; return an unsubscribe function.
  subscribe(callback) {
    window.addEventListener('popstate', callback);
    return () => window.removeEventListener('popstate', callback);
  },
  // The path activeWhen patterns are matched against.
  getPath: () => window.location.pathname,
};

const orchestrator = createOrchestrator(); // no `router` option
const disconnect = orchestrator.connectRouter(source);
await orchestrator.start();

// later
disconnect();
```

- `start()` `getPath()` के हिसाब से reconcile करता है। उसके बाद हर `subscribe` callback नए `getPath()` के लिए एक reconcile queue में डालता है।
- पहले से start हो चुके orchestrator को connect करने पर reconcile तुरंत होता है।
- Reconciles एक-एक करके चलते हैं, और अगली बारी सिर्फ़ सबसे नए queued path की आती है। इसलिए router events की बौछार में भी हर स्थिर path पर एक ही reconcile होता है।
- `destroy()` हर connected राउटर को disconnect करता है।

## TanStack Router

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // your createRouter({ routeTree }) instance

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'blog',
  entry: () => import('./micro-apps/blog'),
  container: '#micro-app',
  activeWhen: '/blog/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe('onResolved', callback),
  getPath: () => router.state.location.pathname,
});

// Plain <a href> inside micro apps → TanStack history.
interceptLinks({ navigate: (path) => router.history.push(path) });

await orchestrator.start();
```

राउटर नई location resolve कर लेता है, तब `onResolved` fire होता है। `onLoad` और `setTimeout` की जोड़ी की जगह इसे इस्तेमाल करें।

## React Router

`createBrowserRouter` से बने data router के साथ:

```ts
import { createOrchestrator, interceptLinks } from 'tuvix.js';
import { router } from './router'; // createBrowserRouter(routes)

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'account',
  entry: () => import('./micro-apps/account'),
  container: '#micro-app',
  activeWhen: '/account/*',
});

orchestrator.connectRouter({
  subscribe: (callback) => router.subscribe(() => callback()),
  getPath: () => router.state.location.pathname,
});

interceptLinks({ navigate: (path) => router.navigate(path) });

await orchestrator.start();
```

`<BrowserRouter>` में subscribe करने के लिए कोई router object नहीं होता। `useLocation()` पढ़ने वाले कंपोनेंट से इसे जोड़ें:

```tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { Orchestrator, RouterSource } from 'tuvix.js';

export function TuvixBridge({ orchestrator }: { orchestrator: Orchestrator }) {
  const location = useLocation();
  const listeners = useRef(new Set<() => void>());
  const path = useRef<string>(location.pathname);
  path.current = location.pathname;

  useEffect(() => {
    const source: RouterSource = {
      subscribe(callback) {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
      },
      getPath: () => path.current,
    };
    return orchestrator.connectRouter(source);
  }, [orchestrator]);

  useEffect(() => {
    for (const callback of listeners.current) callback();
  }, [location.pathname]);

  return null;
}
```

## माइक्रो ऐप्स के अंदर सादे links

आपके राउटर के अपने `<Link>` कंपोनेंट पहले से client-side navigate करते हैं। माइक्रो ऐप्स जो links सादे `<a href>` के रूप में रेंडर करते हैं, वे ऐसा नहीं करते; `interceptLinks` के बिना वे page reload करते हैं। `interceptLinks` modifier वाले clicks, दूसरे origins, `target="_blank"`, `download`, `rel="external"`, `data-tuvix-reload` और मौजूदा path पर सिर्फ़ hash वाले links छोड़ देता है, और बाकी के लिए आपका `navigate` call करता है। Hover या focus पर अगला route पहले से तैयार करने के लिए `prefetch` जोड़ें। TanStack Router के साथ:

```ts
import { interceptLinks } from 'tuvix.js';
import { router } from './router';

const stop = interceptLinks({
  navigate: (path) => router.history.push(path),
  prefetch: (path) => void router.preloadRoute({ to: path }),
});
```

Shell unmount हो, तब `stop()` call करें।

## Base paths

`/app` जैसे router basename के साथ:

- `activeWhen` patterns ठीक उसी string से match होते हैं जो `getPath()` लौटाता है। अगर आपका राउटर paths को `/app` के साथ देता है, तो `'/app/blog/*'` लिखें, या `getPath` में base हटा दें।
- `interceptLinks({ base: '/app', ... })` `/app` के बाहर के links को नज़रअंदाज़ करता है और `navigate` call करने से पहले `/app` हटा देता है। इसे तब इस्तेमाल करें जब आपके राउटर का `navigate` basename के सापेक्ष paths लेता हो (React Router का `router.navigate`)। जब `navigate` पूरा URL path लेता हो (TanStack का `router.history.push`), तो `base` न दें।

## Routes से रेंडर होने वाले containers {#containers-rendered-by-routes}

Orchestrator mount करते समय `container` खोजता है। अगर container element कोई route component रेंडर करता है, तो हो सकता है कि router callback fire होने तक वह DOM में न आया हो, और mount `Container "#micro-app" not found in DOM` के साथ fail हो जाए। इससे निकलने के दो रास्ते हैं:

- Container को ऐसे layout में रखें जो हर micro-app route में साझा हो, ताकि वह navigation से पहले मौजूद रहे।
- माइक्रो ऐप को route component से ही `TuvixIsland` (`@tuvix.js/react`) के साथ रेंडर करें, और उस ऐप के लिए orchestrator छोड़ दें।

## connectRouter क्या नहीं करता

- यह navigate नहीं करता। Navigation आपके राउटर के पास रहता है।
- यह route params नहीं पढ़ता। उन्हें `updateAppProps` से props के रूप में भेजें, या ऐप के अंदर पढ़ें।
- यह link clicks नहीं संभालता। उसके लिए `interceptLinks` call करें।
