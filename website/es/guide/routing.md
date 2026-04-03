# Enrutamiento

`@tuvix.js/router` proporciona activación de micro apps basada en URL. Cuando una URL coincide con una ruta, la micro app correspondiente se monta. Cuando la URL cambia, la app se desmonta.

## Configuración

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  mode: 'history', // o 'hash'
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

orchestrator.start();
```

## Coincidencia de Rutas

Las rutas se comparan en orden. La primera coincidencia gana.

| Patrón | Coincide con | Parámetros |
|--------|-------------|------------|
| `/` | `/` | - |
| `/dashboard` | `/dashboard` | - |
| `/users/:id` | `/users/42` | `{ id: '42' }` |
| `/files/*` | `/files/a/b/c` | `{ '*': 'a/b/c' }` |

Los parámetros de ruta se pasan a la micro app como `props.params`:

```ts
// En tu micro app
async mount(container, props) {
  const { id } = (props?.params ?? {}) as { id: string };
  // obtener usuario con id
}
```

## Guards de Navegación

Protege rutas con funciones guard:

```ts
routes: [
  {
    path: '/admin',
    app: 'admin',
    guard: async () => {
      const user = await getUser();
      if (!user.isAdmin) {
        router.navigate('/login');
        return false; // Bloquear navegación
      }
      return true;
    },
  },
],
```

## Navegación Programática

```ts
// Navegar a una ruta
router.navigate('/dashboard');

// Navegar con parámetros de consulta
router.navigate('/search?q=tuvix');

// Reemplazar entrada actual del historial (sin botón atrás)
router.replace('/dashboard');

// Ir atrás / adelante
router.go(-1);
```

## Modo Hash

Usa el modo hash para entornos sin reescritura de URL del lado del servidor (ej. hosting estático sin fallback SPA):

```ts
const router = createRouter({
  orchestrator,
  mode: 'hash',
  routes: [
    { path: '/', app: 'home' },
    { path: '/about', app: 'about' },
  ],
});
// URLs: /#/, /#/about
```

## Ruta Activa

```ts
const currentRoute = router.currentRoute;
// { path: '/dashboard', app: 'dashboard', params: {} }

router.onRouteChange((route) => {
  console.log('Navigated to:', route.path);
});
```
