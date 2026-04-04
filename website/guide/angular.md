# With Angular

`@tuvix.js/angular` provides Angular 15+ bindings for Tuvix.js.

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/platform-browser-dynamic
```

## Angular Module Setup

Import the Angular module into your app:

```ts
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

## createAngularMicroApp

```ts
// src/main.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

export const app = createAngularMicroApp({
  name: 'angular-app',
  module: AppModule,
  platform: platformBrowserDynamic,
});
```

## Receiving Props

```ts
// app.component.ts
import { Component, OnInit } from '@angular/core';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-root',
  template: `<h1>User: {{ userId }}</h1>`,
})
export class AppComponent implements OnInit {
  userId = '';

  ngOnInit() {
    // Props are passed directly from shell at mount time
    this.userId = (window as any).__tuvixProps?.userId ?? '';
  }
}
```

## Event Bus Integration

```ts
import { Component, OnDestroy } from '@angular/core';
import { getGlobalBus } from '@tuvix.js/event-bus';

@Component({ template: `<span>{{ count }}</span>` })
export class CartBadgeComponent implements OnDestroy {
  count = 0;
  private unsub: () => void;

  constructor() {
    const bus = getGlobalBus();
    this.unsub = bus.on('cart:updated', ({ itemCount }) => {
      this.count = itemCount;
    });
  }

  ngOnDestroy() {
    this.unsub();
  }
}
```
