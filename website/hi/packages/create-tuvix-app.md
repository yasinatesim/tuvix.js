---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="CLI scaffolding tool. Instantly bootstrap a Tuvix.js project with your choice of framework and tooling."
  icon="🚀"
  github="create-tuvix-app"
/>

## उपयोग

```bash
npx create-tuvix-app my-app
```

Or with a specific package manager:

```bash
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
```

## टेम्पलेट

| टेम्पलेट | विवरण |
|---------|-------------|
| `shell` | माइक्रोफ्रंटेंड के लिए शेल ऑर्केस्ट्रेटर |
| `react-app` | React माइक्रो ऐप |
| `vue-app` | Vue माइक्रो ऐप |
| `vanilla-app` | Vanilla JS/TS माइक्रो ऐप |

## टेम्पलेट सीधे निर्दिष्ट करें

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-react --template react-app
npx create-tuvix-app my-vue --template vue-app
npx create-tuvix-app my-vanilla --template vanilla-app
```

## उदाहरण

पूर्व-निर्मित उदाहरण एप्लिकेशन `--example` फ्लैग का उपयोग करके स्कैफोल्ड किए जा सकते हैं:

| उदाहरण | विवरण |
|--------|-------------|
| `with-react` | React माइक्रोफ्रंटेंड उदाहरण |
| `with-vue` | Vue माइक्रोफ्रंटेंड उदाहरण |
| `with-svelte` | Svelte माइक्रोफ्रंटेंड उदाहरण |
| `with-angular` | Angular माइक्रोफ्रंटेंड उदाहरण |
| `with-ssr-react` | React के साथ सर्वर-साइड रेंडरिंग |
| `with-react-devtools` | DevTools के साथ React एकीकरण |
| `with-react-event-bus` | Event-Bus एकीकरण उदाहरण |
| `with-react-router` | Router एकीकरण उदाहरण |
| `with-react-sandbox` | Sandbox/CSS अलगाव उदाहरण |
| `with-module-federation-react` | React के साथ Module Federation |
| `with-vanilla` | Vanilla JS माइक्रोफ्रंटेंड उदाहरण |
| `with-ssr-vanilla` | Vanilla JS के साथ सर्वर-साइड रेंडरिंग |
| `with-multiple-frameworks` | एकाधिक फ्रेमवर्क एकीकरण |

## एक उदाहरण स्कैफोल्ड करें

```bash
npx create-tuvix-app my-app --example with-react
npx create-tuvix-app my-app --example with-vue
npx create-tuvix-app my-app --example with-multiple-frameworks
```
