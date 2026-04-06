import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'toast',
    description: 'Auto-dismissing toast notification with type variants',
    tags: ['notification', 'toast', 'auto-dismiss'],
    code: `<template>
  <div class="toast-demo">
    <div class="toast-controls">
      <button v-for="type in types" :key="type" :class="['toast-trigger', type]" @click="showToast(type)">{{ type }}</button>
    </div>
    <transition name="toast-fade">
      <div v-if="visible" :class="['toast', currentType]">
        <span class="toast-icon">{{ icons[currentType] }}</span>
        <span class="toast-msg">{{ messages[currentType] }}</span>
        <button class="toast-close" @click="visible = false">✕</button>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

type ToastType = 'success' | 'error' | 'warning' | 'info';

const ToastNotification = defineComponent({
  name: 'ToastNotification',
  setup() {
    const types: ToastType[] = ['success', 'error', 'warning', 'info'];
    const icons: Record<ToastType, string> = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const messages: Record<ToastType, string> = {
      success: 'Operation completed successfully!',
      error: 'Something went wrong. Please try again.',
      warning: 'Please review before continuing.',
      info: 'New updates are available.',
    };
    const visible = ref(false);
    const currentType = ref<ToastType>('info');
    let timer: ReturnType<typeof setTimeout>;
    const showToast = (type: ToastType) => {
      currentType.value = type;
      visible.value = true;
      clearTimeout(timer);
      timer = setTimeout(() => { visible.value = false; }, 3000);
    };
    return { types, icons, messages, visible, currentType, showToast };
  },
});

export default createVueMicroApp({ name: 'notification', App: ToastNotification });
</script>

<style scoped>
.toast-demo { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
.toast-controls { display: flex; gap: 8px; flex-wrap: wrap; }
.toast-trigger { padding: 7px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; text-transform: capitalize; color: #fff; }
.toast-trigger.success { background: #22c55e; }
.toast-trigger.error { background: #ef4444; }
.toast-trigger.warning { background: #f59e0b; }
.toast-trigger.info { background: #3b82f6; }
.toast { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 8px; font-size: 14px; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.toast.success { background: #f0fdf4; border-left: 4px solid #22c55e; color: #166534; }
.toast.error { background: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b; }
.toast.warning { background: #fffbeb; border-left: 4px solid #f59e0b; color: #92400e; }
.toast.info { background: #eff6ff; border-left: 4px solid #3b82f6; color: #1e40af; }
.toast-icon { font-size: 16px; flex-shrink: 0; }
.toast-msg { flex: 1; }
.toast-close { background: none; border: none; cursor: pointer; opacity: 0.6; font-size: 14px; }
.toast-close:hover { opacity: 1; }
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.25s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateX(20px); }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'alert',
    description: 'Dismissible alert box with severity levels and icon',
    tags: ['notification', 'alert', 'dismissible'],
    code: `<template>
  <div class="alert-stack">
    <div v-for="alert in alerts" :key="alert.id" v-if="alert.visible" :class="['alert-box', alert.severity]">
      <span class="alert-icon">{{ severityIcon[alert.severity] }}</span>
      <div class="alert-body">
        <strong class="alert-title">{{ alert.title }}</strong>
        <p class="alert-desc">{{ alert.message }}</p>
      </div>
      <button class="alert-dismiss" @click="alert.visible = false">✕</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

type Severity = 'success' | 'warning' | 'error' | 'info';

const AlertNotification = defineComponent({
  name: 'AlertNotification',
  setup() {
    const severityIcon: Record<Severity, string> = { success: '✅', warning: '⚠️', error: '🚫', info: 'ℹ️' };
    const alerts = ref([
      { id: 1, severity: 'success' as Severity, title: 'Saved!', message: 'Your changes have been saved.', visible: true },
      { id: 2, severity: 'warning' as Severity, title: 'Low Storage', message: 'You are using 90% of your quota.', visible: true },
      { id: 3, severity: 'error' as Severity, title: 'Upload Failed', message: 'The file could not be uploaded.', visible: true },
      { id: 4, severity: 'info' as Severity, title: 'Tip', message: 'Press Ctrl+K to open the command palette.', visible: true },
    ]);
    return { alerts, severityIcon };
  },
});

export default createVueMicroApp({ name: 'notification', App: AlertNotification });
</script>

<style scoped>
.alert-stack { display: flex; flex-direction: column; gap: 10px; }
.alert-box { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 8px; border: 1px solid transparent; }
.alert-box.success { background: #f0fdf4; border-color: #bbf7d0; }
.alert-box.warning { background: #fffbeb; border-color: #fde68a; }
.alert-box.error { background: #fef2f2; border-color: #fecaca; }
.alert-box.info { background: #eff6ff; border-color: #bfdbfe; }
.alert-icon { font-size: 18px; flex-shrink: 0; }
.alert-body { flex: 1; }
.alert-title { display: block; font-size: 14px; font-weight: 700; margin-bottom: 2px; color: #111827; }
.alert-desc { margin: 0; font-size: 13px; color: #6b7280; }
.alert-dismiss { background: none; border: none; cursor: pointer; font-size: 14px; color: #9ca3af; flex-shrink: 0; }
.alert-dismiss:hover { color: #374151; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'badge',
    description: 'Notification badge with count overlay on icons',
    tags: ['notification', 'badge', 'count', 'indicator'],
    code: `<template>
  <div class="badge-demo">
    <div v-for="item in items" :key="item.label" class="badge-wrapper">
      <span class="badge-icon">{{ item.icon }}</span>
      <span v-if="item.count > 0" :class="['badge', item.count > 99 ? 'badge-wide' : '']">{{ item.count > 99 ? '99+' : item.count }}</span>
      <span class="badge-label">{{ item.label }}</span>
    </div>
    <button class="badge-reset" @click="resetAll">Clear All</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const BadgeNotification = defineComponent({
  name: 'BadgeNotification',
  setup() {
    const items = ref([
      { icon: '🔔', label: 'Alerts', count: 5 },
      { icon: '✉️', label: 'Messages', count: 128 },
      { icon: '📋', label: 'Tasks', count: 0 },
      { icon: '🛒', label: 'Cart', count: 3 },
    ]);
    const resetAll = () => items.value.forEach(i => i.count = 0);
    return { items, resetAll };
  },
});

export default createVueMicroApp({ name: 'notification', App: BadgeNotification });
</script>

<style scoped>
.badge-demo { display: flex; gap: 24px; align-items: flex-end; flex-wrap: wrap; }
.badge-wrapper { display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; }
.badge-icon { font-size: 28px; position: relative; }
.badge { position: absolute; top: -6px; right: -10px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 4px; border: 2px solid #fff; }
.badge-wide { min-width: 28px; }
.badge-label { font-size: 12px; color: #6b7280; }
.badge-reset { margin-top: 8px; padding: 6px 14px; background: #f3f4f6; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; color: #374151; }
.badge-reset:hover { background: #e5e7eb; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'banner',
    description: 'Full-width announcement banner with action button',
    tags: ['notification', 'banner', 'announcement', 'full-width'],
    code: `<template>
  <div class="banner-demo">
    <div v-if="visible" class="banner">
      <span class="banner-icon">📢</span>
      <span class="banner-text">{{ message }}</span>
      <a href="#" class="banner-action" @click.prevent>Learn more</a>
      <button class="banner-dismiss" @click="visible = false" aria-label="Dismiss">✕</button>
    </div>
    <div class="banner-content">
      <p>Page content below the banner.</p>
      <button v-if="!visible" class="btn-restore" @click="visible = true">Restore Banner</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const BannerNotification = defineComponent({
  name: 'BannerNotification',
  setup() {
    const visible = ref(true);
    const message = ref('🎉 New: tuvix.js 2.0 is here with better performance and DX!');
    return { visible, message };
  },
});

export default createVueMicroApp({ name: 'notification', App: BannerNotification });
</script>

<style scoped>
.banner-demo { display: flex; flex-direction: column; }
.banner { display: flex; align-items: center; gap: 12px; padding: 12px 20px; background: linear-gradient(90deg, #6366f1, #8b5cf6); color: #fff; font-size: 14px; }
.banner-icon { font-size: 18px; flex-shrink: 0; }
.banner-text { flex: 1; }
.banner-action { color: #fff; font-weight: 700; text-decoration: underline; white-space: nowrap; }
.banner-dismiss { background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 16px; padding: 2px 6px; }
.banner-dismiss:hover { color: #fff; }
.banner-content { padding: 24px; font-size: 14px; color: #374151; }
.btn-restore { margin-top: 12px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'snackbar',
    description: 'Bottom snackbar with undo action and queue support',
    tags: ['notification', 'snackbar', 'undo', 'action'],
    code: `<template>
  <div class="snackbar-demo">
    <div class="snackbar-triggers">
      <button class="trigger-btn" @click="push('Item deleted')">Delete Item</button>
      <button class="trigger-btn" @click="push('File uploaded successfully')">Upload File</button>
    </div>
    <transition name="snackbar-slide">
      <div v-if="visible" class="snackbar">
        <span class="snackbar-text">{{ currentMessage }}</span>
        <button class="snackbar-undo" @click="undo">Undo</button>
        <button class="snackbar-close" @click="visible = false">✕</button>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SnackbarNotification = defineComponent({
  name: 'SnackbarNotification',
  setup() {
    const visible = ref(false);
    const currentMessage = ref('');
    let timer: ReturnType<typeof setTimeout>;
    const push = (msg: string) => {
      currentMessage.value = msg;
      visible.value = true;
      clearTimeout(timer);
      timer = setTimeout(() => { visible.value = false; }, 4000);
    };
    const undo = () => {
      visible.value = false;
      push('Action undone!');
    };
    return { visible, currentMessage, push, undo };
  },
});

export default createVueMicroApp({ name: 'notification', App: SnackbarNotification });
</script>

<style scoped>
.snackbar-demo { position: relative; min-height: 120px; display: flex; flex-direction: column; }
.snackbar-triggers { display: flex; gap: 10px; }
.trigger-btn { padding: 8px 16px; background: #374151; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
.snackbar { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1f2937; color: #fff; padding: 12px 20px; border-radius: 8px; display: flex; align-items: center; gap: 16px; font-size: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.25); min-width: 300px; z-index: 300; }
.snackbar-text { flex: 1; }
.snackbar-undo { background: none; border: none; color: #a5b4fc; cursor: pointer; font-weight: 700; font-size: 13px; }
.snackbar-undo:hover { color: #c7d2fe; }
.snackbar-close { background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 14px; }
.snackbar-slide-enter-active, .snackbar-slide-leave-active { transition: all 0.3s; }
.snackbar-slide-enter-from, .snackbar-slide-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'progress-bar',
    description: 'Animated progress bar with percentage label and steps',
    tags: ['notification', 'progress', 'loading', 'steps'],
    code: `<template>
  <div class="progress-demo">
    <div v-for="bar in bars" :key="bar.label" class="progress-group">
      <div class="progress-meta">
        <span class="progress-label">{{ bar.label }}</span>
        <span class="progress-pct">{{ bar.value }}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: bar.value + '%', background: bar.color }"></div>
      </div>
    </div>
    <div class="progress-actions">
      <button class="btn-run" @click="animate">Simulate Progress</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ProgressBarNotification = defineComponent({
  name: 'ProgressBarNotification',
  setup() {
    const bars = ref([
      { label: 'Upload', value: 72, color: '#6366f1' },
      { label: 'Processing', value: 45, color: '#f59e0b' },
      { label: 'Validation', value: 90, color: '#22c55e' },
    ]);
    const animate = () => {
      bars.value.forEach(bar => {
        bar.value = Math.min(100, bar.value + Math.floor(Math.random() * 15) + 5);
      });
    };
    return { bars, animate };
  },
});

export default createVueMicroApp({ name: 'notification', App: ProgressBarNotification });
</script>

<style scoped>
.progress-demo { display: flex; flex-direction: column; gap: 16px; }
.progress-group { display: flex; flex-direction: column; gap: 6px; }
.progress-meta { display: flex; justify-content: space-between; }
.progress-label { font-size: 13px; font-weight: 500; color: #374151; }
.progress-pct { font-size: 13px; color: #6b7280; }
.progress-track { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.progress-actions { margin-top: 4px; }
.btn-run { padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'skeleton',
    description: 'Skeleton loading placeholder with animated shimmer',
    tags: ['notification', 'skeleton', 'loading', 'placeholder'],
    code: `<template>
  <div class="skeleton-demo">
    <div class="skeleton-controls">
      <label class="skeleton-toggle">
        <input type="checkbox" v-model="loading" />
        Show Skeleton
      </label>
    </div>
    <div v-if="loading" class="skeleton-card">
      <div class="sk sk-avatar"></div>
      <div class="sk-lines">
        <div class="sk sk-line sk-line-lg"></div>
        <div class="sk sk-line sk-line-md"></div>
        <div class="sk sk-line sk-line-sm"></div>
      </div>
    </div>
    <div v-else class="real-card">
      <div class="real-avatar">JD</div>
      <div class="real-content">
        <p class="real-name">Jane Doe</p>
        <p class="real-role">Senior Engineer</p>
        <p class="real-bio">Building micro-frontends at scale with tuvix.js.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SkeletonLoader = defineComponent({
  name: 'SkeletonLoader',
  setup() {
    const loading = ref(true);
    return { loading };
  },
});

export default createVueMicroApp({ name: 'notification', App: SkeletonLoader });
</script>

<style scoped>
.skeleton-demo { display: flex; flex-direction: column; gap: 16px; }
.skeleton-controls { display: flex; align-items: center; gap: 8px; }
.skeleton-toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; cursor: pointer; }
.skeleton-card { display: flex; gap: 16px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; }
.sk { background: #e5e7eb; border-radius: 4px; animation: shimmer 1.5s infinite; background-size: 200% 100%; background-image: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%); }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.sk-avatar { width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0; }
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 10px; justify-content: center; }
.sk-line { height: 12px; }
.sk-line-lg { width: 70%; }
.sk-line-md { width: 50%; }
.sk-line-sm { width: 35%; }
.real-card { display: flex; gap: 16px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; }
.real-avatar { width: 56px; height: 56px; border-radius: 50%; background: #6366f1; color: #fff; font-weight: 700; font-size: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.real-content { display: flex; flex-direction: column; gap: 2px; }
.real-name { font-size: 16px; font-weight: 700; margin: 0; color: #111827; }
.real-role { font-size: 13px; color: #6366f1; margin: 0; }
.real-bio { font-size: 13px; color: #6b7280; margin: 4px 0 0; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'empty-state',
    description: 'Empty state illustration with call-to-action prompt',
    tags: ['notification', 'empty-state', 'no-data', 'placeholder'],
    code: `<template>
  <div class="empty-state-demo">
    <div v-if="items.length === 0" class="empty-state">
      <div class="empty-illustration">📭</div>
      <h3 class="empty-title">No items yet</h3>
      <p class="empty-desc">Start by creating your first project to get things rolling.</p>
      <button class="empty-cta" @click="addItem">Create Project</button>
    </div>
    <div v-else class="item-list">
      <div v-for="item in items" :key="item" class="item-row">
        <span>📁 {{ item }}</span>
        <button class="item-delete" @click="removeItem(item)">✕</button>
      </div>
      <button class="add-more" @click="addItem">+ Add Another</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const EmptyState = defineComponent({
  name: 'EmptyState',
  setup() {
    const items = ref<string[]>([]);
    let counter = 1;
    const addItem = () => items.value.push(\`Project \${counter++}\`);
    const removeItem = (item: string) => { items.value = items.value.filter(i => i !== item); };
    return { items, addItem, removeItem };
  },
});

export default createVueMicroApp({ name: 'notification', App: EmptyState });
</script>

<style scoped>
.empty-state-demo { min-height: 240px; display: flex; flex-direction: column; }
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; }
.empty-illustration { font-size: 56px; margin-bottom: 16px; }
.empty-title { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px; }
.empty-desc { font-size: 14px; color: #6b7280; margin: 0 0 24px; max-width: 320px; }
.empty-cta { padding: 10px 24px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px; }
.item-list { display: flex; flex-direction: column; gap: 8px; padding: 12px 0; }
.item-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f9fafb; border-radius: 8px; font-size: 14px; color: #374151; }
.item-delete { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 14px; }
.item-delete:hover { color: #ef4444; }
.add-more { margin-top: 4px; padding: 8px; background: none; border: 1px dashed #d1d5db; border-radius: 8px; cursor: pointer; font-size: 14px; color: #6b7280; }
.add-more:hover { border-color: #6366f1; color: #6366f1; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'error-boundary',
    description: 'Error boundary fallback UI with retry capability',
    tags: ['notification', 'error', 'boundary', 'fallback'],
    code: `<template>
  <div class="error-demo">
    <div v-if="hasError" class="error-boundary">
      <div class="error-icon">💥</div>
      <h3 class="error-title">Something went wrong</h3>
      <p class="error-msg">{{ errorMessage }}</p>
      <div class="error-actions">
        <button class="btn-retry" @click="retry">Try Again</button>
        <button class="btn-report" @click="report">Report Issue</button>
      </div>
      <details class="error-details">
        <summary>Technical Details</summary>
        <pre class="error-trace">{{ errorTrace }}</pre>
      </details>
    </div>
    <div v-else class="component-ok">
      <p class="ok-label">✅ Component loaded successfully</p>
      <button class="btn-break" @click="triggerError">Simulate Error</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ErrorBoundaryDemo = defineComponent({
  name: 'ErrorBoundaryDemo',
  setup() {
    const hasError = ref(false);
    const errorMessage = ref('');
    const errorTrace = ref('');
    const triggerError = () => {
      hasError.value = true;
      errorMessage.value = 'Failed to load the requested resource.';
      errorTrace.value = "TypeError: Cannot read property 'data' of undefined\\n  at fetchUser (api.ts:42)\\n  at setup (Component.ts:15)";
    };
    const retry = () => { hasError.value = false; errorMessage.value = ''; };
    const report = () => alert('Error reported to monitoring service.');
    return { hasError, errorMessage, errorTrace, triggerError, retry, report };
  },
});

export default createVueMicroApp({ name: 'notification', App: ErrorBoundaryDemo });
</script>

<style scoped>
.error-demo { min-height: 200px; }
.error-boundary { padding: 32px 24px; border: 1px solid #fecaca; border-radius: 12px; background: #fef2f2; text-align: center; }
.error-icon { font-size: 48px; margin-bottom: 12px; }
.error-title { font-size: 18px; font-weight: 700; color: #991b1b; margin: 0 0 8px; }
.error-msg { font-size: 14px; color: #b91c1c; margin: 0 0 20px; }
.error-actions { display: flex; gap: 10px; justify-content: center; margin-bottom: 16px; }
.btn-retry { padding: 8px 18px; background: #ef4444; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 700; }
.btn-report { padding: 8px 18px; background: #fff; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-weight: 600; }
.error-details { text-align: left; }
.error-details summary { font-size: 13px; color: #6b7280; cursor: pointer; }
.error-trace { font-size: 12px; background: #fff; border: 1px solid #fecaca; border-radius: 4px; padding: 10px; margin-top: 8px; overflow-x: auto; color: #374151; white-space: pre; }
.component-ok { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px; }
.ok-label { font-size: 16px; color: #166534; margin: 0; }
.btn-break { padding: 8px 18px; background: #ef4444; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'spinner',
    description: 'Loading spinner with size and color variants',
    tags: ['notification', 'spinner', 'loading', 'indicator'],
    code: `<template>
  <div class="spinner-demo">
    <div class="spinner-row">
      <div v-for="size in sizes" :key="size.label" class="spinner-item">
        <div :class="['spinner', size.cls]" :style="{ borderTopColor: color }"></div>
        <span class="spinner-label">{{ size.label }}</span>
      </div>
    </div>
    <div class="color-picker">
      <label class="picker-label">Color</label>
      <div class="color-swatches">
        <button
          v-for="c in colors"
          :key="c"
          :class="['swatch', { selected: color === c }]"
          :style="{ background: c }"
          @click="color = c"
        ></button>
      </div>
    </div>
    <div class="overlay-example">
      <button class="btn-load" @click="simulateLoad" :disabled="loading">
        <span v-if="loading" class="btn-spinner" :style="{ borderTopColor: '#fff' }"></span>
        {{ loading ? 'Loading...' : 'Trigger Load' }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SpinnerNotification = defineComponent({
  name: 'SpinnerNotification',
  setup() {
    const sizes = ref([
      { label: 'Small', cls: 'spinner-sm' },
      { label: 'Medium', cls: 'spinner-md' },
      { label: 'Large', cls: 'spinner-lg' },
    ]);
    const colors = ref(['#6366f1', '#22c55e', '#f59e0b', '#ef4444']);
    const color = ref('#6366f1');
    const loading = ref(false);
    const simulateLoad = () => {
      loading.value = true;
      setTimeout(() => { loading.value = false; }, 2000);
    };
    return { sizes, colors, color, loading, simulateLoad };
  },
});

export default createVueMicroApp({ name: 'notification', App: SpinnerNotification });
</script>

<style scoped>
.spinner-demo { display: flex; flex-direction: column; gap: 24px; }
.spinner-row { display: flex; gap: 32px; align-items: flex-end; }
.spinner-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.spinner { border-radius: 50%; border: 3px solid #e5e7eb; animation: spin 0.75s linear infinite; }
.spinner-sm { width: 20px; height: 20px; }
.spinner-md { width: 36px; height: 36px; }
.spinner-lg { width: 52px; height: 52px; border-width: 4px; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinner-label { font-size: 12px; color: #6b7280; }
.color-picker { display: flex; align-items: center; gap: 12px; }
.picker-label { font-size: 13px; color: #374151; font-weight: 500; }
.color-swatches { display: flex; gap: 8px; }
.swatch { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
.swatch.selected { border-color: #111827; }
.btn-load { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.btn-load:disabled { opacity: 0.8; cursor: not-allowed; }
.btn-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); animation: spin 0.75s linear infinite; flex-shrink: 0; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'countdown',
    description: 'Countdown timer notification with days, hours, minutes, seconds',
    tags: ['notification', 'countdown', 'timer', 'deadline'],
    code: `<template>
  <div class="countdown-wrapper">
    <p class="countdown-label">{{ label }}</p>
    <div class="countdown-grid">
      <div v-for="unit in units" :key="unit.name" class="countdown-unit">
        <span class="countdown-value">{{ pad(unit.value) }}</span>
        <span class="countdown-name">{{ unit.name }}</span>
      </div>
    </div>
    <div class="countdown-controls">
      <button class="btn-reset" @click="reset">Reset</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onUnmounted } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const CountdownNotification = defineComponent({
  name: 'CountdownNotification',
  setup() {
    const label = ref('⏰ Sale ends in');
    const target = ref(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000);
    const remaining = ref(target.value - Date.now());

    const units = computed(() => {
      const totalSecs = Math.max(0, Math.floor(remaining.value / 1000));
      return [
        { name: 'Days', value: Math.floor(totalSecs / 86400) },
        { name: 'Hours', value: Math.floor((totalSecs % 86400) / 3600) },
        { name: 'Minutes', value: Math.floor((totalSecs % 3600) / 60) },
        { name: 'Seconds', value: totalSecs % 60 },
      ];
    });

    const pad = (n: number) => String(n).padStart(2, '0');
    const reset = () => { target.value = Date.now() + 3 * 24 * 60 * 60 * 1000; };
    const interval = setInterval(() => { remaining.value = target.value - Date.now(); }, 1000);
    onUnmounted(() => clearInterval(interval));
    return { label, units, pad, reset };
  },
});

export default createVueMicroApp({ name: 'notification', App: CountdownNotification });
</script>

<style scoped>
.countdown-wrapper { display: inline-flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px; background: linear-gradient(135deg, #1e1b4b, #312e81); border-radius: 12px; }
.countdown-label { font-size: 14px; font-weight: 600; color: #c7d2fe; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
.countdown-grid { display: flex; gap: 12px; }
.countdown-unit { display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 16px; min-width: 64px; }
.countdown-value { font-size: 32px; font-weight: 800; color: #fff; font-variant-numeric: tabular-nums; }
.countdown-name { font-size: 10px; font-weight: 600; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }
.countdown-controls { }
.btn-reset { padding: 6px 16px; background: rgba(255,255,255,0.15); color: #e0e7ff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
.btn-reset:hover { background: rgba(255,255,255,0.25); }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'status-chip',
    description: 'Status chip indicators for system or task states',
    tags: ['notification', 'status', 'chip', 'indicator'],
    code: `<template>
  <div class="status-demo">
    <div class="status-grid">
      <div v-for="item in statuses" :key="item.label" class="status-row">
        <span class="status-entity">{{ item.entity }}</span>
        <span :class="['status-chip', item.status]">
          <span class="status-dot"></span>{{ item.label }}
        </span>
      </div>
    </div>
    <button class="btn-cycle" @click="cycle">Cycle Statuses</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

type Status = 'online' | 'offline' | 'pending' | 'error' | 'maintenance';

interface StatusItem { entity: string; label: string; status: Status; }

const StatusChip = defineComponent({
  name: 'StatusChip',
  setup() {
    const statusOptions: { label: string; status: Status }[] = [
      { label: 'Online', status: 'online' },
      { label: 'Offline', status: 'offline' },
      { label: 'Pending', status: 'pending' },
      { label: 'Error', status: 'error' },
      { label: 'Maintenance', status: 'maintenance' },
    ];
    const statuses = ref<StatusItem[]>([
      { entity: 'API Gateway', ...statusOptions[0] },
      { entity: 'Database', ...statusOptions[2] },
      { entity: 'CDN', ...statusOptions[0] },
      { entity: 'Auth Service', ...statusOptions[3] },
      { entity: 'Queue Worker', ...statusOptions[4] },
    ]);
    const cycle = () => {
      statuses.value.forEach(s => {
        const idx = statusOptions.findIndex(o => o.status === s.status);
        const next = statusOptions[(idx + 1) % statusOptions.length];
        s.label = next.label;
        s.status = next.status;
      });
    };
    return { statuses, cycle };
  },
});

export default createVueMicroApp({ name: 'notification', App: StatusChip });
</script>

<style scoped>
.status-demo { display: flex; flex-direction: column; gap: 20px; }
.status-grid { display: flex; flex-direction: column; gap: 10px; }
.status-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f9fafb; border-radius: 8px; }
.status-entity { font-size: 14px; font-weight: 500; color: #374151; }
.status-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-chip.online { background: #dcfce7; color: #166534; }
.status-chip.offline { background: #f3f4f6; color: #6b7280; }
.status-chip.pending { background: #fef3c7; color: #92400e; }
.status-chip.error { background: #fee2e2; color: #991b1b; }
.status-chip.maintenance { background: #e0e7ff; color: #3730a3; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.btn-cycle { align-self: flex-start; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 13px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'inline-alert',
    description: 'Inline form validation alert with field-level messages',
    tags: ['notification', 'inline', 'validation', 'form'],
    code: `<template>
  <form class="inline-form" @submit.prevent="submit">
    <div class="field-group">
      <label class="field-label" for="email">Email</label>
      <input id="email" v-model="email" type="email" :class="['field-input', { error: errors.email }]" placeholder="you@example.com" @blur="validateEmail" />
      <p v-if="errors.email" class="inline-error">{{ errors.email }}</p>
    </div>
    <div class="field-group">
      <label class="field-label" for="pw">Password</label>
      <input id="pw" v-model="password" type="password" :class="['field-input', { error: errors.password }]" placeholder="Min. 8 characters" @blur="validatePassword" />
      <p v-if="errors.password" class="inline-error">{{ errors.password }}</p>
      <div v-if="password && !errors.password" class="strength-bar">
        <div class="strength-fill" :style="{ width: strength + '%', background: strengthColor }"></div>
      </div>
    </div>
    <div v-if="success" class="success-msg">✅ Account created successfully!</div>
    <button type="submit" class="submit-btn">Create Account</button>
  </form>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const InlineAlertForm = defineComponent({
  name: 'InlineAlertForm',
  setup() {
    const email = ref('');
    const password = ref('');
    const errors = ref<Record<string, string>>({});
    const success = ref(false);

    const validateEmail = () => {
      errors.value.email = email.value.includes('@') ? '' : 'Please enter a valid email address.';
    };
    const validatePassword = () => {
      errors.value.password = password.value.length >= 8 ? '' : 'Password must be at least 8 characters.';
    };
    const strength = computed(() => Math.min(100, password.value.length * 8));
    const strengthColor = computed(() => strength.value < 40 ? '#ef4444' : strength.value < 70 ? '#f59e0b' : '#22c55e');
    const submit = () => {
      validateEmail();
      validatePassword();
      if (!errors.value.email && !errors.value.password && email.value && password.value) {
        success.value = true;
      }
    };
    return { email, password, errors, success, validateEmail, validatePassword, strength, strengthColor, submit };
  },
});

export default createVueMicroApp({ name: 'notification', App: InlineAlertForm });
</script>

<style scoped>
.inline-form { display: flex; flex-direction: column; gap: 16px; max-width: 360px; }
.field-group { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 13px; font-weight: 600; color: #374151; }
.field-input { padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; color: #111827; outline: none; }
.field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.field-input.error { border-color: #ef4444; }
.inline-error { font-size: 12px; color: #ef4444; margin: 0; }
.strength-bar { height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden; margin-top: 4px; }
.strength-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
.success-msg { padding: 10px 14px; background: #f0fdf4; border-radius: 6px; font-size: 13px; color: #166534; border: 1px solid #bbf7d0; }
.submit-btn { padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 14px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'floating-notification',
    description: 'Floating notification stack with position controls',
    tags: ['notification', 'floating', 'stack', 'position'],
    code: `<template>
  <div class="float-demo">
    <div class="float-controls">
      <button v-for="type in notifTypes" :key="type.label" class="float-btn" :style="{ background: type.color }" @click="addNotif(type)">{{ type.label }}</button>
    </div>
    <div class="notif-stack">
      <transition-group name="notif-list">
        <div v-for="n in notifications" :key="n.id" :class="['notif-card', n.type]">
          <span class="notif-card-icon">{{ n.icon }}</span>
          <div class="notif-card-body">
            <p class="notif-card-title">{{ n.title }}</p>
            <p class="notif-card-msg">{{ n.message }}</p>
          </div>
          <button class="notif-card-close" @click="remove(n.id)">✕</button>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

interface Notification { id: number; type: string; icon: string; title: string; message: string; }

const FloatingNotification = defineComponent({
  name: 'FloatingNotification',
  setup() {
    const notifTypes = ref([
      { label: '✅ Success', color: '#22c55e', type: 'success', icon: '✅', title: 'Success!', message: 'Your action completed.' },
      { label: '❌ Error', color: '#ef4444', type: 'error', icon: '❌', title: 'Error', message: 'Something went wrong.' },
      { label: '⚠️ Warning', color: '#f59e0b', type: 'warning', icon: '⚠️', title: 'Warning', message: 'Please check your input.' },
    ]);
    const notifications = ref<Notification[]>([]);
    let nextId = 1;
    const addNotif = (type: typeof notifTypes.value[number]) => {
      const id = nextId++;
      notifications.value.unshift({ id, type: type.type, icon: type.icon, title: type.title, message: type.message });
      setTimeout(() => remove(id), 4000);
    };
    const remove = (id: number) => { notifications.value = notifications.value.filter(n => n.id !== id); };
    return { notifTypes, notifications, addNotif, remove };
  },
});

export default createVueMicroApp({ name: 'notification', App: FloatingNotification });
</script>

<style scoped>
.float-demo { display: flex; flex-direction: column; gap: 16px; }
.float-controls { display: flex; gap: 8px; flex-wrap: wrap; }
.float-btn { padding: 8px 14px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; color: #fff; }
.notif-stack { display: flex; flex-direction: column; gap: 8px; max-width: 340px; }
.notif-card { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-left: 4px solid transparent; background: #fff; }
.notif-card.success { border-left-color: #22c55e; }
.notif-card.error { border-left-color: #ef4444; }
.notif-card.warning { border-left-color: #f59e0b; }
.notif-card-icon { font-size: 20px; flex-shrink: 0; }
.notif-card-body { flex: 1; }
.notif-card-title { font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 2px; }
.notif-card-msg { font-size: 13px; color: #6b7280; margin: 0; }
.notif-card-close { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 14px; padding: 0; }
.notif-list-enter-active, .notif-list-leave-active { transition: all 0.3s; }
.notif-list-enter-from { opacity: 0; transform: translateX(40px); }
.notif-list-leave-to { opacity: 0; transform: translateX(40px); }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'announcement',
    description: 'Pinned announcement card with dismiss and read-more states',
    tags: ['notification', 'announcement', 'pinned', 'news'],
    code: `<template>
  <div class="announcement-wrapper">
    <div v-if="!dismissed" class="announcement-card">
      <div class="announcement-header">
        <span class="announcement-tag">📌 Announcement</span>
        <span class="announcement-date">{{ date }}</span>
      </div>
      <h3 class="announcement-title">{{ title }}</h3>
      <p class="announcement-body">{{ expanded ? fullBody : shortBody }}</p>
      <div class="announcement-footer">
        <button class="btn-expand" @click="expanded = !expanded">{{ expanded ? 'Show less' : 'Read more' }}</button>
        <button class="btn-dismiss" @click="dismissed = true">Dismiss</button>
      </div>
    </div>
    <div v-else class="dismissed-state">
      <p>Announcement dismissed.</p>
      <button class="btn-restore" @click="dismissed = false">Show again</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const AnnouncementNotification = defineComponent({
  name: 'AnnouncementNotification',
  setup() {
    const date = ref('April 5, 2026');
    const title = ref('tuvix.js 2.0 — General Availability');
    const shortBody = ref('We are thrilled to announce that tuvix.js 2.0 is now generally available for all users.');
    const fullBody = ref('We are thrilled to announce that tuvix.js 2.0 is now generally available for all users. This release includes a completely rewritten core runtime, 50% smaller bundle size, first-class TypeScript support, and new adapters for React 19, Vue 3.5, Angular 18, and Svelte 5. Upgrade today with pnpm add @tuvix.js/core@latest.');
    const expanded = ref(false);
    const dismissed = ref(false);
    return { date, title, shortBody, fullBody, expanded, dismissed };
  },
});

export default createVueMicroApp({ name: 'notification', App: AnnouncementNotification });
</script>

<style scoped>
.announcement-wrapper { max-width: 480px; }
.announcement-card { border: 1px solid #e0e7ff; border-radius: 10px; background: #f5f3ff; padding: 20px; }
.announcement-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.announcement-tag { font-size: 12px; font-weight: 700; color: #7c3aed; }
.announcement-date { font-size: 12px; color: #9ca3af; }
.announcement-title { font-size: 17px; font-weight: 700; color: #111827; margin: 0 0 8px; }
.announcement-body { font-size: 14px; color: #374151; margin: 0 0 16px; line-height: 1.6; }
.announcement-footer { display: flex; align-items: center; gap: 12px; }
.btn-expand { background: none; border: none; color: #6366f1; font-size: 13px; font-weight: 700; cursor: pointer; padding: 0; }
.btn-dismiss { margin-left: auto; padding: 6px 14px; background: #fff; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 13px; color: #374151; font-weight: 600; }
.dismissed-state { padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
.btn-restore { margin-top: 8px; padding: 6px 14px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
