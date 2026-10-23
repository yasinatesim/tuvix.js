# create-tuvix-app

> Tuvix.js shell'i ya da React, Vue, Svelte, Angular veya vanilla mikro uygulaması için Vite proje iskeleti oluşturur

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır.

## Kullanım

```bash
npx create-tuvix-app my-app
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
bun create tuvix-app my-app

# npm create forwards flags only after --
npm create tuvix-app@latest my-app -- --template react-app --typescript
```

CLI, vermediğiniz her değeri (proje adı, şablon, TypeScript) sorar, dosyaları `./<project-name>` klasörüne yazar ve ardından bağımlılıkları kurar.

## Hızlı başlangıç

```bash
pnpm create tuvix-app checkout --template react-app --typescript
cd checkout
pnpm run dev
```

## Seçenekler

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `project-name` | konumsal | soru | Klasör ve `package.json` adı |
| `--template`, `-t` | `string` | soru | `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app` ya da `vanilla-app` |
| `--typescript` / `--no-typescript` | bayrak | soru (`Yes` önceden seçili) | TypeScript dosyaları ve `tsconfig.json` ya da JavaScript. `angular-app` her zaman TypeScript kullanır. |
| `--example`, `-e` | `string` | yok | GitHub deposundan (`master`) `examples/<name>` klasörünü indirir. Soruları ve kurulumu atlar. |
| `--help`, `-h` | bayrak | `false` | Kullanım bilgisini yazdırır |
| `--version`, `-v` | bayrak | `false` | CLI'ın `package.json` dosyasından okunan `create-tuvix-app v<version>` değerini yazdırır |

## Şablonlar

Her projede `index.html`, `src/main.<ext>` ve `dev`/`build`/`preview` Vite script'lerini, `tuvix.js@^0.5.0` ile `vite@^6.0.0` bağımlılıklarını (TS modunda ek olarak `typescript@^5.7.0`) içeren bir `package.json` bulunur.

| Şablon | Ürettikleri | Ek bağımlılıklar |
| --- | --- | --- |
| `shell` | History router'lı (`/dashboard/*`, `/settings/*`) bir `createOrchestrator` ve yer tutucu bir CDN URL'sine işaret eden, kayıtlı tek bir `dashboard` uygulaması | yok |
| `react-app` | `createReactMicroApp({ name, App })`, `App.tsx` ve `@vitejs/plugin-react` eklentili bir `vite.config.ts` | `react`, `react-dom` `^19`, `@tuvix.js/react`, `@vitejs/plugin-react@^4.3` |
| `vue-app` | `createVueMicroApp({ name, App })`, props'u `inject(TUVIX_PROPS_KEY)` ile okuyan bir `App.vue`, `@vitejs/plugin-vue` eklentili `vite.config.ts`, TS modunda da `*.vue` modüllerini bildiren `src/vite-env.d.ts` | `vue@^3.5`, `@tuvix.js/vue`, `@vitejs/plugin-vue@^5.2` |
| `svelte-app` | `svelte/reactivity` modülünden gelen `SvelteMap` ile `createSvelteMicroApp({ name, App, SvelteMap })`, böylece `update()` yerinde yeniden render eder. `$props()` okuyan Svelte 5 `App.svelte`, `vite.config.ts`, `vitePreprocess()` kullanan `svelte.config.js`, TS modunda da `src/vite-env.d.ts` ve bir `check` script'i | `svelte@^5`, `@tuvix.js/svelte`, `@sveltejs/vite-plugin-svelte@^5`, `svelte-check@^4` (TS modu) |
| `angular-app` | Standalone bir `AppComponent` ile `createSsrAngularMicroApp({ name, component })`, zoneless Angular 20. JIT bileşenleri derlenebilsin diye `src/main.ts` önce `@angular/compiler` paketini import eder. | `@angular/{common,compiler,core,platform-browser}@^20`, `rxjs`, `tslib`, `@tuvix.js/angular` |
| `vanilla-app` | `innerHTML` yazan `mount`/`unmount` ile `defineMicroApp` | yok |

## Paket yöneticisi ve kurulum

CLI, Bun üzerinde çalışıyorsa `bun` seçer. Değilse önce `npm_execpath` içinde `pnpm`/`yarn`, sonra `npm_config_user_agent` içinde `pnpm`/`yarn`/`bun/` arar, hiçbiri yoksa `npm` kullanır. Şablonla yapılan bir çalıştırmadan sonra çıktıyı gizleyerek `<pm> install` çalıştırır. Kurulum başarısız olursa komutlarla birlikte `Install failed. Run manually:` yazdırır ve yine de 0 koduyla çıkar.

## Sınır durumlar

- Hedef klasör zaten varsa `Directory "<name>" already exists.` hatasıyla durur (çıkış kodu 1).
- `../app` gibi geçerli dizinin dışına çıkan adlar hata verir.
- Bilinmeyen bir `--template` değeri, kullanılabilir şablonların listesiyle hata verir.
- CLI proje adını yazıldığı gibi kullanır, npm adlandırma kurallarını kontrol etmez.
- Örnekler `workspace:*` bağımlılıklarına dayanır. Kurulumdan önce bunları `^0.5.0` ile değiştirin.
- Olmayan bir örnek geride boş bir klasör bırakır. Yeniden denemeden önce klasörü silin.

## Ne yapmaz

- Mikro uygulama şablonları bir modül export eder ama onu hiçbir zaman mount etmez. Bu yüzden bir shell yükleyene kadar `pnpm run dev` boş bir `#app` gösterir.
- Library modunda build ayarı, git init, linter, test ya da monorepo kurulumu yoktur.
- `--no-install` ya da paket yöneticisi bayrağı yoktur, programatik API de yoktur.

Dokümantasyonun tamamı: [tuvix.js.org/tr/packages/create-tuvix-app](https://tuvix.js.org/tr/packages/create-tuvix-app)

## Lisans

MIT
