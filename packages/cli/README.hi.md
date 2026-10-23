# create-tuvix-app

> Tuvix.js shell या React, Vue, Svelte, Angular या vanilla माइक्रो ऐप के लिए एक Vite project scaffold करें

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा।

## इस्तेमाल

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app

# npm create forwards flags only after --
npm create tuvix-app@latest my-app -- --template react-app --typescript
```

आप जो भी value छोड़ देते हैं (project का नाम, template, TypeScript), CLI उसके लिए prompt करता है, files को `./<project-name>` में लिखता है, फिर डिपेंडेंसी install करता है।

## क्विक स्टार्ट

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

## विकल्प

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `project-name` | positional | prompt | folder और `package.json` का नाम |
| `--template`, `-t` | `string` | prompt | `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app` या `vanilla-app` |
| `--typescript` / `--no-typescript` | flag | prompt (`Yes` पहले से चुना हुआ) | TypeScript files और `tsconfig.json`, या JavaScript। `angular-app` हमेशा TypeScript होता है। |
| `--example`, `-e` | `string` | कोई नहीं | GitHub repo (`master`) से `examples/<name>` download करता है। prompts और install छोड़ देता है। |
| `--help`, `-h` | flag | `false` | usage print करता है |
| `--version`, `-v` | flag | `false` | `create-tuvix-app v<version>` print करता है, जिसे CLI के `package.json` से पढ़ा जाता है |

## Templates

हर project को `index.html`, `src/main.<ext>` और एक `package.json` मिलता है, जिसमें `dev`/`build`/`preview` Vite scripts, `tuvix.js@^0.5.0` और `vite@^6.0.0` होते हैं (TS mode में साथ में `typescript@^5.7.0`)।

| Template | क्या बनाता है | अतिरिक्त डिपेंडेंसी |
| --- | --- | --- |
| `shell` | history राउटर (`/dashboard/*`, `/settings/*`) के साथ `createOrchestrator` और एक registered `dashboard` ऐप, जो placeholder CDN URL की ओर point करता है | कोई नहीं |
| `react-app` | `createReactMicroApp({ name, App })`, `App.tsx` और `@vitejs/plugin-react` के साथ एक `vite.config.ts` | `react`, `react-dom` `^19`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3` |
| `vue-app` | `createVueMicroApp({ name, App })`, `App.vue` जो props को `inject(TUVIX_PROPS_KEY)` से पढ़ता है, `@vitejs/plugin-vue` के साथ `vite.config.ts`, और TS mode में `*.vue` modules declare करने वाला `src/vite-env.d.ts` | `vue@^3.5`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2` |
| `svelte-app` | `svelte/reactivity` से `SvelteMap` के साथ `createSvelteMicroApp({ name, App, SvelteMap })`, ताकि `update()` उसी जगह फिर से render करे। `$props()` पढ़ने वाला Svelte 5 `App.svelte`, `vite.config.ts`, `vitePreprocess()` के साथ `svelte.config.js`, और TS mode में `src/vite-env.d.ts` और एक `check` script | `svelte@^5`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5`, `svelte-check@^4` (TS mode) |
| `angular-app` | standalone `AppComponent` के साथ `createSsrAngularMicroApp({ name, component })`, zoneless Angular 20। `src/main.ts` सबसे पहले `@angular/compiler` import करता है ताकि JIT कंपोनेंट compile हों। | `@angular/{common,compiler,core,platform-browser}@^20`, `rxjs`, `tslib`, `@tuvix.js/angular` |
| `vanilla-app` | `mount`/`unmount` के साथ `defineMicroApp`, जो `innerHTML` लिखता है | कोई नहीं |

## Package manager और install

Bun पर चलने पर CLI `bun` चुनता है, फिर `npm_execpath` में `pnpm`/`yarn` देखता है, फिर `npm_config_user_agent` में `pnpm`/`yarn`/`bun/`, और आख़िर में `npm` पर आ जाता है। template run के बाद यह छिपे output के साथ `<pm> install` चलाता है। अगर यह fail हो, तो यह commands के साथ `Install failed. Run manually:` print करता है और फिर भी exit 0 देता है।

## Edge cases

- अगर target folder पहले से मौजूद है, तो `Directory "<name>" already exists.` (exit 1) के साथ fail होता है।
- current directory से बाहर resolve होने वाले नाम, जैसे `../app`, fail होते हैं।
- अनजान `--template` उपलब्ध templates की list के साथ fail होता है।
- project का नाम जैसा लिखा है वैसा ही इस्तेमाल होता है; npm naming नियमों की जाँच नहीं होती।
- Examples `workspace:*` पर निर्भर हैं। install करने से पहले उन्हें `^0.5.0` से बदलें।
- example न मिलने पर एक ख़ाली folder पीछे रह जाता है; दोबारा कोशिश करने से पहले उसे delete करें।

## यह क्या नहीं करता

- माइक्रो ऐप templates एक module export करते हैं और उसे कभी mount नहीं करते, इसलिए जब तक कोई shell उसे लोड न करे, `pnpm run dev` एक ख़ाली `#app` दिखाता है।
- कोई library-mode build config, git init, linter, tests या monorepo setup नहीं।
- कोई `--no-install` या package manager flag नहीं, और कोई programmatic API नहीं।

पूरा documentation: [tuvix.js.org/hi/packages/create-tuvix-app](https://tuvix.js.org/hi/packages/create-tuvix-app)

## License

MIT
