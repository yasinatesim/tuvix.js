# Lifecycle Hooks

orchestrator हर register किए गए ऐप को hooks और statuses के एक तय क्रम से गुज़ारता है। इस पेज में वे hooks हैं जिन्हें आपका module implement करता है, वे statuses जिन्हें shell पढ़ सकता है, और यह कि एरर और तेज़ navigation पर क्या होता है। बाहर से यह जानने के लिए कि ऐप पेज पर कब आया, [Lifecycle Events](/hi/guide/lifecycle-events) इस्तेमाल करें।

## Hook का क्रम

```text
register()
  └─ first activation: load entry → bootstrap() → mount()
       ├─ updateAppProps() while mounted → update()
       └─ deactivation → unmount()
  └─ next activation: mount()   (module cached, no bootstrap)
```

orchestrator हर hook को await करता है। यह कभी ऐसे ऐप पर `mount` call नहीं करता जो अभी mount हो रहा है, और `mount` चलते समय कभी `unmount` call नहीं करता: unmount, mount के settle होने का इंतज़ार करता है।

## bootstrap

हर लोड हुए module के लिए एक बार चलता है, entry लोड होने के बाद और पहले `mount` से पहले। इसे उस काम के लिए इस्तेमाल करें जो remounts के बाद भी बना रहना चाहिए, जैसे कॉन्फ़िगरेशन पढ़ना।

```ts
import { defineMicroApp } from '@tuvix.js/core';

let config: { apiUrl: string } | undefined;

export default defineMicroApp({
  name: 'reports',
  async bootstrap() {
    const response = await fetch('/reports/config.json');
    config = (await response.json()) as { apiUrl: string };
  },
  mount({ container }) {
    container.textContent = `API: ${config?.apiUrl ?? 'unknown'}`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

अगर `bootstrap` throw करता है, तो ऐप `error` status में चला जाता है और mount विफल होता है। अगला mount प्रयास `bootstrap` को फिर से call करता है। एक सफल run के बाद remounts इसे छोड़ देते हैं।

## mount

हर बार चलता है जब ऐप सक्रिय होता है, या जब आप `mountApp(name)` call करते हैं। context में ये होते हैं:

| Field | मान |
| --- | --- |
| `container` | वह element जिसमें रेंडर करना है। `sandbox: true` वाले ऐप्स के लिए shadow root के अंदर का एक element। |
| `props` | register किए गए props, हर `updateAppProps` call के साथ merge किए हुए। |
| `name` | register किया गया ऐप का नाम। |
| `bus` | orchestrator का event bus। |

`mountApp(name)` `mount` के settle होने के बाद resolve होता है और load या mount एरर के साथ reject होता है।

## update

तब चलता है जब ऐप mount रहते हुए shell `updateAppProps(name, props)` call करता है:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('reports', { range: '7d' });
```

context में merge हुए `props` और `container` होते हैं। अगर `update` नहीं है या ऐप mount नहीं है, तो orchestrator props रख लेता है और उन्हें अगले `mount` को देता है। props बदलने की वजह से यह कभी किसी ऐप को remount नहीं करता।

`updateAppProps` पहले pending mount का इंतज़ार करता है, ताकि update नए instance तक पहुँचे। update के दौरान आया `unmount` update का इंतज़ार करता है।

## unmount

तब चलता है जब ऐप निष्क्रिय होता है, और `unmountApp(name)`, `unregister(name)` व `destroy()` पर भी। वह सब हटाएँ जो `mount` ने बनाया: फ्रेमवर्क roots, listeners, timers, bus subscriptions।

`unmount` के बाद orchestrator ऐप की entry stylesheets को `document.head` से हटा देता है। अगला mount उन्हें वापस जोड़ता है और उनके लोड होने का इंतज़ार करता है।

## ऐप status

```ts
import { createOrchestrator, type AppStatus } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
const status: AppStatus | null = orchestrator.getAppStatus('reports');
// 'registered' | 'bootstrapping' | 'bootstrapped' | 'mounting' | 'mounted'
// | 'updating' | 'unmounting' | 'unmounted' | 'error' | null (not registered)
```

| Method | लौटाता है |
| --- | --- |
| `getAppStatus(name)` | status, या अनजान नाम के लिए `null`। |
| `getMountedApps()` | `mounted` status वाले नाम। |
| `getRegisteredApps()` | register किया गया हर नाम। |

## एरर और fallback

जब load, `bootstrap` या `mount` विफल होता है, तो orchestrator:

1. अगर आपने ऐप का `fallback` HTML सेट किया है, तो उसे ऐप के container में लिखता है;
2. status `error` सेट करता है;
3. bus पर `{ name, error, phase }` के साथ `OrchestratorEvent.APP_ERROR` (`tuvix:app:error`) emit करता है;
4. `onError(error, name)` call करता है;
5. `mountApp` को reject करता है। route बदलने के दौरान विफल हुआ mount इसके बजाय `console.error` से log होता है, और बाकी ऐप्स फिर भी mount होते हैं।

विफल `update` या `unmount` steps 2 से 4 चलाता है और `updateAppProps` या `unmountApp` को reject करता है; यह कोई fallback HTML नहीं लिखता। `phase` का मान `'load'` (जिसमें container resolve करना भी शामिल है), `'bootstrap'`, `'mount'`, `'update'` या `'unmount'` होता है।

```ts
import { createOrchestrator, OrchestratorEvent, type AppErrorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.getEventBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, phase, error }) => {
  console.error(`${name} failed during ${phase}`, error);
});
```

`error` status वाले ऐप को सक्रिय करने वाला अगला route बदलाव उसे फिर से mount करने की कोशिश करता है।

## तेज़ navigation

route बदलाव एक-एक करके reconcile होते हैं। सक्रिय ऐप्स के mount होने से पहले निष्क्रिय ऐप्स unmount होते हैं। जब paths ऐप्स के mount होने से तेज़ आते हैं:

- केवल सबसे नया queued path आगे चलता है;
- जो ऐप अपनी entry लोड होते समय निष्क्रिय हो जाता है, वह अपना mount छोड़ देता है;
- जो ऐप `mount` चलते समय निष्क्रिय हो जाता है, वह `mount` के settle होते ही unmount हो जाता है।

इसलिए A → B → A पर जल्दी-जल्दी जाने के अंत में केवल A mount रहता है, और कोई भी ऐप ऐसे container में रेंडर नहीं करता जिसे दूसरा ऐप अभी भी पकड़े हुए है।

## Shell-level hooks

```ts
import { createOrchestrator, OrchestratorEvent } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  onError: (error, name) => console.error(`[${name}]`, error),
  onStatusChange: (name, status) => console.debug(`[${name}] ${status}`),
});

const bus = orchestrator.getEventBus();
bus.on<{ name: string }>(OrchestratorEvent.APP_MOUNT, ({ name }) => {
  console.log('mounted', name);
});
bus.on<{ name: string }>(OrchestratorEvent.APP_UNMOUNT, ({ name }) => {
  console.log('unmounted', name);
});
bus.on<{ to: string }>(OrchestratorEvent.ROUTE_CHANGE, ({ to }) => {
  console.log('route', to);
});
```

| Event | Payload | कब emit होता है |
| --- | --- | --- |
| `tuvix:app:registered` | `{ name }` | `register()` |
| `tuvix:app:bootstrap` | `{ name }` | `bootstrap` के बाद |
| `tuvix:app:mount` | `{ name }` | `mount` के बाद |
| `tuvix:app:unmount` | `{ name }` | `unmount` के बाद |
| `tuvix:app:error` | `{ name, error, phase }` | load, bootstrap, mount, update या unmount विफल हुआ |
| `tuvix:app:status-change` | `{ name, status }` | हर status बदलाव |
| `tuvix:route:change` | `{ from, to, fromRoute, toRoute }` | केवल बिल्ट-इन राउटर navigation |
| `tuvix:started` | `{}` | `start()` के अंत में |
| `tuvix:destroyed` | `{}` | `destroy()` के अंत में |

ये bus events orchestrator से आते हैं। [Lifecycle Events](/hi/guide/lifecycle-events) वाले `tuvix:mounted` DOM events adapters और `defineMicroApp` से आते हैं, और orchestrator के बिना mount हुए islands के लिए भी fire होते हैं।

## Teardown

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.destroy();
```

`destroy()` चल रहे reconcile का इंतज़ार करता है, हर ऐप को unmount करता है, राउटर, `connectRouter` subscriptions, prefetching और viewport observer को रोकता है, और loader cache साफ़ करता है। यह private event bus को नष्ट करता है और global bus को चलता रहने देता है। इसे दो बार call करना सुरक्षित है। इसके बाद `register`, `start`, `mountApp`, `unmountApp`, `unregister`, `reconcile` और `connectRouter` एरर throw करते हैं; इसके बजाय नया orchestrator बनाएँ।
