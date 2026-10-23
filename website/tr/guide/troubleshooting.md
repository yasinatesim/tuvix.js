# Sorun giderme

Her madde önce gördüğünüz belirtiyle başlar, ardından nedeni ve çözümü verir.

## Svelte: onMount hiç çalışmıyor ya da mount() lifecycle_function_unavailable hatası fırlatıyor

**Belirti.** Bir Svelte island'ı render oluyor ama `onMount` callback'leri hiç tetiklenmiyor ya da Svelte 5 `mount()` çağrısı `lifecycle_function_unavailable` hatası fırlatıyor.

**Neden.** `svelte` paketi aynı import altında hem tarayıcı hem sunucu runtime'ı sunar. Client bundle'ınız sunucu runtime'ını seçmiş. Bazı SSR kurulumları (Vinxi, özel Vite environment'ları, jsdom'da çalışan Vitest) client tarafını `browser` export koşulu olmadan çözümler. Vite'ın dependency optimizer'ı da bunun üzerine sunucu runtime'ını önceden bundle'lar. Tarayıcı devtools'ta client dosyası yerine `svelte/src/index-server.js` (Svelte 5) ya da `svelte/src/runtime/ssr.js` (Svelte 4) görürsünüz.

**Çözüm.** `browser` koşulunu client'ın resolve koşullarına geri ekleyin. Ardından optimize edilmiş bağımlılıkları yeniden oluştursun diye Vite'ı `--force` ile yeniden başlatın:

```ts
// vite.config.ts (client build'i ya da client environment'ı)
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  resolve: { conditions: ['browser', ...defaultClientConditions] },
});
```

Vitest'i jsdom ile kullanıyorsanız koşulu ekleyin ve Vite çözümleyebilsin diye Svelte'i inline edin:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['browser'] },
  test: { environment: 'jsdom', server: { deps: { inline: [/svelte/] } } },
});
```

`svelte` paketini `optimizeDeps` dışında bırakmayın. Bırakırsanız esbuild "The entry point "svelte" cannot be marked as external" hatası verir.

## Vue: ~ alias'ı .vue dosyalarında çalışmıyor

**Belirti.** Production build `Rollup failed to resolve import "~/utils/x" from ".../Card.vue?vue&type=script..."` hatasıyla duruyor. Oysa aynı import `.ts` dosyalarında çalışıyor, `.vue` dosyalarında `~/` üzerinden yapılan `import type` da sorunsuz.

**Neden.** `vite-tsconfig-paths` alias'ları yalnızca tsconfig'in `include` listesindeki dosyalara uygular. `**/*.ts` ve `**/*.tsx` dosyalarını içeren bir tsconfig, `.vue` dosyalarını dışarıda bırakır. Yalnızca tip içeren import'lar çözümlemeden önce silinir, bu yüzden hiç hata vermez.

**Çözüm.** `.vue` dosyalarını o tsconfig'e ekleyin:

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

ya da alias'ı doğrudan Vite'ta tanımlayın:

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
});
```

Editörde Vue - Official (Volar) eklentisini kullanın. Vetur, `<script setup>` makrolarını ve `moduleResolution: "Bundler"` ayarını anlamaz.

## Angular 15-17: tıklamalar görünümü güncellemiyor

**Belirti.** Bir Angular island'ı render oluyor, ama bir buton handler'ı bir alanı değiştirdiğinde template güncellenmiyor.

**Neden.** Adaptör Angular'ı zone.js olmadan çalıştırır. Angular 18+ zoneless modda change detection'ı kendisi planlar. 15-17'de ise adaptör `NgZone` yerine hiçbir şey yapmayan bir zone koyar ve DOM olaylarından sonra change detection'ı çalıştıran bir şey kalmaz.

**Çözüm.** Değişiklikten sonra `detectChanges()` çağırın:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-like',
  standalone: true,
  template: `<button (click)="like()">{{ likes }}</button>`,
})
export class LikeComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  likes = 0;

  like(): void {
    this.likes += 1;
    this.cdr.detectChanges();
  }
}
```

Ya da client entry dosyanızın en üstünde `zone.js` import edin ve `createAngularMicroApp` fonksiyonuna `zone: true` verin. zone.js'i sunucudan uzak tutun: global `Promise` nesnesini patch'ler ve sunucu tarafındaki `fetch` çağrılarını bozar.

## Tarihlerden kaynaklanan hydration uyuşmazlığı

**Belirti.** React #418 hatasını (Vue ve Svelte ise hydration mismatch uyarısını) yalnızca bazı kullanıcılarda ya da yalnızca gece yarısına yakın veriyor. Diff'te bir gün farklı tarihler görünüyor, örneğin `21 Mart 2026` ile `22 Mart 2026`.

**Neden.** Sunucu tarihleri kendi saat diliminde (genelde UTC), tarayıcı ise kullanıcının saat diliminde biçimlendirir. `timeZone` verilmeden kullanılan `new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })` iki tarafta farklı metin üretir.

**Çözüm.** Sunucunun render ettiği tarihleri biçimlendirdiğiniz her yerde açıkça bir `timeZone` verin:

```ts
const format = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Istanbul',
});

console.log(format.format(new Date('2026-03-21T22:30:00Z'))); // sunucuda ve client'ta 22 Mart 2026
```

Aynı kural `toLocaleString`, göreli zamanlar ("3 saat önce") ve render sırasında `Date.now()` kullanan her şey için geçerlidir.

## Bir isteğin verisi başka bir istekte görünüyor

**Belirti.** Sunucuda render edilmiş bir island eski veriyi ya da başka bir kullanıcının isteğine ait veriyi gösteriyor, ardından client farklı içerikle yeniden render ediyor.

**Neden.** Modül seviyesindeki bir cache, sunucu süreci ayakta kaldığı sürece yaşar. Örneğin birkaç mikro uygulamanın import ettiği `export const queryClient = new QueryClient()` böyledir. Her istek aynı instance'ı okur ve ona yazar.

**Çözüm.** Sunucuda cache'i her istek için ayrı oluşturun ve island'ın ihtiyaç duyduğu veriyi props ile geçin. Modül seviyesinde tek bir client'ı yalnızca tarayıcı kodunda tutun.

```ts
import { QueryClient } from '@tanstack/query-core';

export function createRequestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}
```

Ayrıntılar için [İstek başına state](/tr/guide/ssr-islands#per-request-state) bölümüne bakın.

## Module script uygulaması unload sonrasında yüklenmiyor

**Belirti.** `orchestrator.unregister(name)` ya da `loader.unload(name)` sonrasında aynı uygulamayı yeniden kaydedip mount etmek `Module "<name>" loaded but no exports found` hatasıyla başarısız oluyor.

**Neden.** Tarayıcılar bir module script'i her URL için bir kez çalıştırır. Aynı URL için eklenen ikinci `<script type="module" src="...">` hiçbir şey yapmaz, bu yüzden uygulama `registerModule` fonksiyonunu bir daha çağırmaz.

**Çözüm.** Modülü bundler'ın modül cache'inde tutan bir loader fonksiyonu entry'si kullanın ya da URL'yi değiştirin (örneğin sürüm bilgisi taşıyan bir query string ile):

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

## "loaded but no exports found"

**Belirti.** `[Tuvix Loader] Module "dashboard" loaded but no exports found.`

**Neden ve çözüm**, kontrol sırasına göre:

1. Bundle'ın kaydettiği isim, register ederken verdiğiniz isimden farklı. `createReactMicroApp({ name: 'Dashboard' })` ile `register({ name: 'dashboard' })` eşleşmez. İkisinde de aynı string'i kullanın.
2. Bir ES module bundle'ı klasik script olarak yüklenmiş. Vite'ın ES çıktısı `.js` uzantılıdır; entry'ye `type: 'module'` ekleyin.
3. Bundle modülü export ediyor ama hiç kaydetmiyor. Bir adaptör ya da `defineMicroApp` kullanın veya `registerModule(name, module)` fonksiyonunu kendiniz çağırın.

## Container bulunamadı

**Belirti.** `[Tuvix] Container "#app" not found in DOM.`

**Neden.** Orchestrator container'ı uygulamayı mount ederken arar. Harici bir router'ın route bileşeni onu henüz render etmemiş olabilir.

**Çözüm.** Container'ları navigasyondan önce var olan bir layout içinde tutun ya da o uygulamayı route bileşeninin içinde `TuvixIsland` ile barındırın. Ayrıntılar için [Harici router](/tr/guide/external-router#containers-rendered-by-routes) sayfasına bakın.

## İlk boyamada stiller eksik

**Belirti.** JavaScript kapalıyken ya da yavaş bağlantılarda kısa bir süre, sunucuda render edilmiş island'lar CSS'leri olmadan görünüyor.

**Neden.** Vite, CSS Modules, Vue `<style>` blokları ve Svelte stillerini JavaScript üzerinden enjekte eder. Sunucu HTML'i bunların hiçbirine link vermez.

**Çözüm.** Vite config'inize `@tuvix.js/vite` paketinden `tuvix()` ekleyin ve `renderAssetTags(await getAssets([...]))` çıktısını `<head>` içine yazdırın. Ayrıntılar için [SSR island'ları](/tr/guide/ssr-islands) sayfasına bakın.
