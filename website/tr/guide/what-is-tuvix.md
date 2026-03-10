# Tuvix.js Nedir?

Tuvix.js, bağımsız olarak dağıtılabilir parçalardan oluşan ölçeklenebilir frontend uygulamaları oluşturmak için **hafif, framework'ten bağımsız bir mikro frontend orkestratörüdür**.

## Sorun

Frontend'ler büyüdükçe, yekpare single-page uygulamaları şöyle hale gelir:

- Birden fazla ekip arasında ölçeklendirilmesi zor
- Yavaş build ve dağıtım — bir değişiklik her şeyi yeniden build eder
- Tek bir framework veya versiyona kilitli
- İzole olarak test edilmesi ve anlaşılması zor

## Çözüm: Mikro Frontend'ler

Mikro frontend'ler, microservice ilkelerini frontend'e uygular. Her **mikro uygulama**:

- **Bağımsız olarak geliştirilir** — ayrı kod tabanı, ayrı ekip
- **Bağımsız olarak dağıtılır** — kendi CI/CD pipeline'ı
- **Framework bağımsızdır** — bir ekip React, diğeri Vue, diğeri Svelte kullanır

Tuvix.js, tüm mikro uygulamaları çalışma zamanında yükleyen, bağlayan ve koordine eden **shell**'i sağlar.

## Mimari

```
┌─────────────────────────────────────────────┐
│              Tuvix.js Shell                 │
│                                             │
│  ┌────────────┐  ┌──────────┐  ┌────────┐  │
│  │ Orkestratör│  │  Router  │  │ Loader │  │
│  └────────────┘  └──────────┘  └────────┘  │
│                                             │
│  ┌─────────┐  ┌────────┐  ┌──────────────┐ │
│  │  React  │  │  Vue   │  │   Angular    │ │
│  │  Mikro  │  │  Mikro │  │    Mikro     │ │
│  │  Uygul. │  │  Uygul.│  │    Uygul.    │ │
│  └─────────┘  └────────┘  └──────────────┘ │
└─────────────────────────────────────────────┘
```

## Sonraki Adım

→ [Başlarken](/tr/guide/getting-started)
