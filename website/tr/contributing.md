# Tuvix.js'e Katkı Sağlama

Katkı sağlamak istediğiniz için teşekkürler! İster hata düzeltme, ister yeni özellik, ister belge iyileştirmesi, ister çeviri olsun — tüm katkılar memnuniyetle karşılanır.

## Katkı Yolları

- **Hata raporları** — [Sorun açın](https://github.com/yasinatesim/tuvix.js/issues/new?template=bug_report.md)
- **Özellik istekleri** — [Tartışma başlatın](https://github.com/yasinatesim/tuvix.js/discussions)
- **Kod** — Hata düzeltin, özellik ekleyin, testleri geliştirin
- **Belgeleme** — Yazım hatalarını düzeltin, örnek ekleyin
- **Çeviriler** — Diğer dillerde belgeleme ekleyin veya geliştirin

## Başlarken

### 1. Fork ve Clone

```bash
git clone https://github.com/KULLANICI_ADINIZ/tuvix.js.git
cd tuvix.js
```

### 2. Bağımlılıkları Yükleyin

```bash
pnpm install
```

### 3. Tüm Paketleri Build Edin

```bash
pnpm build
```

### 4. Testleri Çalıştırın

```bash
pnpm test
```

### 5. Docs Geliştirme Sunucusunu Başlatın

```bash
cd website
pnpm install
pnpm dev
```

## Commit Mesajları

[Conventional Commits](https://www.conventionalcommits.org/) standardını takip ediyoruz:

```
feat: router'a hash modu eklendi
fix(sandbox): unmount sırasında olay dinleyicileri temizlendi
docs: Angular rehber örneği eklendi
```

## Pull Request Süreci

1. `master`'dan bir dal oluşturun:
   ```bash
   git checkout -b ozellik/yeni-ozelligim
   ```

2. Değişikliklerinizi yapın ve test ekleyin

3. Tam test paketini çalıştırın:
   ```bash
   pnpm test && pnpm check-types && pnpm lint
   ```

4. Yayınlanan bir paketi etkileyen değişiklik varsa changeset ekleyin:
   ```bash
   pnpm changeset
   ```

5. `master`'a karşı PR açın

İngilizce katkı rehberinin tamamı için: [Contributing (EN)](/contributing)
