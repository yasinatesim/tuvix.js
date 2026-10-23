---
layout: home

# Every visible string on the home page comes from this frontmatter, so a
# locale only needs a translated copy of this file. Field reference:
# website/.vitepress/theme/components/home/model.ts

# The Orbit sections replace the markdown body on this page, so the body
# stays empty. Keep the flag: without it OrbitHome renders an empty, bordered
# content block above the footer.
markdownContent: false

hero:
  name: Tuvix.js
  title: कई ऐप्स।
  accent: एक अनुभव।
  tagline: Tuvix.js React, Vue, Svelte, Angular और vanilla JS माइक्रो ऐप्स को एक होस्ट पेज में mount करता है। रूटिंग, event bus, sandboxing और सर्वर रेंडरिंग अलग पैकेज के रूप में आते हैं, जिन्हें आप ज़रूरत पड़ने पर जोड़ते हैं।
  image:
    src: /logo.svg
    alt: Tuvix.js लोगो
  actions:
    - theme: brand
      text: शुरुआत करें
      link: /hi/guide/getting-started
    - theme: alt
      text: Playground आज़माएं
      link: /playground
  install:
    command: npx create-tuvix-app
    copyLabel: कमांड कॉपी करें
    copiedLabel: कॉपी हो गया

showcase:
  file: src/orchestrator.ts
  copyLabel: कॉपी करें
  copiedLabel: कॉपी हो गया
  shellTitle: होस्ट shell
  routeLabel: URL
  mountedLabel: mounted
  busLabel: साझा event bus

featuresSection:
  title: Tuvix.js में क्या मिलता है
  lead: आठ बिल्डिंग ब्लॉक। मुख्य पांच पाने के लिए tuvix.js umbrella पैकेज इंस्टॉल करें, या shell बढ़ने पर अलग-अलग पैकेज जोड़ें।

features:
  - icon: layers
    title: फ्रेमवर्क-स्वतंत्र
    details: एक ही shell में React, Vue, Svelte, Angular और vanilla JS माइक्रो ऐप्स साथ-साथ चलाएं।
    link: /hi/guide/micro-apps
    linkText: माइक्रो ऐप्स गाइड
  - icon: box
    title: कोई third-party रनटाइम डिपेंडेंसी नहीं
    details: हर पैकेज केवल दूसरे @tuvix.js पैकेजों पर निर्भर है। आप वही पैकेज इंस्टॉल करते हैं जिन्हें आप import करते हैं।
    link: /hi/packages/
    linkText: सभी पैकेज
  - icon: route
    title: बिल्ट-इन रूटिंग
    details: URL बदलने पर राउटर ऐप्स को mount और unmount करता है, history या hash mode में।
    link: /hi/guide/routing
    linkText: '@tuvix.js/router'
  - icon: broadcast
    title: Event bus
    details: ऐप्स globals साझा किए बिना typed events publish और subscribe करते हैं।
    link: /hi/guide/event-bus
    linkText: '@tuvix.js/event-bus'
  - icon: shield
    title: CSS और JS sandbox
    details: Shadow DOM हर ऐप की styles को उसके container के अंदर रखता है। JsSandbox किसी script को एक Proxy window पर चलाता है, जिसे आप बाद में हटा सकते हैं।
    link: /hi/guide/sandbox
    linkText: '@tuvix.js/sandbox'
  - icon: bolt
    title: डायनेमिक लोडिंग
    details: loader ज़रूरत पड़ने पर ऐप bundles fetch करता है, उन्हें cache करता है और असफल loads को दोबारा आज़माता है।
    link: /hi/packages/loader
    linkText: '@tuvix.js/loader'
  - icon: terminal
    title: DevTools
    details: पेज के अंदर एक पैनल registered ऐप्स, active route और event bus ट्रैफ़िक दिखाता है।
    link: /hi/packages/devtools
    linkText: '@tuvix.js/devtools'
  - icon: server
    title: सर्वर रेंडरिंग
    details: माइक्रो ऐप्स को सर्वर पर रेंडर करें और उनका HTML shell template में जोड़ें, string या stream के रूप में।
    link: /hi/packages/server
    linkText: '@tuvix.js/server'

frameworks:
  title: अपना फ्रेमवर्क चुनें
  lead: हर adapter एक कंपोनेंट को माइक्रो ऐप में बदलता है, जिसे orchestrator mount, update और unmount कर सकता है।
  copyLabel: इंस्टॉल कमांड कॉपी करें
  copiedLabel: कॉपी हो गया
  items:
    - name: React
      icon: react
      details: createReactMicroApp एक कंपोनेंट को wrap करता है। useTuvixProps और useTuvixBus props और events पढ़ते हैं।
      install: npm i @tuvix.js/react
      link: /hi/guide/react
    - name: Vue
      icon: vue
      details: createVueMicroApp एक Vue 3 ऐप mount करता है, props और event bus के लिए composables के साथ।
      install: npm i @tuvix.js/vue
      link: /hi/guide/vue
    - name: Svelte
      icon: svelte
      details: createSvelteMicroApp Svelte 3, 4 और 5 कंपोनेंट्स mount करता है।
      install: npm i @tuvix.js/svelte
      link: /hi/guide/svelte
    - name: Angular
      icon: angular
      details: createAngularMicroApp एक Angular 15+ कंपोनेंट को उसके container में bootstrap करता है।
      install: npm i @tuvix.js/angular
      link: /hi/guide/angular
    - name: Vanilla JS
      icon: javascript
      details: defineMicroApp सादे JavaScript को mount, unmount और update hooks देता है।
      install: npm i @tuvix.js/core
      link: /hi/guide/micro-apps

packages:
  title: 15 पैकेज, हर एक का अपना वर्शन
  lead: umbrella पैकेज से शुरू करें। छोटा install चाहिए तो अलग-अलग पैकेज पर जाएं।
  items:
    - name: tuvix.js
      details: core, router, event bus, loader और sandbox वाला umbrella पैकेज।
      link: /hi/packages/tuvix
    - name: '@tuvix.js/core'
      details: orchestrator। माइक्रो ऐप्स register करता है और उनके lifecycles चलाता है।
      link: /hi/packages/core
    - name: '@tuvix.js/router'
      details: URL के आधार पर माइक्रो ऐप्स को activate करता है, history या hash mode में।
      link: /hi/packages/router
    - name: '@tuvix.js/event-bus'
      details: माइक्रो ऐप्स के बीच typed publish/subscribe।
      link: /hi/packages/event-bus
    - name: '@tuvix.js/loader'
      details: caching और retries के साथ ज़रूरत पड़ने पर ऐप bundles लोड करता है।
      link: /hi/packages/loader
    - name: '@tuvix.js/sandbox'
      details: Shadow DOM से CSS isolation, Proxy से JS isolation।
      link: /hi/packages/sandbox
    - name: '@tuvix.js/server'
      details: होस्ट पेज के लिए सर्वर-साइड composition और streaming।
      link: /hi/packages/server
    - name: '@tuvix.js/module-federation'
      details: Webpack Module Federation remotes से माइक्रो ऐप्स लोड करता है।
      link: /hi/packages/module-federation
    - name: '@tuvix.js/devtools'
      details: ऐप्स, routes और events के लिए पेज के अंदर debug पैनल।
      link: /hi/packages/devtools
    - name: '@tuvix.js/react'
      details: React adapter, hooks और सर्वर रेंडरिंग helpers।
      link: /hi/packages/react
    - name: '@tuvix.js/vue'
      details: Vue 3 adapter, composables और सर्वर रेंडरिंग helpers।
      link: /hi/packages/vue
    - name: '@tuvix.js/svelte'
      details: सर्वर रेंडरिंग सपोर्ट वाला Svelte adapter।
      link: /hi/packages/svelte
    - name: '@tuvix.js/angular'
      details: सर्वर रेंडरिंग सपोर्ट वाला Angular adapter।
      link: /hi/packages/angular
    - name: '@tuvix.js/vite'
      details: Vite plugin जो island CSS और modulepreload links को SSR head में डालता है, ताकि सर्वर पर रेंडर हुए माइक्रो ऐप्स पहले paint पर ही styled दिखें।
      link: /hi/packages/vite
    - name: create-tuvix-app
      details: कमांड लाइन से नया होस्ट और माइक्रो ऐप प्रोजेक्ट बनाता है।
      link: /hi/packages/create-tuvix-app

footer:
  tagline: React, Vue, Svelte, Angular और vanilla JS के लिए माइक्रोफ्रंटएंड orchestrator।
  columns:
    - title: डॉक्स
      links:
        - text: शुरुआत करें
          link: /hi/guide/getting-started
        - text: आर्किटेक्चर
          link: /hi/guide/architecture
        - text: कॉन्फ़िगरेशन
          link: /hi/guide/configuration
        - text: Playground
          link: /playground
    - title: पैकेज
      links:
        - text: Core
          link: /hi/packages/core
        - text: Router
          link: /hi/packages/router
        - text: Event bus
          link: /hi/packages/event-bus
        - text: सभी पैकेज
          link: /hi/packages/
    - title: प्रोजेक्ट
      links:
        - text: GitHub
          link: https://github.com/yasinatesim/tuvix.js
        - text: npm
          link: https://www.npmjs.com/org/tuvix.js
        - text: Releases
          link: https://github.com/yasinatesim/tuvix.js/releases
        - text: योगदान
          link: /hi/contributing
  copyright: MIT License · © 2026 Yasin ATEŞ
---
