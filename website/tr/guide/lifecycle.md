# Lifecycle Hooks

## Genel Bakış

Tuvix.js'teki her mikro uygulama öngörülebilir bir lifecycle takip eder. Orchestrator, lifecycle hook'larını uygun zamanlarda çağırır.

```
register()  →  mount()  →  update()  →  unmount()
```

## mount

Mikro uygulamanın rotası aktif olduğunda çağrılır.

```ts
async mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

## unmount

Rotadan uzaklaşıldığında çağrılır. Temizleme işlemlerini burada yapın.

```ts
async unmount(container: HTMLElement): Promise<void>
```

## update

Shell yeni props geçirdiğinde çağrılır (isteğe bağlı).

```ts
async update(container: HTMLElement, props?: Record<string, unknown>): Promise<void>
```

## Orchestrator Düzeyinde Hook'lar

Shell, lifecycle olaylarını global olarak dinleyebilir:

```ts
const orchestrator = createOrchestrator({
  container: '#app',

  onBeforeMount(app) {
    console.log(`Bağlanıyor: ${app.name}`);
  },

  onAfterMount(app) {
    console.log(`Bağlandı: ${app.name}`);
  },

  onError(error, app) {
    console.error(`${app.name} hatası:`, error);
    app.container.innerHTML = '<p>Yüklenemedi. Lütfen yenileyin.</p>';
  },
});
```
