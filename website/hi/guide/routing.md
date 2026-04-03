# रूटिंग

`@tuvix.js/router` URL-आधारित माइक्रो ऐप सक्रियण प्रदान करता है। जब URL किसी रूट से मेल खाता है, तो संबंधित माइक्रो ऐप माउंट होती है। जब URL बदलता है, तो ऐप अनमाउंट होती है।

## सेटअप

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  mode: 'history', // या 'hash'
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

orchestrator.start();
```

## रूट मैचिंग

रूट्स क्रम में मैच किए जाते हैं। पहला मैच जीतता है।

| पैटर्न | मैच करता है | पैरामीटर |
|--------|------------|----------|
| `/` | `/` | - |
| `/dashboard` | `/dashboard` | - |
| `/users/:id` | `/users/42` | `{ id: '42' }` |
| `/files/*` | `/files/a/b/c` | `{ '*': 'a/b/c' }` |

रूट पैरामीटर `props.params` के रूप में माइक्रो ऐप को पास किए जाते हैं:

```ts
// आपकी माइक्रो ऐप में
async mount(container, props) {
  const { id } = (props?.params ?? {}) as { id: string };
  // id से उपयोगकर्ता प्राप्त करें
}
```

## नेविगेशन गार्ड्स

गार्ड फ़ंक्शंस से रूट्स की रक्षा करें:

```ts
routes: [
  {
    path: '/admin',
    app: 'admin',
    guard: async () => {
      const user = await getUser();
      if (!user.isAdmin) {
        router.navigate('/login');
        return false; // नेविगेशन ब्लॉक करें
      }
      return true;
    },
  },
],
```

## प्रोग्रामेटिक नेविगेशन

```ts
// पथ पर नेविगेट करें
router.navigate('/dashboard');

// क्वेरी पैरामीटर के साथ नेविगेट करें
router.navigate('/search?q=tuvix');

// वर्तमान इतिहास प्रविष्टि बदलें (बैक बटन नहीं)
router.replace('/dashboard');

// पीछे / आगे जाएं
router.go(-1);
```

## हैश मोड

सर्वर-साइड URL रीराइटिंग के बिना वातावरण के लिए हैश मोड का उपयोग करें (जैसे SPA फ़ॉलबैक के बिना स्टैटिक होस्टिंग):

```ts
const router = createRouter({
  orchestrator,
  mode: 'hash',
  routes: [
    { path: '/', app: 'home' },
    { path: '/about', app: 'about' },
  ],
});
// URLs: /#/, /#/about
```

## सक्रिय रूट

```ts
const currentRoute = router.currentRoute;
// { path: '/dashboard', app: 'dashboard', params: {} }

router.onRouteChange((route) => {
  console.log('Navigated to:', route.path);
});
```
