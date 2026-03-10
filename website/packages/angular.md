---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Angular Bindings"
  description="Angular 15+ bindings for Tuvix.js. NgModule, service injection, and RxJS-based event bus integration."
  icon="🔺"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/angular @angular/core @angular/platform-browser-dynamic
```

## API

### `createMicroApp({ module, component })`

```ts
import { createMicroApp } from '@tuvix.js/angular';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';

export const app = createMicroApp({ module: AppModule, component: AppComponent });
```

### `TuvixModule`

Import into your Angular module to enable prop injection and event service:

```ts
import { TuvixModule } from '@tuvix.js/angular';

@NgModule({
  imports: [BrowserModule, TuvixModule],
})
export class AppModule {}
```

### `TuvixPropsService`

Inject shell props into any Angular component or service:

```ts
constructor(private tuvixProps: TuvixPropsService) {
  const props = this.tuvixProps.getProps<{ userId: string }>();
}
```

### `TuvixEventService`

RxJS-based wrapper around the event bus:

```ts
constructor(private events: TuvixEventService) {
  this.events.on('theme:changed').subscribe(({ theme }) => {
    this.currentTheme = theme;
  });
}
```

See the [Angular Guide](/guide/angular) for the full example.
