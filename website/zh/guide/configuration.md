# 配置

## Orchestrator 选项

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({
  /**
   * 根容器选择器或元素。
   * 微应用挂载在此元素内。
   * @default '#app'
   */
  container: '#app',

  /**
   * 在任何微应用挂载之前调用。
   */
  onBeforeMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * 在微应用挂载之后调用。
   */
  onAfterMount?: (app: RegisteredApp) => void | Promise<void>;

  /**
   * 当微应用在 mount/unmount 期间抛出错误时调用。
   */
  onError?: (error: Error, app: RegisteredApp) => void;
});
```

## 注册微应用

```ts
orchestrator.register('my-app', {
  /**
   * 微应用的 JavaScript 包 URL。
   * 可以是字符串或返回字符串的懒加载函数。
   */
  entry: 'https://cdn.example.com/my-app/main.js',

  /**
   * 可选：挂载时传递给微应用的额外 props。
   */
  props: {
    apiUrl: 'https://api.example.com',
  },

  /**
   * CSS 和 JS 隔离的沙箱选项。
   */
  sandbox: {
    css: true,   // Shadow DOM 样式隔离
    js: false,   // JS Proxy 作用域隔离
  },

  /**
   * 覆盖此特定应用的容器选择器。
   * 回退到 orchestrator 级别的容器。
   */
  container: '#dashboard-container',
});
```

## Router 选项

```ts
import { createRouter } from '@tuvix.js/router';

const router = createRouter({
  orchestrator,

  /**
   * 'history' 使用 History API（默认）。
   * 'hash' 使用 URL 哈希（#/路径）。
   */
  mode: 'history',

  /**
   * 路由定义。
   */
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    {
      path: '/admin',
      app: 'admin',
      /**
       * 守卫函数 - 返回 false 以阻止导航。
       */
      guard: () => checkAuth(),
    },
  ],
});
```

## 沙箱选项

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({
  /**
   * 启用 Shadow DOM CSS 隔离。
   */
  css: true,

  /**
   * 启用 JS Proxy 作用域隔离。
   * 拦截并在卸载时清理 window 访问。
   */
  js: true,
});
```

## 环境变量

Tuvix.js 没有必需的环境变量。所有配置都在代码中完成。

对于生产环境，使用打包工具的 define/replace 插件注入运行时值：

```ts
// vite.config.ts
export default {
  define: {
    __TUVIX_DEBUG__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
};
```
