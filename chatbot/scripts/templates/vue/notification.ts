import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'toast',
    description: 'Auto-dismissing toast notification with type variants',
    tags: ['notification', 'toast', 'auto-dismiss'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ToastNotification = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: ToastNotification,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'alert',
    description: 'Dismissible alert box with severity levels and icon',
    tags: ['notification', 'alert', 'dismissible'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const AlertNotification = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: AlertNotification,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'badge',
    description: 'Notification badge with count overlay on icons',
    tags: ['notification', 'badge', 'count', 'indicator'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const BadgeNotification = defineComponent({
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
  template: \`
    <div class="badge-demo">
    <div v-for="item in items" :key="item.label" class="badge-wrapper">
      <span class="badge-icon">{{ item.icon }}</span>
      <span v-if="item.count > 0" :class="['badge', item.count > 99 ? 'badge-wide' : '']">{{ item.count > 99 ? '99+' : item.count }}</span>
      <span class="badge-label">{{ item.label }}</span>
    </div>
    <button class="badge-reset" @click="resetAll">Clear All</button>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: BadgeNotification,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'banner',
    description: 'Full-width announcement banner with action button',
    tags: ['notification', 'banner', 'announcement', 'full-width'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const BannerNotification = defineComponent({
  setup() {
  const visible = ref(true);
      const message = ref('🎉 New: tuvix.js 2.0 is here with better performance and DX!');
      return { visible, message };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: BannerNotification,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'snackbar',
    description: 'Bottom snackbar with undo action and queue support',
    tags: ['notification', 'snackbar', 'undo', 'action'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const SnackbarNotification = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: SnackbarNotification,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'progress-bar',
    description: 'Animated progress bar with percentage label and steps',
    tags: ['notification', 'progress', 'loading', 'steps'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ProgressBarNotification = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: ProgressBarNotification,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'skeleton',
    description: 'Skeleton loading placeholder with animated shimmer',
    tags: ['notification', 'skeleton', 'loading', 'placeholder'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const SkeletonLoader = defineComponent({
  setup() {
  const loading = ref(true);
      return { loading };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: SkeletonLoader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'empty-state',
    description: 'Empty state illustration with call-to-action prompt',
    tags: ['notification', 'empty-state', 'no-data', 'placeholder'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const EmptyState = defineComponent({
  setup() {
  const items = ref<string[]>([]);
      let counter = 1;
      const addItem = () => items.value.push(\`Project \${counter++}\`);
      const removeItem = (item: string) => { items.value = items.value.filter(i => i !== item); };
      return { items, addItem, removeItem };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: EmptyState,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'error-boundary',
    description: 'Error boundary fallback UI with retry capability',
    tags: ['notification', 'error', 'boundary', 'fallback'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ErrorBoundaryDemo = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: ErrorBoundaryDemo,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'spinner',
    description: 'Loading spinner with size and color variants',
    tags: ['notification', 'spinner', 'loading', 'indicator'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const SpinnerNotification = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: SpinnerNotification,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'countdown',
    description: 'Countdown timer notification with days, hours, minutes, seconds',
    tags: ['notification', 'countdown', 'timer', 'deadline'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed, onUnmounted } from 'vue';

const CountdownNotification = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: CountdownNotification,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'status-chip',
    description: 'Status chip indicators for system or task states',
    tags: ['notification', 'status', 'chip', 'indicator'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const StatusChip = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: StatusChip,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'inline-alert',
    description: 'Inline form validation alert with field-level messages',
    tags: ['notification', 'inline', 'validation', 'form'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const InlineAlertForm = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: InlineAlertForm,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'floating-notification',
    description: 'Floating notification stack with position controls',
    tags: ['notification', 'floating', 'stack', 'position'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const FloatingNotification = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: FloatingNotification,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'announcement',
    description: 'Pinned announcement card with dismiss and read-more states',
    tags: ['notification', 'announcement', 'pinned', 'news'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const AnnouncementNotification = defineComponent({
  setup() {
  const date = ref('April 5, 2026');
      const title = ref('tuvix.js 2.0 — General Availability');
      const shortBody = ref('We are thrilled to announce that tuvix.js 2.0 is now generally available for all users.');
      const fullBody = ref('We are thrilled to announce that tuvix.js 2.0 is now generally available for all users. This release includes a completely rewritten core runtime, 50% smaller bundle size, first-class TypeScript support, and new adapters for React 19, Vue 3.5, Angular 18, and Svelte 5. Upgrade today with pnpm add @tuvix.js/core@latest.');
      const expanded = ref(false);
      const dismissed = ref(false);
      return { date, title, shortBody, fullBody, expanded, dismissed };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'notification',
  App: AnnouncementNotification,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
