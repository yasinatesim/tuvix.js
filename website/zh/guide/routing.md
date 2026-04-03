# 路由

`@tuvix.js/router` 提供基于 URL 的微应用激活。当 URL 匹配路由时，对应的微应用被挂载。当 URL 改变时，应用被卸载。

## 设置

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  mode: 'history', // 或 'hash'
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

orchestrator.start();
```

## 路由匹配

路由按顺序匹配。第一个匹配项获胜。

| 模式 | 匹配 | 参数 |
|------|------|------|
| `/` | `/` | - |
| `/dashboard` | `/dashboard` | - |
| `/users/:id` | `/users/42` | `{ id: '42' }` |
| `/files/*` | `/files/a/b/c` | `{ '*': 'a/b/c' }` |

路由参数作为 `props.params` 传递给微应用：

```ts
// 在你的微应用中
async mount(container, props) {
  const { id } = (props?.params ?? {}) as { id: string };
  // 通过 id 获取用户
}
```

## 导航守卫

使用守卫函数保护路由：

```ts
routes: [
  {
    path: '/admin',
    app: 'admin',
    guard: async () => {
      const user = await getUser();
      if (!user.isAdmin) {
        router.navigate('/login');
        return false; // 阻止导航
      }
      return true;
    },
  },
],
```

## 编程式导航

```ts
// 导航到路径
router.navigate('/dashboard');

// 带查询参数导航
router.navigate('/search?q=tuvix');

// 替换当前历史记录条目（无返回按钮）
router.replace('/dashboard');

// 后退 / 前进
router.go(-1);
```

## 哈希模式

在没有服务端 URL 重写的环境中使用哈希模式（例如没有 SPA 回退的静态托管）：

```ts
const router = createRouter({
  orchestrator,
  mode: 'hash',
  routes: [
    { path: '/', app: 'home' },
    { path: '/about', app: 'about' },
  ],
});
// URL: /#/, /#/about
```

## 当前路由

```ts
const currentRoute = router.currentRoute;
// { path: '/dashboard', app: 'dashboard', params: {} }

router.onRouteChange((route) => {
  console.log('Navigated to:', route.path);
});
```
