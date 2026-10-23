---
title: पैकेज
---

# पैकेज

Tuvix.js 15 पैकेज के रूप में आता है: 13 scoped `@tuvix.js/*` लाइब्रेरी, `tuvix.js` अम्ब्रेला पैकेज और `create-tuvix-app` scaffolder। आपका ऐप जिन पैकेज को import करता है, सिर्फ़ उन्हें इंस्टॉल करें।

<PackagesOverview />

## सब कुछ इंस्टॉल करें

```bash
npm install tuvix.js
```

[`tuvix.js` अम्ब्रेला](/hi/packages/tuvix) core, router, event bus, loader और sandbox को re-export करता है। इसमें फ्रेमवर्क adapters, `@tuvix.js/server`, `@tuvix.js/vite`, `@tuvix.js/devtools` या `@tuvix.js/module-federation` शामिल नहीं हैं। इन्हें अलग से इंस्टॉल करें।

## अलग-अलग पैकेज

```bash
# Core
npm install @tuvix.js/core
npm install @tuvix.js/router
npm install @tuvix.js/event-bus
npm install @tuvix.js/loader
npm install @tuvix.js/sandbox

# Framework adapters (install the one each micro app uses)
npm install @tuvix.js/react
npm install @tuvix.js/vue
npm install @tuvix.js/svelte
npm install @tuvix.js/angular

# Server rendering and build tooling
npm install @tuvix.js/server
npm install -D @tuvix.js/vite
npm install @tuvix.js/module-federation
npm install @tuvix.js/devtools

# Scaffold a new project
npx create-tuvix-app my-app
```

pnpm के साथ `npm install` की जगह `pnpm add` लिखें।
