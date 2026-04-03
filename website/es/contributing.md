# Contribuir a Tuvix.js

¡Gracias por tu interés en contribuir! Ya sea una corrección de errores, una nueva funcionalidad, una mejora en la documentación o una traducción, todas las contribuciones son bienvenidas.

## Formas de Contribuir

- **Reportes de errores** - [Abre un issue](https://github.com/yasinatesim/tuvix.js/issues/new?template=bug_report.md)
- **Solicitudes de funcionalidades** - [Inicia una discusión](https://github.com/yasinatesim/tuvix.js/discussions)
- **Código** - Corrige errores, agrega funcionalidades, mejora pruebas
- **Documentación** - Corrige erratas, agrega ejemplos, mejora la claridad
- **Traducciones** - Agrega o mejora la documentación en otros idiomas

## Primeros Pasos

### 1. Fork y Clone

```bash
git clone https://github.com/TU_USUARIO/tuvix.js.git
cd tuvix.js
```

### 2. Instalar Dependencias

Usamos [pnpm](https://pnpm.io) y [Node.js ≥ 18](https://nodejs.org).

```bash
pnpm install
```

### 3. Compilar Todos los Paquetes

```bash
pnpm build
```

### 4. Ejecutar Pruebas

```bash
pnpm test
```

### 5. Iniciar el Servidor de Desarrollo de Documentación

```bash
cd website
pnpm install
pnpm dev
```

Abre `http://localhost:5173` en tu navegador para previsualizar la documentación.

## Estructura del Proyecto

```
tuvix.js/
├── packages/
│   ├── core/           @tuvix.js/core
│   ├── router/         @tuvix.js/router
│   ├── event-bus/      @tuvix.js/event-bus
│   ├── loader/         @tuvix.js/loader
│   ├── sandbox/        @tuvix.js/sandbox
│   ├── react/          @tuvix.js/react
│   ├── vue/            @tuvix.js/vue
│   ├── svelte/         @tuvix.js/svelte
│   ├── angular/        @tuvix.js/angular
│   ├── devtools/       @tuvix.js/devtools
│   ├── server/         @tuvix.js/server
│   ├── module-federation/
│   ├── create-tuvix-app/
│   └── tuvix/          tuvix.js umbrella
└── website/
    ├── .vitepress/     Configuración y tema de VitePress
    ├── guide/          Documentación en inglés
    ├── packages/       Documentación de API de paquetes
    ├── tr/             Traducciones al turco
    ├── es/             Traducciones al español
    └── ...             Otros idiomas
```

## Estilo de Código

- **TypeScript** - modo estricto, todo el código debe estar tipado
- **Prettier** - ejecuta `pnpm format` para formatear
- **Sin dependencias en tiempo de ejecución** - los paquetes deben tener cero dependencias en tiempo de ejecución
- **Exportaciones con nombre** - evita las exportaciones por defecto
- **Mensajes de error** - prefijar con `[Tuvix ...]`

## Mensajes de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add hash mode to router
fix(sandbox): clean up event listeners on unmount
docs: add Angular guide example
chore: bump vitepress to 1.7.0
test(event-bus): add once() edge case tests
```

## Proceso de Pull Request

1. Crea una rama desde `master`:
   ```bash
   git checkout -b feat/mi-funcionalidad
   ```

2. Realiza tus cambios y agrega pruebas

3. Ejecuta la suite completa de pruebas:
   ```bash
   pnpm test
   pnpm check-types
   pnpm lint
   ```

4. Si tu cambio afecta un paquete publicado, agrega un changeset:
   ```bash
   pnpm changeset
   ```

5. Haz push y abre un PR contra `master`

6. Un mantenedor revisará tu PR. Por favor responde a los comentarios dentro de 7 días.

## Agregar una Traducción

Toda la documentación está en Markdown bajo `website/`. Cada idioma tiene su propio directorio:

```
website/
├── index.md              ← Inglés (raíz)
├── guide/                ← Guías en inglés
├── tr/                   ← Turco
│   ├── index.md
│   ├── guide/
│   └── packages/
├── es/                   ← Español
└── ...
```

### Pasos para agregar o mejorar una traducción

1. Copia los archivos en inglés de `website/guide/` a `website/<lang>/guide/`
2. Traduce el contenido Markdown (mantén los bloques de código en inglés)
3. Actualiza la configuración del sidebar en `website/.vitepress/config/<lang>.ts`
4. Ejecuta `cd website && pnpm dev` para previsualizar

::: tip Consejos de Traducción
- Mantén todos los ejemplos de código en inglés
- Traduce las etiquetas de la interfaz, descripciones y texto explicativo
- Usa terminología nativa cuando existan traducciones estándar
:::

## Idiomas Soportados

| Idioma | Código | Estado |
|--------|--------|--------|
| Inglés | `en` | Completo (referencia) |
| Turco | `tr` | En progreso |
| Español | `es` | En progreso |
| Alemán | `de` | En progreso |
| Francés | `fr` | En progreso |
| Japonés | `ja` | En progreso |
| Chino | `zh` | En progreso |
| Italiano | `it` | En progreso |
| Portugués | `pt` | En progreso |
| Hindi | `hi` | En progreso |

Si deseas contribuir a alguno de estos idiomas, consulta los [issues de traducción abiertos](https://github.com/yasinatesim/tuvix.js/labels/translation) o abre uno nuevo.

## Código de Conducta

Este proyecto sigue el [Contributor Covenant](https://www.contributor-covenant.org/). Sé respetuoso y constructivo.

## Licencia

Al contribuir, aceptas que tus contribuciones serán licenciadas bajo la Licencia MIT.
