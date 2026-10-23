---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="CLI जो Tuvix.js shell या React, Vue, Svelte, Angular या vanilla माइक्रो ऐप के लिए Vite प्रोजेक्ट scaffold करता है, फिर उसकी डिपेंडेंसी इंस्टॉल करता है।"
  icon="🚀"
  npm="true"
  github="cli"
/>

## इस्तेमाल

पैकेज का नाम `create-` से शुरू होता है, इसलिए हर पैकेज मैनेजर का `create` command इसे ढूँढ लेता है, और `npx` इसकी `create-tuvix-app` binary चलाता है:

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app
```

`npm create` flags को सिर्फ़ `--` के बाद आगे भेजता है। बाकी commands उन्हें सीधे पास करते हैं:

```bash
npm create tuvix-app@latest my-app -- --template react-app --typescript
pnpm create tuvix-app my-app --template react-app --typescript
```

Binary को Node.js चाहिए। यह current directory के अंदर एक नए folder में लिखती है।

## इसे कब इस्तेमाल करें

Tuvix.js का कोई एक हिस्सा शून्य से शुरू करने के लिए इसे इस्तेमाल करें: माइक्रो ऐप्स register करने वाला shell, या किसी फ्रेमवर्क में एक माइक्रो ऐप। हर run एक Vite प्रोजेक्ट बनाता है, जिसमें `tuvix.js` और उससे मेल खाता `@tuvix.js/*` adapter `^0.5.0` पर होता है।

अगर आप Tuvix.js को पहले से मौजूद ऐप में जोड़ रहे हैं, तो कोई और तरीका चुनें। अपने पैकेज मैनेजर से adapter इंस्टॉल करें और [गाइड](/hi/guide/getting-started) follow करें। पढ़ने या copy करने के लिए काम करता हुआ multi-app setup चाहिए, तो `--example` इस्तेमाल करें ([उदाहरण](#examples) देखें)।

## क्विक स्टार्ट

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

CLI छह फ़ाइलें लिखता है, `checkout/` में `pnpm install` चलाता है और अगले steps print करता है:

```text
checkout/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    └── main.tsx
```

`src/main.tsx` वह माइक्रो ऐप module export करता है जिसे shell load करता है:

```tsx [src/main.tsx]
import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export default createReactMicroApp({
  name: 'my-react-app',
  App,
});
```

`my-react-app` को उस नाम में बदलें जो आपका shell register करता है। CLI वहाँ आपके प्रोजेक्ट का नाम नहीं डालता।

## विकल्प

```text
create-tuvix-app [project-name] [options]
```

| विकल्प | टाइप | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- | --- |
| `project-name` | positional | prompt | Folder का नाम और `package.json` का नाम। पहला argument जो `-` से शुरू नहीं होता, इसे set करता है। बाद वाला argument इसे बदल देता है। |
| `--template`, `-t` | `string` | prompt | `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app` में से एक। |
| `--typescript` | flag | prompt (`Yes` पहले से चुना हुआ) | TypeScript फ़ाइलें और एक `tsconfig.json` बनाता है। |
| `--no-typescript` | flag | prompt | JavaScript फ़ाइलें बनाता है। `angular-app` इसे अनदेखा करता है। |
| `--example`, `-e` | `string` | कोई नहीं | template की जगह GitHub repository के `examples/` से एक folder download करता है। prompts और install step छोड़ देता है। |
| `--help`, `-h` | flag | `false` | Usage print करके exit करता है। |
| `--version`, `-v` | flag | `false` | `create-tuvix-app v<version>` print करके exit करता है। CLI version अपने ख़ुद के `package.json` से पढ़ता है। |

जो value आप नहीं देते, उसके लिए CLI interactive prompt से पूछता है, इस क्रम में: प्रोजेक्ट का नाम (placeholder `my-app`, खाली input अस्वीकार), template, फिर TypeScript। बिना prompts के चलाने के लिए तीनों पास करें:

```bash
npx create-tuvix-app admin --template angular-app --typescript
```

CLI अनजान flags को अनदेखा करता है।

## Templates

हर template `index.html`, `package.json` और `src/main.<ext>` लिखता है। बना हुआ `package.json` `private` है, उसमें `"type": "module"`, version `0.1.0` और तीन scripts हैं: `dev` (`vite`), `build` (`vite build`) और `preview` (`vite preview`)। TypeScript mode में `svelte-app` चौथी script, `check`, जोड़ता है। हर `package.json` में `tuvix.js@^0.5.0` और `vite@^6.0.0` होते हैं, और TypeScript mode में `typescript@^5.7.0` भी।

| Template | `index.html` और `package.json` के अलावा फ़ाइलें | अतिरिक्त डिपेंडेंसी |
| --- | --- | --- |
| `shell` | `src/main.ts` | कोई नहीं |
| `react-app` | `src/main.tsx`, `src/App.tsx`, `vite.config.ts` | `react`, `react-dom` `^19.0.0`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3.0`; TS mode में `@types/react`, `@types/react-dom` |
| `vue-app` | `src/main.ts`, `src/App.vue`, `vite.config.ts`; TS mode में `src/vite-env.d.ts` | `vue@^3.5.0`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2.0` |
| `svelte-app` | `src/main.ts`, `src/App.svelte`, `vite.config.ts`, `svelte.config.js`; TS mode में `src/vite-env.d.ts` | `svelte@^5.0.0`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5.0.0`; TS mode में `svelte-check@^4.0.0` |
| `angular-app` | `src/main.ts`, `src/app/app.component.ts`, `vite.config.ts` | `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/platform-browser` `^20.0.0`, `rxjs@^7.8.0`, `tslib@^2.6.0`, `@tuvix.js/angular`, `typescript@~5.8.0` |
| `vanilla-app` | `src/main.ts` | कोई नहीं |

TypeScript mode `tsconfig.json` जोड़ता है (`ES2020`, `ESNext` modules, `bundler` resolution, `strict`)। `react-app`, `vue-app` और `svelte-app` के लिए यह `src` के साथ `vite.config.ts` को भी include करता है। JavaScript mode `.js` और `.jsx` इस्तेमाल करता है और कोई `tsconfig.json` नहीं लिखता। `vite.config.ts` TypeScript में ही रहता है, जिसे Vite दोनों तरह load करता है। सभी `@tuvix.js/*` पैकेज को `^0.5.0` मिलता है।

### `shell`

History राउटर वाला एक orchestrator। `index.html` में एक `#header`, `/dashboard` और `/settings` के links वाला एक `<nav>`, और एक `<main id="main">` है। `src/main.ts`:

```ts [src/main.ts]
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
  onError(error, appName) {
    console.error(`App "${appName}" failed:`, error);
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

orchestrator.start();
```

`entry` URL को अपने dashboard ऐप की built entry से बदलें और `settings` को ख़ुद register करें। Template सिर्फ़ `dashboard` को register करता है।

### `react-app`

`@tuvix.js/react` से `createReactMicroApp({ name: 'my-react-app', App })`। `App` एक heading और उसे मिले props को JSON के रूप में render करता है। `vite.config.ts` `@vitejs/plugin-react` जोड़ता है, जो JSX को automatic runtime के साथ compile करता है, इसलिए JavaScript mode में `App.jsx` को `React` import की ज़रूरत नहीं होती। TS `tsconfig.json` `"jsx": "react-jsx"` set करता है।

### `vue-app`

`@tuvix.js/vue` से `createVueMicroApp({ name: 'my-vue-app', App })`, और `vite.config.ts` `@vitejs/plugin-vue` जोड़ता है। `App.vue` एक `<script setup>` कंपोनेंट है जो shell के props को `inject` से पढ़ता है:

```vue [src/App.vue]
<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>Vue Micro App</h1>
    <p>This is a Tuvix.js micro frontend.</p>
    <pre>{{ JSON.stringify(props, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

// The props the shell passes to mount() and update(), kept reactive.
const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
</script>
```

TS mode में `src/vite-env.d.ts` `vite/client` को reference करता है और `*.vue` modules declare करता है, ताकि `tsc` `App` import को स्वीकार करे।

### `svelte-app`

एक Svelte 5 माइक्रो ऐप। `src/main.ts` `svelte/reactivity` से `SvelteMap` पास करता है, ताकि `update({ props })` remount करने की जगह उसी जगह फिर से render करे:

```ts [src/main.ts]
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({
  name: 'my-svelte-app',
  App,
  SvelteMap,
});
```

`App.svelte` अपना `name` prop `$props()` से पढ़ता है। `vite.config.ts` Svelte plugin जोड़ता है, और `svelte.config.js` `preprocess: vitePreprocess()` set करता है ताकि `<script lang="ts">` compile हो। TS mode में `src/vite-env.d.ts` `svelte` और `vite/client` types को reference करता है, और `package.json` को एक `check` script (`svelte-check --tsconfig ./tsconfig.json`) मिलती है।

### `angular-app`

zone.js के बिना Angular 20। Template हमेशा TypeScript इस्तेमाल करता है, `--no-typescript` के साथ भी, और अगर आपने prompt में JavaScript चुना तो यह `Angular requires TypeScript. Switching to TypeScript automatically.` print करता है।

```ts [src/main.ts]
// Load the JIT compiler before any Angular package that ships partially
// compiled code (@angular/common, forms, router) is evaluated.
import '@angular/compiler';
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app/app.component';

export default createSsrAngularMicroApp({
  name: 'my-angular-app',
  component: AppComponent,
});
```

`AppComponent` inline template वाला एक standalone कंपोनेंट है। `createSsrAngularMicroApp` इसे खाली container में नए सिरे से render करता है, और जब container में `renderAngularToString` से आया HTML होता है तो उस markup के ऊपर render करता है। Adapter zoneless चलता है। Vite Angular को AOT-compile नहीं करता, इसलिए कंपोनेंट ब्राउज़र में compile होते हैं: `import '@angular/compiler'` को `src/main.ts` की पहली line रखें, और compiler को runtime डिपेंडेंसी के रूप में रखें। `tsconfig.json` `ES2022` को target करता है, `experimentalDecorators` चालू और `useDefineForClassFields` बंद रखता है, और `vite.config.ts` esbuild target को `es2022` पर set करता है।

### `vanilla-app`

`tuvix.js` से `defineMicroApp`, जिसमें `mount` एक heading को `container.innerHTML` में लिखता है और `unmount` उसे साफ़ करता है।

## उदाहरण {#examples}

`--example <name>` `https://codeload.github.com/yasinatesim/tuvix.js/tar.gz/master` download करता है और `examples/<name>/` को आपके प्रोजेक्ट folder में extract करता है। Prompts, `--template`, `--typescript` और install step छोड़ दिए जाते हैं। CLI अगले steps के रूप में `<pm> install` और `<pm> run dev` print करता है।

```bash
npx create-tuvix-app my-app --example with-multiple-frameworks
```

प्रोजेक्ट नाम न देने पर folder `my-app` होता है। नाम में सिर्फ़ अक्षर, अंक और hyphens हो सकते हैं। `examples/` में ये folders मौजूद हैं:

| उदाहरण | क्या दिखाता है |
| --- | --- |
| `with-react` | shell में React माइक्रो ऐप्स |
| `with-vue` | shell में Vue माइक्रो ऐप्स |
| `with-svelte` | shell में Svelte माइक्रो ऐप्स |
| `with-angular` | shell में Angular माइक्रो ऐप्स |
| `with-vanilla` | फ्रेमवर्क के बिना माइक्रो ऐप्स |
| `with-multiple-frameworks` | एक पेज पर React और Vue माइक्रो ऐप्स |
| `with-react-router` | React ऐप्स के साथ `@tuvix.js/router` |
| `with-react-event-bus` | `@tuvix.js/event-bus` पर बात करते ऐप्स |
| `with-react-sandbox` | `@tuvix.js/sandbox` के साथ CSS isolation |
| `with-react-devtools` | [`@tuvix.js/devtools`](/hi/packages/devtools) overlay |
| `with-module-federation-react` | React remotes के साथ `@tuvix.js/module-federation` |
| `with-ssr-react` | React fragments को compose करता `@tuvix.js/server` |
| `with-ssr-vanilla` | सादे HTML fragments को compose करता `@tuvix.js/server` |
| `with-ssr-islands` | [`@tuvix.js/vite`](/hi/packages/vite) के साथ कई फ्रेमवर्क में सर्वर पर रेंडर किए गए islands |

उदाहरण monorepo के अंदर रहते हैं, इसलिए उनकी `package.json` फ़ाइलें `workspace:*` पर निर्भर हैं। install command चलाने से पहले हर `workspace:*` और `workspace:^` को `^0.5.0` से बदलें, वरना पैकेज मैनेजर unsupported protocol एरर के साथ रुक जाता है।

## पैकेज मैनेजर की पहचान

CLI install step और print होने वाले commands के लिए पैकेज मैनेजर इस आधार पर चुनता है कि आपने इसे कैसे शुरू किया। यह इस क्रम में जाँच करता है:

1. `process.versions.bun` set है: `bun`।
2. `npm_execpath` में `pnpm` या `yarn` है: वही मैनेजर।
3. `npm_config_user_agent` `pnpm`, `yarn` या `bun/` से शुरू होता है: वही मैनेजर।
4. वरना: `npm`।

`pnpm create tuvix-app` और `pnpm dlx create-tuvix-app` pnpm से इंस्टॉल करते हैं, `yarn create` yarn से, `npx` और `npm create` npm से। कोई flag इस चुनाव को override नहीं करता।

## Install step

Template run के बाद CLI नए folder में एक spinner (`Installing dependencies with <pm>`) के पीछे `<pm> install` चलाता है। यह पैकेज मैनेजर का output छिपा देता है।

- Exit code 0: spinner `Dependencies installed` के साथ ख़त्म होता है, और CLI `cd <name>` और `<pm> run dev` print करता है।
- Non-zero exit code, या binary मौजूद नहीं: spinner `Install failed. Run manually:` के साथ ख़त्म होता है, उसके बाद `cd <absolute path>` और `<pm> install` आते हैं। प्रोजेक्ट फ़ाइलें बनी रहती हैं, और CLI फिर भी code 0 के साथ exit करता है।

`--example` runs कभी इंस्टॉल नहीं करते।

## Edge cases

- पहले से मौजूद folder run को `Directory "<name>" already exists.` और exit code 1 के साथ रोक देता है। CLI कभी किसी मौजूदा folder में नहीं लिखता और न उसके साथ merge करता है।
- ऐसा नाम जिसका resolved path current directory से शुरू नहीं होता, जैसे `../app`, `Project directory must be within the current working directory.` के साथ रुकता है।
- अनजान `--template` value prompts के बाद `Unknown template "<value>". Available: shell, react-app, vue-app, vanilla-app, svelte-app, angular-app` के साथ fail होती है।
- आख़िरी argument के रूप में बिना value वाला `--template` या `--example` न दिए जैसा माना जाता है: आपको template prompt मिलता है, या सामान्य template run।
- CLI प्रोजेक्ट नाम को जैसा लिखा है वैसा ही folder और `package.json` के `name` दोनों के लिए इस्तेमाल करता है। यह npm naming rules की जाँच नहीं करता, इसलिए `My App` से invalid पैकेज नाम बनता है।
- Prompt cancel करने (Ctrl+C) पर `Operation cancelled.` print होता है और code 0 के साथ exit होता है।
- ऐसा example नाम जो `master` पर मौजूद नहीं, एक खाली folder छोड़ता है और `Example "<name>" was not found or failed to extract.` के साथ fail होता है। दोबारा कोशिश करने से पहले folder delete करें।
- CLI एक example के लिए पूरी repository का tarball download करता है। धीमे connection पर `--example` धीमा चलता है।

## यह क्या नहीं करता

- माइक्रो ऐप templates ख़ुद को mount नहीं करते। `src/main` module export करता है, और `index.html` में कुछ भी `mount` call नहीं करता, इसलिए जब तक कोई shell entry load नहीं करता, `pnpm run dev` एक खाली `#app` दिखाता है।
- कोई library-mode Vite config नहीं। `vite build` hashed फ़ाइल नामों के साथ सामान्य ऐप build बनाता है, और आपका shell कौन-सी entry load करे, यह आप चुनते हैं।
- कोई monorepo, workspace या multi-app setup नहीं। हर ऐप के लिए CLI एक बार चलाएँ, या किसी `--example` से शुरू करें।
- कोई git init, linter, test runner या CSS setup नहीं।
- कोई `--no-install` flag नहीं और कोई पैकेज मैनेजर flag नहीं।
- कोई programmatic API नहीं। पैकेज import करने पर CLI चलता है।
