# Tuvix.js Nedir?

Tuvix.js, bağımsız olarak dağıtılabilir parçalardan oluşan ölçeklenebilir frontend uygulamaları oluşturmak için **Lightweight, framework'ten bağımsız bir mikro frontend Orchestrator'üdür**.

## Sorun

Frontend'ler büyüdükçe, yekpare single-page uygulamaları şöyle hale gelir:

- Birden fazla ekip arasında ölçeklendirilmesi zor
- Yavaş build ve dağıtım - bir değişiklik her şeyi yeniden build eder
- Tek bir framework veya versiyona kilitli
- İzole olarak test edilmesi ve anlaşılması zor

## Çözüm: Mikro Frontend'ler

Mikro frontend'ler, microservice ilkelerini frontend'e uygular. Her **mikro uygulama**:

- **Bağımsız olarak geliştirilir** - ayrı kod tabanı, ayrı ekip
- **Bağımsız olarak dağıtılır** - kendi CI/CD pipeline'ı
- **Framework bağımsızdır** - bir ekip React, diğeri Vue, diğeri Svelte kullanır

Tuvix.js, tüm mikro uygulamaları çalışma zamanında yükleyen, bağlayan ve koordine eden **shell**'i sağlar.

## Mimari

```
┌─────────────────────────────────────────────┐
│              Tuvix.js Shell                 │
│                                             │
│  ┌────────────┐  ┌──────────┐  ┌────────┐  │
│  │Orchestrator│  │  Router  │  │ Loader │  │
│  └────────────┘  └──────────┘  └────────┘  │
│                                             │
│  ┌─────────┐  ┌────────┐  ┌──────────────┐ │
│  │  React  │  │  Vue   │  │   Angular    │ │
│  │  Mikro  │  │  Mikro │  │    Mikro     │ │
│  │  Uygul. │  │  Uygul.│  │    Uygul.    │ │
│  └─────────┘  └────────┘  └──────────────┘ │
└─────────────────────────────────────────────┘
```

## Temel Kavramlar

| Kavram | Açıklama |
|--------|----------|
| **Shell** | Ana uygulama - mikro uygulamaları yükler ve koordine eder |
| **Orchestrator** | Mikro uygulama kaydını ve lifecycle'ı yöneten çekirdek motor |
| **Mikro Uygulama** | Bağımsız olarak dağıtılan bir frontend uygulaması |
| **Entry** | Mikro uygulamanın JavaScript paketi URL'si |
| **Lifecycle** | Her mikro uygulamanın uyguladığı mount, unmount, update hook'ları |
| **Event Bus** | Mikro uygulamalar arasındaki yazılı yayın/abone köprüsü |
| **Sandbox** | Çatışmaları önlemek için CSS + JS izolasyonu |

## Karşılaştırma

| Özellik | Tuvix.js | single-spa | Module Federation |
|---------|----------|------------|-------------------|
| Sıfır çalışma zamanı bağımlılığı | ✅ | ❌ | ✅ |
| Yerleşik Event Bus | ✅ | ❌ | ❌ |
| CSS Sandbox | ✅ | ❌ | ❌ |
| SSR desteği | ✅ | Kısmi | ✅ |
| TypeScript-first | ✅ | Kısmi | ✅ |
| Framework bağlamaları | React, Vue, Svelte, Angular | React, Vue | Herhangi |

## Sonraki Adım

→ [Başlarken](/tr/guide/getting-started)
