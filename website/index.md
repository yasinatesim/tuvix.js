---
layout: home

hero:
  name: Tuvix.js
  text: Microfrontend Framework
  tagline: A lightweight, framework-agnostic orchestrator. Build scalable, independently deployable frontend applications with React, Vue, Svelte, Angular or Vanilla JS.
  image:
    src: /logo.svg
    alt: Tuvix.js
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/yasinatesim/tuvix.js
    - theme: alt
      text: Packages
      link: /packages/

features:
  - icon: 🔧
    title: Framework Agnostic
    details: Mix React, Vue, Svelte, Angular, and Vanilla JS micro apps in a single shell - all at the same time.
  - icon: 📦
    title: Zero Runtime Dependencies
    details: Every package ships with zero runtime dependencies. Tree-shakeable and tiny on the wire.
  - icon: 🔀
    title: Built-in Routing
    details: URL-based micro app activation. Mount and unmount apps automatically as the route changes.
  - icon: 📡
    title: Event Bus
    details: Typed publish/subscribe communication between micro apps without shared globals.
  - icon: 🔒
    title: CSS & JS Sandbox
    details: Shadow DOM style isolation and JS Proxy scope isolation. No more style leakage.
  - icon: ⚡
    title: Dynamic Loading
    details: Load micro app bundles on demand with caching, retry logic and error boundaries.
  - icon: 🛠️
    title: DevTools
    details: In-browser debug panel to inspect registered apps, active routes and event bus traffic.
  - icon: 🖥️
    title: SSR Ready
    details: Server-side composition with @tuvix.js/server - pre-render and stitch HTML on the server.
---

## Quick Install

```bash
# Umbrella package (includes everything)
npm install tuvix.js

# Or install individual packages
npm install @tuvix.js/core @tuvix.js/router @tuvix.js/event-bus
```

## 14 Packages · 10 Languages · MIT License

Tuvix.js ships as a collection of focused, independently versioned packages.
Click any package below to explore its API and examples.

<PackagesOverview />
