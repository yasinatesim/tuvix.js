---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Angular 绑定"
  description="把 Angular 15+ 组件变成 Tuvix.js 微应用：默认 zoneless，每个容器一个应用，props 作为组件输入，并在服务端渲染时带上样式。"
  icon="🔺"
  npm="true"
/>

## 安装

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

如果组件没有经过 AOT 编译（JIT），添加 `@angular/compiler`；如果在服务端调用 `renderAngularToString`，在服务端添加 `@angular/platform-server` 和 `@angular/compiler`。客户端适配器需要 Angular 15 或更高版本；服务端渲染器需要 Angular 16 或更高版本。

## 何时使用

当一个 Angular 组件需要作为多个微应用中的一个运行时，使用这个包：编排器在某个路由上把它挂载到容器中，传入 props，更新 props，并在离开时卸载它。多个 Angular 应用，或同一个应用的多个副本，可以共享一个页面，因为每次挂载都有自己的 Angular 应用和自己的宿主元素。适配器从不加载 zone.js，所以 Angular island 不会为旁边的 React 或 Vue 应用修改 `Promise` 或 `addEventListener`。

如果整个页面由 Angular 负责，按常规方式用 `bootstrapApplication` 启动它。这种情况下适配器带不来任何好处。

## 快速开始

一个带输入的独立组件：

```ts
// greeting.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}
```

微应用入口包装这个组件：

```ts
// greeting-app.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { GreetingComponent } from './greeting.component';

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

shell（宿主应用）注册应用并启动编排器：

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'greeting',
  entry: () => import('./greeting-app'),
  container: '#greeting',
  activeWhen: '/hello',
  props: { name: 'Ada' },
});

await orchestrator.start();

// 之后：执行 setInput('name', 'Grace') 和一次变更检测。
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

适配器在 `#greeting` 中创建一个 `<app-greeting>` 宿主元素，更新后显示「Hello Grace」。

## API

### `createAngularMicroApp`

```ts no-check
function createAngularMicroApp<C>(config: AngularMicroAppConfig<C>): MicroAppModule;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 应用名。适配器用 `@tuvix.js/loader` 的 `registerModule` 以这个名字注册模块。 |
| `component` | `Type<C>` | 必填 | 根组件。独立组件可以直接使用。 |
| `module` | `Type<unknown>` | 无 | 声明了 `component` 的 NgModule。适配器通过 `importProvidersFrom` 添加它的 provider。 |
| `providers` | `AngularProviders` | `[]` | 应用的环境 provider，例如 `provideHttpClient()`。 |
| `selector` | `string` | 组件选择器中的元素部分，否则为 `'div'` | 适配器在容器中创建的宿主元素的标签名。 |
| `zone` | `boolean` | `false` | 使用 zone.js 变更检测。你的客户端入口必须先导入 `zone.js`。 |
| `ssr` | `boolean` | `false` | 接管 `renderAngularToString` 输出的标记。参见 `createSsrAngularMicroApp`。 |
| `bootstrap` | `() => void \| Promise<void>` | 无 | 一次性初始化。模块的 `bootstrap()` 会等待它完成。 |

每次 `mount({ container, props })`：

1. 如果 `component` 或 `module` 没有 AOT 定义（`ɵcmp` / `ɵmod`），先加载 `@angular/compiler`，然后加载 `@angular/core` 和 `@angular/platform-browser`。只有当适配器是第一段加载 `@angular/core` 以外的 Angular 包的代码时，这一步才有用。如果你的组件文件导入了 `@angular/common`（`NgIf`、`AsyncPipe`、`CommonModule`）、`@angular/forms`、`@angular/router` 或其他 Angular 库，这些包会在适配器运行之前求值，并以「JIT compilation failed」失败。请把 `import '@angular/compiler'` 保留为客户端入口的第一行，或者使用 AOT 构建。
2. 调用 `createApplication({ providers })`，传入适合你的 Angular 版本的变更检测 provider（参见[变更检测](#change-detection)）、模块的 provider 以及 `providers`。
3. 创建宿主元素（选择器为 `'app-greeting'` 时是 `<app-greeting>`，属性选择器如 `'[card]'` 时是 `<div>`），把它放进容器，并把组件引导到其中。
4. 在第一次变更检测之前，用 `ComponentRef.setInput` 把 props 设置为组件输入，所以 `ngOnInit` 已经能看到它们。在没有 `ComponentFactoryResolver` 的 Angular 版本上，输入在引导完成后立即设置，随后执行一次 tick。
5. 在容器上派发 `tuvix:mounted`。失败时派发 `tuvix:error`，并以原始错误 reject。

`update({ props, container? })` 用 `setInput` 写入新值并执行 `appRef.tick()`，作用于一个容器；省略 `container` 时作用于所有挂载。这在所有 Angular 版本上都会渲染，无论是否 zoneless。

`unmount({ container })` 销毁应用，清空容器，并派发 `tuvix:unmounted`。

一个在 NgModule 中声明的组件：

```ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin/admin.component';
import { AdminModule } from './admin/admin.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  module: AdminModule,
  providers: [provideHttpClient()],
});
```

### `createSsrAngularMicroApp`

```ts no-check
function createSsrAngularMicroApp<C>(config: AngularSsrMicroAppConfig<C>): MicroAppModule;
```

选项与 `createAngularMicroApp` 相同，但没有 `ssr`；它的行为等同于 `createAngularMicroApp({ ...config, ssr: true })`。在客户端用它处理服务端通过 `renderAngularToString` 渲染的 island。

当容器中有服务端标记时，如果宿主元素是容器的直接子元素且标签符合预期，适配器会复用它。Angular 渲染到这个元素中，替换服务端输出的子节点。Angular 把组件样式加入 `<head>` 之后，适配器移除内联的服务端 `<style>` 标签以及宿主元素旁边的其他内容。`tuvix:mounted` 报告 `hydrated: true`。空容器会进行普通的客户端渲染。

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString`

```ts no-check
// import from '@tuvix.js/angular/server'
function renderAngularToString(component: unknown, options?: AngularSsrOptions): Promise<string>;
```

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `props` | `Record<string, unknown>` | `{}` | 以输入名（或别名）为键的输入值。与客户端挂载一样，在第一次变更检测之前设置。不是输入的键会被跳过。 |
| `providers` | `AngularProviders` | `[]` | 服务端渲染使用的环境 provider。 |
| `appId` | `string` | `'ng'`（Angular 的默认值） | Angular 的 `APP_ID`。Angular 把它写入样式标签的 `ng-app-id` 属性。 |
| `document` | `string` | 一个空文档，`<body>` 中有宿主元素 | 用于渲染的 HTML 文档。它必须包含宿主元素。 |
| `selector` | `string` | 组件选择器中的元素部分，否则为 `'app-root'` | 默认文档中宿主元素的标签；Angular 引导到它匹配的元素中。 |

用 `@angular/platform-server` 的 `renderApplication` 渲染独立组件，返回一个片段：渲染结果 `<head>` 中的组件 `<style>` 标签，后面跟着 `<body>` 的内部 HTML。把这个片段放进 `createSsrAngularMicroApp` 挂载的容器中；island 在首次绘制时就有样式。

`props` 在第一次变更检测之前通过 `setInput` 传给组件，与客户端 `mount` 设置它们的方式相同，所以 `ngOnInit` 在两端都能看到它们。把同一个对象传给服务端渲染和客户端挂载，两端就会产生相同的标记。

渲染以 zoneless 方式运行，从不修改全局 `Promise`。它总是先加载 `@angular/compiler`，因为 Node 从 `node_modules` 加载 Angular 包时没有经过 Angular linker。在服务端函数中调用它，不要在同时运行于浏览器的代码中调用：在浏览器中它返回 `''`。

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAboutIsland(): Promise<string> {
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props: { title: 'About us' } });
  return `<section id="about" data-tuvix-app="about">${html}</section>`;
}
```

### 类型

| 类型 | 含义 |
| --- | --- |
| `AngularMicroAppConfig<C>` | `createAngularMicroApp` 的选项。 |
| `AngularSsrMicroAppConfig<C>` | 不含 `ssr` 的 `AngularMicroAppConfig<C>`；`createSsrAngularMicroApp` 的选项。 |
| `AngularSsrOptions` | `renderAngularToString` 的选项。从 `@tuvix.js/angular` 导入这个类型。 |
| `AngularProviders` | `Array<Provider \| EnvironmentProviders>`，即 `createApplication` 和 `bootstrapApplication` 接受的类型。 |

## 变更检测 {#change-detection}

适配器从不导入 zone.js。除非你传入 `zone: true`，它会选择你的 Angular 版本支持的 zoneless 配置：

| Angular | 适配器添加的 provider | 触发变更检测的方式 |
| --- | --- | --- |
| 20 及更高版本 | `provideZonelessChangeDetection()` | 模板事件监听器、signal 写入、`markForCheck()`、`AsyncPipe`、`setInput` |
| 18 和 19 | `provideExperimentalZonelessChangeDetection()` | 与 20 相同 |
| 15 到 17 | 用 `ɵNoopNgZone` 替换 `NgZone` | 自身不会触发。来自宿主的 `update()` 仍会渲染。 |

在 Angular 18 及更高版本上，在 `setTimeout` 或 `fetch` 回调中修改普通字段不会重新渲染模板。把这类状态放进 signal，或者调用 `ChangeDetectorRef.markForCheck()`：

```ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  standalone: true,
  template: `<time>{{ now() }}</time>`,
})
export class ClockComponent {
  readonly now = signal(new Date().toLocaleTimeString());

  constructor() {
    setInterval(() => this.now.set(new Date().toLocaleTimeString()), 1000);
  }
}
```

在 Angular 15 到 17 上，点击和其他 DOM 事件同样不会触发变更检测。修改状态后调用 `ChangeDetectorRef.detectChanges()`：

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="increment()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  increment(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

要保留基于 zone 的变更检测，在适配器挂载之前于客户端入口中导入 zone.js，并传入 `zone: true`。适配器会保留 Angular 默认的 `NgZone`，并在其中引导应用：

```ts
import 'zone.js';
import { createAngularMicroApp } from '@tuvix.js/angular';
import { DashboardComponent } from './dashboard.component';

export default createAngularMicroApp({ name: 'dashboard', component: DashboardComponent, zone: true });
```

zone.js 会为整个页面修改 `Promise`、定时器和 DOM 监听器，包括其他框架的应用。

## 服务端渲染

1. 在服务端调用 `renderAngularToString(Component)`，把片段放进容器元素。
2. 在客户端，从 island 入口导出 `createSsrAngularMicroApp({ name, component })`。
3. 编排器把应用挂载到这个容器中。Angular 渲染到服务端输出的宿主元素中，适配器丢弃服务端样式。

适配器在服务端 DOM 之上重新渲染。它不使用 Angular 的非破坏性水合（`provideClientHydration`），因为那种水合要求整个页面从上到下都由 Angular 渲染：它会在 `<body>` 的直接子节点中查找 Angular 的水合标记注释，并在组件上查找 `ngh` 注解。在由 React、Vue 或普通服务端模板渲染的页面中，island 两者都没有。代价是：可见的标记和样式随 HTML 一起到达，但 island 内部的状态（焦点、已输入的值、滚动位置）在 Angular 接管时会重置，在此之前的点击也不会有任何效果。

把相同的 props 传给服务端渲染和客户端挂载，这样客户端渲染结果与服务端标记一致。渲染不会等待组件发起的 HTTP 请求或定时器：先加载数据，再作为 props 传入。

```ts
// server.ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<{ html: string; props: { text: string } }> {
  const response = await fetch('https://api.example.com/about');
  const props = { text: await response.text() };
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props });
  return { html, props };
}
```

把 `props` 随页面一起发送到浏览器（例如作为 `<script type="application/json">` 标签中的 JSON），并用它们注册应用：

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const props = JSON.parse(document.getElementById('about-props')?.textContent ?? '{}') as Record<string, unknown>;
const orchestrator = createOrchestrator();

orchestrator.register({ name: 'about', entry: () => import('./about-app'), container: '#about', props });
await orchestrator.start();
```

对于不是输入的值，例如 API 基础 URL，改为在两端传入 `providers`。

## 边界情况

- 页面上没有 zone.js 却设置了 `zone: true`，挂载会以 `[tuvix.js/angular] "<name>" sets zone: true, but zone.js is not loaded. Import 'zone.js' in your client entry before mounting, or drop zone: true.` reject，并派发 `tuvix:error`。
- 键不是组件输入的 props 会被跳过，所以 Angular 不会记录 NG0303。输入按公开名称匹配（如果设置了别名，则按别名）。
- 旧 props 中存在、新 props 中缺少的输入会被设为 `undefined`。字段初始化器（`name = ''`）不会再次执行。
- 挂载完成前调用 `update` 会保存 props；等待中的引导使用最新的 props。对这个模块尚未挂载的容器调用 `update({ container })` 不做任何事。
- 在 `mount` 仍在加载 Angular 时调用 `unmount` 会取消挂载：应用被销毁，容器保持为空，也不会触发 `tuvix:mounted`。如果取消发生在引导之后，你会先收到 `tuvix:mounted`，再收到 `tuvix:unmounted`。
- 对同一个容器再次调用 `mount`，会先销毁第一个应用，再引导新应用。
- 对这个模块从未挂载过的容器调用 `unmount` 不做任何事。
- 如果销毁应用时抛错，适配器会清空容器，派发 `tuvix:error`，然后重新抛出错误。
- 使用 SSR 时，如果容器的标记中没有与宿主标签匹配的直接子元素，会得到一个新的宿主元素。`hydrated` 仍为 `true`，因为容器中有标记。
- 在服务端，属性选择器组件（`'[card]'`）会回退到 `<app-root>` 宿主，而选择器并不匹配它。传入一个 `<body>` 中包含匹配元素的 `document`。
- 在 Angular 16 上，`@angular/platform-server` 会在服务端渲染期间把 Domino 的 DOM 类（`Event`、`Node` 等）复制到 Node 全局对象上。这是 Angular 的行为，不是适配器的。
- 没有 Angular 编译器插件的 JIT 组件仍需要 TypeScript 的 `experimentalDecorators`；Angular 不支持标准装饰器提案。

## 它不做什么

- 它不加载 zone.js 或任何其他 polyfill。
- 它不添加 `provideClientHydration()`，也不执行非破坏性水合。
- 它不把服务端 props 发送到浏览器。你需要自己把它们序列化到页面中，并把同一个对象传给客户端挂载。
- 它不等待组件在服务端渲染期间发起的 HTTP 调用、定时器或 `PendingTasks`。
- 客户端接管时，它不保留服务端的 DOM 节点、焦点或表单状态。
- 它不为组件提供 Tuvix 的 props 服务或事件总线。为 props 声明输入，并使用 [`@tuvix.js/event-bus`](/zh/packages/event-bus) 与其他应用通信。

## 从 0.4 迁移

**`createAngularMicroApp` 接受组件。** `platform` 和 `compilerOptions` 已移除。把根组件作为 `component` 传入；如果它在 NgModule 中声明，把该模块作为 `module` 传入。

```ts no-check
// 0.4
createAngularMicroApp({
  name: 'admin',
  module: AppModule,
  platform: platformBrowserDynamic,
  selector: 'app-root',
});
```

```ts
// 0.5
import { createAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

export default createAngularMicroApp({ name: 'admin', component: AppComponent, module: AppModule });
```

**props 就是输入。** `update()` 不再写入 `window.__TUVIX_ANGULAR_PROPS__`。删除读取这个全局变量的服务，改为用 prop 名称声明 `@Input()` 字段。

**默认 zoneless。** 除非传入 `zone: true`，应用都在没有 zone.js 的情况下运行。在 Angular 15 到 17 上，DOM 事件不再触发变更检测；在处理函数中调用 `ChangeDetectorRef.detectChanges()`，或者选择启用 zone.js。你可以从入口中删除 `provideZonelessChangeDetection()`。只有当你的组件文件除 `@angular/core` 外不从 Angular 导入任何内容时，才删除 `import '@angular/compiler'`；否则把它保留为客户端入口的第一行，或者使用 AOT 构建。

**不再自动添加 `provideClientHydration()`。** `createSsrAngularMicroApp` 在服务端标记之上重新渲染。不要把 `provideClientHydration()` 放进它的 `providers`。

**`appId` 生效。** 在 0.4 中，`renderAngularToString` 接受 `appId` 但会忽略它。现在它会设置 Angular 的 `APP_ID`，所以样式标签的 `ng-app-id` 属性会从 `ng` 变为你设置的值。

**宿主元素。** 在客户端和服务端，宿主标签都来自组件选择器，而不是固定的 `'app-root'`，并且客户端适配器会在容器中创建它。对模块从未挂载过的容器调用 `unmount` 不再清空它。

完整应用请参阅 [Angular 指南](/zh/guide/angular)。
