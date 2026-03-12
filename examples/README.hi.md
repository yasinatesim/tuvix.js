<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Tuvix.js उदाहरण

यह निर्देशिका स्वतंत्र, पूर्ण रूप से कार्यशील परियोजना उदाहरण शामिल करती है जो **Tuvix.js** ऑर्केस्ट्रेटर की विभिन्न सुविधाओं और फ्रेमवर्क एकीकरण को प्रदर्शित करती हैं।

## त्वरित शुरुआत

`create-tuvix-app` CLI को `--example` फ्लैग के साथ उपयोग करना किसी भी उदाहरण शुरू करने का सबसे आसान तरीका है:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

*(आप इस रिपॉजिटरी को क्लोन कर सकते हैं और किसी भी उदाहरण फ़ोल्डर के अंदर `npm install` और `npm run dev` को मैनुअली चला सकते हैं)।*

## उपलब्ध उदाहरण

| उदाहरण का नाम | फ्रेमवर्क | प्रदर्शित मुख्य सुविधा |
|--------------|-----------|--------------------------|
| [`with-react`](./with-react/) | React 18 | Basic Shell, Routing, and Prop passing via `@tuvix.js/react` |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | Cross-app pub/sub communication using `@tuvix.js/event-bus` |
| [`with-react-router`](./with-react-router/) | React 18 | URL-based active routing using `@tuvix.js/router` |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | Strict Shadow DOM CSS isolation via `@tuvix.js/sandbox` |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | In-page orchestrator debugging via `@tuvix.js/devtools` |
| [`with-module-federation-react`](./with-module-federation-react/) | React (Webpack 5) | Dynamic remote module loading via `@tuvix.js/module-federation` |
| [`with-ssr-react`](./with-ssr-react/) | React (Express) | Asynchronous SSR HTML fragment composition via `@tuvix.js/server` |
| [`with-vue`](./with-vue/) | Vue 3 | Vue 3 composition API integration via `@tuvix.js/vue` |
| [`with-svelte`](./with-svelte/) | Svelte 4 | Svelte integration and Context API props via `@tuvix.js/svelte` |
| [`with-angular`](./with-angular/) | Angular 15+ | Angular CLI setup and `@Input()` injection via `@tuvix.js/angular` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React & Vue 3 | Polyglot architecture (sharing a single shell across frameworks) |

## बहुभाषी समर्थन
प्रत्येक उदाहरण **10 भाषाओं** (अंग्रेजी, तुर्की, स्पेनिश, जर्मन, फ्रेंच, जापानी, चीनी, इतालवी, पुर्तगाली और हिंदी) में दस्तावेज़ प्रदान करता है। स्थानीयकृत README फ़ाइलें देखने के लिए किसी भी उदाहरण की निर्देशिका खोलें।
