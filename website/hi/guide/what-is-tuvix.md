# Tuvix.js क्या है?

Tuvix.js ब्राउज़र के लिए एक माइक्रोफ्रंटएंड टूलकिट है। एक होस्ट पेज (shell) माइक्रो ऐप्स register करता है, और Tuvix.js हर ऐप का कोड लोड करता है, उसे एक container में mount करता है, उसे props देता है, और जब URL या आपका कोड कहे तब उसे unmount करता है। हर माइक्रो ऐप React, Vue, Svelte, Angular इस्तेमाल कर सकता है या बिना फ्रेमवर्क के चल सकता है, और हर टीम अपना ऐप अपने शेड्यूल पर build और deploy कर सकती है।

## यह क्या करता है

- **माइक्रो ऐप्स को orchestrate करता है।** `createOrchestrator()` ऐप्स की एक registry रखता है। हर ऐप के लिए यह मौजूदा path से तय करता है कि ऐप mount होना चाहिए या नहीं, और एक समय में एक ही reconcile चलाता है, ताकि एक container साझा करने वाले दो ऐप्स कभी overlap न करें।
- **ज़रूरत पड़ने पर कोड लोड करता है।** किसी ऐप की `entry` एक script URL, scripts और stylesheets की सूची, या `() => import('./dashboard')` जैसा कोई function हो सकती है। loader विफल लोड को दोबारा आज़माता है और धीमे लोड को रद्द कर देता है।
- **URL से रूटिंग करता है।** `activeWhen: '/dashboard/*'` किसी ऐप को `/dashboard` पर और उसके नीचे के हर path पर mount करता है। आप बिल्ट-इन राउटर इस्तेमाल कर सकते हैं, या `connectRouter()` से TanStack Router या React Router को follow कर सकते हैं।
- **फ्रेमवर्क्स को adapt करता है।** `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp` और `createAngularMicroApp` एक root कंपोनेंट को `mount`, `update` और `unmount` वाले module में बदलते हैं।
- **React पेज में islands होस्ट करता है।** `TuvixIsland` सर्वर पर रेंडर हुए React tree के अंदर Vue, Svelte, Angular या React माइक्रो ऐप mount करता है और सर्वर HTML को दो बार भेजे बिना hydrate करता है। देखें [SSR Islands](/hi/guide/ssr-islands)।
- **lifecycle की रिपोर्ट देता है।** adapters और `defineMicroApp` `tuvix:mounted`, `tuvix:unmounted` और `tuvix:error` DOM events dispatch करते हैं, और `whenMounted(name)` तब resolve होता है जब ऐप पेज पर आ जाता है। देखें [Lifecycle Events](/hi/guide/lifecycle-events)।
- **ऐप्स को जोड़ता है।** पेज के सभी ऐप्स `getGlobalBus()` के ज़रिए एक ही event bus साझा करते हैं, तब भी जब हर ऐप `@tuvix.js/event-bus` की अपनी कॉपी bundle करता है।
- **माँगने पर CSS अलग करता है।** `sandbox: true` किसी ऐप को shadow root के अंदर रेंडर करता है, ताकि पेज की CSS और ऐप की CSS अलग रहें।

## इसे कब इस्तेमाल करें

Tuvix.js तब चुनें जब कई टीमें एक पेज के हिस्से ship करती हैं और उन्हें अलग-अलग deploy करना होता है, या जब आप किसी legacy ऐप को दूसरे फ्रेमवर्क में हो रहे rewrite के साथ चलाते रहना चाहते हैं। यह उस अकेली टीम के लिए भी सही है जो सर्वर रेंडरिंग वाली React साइट के अंदर Vue या Svelte widgets चाहती है।

## इसे कब इस्तेमाल न करें

- एक टीम, एक फ्रेमवर्क, एक deploy: ऐसे में सामान्य single-page ऐप ज़्यादा आसान है।
- आपको ऐप्स के बीच सख़्त security isolation चाहिए। Tuvix.js हर ऐप को एक ही JavaScript realm में चलाता है। `@tuvix.js/sandbox` का `JsSandbox` अपने proxy से किए गए global writes छिपाता है, पर यह किसी ऐप को `window` तक पहुँचने से नहीं रोकता। untrusted कोड के लिए `<iframe>` इस्तेमाल करें।
- आप हर ऐप में साझा state वाला एक bundle चाहते हैं। माइक्रो ऐप्स design के तहत events और props से बात करते हैं।

## पैकेज

| पैकेज | इसका उपयोग |
| --- | --- |
| `tuvix.js` | core, router, event bus, loader और sandbox वाला एक इंस्टॉल |
| `@tuvix.js/core` | `createOrchestrator`, `defineMicroApp` |
| `@tuvix.js/router` | `createRouter`, `matchPath`, `interceptLinks` |
| `@tuvix.js/loader` | entry लोड करना और lifecycle runtime (`whenMounted`, `onLifecycle`) |
| `@tuvix.js/event-bus` | `createEventBus`, `getGlobalBus` |
| `@tuvix.js/sandbox` | `CssSandbox`, `JsSandbox` |
| `@tuvix.js/react`, `vue`, `svelte`, `angular` | फ्रेमवर्क adapters, `TuvixIsland` (React) |
| `@tuvix.js/vite` | सर्वर पर रेंडर हुए `<head>` के लिए island stylesheet links |
| `@tuvix.js/server` | HTML fragments का सर्वर-साइड composition |
| `@tuvix.js/module-federation` | webpack Module Federation remotes से लोड होने वाली entries |
| `@tuvix.js/devtools` | पेज के अंदर debug panel |
| `create-tuvix-app` | प्रोजेक्ट scaffolding |

## मुख्य अवधारणाएँ

| शब्द | अर्थ |
| --- | --- |
| Shell | वह होस्ट पेज जो orchestrator बनाता है और layout का मालिक है |
| माइक्रो ऐप | `mount` और `unmount` (और वैकल्पिक `bootstrap`, `update`) वाला module |
| Entry | जहाँ से loader माइक्रो ऐप लेता है: URL, `{ scripts, styles }`, या loader function |
| Container | वह element जिसमें माइक्रो ऐप रेंडर होता है |
| Island | ऐसा माइक्रो ऐप जिसे होस्ट सर्वर पर रेंडर करता है और क्लाइंट उसी जगह hydrate करता है |
| Event bus | एक pub/sub चैनल जिसे पेज का हर ऐप साझा करता है |

## अगले कदम

- [शुरुआत करें](/hi/guide/getting-started) में आप एक shell और दो माइक्रो ऐप्स बनाते हैं।
- [आर्किटेक्चर](/hi/guide/architecture) दिखाता है कि navigation कैसे mount में बदलता है।
- 0.4 से आ रहे हैं? [0.5 पर माइग्रेशन](/hi/guide/migration-0-5) पढ़ें।
