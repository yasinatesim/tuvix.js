# With Angular

`@tuvix.js/angular` provides Angular 15+ bindings for Tuvix.js.

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/platform-browser-dynamic
```

## TuvixModule

Import `TuvixModule` into your Angular module:

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

## createMicroApp

```ts
// src/main.ts
import { createMicroApp } from '@tuvix.js/angular';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';

export const app = createMicroApp({
  module: AppModule,
  component: AppComponent,
});
```

## Receiving Props

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
