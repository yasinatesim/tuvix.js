# 搭配 Angular 使用

`@tuvix.js/angular` 把 Angular 组件作为微应用启动，默认不使用 zone.js。它还能在服务端把 standalone 组件渲染为 HTML。

支持 Angular 15 及以上版本。`renderAngularToString` 需要 Angular 16 及以上版本，并安装 `@angular/platform-server`。

## 安装

```bash
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
# JIT 组件（没有 AOT 构建步骤）还需要编译器
pnpm add @angular/compiler
# 使用 renderAngularToString 时需要
pnpm add @angular/platform-server
```

## 把组件变成微应用

```ts
// src/main.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin.component';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  providers: [provideHttpClient()],
});
```

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 必填。必须与注册的应用名称一致。 |
| `component` | `Type<C>` | 必填。根组件，可以是 standalone 组件，也可以在 `module` 中声明。 |
| `module` | `Type<unknown>` | 声明 `component` 的 NgModule。它的 providers 通过 `importProvidersFrom` 导入。 |
| `providers` | `Array<Provider \| EnvironmentProviders>` | 环境 providers。 |
| `selector` | `string` | 宿主元素的标签。默认取组件 selector 中的元素部分，否则为 `div`。 |
| `zone` | `boolean` | 使用 zone.js 变更检测。默认 `false`。 |
| `ssr` | `boolean` | 接管 `renderAngularToString` 生成的标记。`createSsrAngularMicroApp` 会设置它。 |
| `bootstrap` | `() => void \| Promise<void>` | 在首次挂载前运行一次。 |

每次挂载都会调用 `createApplication`，并把组件启动到容器内它自己的宿主元素中。同一页面上的两个 Angular 应用，或同一模块挂载到两个容器，不会在共享的 `app-root` 上冲突。

当组件没有编译后的 `ɵcmp`（JIT）时，适配器会在 `@angular/platform-browser` 之前加载 `@angular/compiler`。只有当适配器是第一段加载 `@angular/core` 以外的 Angular 包的代码时，这一步才有用。如果你的组件文件导入了 `@angular/common`（`NgIf`、`AsyncPipe`、`CommonModule`）、`@angular/forms`、`@angular/router` 或其他 Angular 库，这些包会在适配器运行之前求值，并以「JIT compilation failed」失败。请把 `import '@angular/compiler'` 保留为客户端入口的第一行，或者使用 AOT 构建。

## 用 props 作为输入

把 props 声明为组件输入：

```ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `<h1>Admin for {{ userId }}</h1>`,
})
export class AdminComponent {
  @Input() userId = '';
}
```

- 挂载时在首次变更检测之前通过 `ComponentRef.setInput` 设置输入，所以 `ngOnInit` 能看到它们。
- `update({ props })` 设置新值并运行变更检测。传入 `container` 时，只更新该挂载。
- 不是输入的键会被跳过。新 props 中缺少的输入会重置为 `undefined`。

## 不使用 zone.js 的变更检测

适配器从不导入 zone.js，所以它不会在页面或服务端修补 `Promise`、定时器或 DOM 事件。它根据 Angular 版本选择 provider：

| Angular | Provider | DOM 事件触发变更检测 |
| --- | --- | --- |
| 20+ | `provideZonelessChangeDetection()` | 是 |
| 18-19 | `provideExperimentalZonelessChangeDetection()` | 是 |
| 15-17 | `NgZone` 替换为空操作 zone | 否 |

在 Angular 15-17 上，点击之后没有任何东西运行变更检测。请在处理函数中调用 `detectChanges()`：

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="add()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  add(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

要保留基于 zone 的变更检测，请在客户端入口顶部导入 `zone.js` 并传入 `zone: true`。没有加载 zone.js 时，`mount` 会 reject。

## 服务端渲染

```ts
// server-only module
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<string> {
  return renderAngularToString(AboutComponent, { appId: 'about', props: { userId: '42' } });
}
```

```ts
// client
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export const about = createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

- `renderAngularToString(component, { props?, providers?, appId?, document?, selector? })` 返回组件的 `<style>` 标签，后面跟着宿主元素，所以 island 在首次绘制时就有样式。它以 zoneless 方式运行。
- `props` 在首次变更检测之前设置组件输入，与客户端 `mount` 的做法相同。不是输入的键会被跳过。在客户端给 island 传入相同的 props，否则水合会显示不同的内容。
- 它不会等待组件发起的 HTTP 请求或定时器。请先加载数据，再提供给组件。
- 请在服务端代码中调用它。在浏览器中它返回 `''`。

在客户端，`createSsrAngularMicroApp` 渲染到服务端生成的宿主元素中，在 Angular 添加了自己的样式之后，移除服务端内联的 `<style>` 标签。`tuvix:mounted` 事件报告 `hydrated: true`。这会替换服务端 DOM。Angular 的非破坏性水合需要一个直接位于 `<body>` 下的标记，而嵌在其他页面中的 island 无法提供它，所以适配器不添加 `provideClientHydration()`。

## 事件总线

```ts
import { Component, OnDestroy, signal } from '@angular/core';
import { getGlobalBus } from '@tuvix.js/event-bus';

@Component({
  selector: 'app-cart-badge',
  standalone: true,
  template: `<span>{{ count() }}</span>`,
})
export class CartBadgeComponent implements OnDestroy {
  readonly count = signal(0);
  private readonly off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) =>
    this.count.set(itemCount),
  );

  ngOnDestroy(): void {
    this.off();
  }
}
```

在 Angular 18+ zoneless 模式下，signal 会调度变更检测。在 15-17 上，请在 `set` 之后调用 `ChangeDetectorRef.detectChanges()`。

## 适配器不做什么

- 它不加载 zone.js 或 `@angular/localize`。需要时请在入口中导入它们。
- 它不做非破坏性水合；见上文。
- 它不在多次挂载之间共享状态。每次挂载都是一个独立的 Angular 应用，有自己的根注入器，所以 `providedIn: 'root'` 的服务每次挂载各有一个。

## API

| 导出 | 用途 |
| --- | --- |
| `createAngularMicroApp({ name, component, module?, providers?, selector?, zone?, ssr?, bootstrap? })` | Angular 微应用模块 |
| `createSsrAngularMicroApp(config)` | 同上，带 `ssr: true` |
| 来自 `@tuvix.js/angular/server` 的 `renderAngularToString(component, options?)` | 样式 + 宿主元素 HTML |
