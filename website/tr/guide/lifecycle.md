# Lifecycle Hooks

Her mikro uygulama öngörülebilir bir lifecycle takip eder.

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

İngilizce belgeler için → [Lifecycle Hooks](/guide/lifecycle)
