# लाइफसाइकल हुक्स

## अवलोकन

Tuvix.js में प्रत्येक माइक्रो ऐप एक पूर्वानुमानित लाइफसाइकल का पालन करता है। Orchestrator उचित समय पर लाइफसाइकल हुक्स को कॉल करता है।

```
register()  →  mount()  →  update()  →  unmount()
```

## mount

जब माइक्रो ऐप का रूट सक्रिय होता है (या मैन्युअल रूप से सक्रिय किया जाता है) तब कॉल किया जाता है।

```ts
async mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

**पैरामीटर:**

- `container` - रेंडर करने के लिए रूट DOM एलिमेंट
- `props` - शेल से वैकल्पिक कुंजी-मान props

**उदाहरण:**

```ts
async mount(container, props) {
  // अपनी ऐप सेटअप करें
  const root = document.createElement('div');
  container.appendChild(root);

  // अपने फ्रेमवर्क को root में रेंडर करें
  this._root = createRoot(root);
  this._root.render(<App {...props} />);
}
```

## unmount

जब माइक्रो ऐप के रूट से दूर नेविगेट किया जाता है (या मैन्युअल रूप से निष्क्रिय किया जाता है) तब कॉल किया जाता है।

```ts
async unmount(container: HTMLElement): Promise<void>
```

यहां आपको **सफाई** करनी होगी - इवेंट की सदस्यता रद्द करें, फ्रेमवर्क इंस्टेंस नष्ट करें, DOM नोड्स हटाएं।

**उदाहरण:**

```ts
async unmount(container) {
  this._root?.unmount();
  container.innerHTML = '';
}
```

::: warning
`unmount` में हमेशा सफाई करें। फ्रेमवर्क इंस्टेंस को नष्ट न करने से होने वाले मेमोरी लीक माइक्रोफ्रंटएंड एप्लिकेशन में सबसे आम बग है।
:::

## update

जब शेल पहले से माउंटेड माइक्रो ऐप को नए props पास करता है तब कॉल किया जाता है। **वैकल्पिक।**

```ts
async update(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

यदि लागू नहीं किया गया है, तो orchestrator props अपडेट के लिए `unmount` → `mount` को कॉल करेगा।

**उदाहरण:**

```ts
async update(container, props) {
  // पूर्ण रीमाउंट के बिना कुशलता से अपडेट करें
  this._root?.render(<App {...props} />);
}
```

## Orchestrator-स्तर के हुक्स

शेल लाइफसाइकल इवेंट्स को ग्लोबली भी सुन सकता है:

```ts
const orchestrator = createOrchestrator({
  container: '#app',

  onBeforeMount(app) {
    console.log(`Mounting: ${app.name}`);
  },

  onAfterMount(app) {
    console.log(`Mounted: ${app.name}`);
    analytics.track('micro_app_mounted', { app: app.name });
  },

  onError(error, app) {
    console.error(`Error in ${app.name}:`, error);
    // फ़ॉलबैक UI दिखाएं
    app.container.innerHTML = '<p>Failed to load. Please refresh.</p>';
  },
});
```
