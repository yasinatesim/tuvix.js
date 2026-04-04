# 使用 Angular

`@tuvix.js/angular` 为 Tuvix.js 提供 Angular 15+ 绑定。

## 安装

```bash
npm install @tuvix.js/angular @angular/core @angular/platform-browser-dynamic
```

## TuvixModule

在你的 Angular 模块中导入 `TuvixModule`：

```ts
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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

## 接收 Props

```ts
// app.component.ts
import { Component, OnInit } from '@angular/core';

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
