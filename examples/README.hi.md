<p align="center">
  <img src="../website/public/logo.svg" alt="Tuvix.js Logo" width="80" height="80" />
</p>

# Tuvix.js उदाहरण

चलाने लायक प्रोजेक्ट्स, हर फ़ीचर या फ्रेमवर्क के लिए एक। हर उदाहरण के `e2e/` फ़ोल्डर में एक Playwright spec है जो CI में चलती है।

## क्विक स्टार्ट

कोई भी उदाहरण `create-tuvix-app` CLI से शुरू करें:

```bash
npx create-tuvix-app@latest --example <example-name> my-app
cd my-app
npm install && npm run dev
```

इस repository के clone में root पर `pnpm install` चलाएं, फिर उदाहरण के फ़ोल्डर में `pnpm dev` (server वाले उदाहरणों के लिए `pnpm start`) चलाएं।

## उपलब्ध उदाहरण

| उदाहरण | फ्रेमवर्क | क्या दिखाता है |
|---------|-----------|---------------|
| [`with-vanilla`](./with-vanilla/) | Plain JS | बिना फ्रेमवर्क के `defineMicroApp`, रूटिंग और `interceptLinks` |
| [`with-react`](./with-react/) | React 18 | `@tuvix.js/react` के ज़रिए shell, routes, props |
| [`with-react-event-bus`](./with-react-event-bus/) | React 18 | `getGlobalBus()` पर events publish और receive करते ऐप्स |
| [`with-react-router`](./with-react-router/) | React 18 | Route से ऐप की mapping और क्लाइंट-साइड link navigation |
| [`with-react-sandbox`](./with-react-sandbox/) | React 18 | `sandbox: true` से shadow-root CSS isolation, तुलना के लिए एक बिना sandbox वाला ऐप |
| [`with-react-devtools`](./with-react-devtools/) | React 18 | `@tuvix.js/devtools` का पेज के अंदर debug panel |
| [`with-module-federation-react`](./with-module-federation-react/) | React (webpack 5) | `createFederatedEntry` से load होने वाले remote ऐप्स |
| [`with-ssr-vanilla`](./with-ssr-vanilla/) | Express | `composeHTML` से सर्वर-साइड fragment composition |
| [`with-ssr-react`](./with-ssr-react/) | React (Express) | `composeHTML` से जोड़े गए React `renderToString` fragments |
| [`with-ssr-islands`](./with-ssr-islands/) | React 19 shell, Vue 3, Svelte 5, Angular 20 (Express + Vite) | सर्वर पर रेंडर हुए islands जो क्लाइंट पर hydrate होते हैं, एक inline `TuvixReactApp`, और एक fail होने वाला island जो पेज को तोड़े बिना fallback पर चला जाता है |
| [`with-vue`](./with-vue/) | Vue 3 | `defineProps` से props के साथ `createVueMicroApp` |
| [`with-svelte`](./with-svelte/) | Svelte 4 | `export let` props के साथ `createSvelteMicroApp` |
| [`with-angular`](./with-angular/) | Angular 16 | Standalone कंपोनेंट, zoneless, `createAngularMicroApp` |
| [`with-multiple-frameworks`](./with-multiple-frameworks/) | React और Vue 3 | एक पेज पर दो फ्रेमवर्क, जो event bus साझा करते हैं |

## अनुवाद

जिन उदाहरणों में `README.md` है, वे उसे तुर्की, स्पेनिश, जर्मन, फ़्रेंच, जापानी, चीनी, इतालवी, पुर्तगाली और हिंदी में भी देते हैं। दोनों में अंतर हो तो अंग्रेज़ी README को सही मानें।
