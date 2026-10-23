# @tuvix.js/angular

> Tuvix.js 微前端框架的 Angular 15+ 绑定

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) 微前端框架的一部分。

## 安装

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

使用 JIT 组件时添加 `@angular/compiler`。在服务端使用 `renderAngularToString`（Angular 16+）时添加 `@angular/platform-server` 和 `@angular/compiler`。

## 快速开始

```ts
import { Component, Input } from '@angular/core';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

适配器通过 `@tuvix.js/loader` 的 `registerModule` 注册模块。编排器传入的 props 会成为组件的 input：

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'greeting', entry: () => import('./greeting-app'), container: '#greeting', props: { name: 'Ada' } });
await orchestrator.start();
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

## API

### `createAngularMicroApp(config)`

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `name` | `string` | 必填 | 应用名，通过 `registerModule` 注册 |
| `component` | `Type<C>` | 必填 | 根组件 |
| `module` | `Type<unknown>` | 无 | 声明 `component` 的 NgModule；它的 providers 通过 `importProvidersFrom` 添加 |
| `providers` | `AngularProviders` | `[]` | 环境 providers，例如 `provideHttpClient()` |
| `selector` | `string` | 组件 selector 中的元素部分，否则为 `'div'` | 宿主元素标签名 |
| `zone` | `boolean` | `false` | 使用 zone.js；你的入口必须先导入 `zone.js` |
| `ssr` | `boolean` | `false` | 接管 `renderAngularToString` 生成的标记 |
| `bootstrap` | `() => void \| Promise<void>` | 无 | 一次性初始化 |

- 每次挂载都会调用 `createApplication`，并把组件初始化（bootstrap）到容器内它自己的宿主元素中。因此两个 Angular 应用（或同一应用的两个副本）不会在同一个 `app-root` 上冲突。
- props 在第一次变更检测之前通过 `ComponentRef.setInput` 设置，所以 `ngOnInit` 能读到它们。不是 input 的键会被跳过。
- `update({ props, container? })` 设置新的 input，并对一个容器或所有挂载运行 `appRef.tick()`。新 props 中缺少的 input 会重置为 `undefined`。
- JIT 组件（没有 `ɵcmp`）会在 `@angular/platform-browser` 之前加载 `@angular/compiler`。只有当适配器是第一个加载 `@angular/core` 以外的 Angular 包的代码时，这才有用。如果你的组件文件导入了 `@angular/common`（`NgIf`、`AsyncPipe`、`CommonModule`）、`@angular/forms`、`@angular/router` 或其他 Angular 库，这些包会在适配器运行之前求值，并以「JIT compilation failed」失败。请把 `import '@angular/compiler'` 保留为客户端入口的第一行，或者使用 AOT 构建。
- `unmount` 销毁应用、清空容器并派发 `tuvix:unmounted`。如果在 `mount` 仍在加载时调用，它会取消这次挂载。

### `createSsrAngularMicroApp(config)`

等同于 `createAngularMicroApp({ ...config, ssr: true })`。当容器中有服务端标记时，Angular 渲染到服务端的宿主元素中，适配器会移除服务端内联的 `<style>` 标签。`tuvix:mounted` 报告 `hydrated: true`。

这会在服务端 DOM 之上重新渲染。Angular 的非破坏性水合（`provideClientHydration`）需要在 `<body>` 下直接放一个水合标记注释，而嵌在其他页面中的 island 无法提供它，所以适配器不会添加。

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `@tuvix.js/angular/server` 中的 `renderAngularToString(component, options?)`

| 选项 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `providers` | `AngularProviders` | `[]` | 服务端渲染使用的 providers |
| `appId` | `string` | `'ng'` | Angular `APP_ID` |
| `document` | `string` | 带有宿主元素的空文档 | 渲染目标文档 |
| `selector` | `string` | 组件 selector 中的元素部分，否则为 `'app-root'` | 默认文档的宿主标签 |
| `props` | `Record<string, unknown>` | `{}` | 组件 input 的值，在第一次变更检测之前设置 |

返回组件的 `<style>` 标签，后面跟着 body 标记。它以 zoneless 方式运行，从不修改 `Promise`，也不等待组件发起的 HTTP 请求。请在服务端函数中调用它；在浏览器中它返回 `''`。

`props` 的行为与客户端 props 相同：键是 input 名（或别名），不是 input 的键会被跳过，`ngOnInit` 能读到这些值。把同一个对象传给服务端渲染和 `mount`，两端就会渲染出相同的标记。

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

const props = { name: 'Ada' };
const aboutHtml = await renderAngularToString(AboutComponent, { appId: 'about', props });
// Client: aboutApp.mount({ container, props })
```

### 类型

`AngularMicroAppConfig<C>`、`AngularSsrMicroAppConfig<C>`、`AngularSsrOptions`、`AngularProviders`（均来自 `@tuvix.js/angular`）。

## 变更检测

适配器从不导入 zone.js。不设置 `zone: true` 时，它在 Angular 20+ 上添加 `provideZonelessChangeDetection()`，在 18-19 上添加 `provideExperimentalZonelessChangeDetection()`，在 15-17 上用 `ɵNoopNgZone` 替换 `NgZone`。

- Angular 18+：事件监听器、signal、`markForCheck()` 和 `AsyncPipe` 会调度变更检测。在定时器或 `fetch` 回调中修改普通字段不会触发；请使用 signal 或 `markForCheck()`。
- Angular 15-17：DOM 事件不会触发变更检测。修改状态后调用 `ChangeDetectorRef.detectChanges()`，或者传入 `zone: true`。

## 边界情况

- 设置了 `zone: true` 但没有加载 zone.js 时，挂载会被拒绝并派发 `tuvix:error`。
- 对本模块从未挂载过的容器调用 `unmount` 不做任何事。
- 在 Angular 16 上，`@angular/platform-server` 在服务端渲染期间会把 Domino 的 DOM 类（`Event`、`Node` 等）复制到 Node 全局对象上。这是 Angular 的行为，不是适配器的行为。
- 使用属性 selector 的组件在服务端需要一个带有匹配宿主元素的 `document`。

## 它不做什么

- 它不加载 zone.js，不添加 `provideClientHydration()`，也不保留服务端 DOM 节点和表单状态。
- 它不写入 `window.__TUVIX_ANGULAR_PROPS__`；请声明 input。

完整文档：[tuvix.js.org/zh/packages/angular](https://tuvix.js.org/zh/packages/angular)

## 许可证

MIT
