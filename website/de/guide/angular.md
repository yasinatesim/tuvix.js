# Mit Angular

`@tuvix.js/angular` bietet Angular 15+ Bindings für Tuvix.js.

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/platform-browser-dynamic
```

## TuvixModule

Importieren Sie `TuvixModule` in Ihr Angular-Modul:

```ts
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { TuvixModule } from '@tuvix.js/angular';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, TuvixModule],
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

## Props Empfangen

```ts
// app.component.ts
import { Component, OnInit } from '@angular/core';
import { TuvixPropsService } from '@tuvix.js/angular';

@Component({
  selector: 'app-root',
  template: `<h1>User: {{ userId }}</h1>`,
})
export class AppComponent implements OnInit {
  userId = '';

  constructor(private tuvixProps: TuvixPropsService) {}

  ngOnInit() {
    const props = this.tuvixProps.getProps<{ userId: string }>();
    this.userId = props.userId;
  }
}
```

## TuvixEventService

```ts
import { Component, OnDestroy } from '@angular/core';
import { TuvixEventService } from '@tuvix.js/angular';
import { Subscription } from 'rxjs';

@Component({ template: `<span>{{ count }}</span>` })
export class CartBadgeComponent implements OnDestroy {
  count = 0;
  private sub: Subscription;

  constructor(events: TuvixEventService) {
    this.sub = events.on('cart:updated').subscribe(({ itemCount }) => {
      this.count = itemCount;
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
```
