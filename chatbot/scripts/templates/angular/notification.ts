import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'toast',
    description: 'Auto-dismissing toast notification with type variants',
    tags: ['notification', 'toast', 'auto-dismiss'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-toast',
  template: \`

    <div class="toast-demo">
      <div class="toast-controls">
        <button *ngFor="let type of types" [class]="'toast-trigger ' + type" (click)="show(type)">{{ type }}</button>
      </div>
      <div *ngIf="visible" [class]="'toast ' + currentType">
        <span class="toast-icon">{{ icons[currentType] }}</span>
        <span class="toast-msg">{{ messages[currentType] }}</span>
        <button class="toast-close" (click)="visible = false">✕</button>
      </div>
    </div>
  
  \`,
})
export class ToastComponent {
types = ['success', 'error', 'warning', 'info'];
  icons: Record<string, string> = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  messages: Record<string, string> = {
    success: 'Operation completed!', error: 'Something went wrong.', warning: 'Please review.', info: 'Updates available.',
  };
  visible = false;
  currentType = 'info';
  private timer: ReturnType<typeof setTimeout> | null = null;
  show(type: string) {
    this.currentType = type;
    this.visible = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.visible = false; }, 3000);
  }
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-toast');
    container.appendChild(el);
    await bootstrapApplication(ToastComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'alert',
    description: 'Dismissible alert boxes with severity levels',
    tags: ['notification', 'alert', 'dismissible', 'severity'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-alert',
  template: \`

    <div class="alert-stack">
      <div *ngFor="let alert of alerts" [class]="'alert-box ' + alert.severity" [style.display]="alert.visible ? 'flex' : 'none'">
        <span class="alert-icon">{{ icons[alert.severity] }}</span>
        <div class="alert-body">
          <strong class="alert-title">{{ alert.title }}</strong>
          <p class="alert-desc">{{ alert.message }}</p>
        </div>
        <button class="alert-dismiss" (click)="alert.visible = false">✕</button>
      </div>
    </div>
  
  \`,
})
export class AlertComponent {
icons: Record<string, string> = { success: '✅', warning: '⚠️', error: '🚫', info: 'ℹ️' };
  alerts = [
    { severity: 'success', title: 'Saved!', message: 'Your changes have been saved.', visible: true },
    { severity: 'warning', title: 'Low Storage', message: 'You are at 90% capacity.', visible: true },
    { severity: 'error', title: 'Upload Failed', message: 'The file could not be uploaded.', visible: true },
    { severity: 'info', title: 'Tip', message: 'Press Ctrl+K to open command palette.', visible: true },
  ];
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-alert');
    container.appendChild(el);
    await bootstrapApplication(AlertComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'badge',
    description: 'Notification badge with count overlay on icon buttons',
    tags: ['notification', 'badge', 'count', 'icon'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-badge',
  template: \`

    <div class="badge-demo">
      <div *ngFor="let item of items" class="badge-wrapper">
        <span class="badge-icon">{{ item.icon }}</span>
        <span *ngIf="item.count > 0" class="badge">{{ item.count > 99 ? '99+' : item.count }}</span>
        <span class="badge-label">{{ item.label }}</span>
      </div>
      <button class="badge-reset" (click)="clearAll()">Clear All</button>
    </div>
  
  \`,
})
export class BadgeComponent {
items = [
    { icon: '🔔', label: 'Alerts', count: 5 },
    { icon: '✉️', label: 'Messages', count: 128 },
    { icon: '📋', label: 'Tasks', count: 0 },
    { icon: '🛒', label: 'Cart', count: 3 },
  ];
  clearAll() { this.items.forEach(i => i.count = 0); }
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-badge');
    container.appendChild(el);
    await bootstrapApplication(BadgeComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'banner',
    description: 'Full-width dismissible announcement banner',
    tags: ['notification', 'banner', 'announcement', 'full-width'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-banner',
  template: \`

    <div class="banner-demo">
      <div *ngIf="visible" class="banner">
        <span class="banner-icon">📢</span>
        <span class="banner-text">{{ message }}</span>
        <a href="#" class="banner-action" (click)="$event.preventDefault()">Learn more</a>
        <button class="banner-dismiss" (click)="visible = false">✕</button>
      </div>
      <div class="banner-content">
        <p>Page content below the banner.</p>
        <button *ngIf="!visible" class="btn-restore" (click)="visible = true">Restore Banner</button>
      </div>
    </div>
  
  \`,
})
export class BannerComponent {
visible = true;
  message = '🎉 New: tuvix.js 2.0 is here with better performance and DX!';
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-banner');
    container.appendChild(el);
    await bootstrapApplication(BannerComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'snackbar',
    description: 'Bottom snackbar with undo action support',
    tags: ['notification', 'snackbar', 'undo', 'bottom'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-snackbar',
  template: \`

    <div class="snackbar-demo">
      <div class="snackbar-triggers">
        <button class="trigger-btn" (click)="push('Item deleted')">Delete Item</button>
        <button class="trigger-btn" (click)="push('File uploaded!')">Upload File</button>
      </div>
      <div *ngIf="visible" class="snackbar">
        <span class="snackbar-text">{{ currentMessage }}</span>
        <button class="snackbar-undo" (click)="undo()">Undo</button>
        <button class="snackbar-close" (click)="visible = false">✕</button>
      </div>
    </div>
  
  \`,
})
export class SnackbarComponent {
visible = false;
  currentMessage = '';
  private timer: ReturnType<typeof setTimeout> | null = null;
  push(msg: string) {
    this.currentMessage = msg;
    this.visible = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.visible = false; }, 4000);
  }
  undo() { this.visible = false; this.push('Action undone!'); }
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-snackbar');
    container.appendChild(el);
    await bootstrapApplication(SnackbarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'progress-bar',
    description: 'Animated progress bars with labels and percentage',
    tags: ['notification', 'progress', 'loading', 'percentage'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-progress-bar',
  template: \`

    <div class="progress-demo">
      <div *ngFor="let bar of bars" class="progress-group">
        <div class="progress-meta">
          <span class="progress-label">{{ bar.label }}</span>
          <span class="progress-pct">{{ bar.value }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" [style.width]="bar.value + '%'" [style.background]="bar.color"></div>
        </div>
      </div>
      <button class="btn-run" (click)="animate()">Simulate Progress</button>
    </div>
  
  \`,
})
export class ProgressBarComponent {
bars = [
    { label: 'Upload', value: 72, color: '#6366f1' },
    { label: 'Processing', value: 45, color: '#f59e0b' },
    { label: 'Validation', value: 90, color: '#22c55e' },
  ];
  animate() {
    this.bars.forEach(bar => { bar.value = Math.min(100, bar.value + Math.floor(Math.random() * 15) + 5); });
  }
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-progress-bar');
    container.appendChild(el);
    await bootstrapApplication(ProgressBarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'skeleton',
    description: 'Skeleton loading placeholder with shimmer animation',
    tags: ['notification', 'skeleton', 'loading', 'shimmer'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-skeleton',
  imports: [FormsModule],
  template: \`

    <div class="skeleton-demo">
      <label class="skeleton-toggle">
        <input type="checkbox" [(ngModel)]="loading" />
        Show Skeleton
      </label>
      <div *ngIf="loading" class="skeleton-card">
        <div class="sk sk-avatar"></div>
        <div class="sk-lines">
          <div class="sk sk-line sk-lg"></div>
          <div class="sk sk-line sk-md"></div>
          <div class="sk sk-line sk-sm"></div>
        </div>
      </div>
      <div *ngIf="!loading" class="real-card">
        <div class="real-avatar">JD</div>
        <div class="real-content">
          <p class="real-name">Jane Doe</p>
          <p class="real-role">Senior Engineer</p>
          <p class="real-bio">Building micro-frontends at scale.</p>
        </div>
      </div>
    </div>
  
  \`,
})
export class SkeletonComponent {
loading = true;
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-skeleton');
    container.appendChild(el);
    await bootstrapApplication(SkeletonComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'empty-state',
    description: 'Empty state placeholder with illustration and call-to-action',
    tags: ['notification', 'empty-state', 'no-data', 'cta'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-empty-state',
  template: \`

    <div class="empty-demo">
      <div *ngIf="items.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3 class="empty-title">No items yet</h3>
        <p class="empty-desc">Create your first project to get started.</p>
        <button class="empty-cta" (click)="addItem()">Create Project</button>
      </div>
      <div *ngIf="items.length > 0" class="item-list">
        <div *ngFor="let item of items" class="item-row">
          <span>📁 {{ item }}</span>
          <button class="item-delete" (click)="remove(item)">✕</button>
        </div>
        <button class="add-more" (click)="addItem()">+ Add Another</button>
      </div>
    </div>
  
  \`,
})
export class EmptyStateComponent {
items: string[] = [];
  private counter = 1;
  addItem() { this.items.push(\`Project \${this.counter++}\`); }
  remove(item: string) { this.items = this.items.filter(i => i !== item); }
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-empty-state');
    container.appendChild(el);
    await bootstrapApplication(EmptyStateComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'error-boundary',
    description: 'Error fallback UI with retry and report actions',
    tags: ['notification', 'error', 'fallback', 'retry'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-error-boundary',
  template: \`

    <div class="error-demo">
      <div *ngIf="hasError" class="error-boundary">
        <div class="error-icon">💥</div>
        <h3 class="error-title">Something went wrong</h3>
        <p class="error-msg">{{ errorMessage }}</p>
        <div class="error-actions">
          <button class="btn-retry" (click)="retry()">Try Again</button>
          <button class="btn-report" (click)="report()">Report Issue</button>
        </div>
        <details class="error-details">
          <summary>Technical Details</summary>
          <pre class="error-trace">{{ errorTrace }}</pre>
        </details>
      </div>
      <div *ngIf="!hasError" class="component-ok">
        <p class="ok-label">✅ Component loaded successfully</p>
        <button class="btn-break" (click)="triggerError()">Simulate Error</button>
      </div>
    </div>
  
  \`,
})
export class ErrorBoundaryComponent {
hasError = false;
  errorMessage = '';
  errorTrace = '';
  triggerError() {
    this.hasError = true;
    this.errorMessage = 'Failed to load the requested resource.';
    this.errorTrace = "TypeError: Cannot read property 'data' of undefined\\n  at fetchUser (api.ts:42)";
  }
  retry() { this.hasError = false; this.errorMessage = ''; }
  report() { alert('Error reported to monitoring service.'); }
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-error-boundary');
    container.appendChild(el);
    await bootstrapApplication(ErrorBoundaryComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'spinner',
    description: 'Loading spinner with size variants and color selector',
    tags: ['notification', 'spinner', 'loading', 'size-variants'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-spinner',
  template: \`

    <div class="spinner-demo">
      <div class="spinner-row">
        <div *ngFor="let size of sizes" class="spinner-item">
          <div [class]="'spinner ' + size.cls" [style.borderTopColor]="color"></div>
          <span class="spinner-label">{{ size.label }}</span>
        </div>
      </div>
      <div class="color-picker">
        <span class="picker-label">Color</span>
        <div class="swatches">
          <button *ngFor="let c of colors" [class]="'swatch' + (color === c ? ' selected' : '')" [style.background]="c" (click)="color = c"></button>
        </div>
      </div>
      <button class="btn-load" (click)="simulateLoad()" [disabled]="loading">
        <span *ngIf="loading" class="btn-spinner" style="border-top-color:#fff"></span>
        {{ loading ? 'Loading...' : 'Trigger Load' }}
      </button>
    </div>
  
  \`,
})
export class SpinnerComponent {
sizes = [{ label: 'Small', cls: 'spinner-sm' }, { label: 'Medium', cls: 'spinner-md' }, { label: 'Large', cls: 'spinner-lg' }];
  colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];
  color = '#6366f1';
  loading = false;
  simulateLoad() {
    this.loading = true;
    setTimeout(() => { this.loading = false; }, 2000);
  }
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-spinner');
    container.appendChild(el);
    await bootstrapApplication(SpinnerComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'countdown',
    description: 'Countdown timer with days, hours, minutes, seconds',
    tags: ['notification', 'countdown', 'timer', 'deadline'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-countdown',
  template: \`

    <div class="countdown-wrapper">
      <p class="countdown-label">⏰ Sale ends in</p>
      <div class="countdown-grid">
        <div *ngFor="let unit of units" class="countdown-unit">
          <span class="countdown-value">{{ pad(unit.value) }}</span>
          <span class="countdown-name">{{ unit.name }}</span>
        </div>
      </div>
      <button class="btn-reset" (click)="reset()">Reset</button>
    </div>
  
  \`,
})
export class CountdownComponent {
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-countdown');
    container.appendChild(el);
    await bootstrapApplication(CountdownComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'status-chip',
    description: 'Status chip indicators for system service states',
    tags: ['notification', 'status', 'chip', 'service'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-status-chip',
  template: \`

    <div class="status-demo">
      <div class="status-grid">
        <div *ngFor="let item of statuses" class="status-row">
          <span class="status-entity">{{ item.entity }}</span>
          <span [class]="'status-chip ' + item.status">
            <span class="status-dot"></span>{{ item.label }}
          </span>
        </div>
      </div>
      <button class="btn-cycle" (click)="cycle()">Cycle Statuses</button>
    </div>
  
  \`,
})
export class StatusChipComponent {
private statusOptions = [
    { label: 'Online', status: 'online' },
    { label: 'Offline', status: 'offline' },
    { label: 'Pending', status: 'pending' },
    { label: 'Error', status: 'error' },
    { label: 'Maintenance', status: 'maintenance' },
  ];
  statuses = [
    { entity: 'API Gateway', ...this.statusOptions[0] },
    { entity: 'Database', ...this.statusOptions[2] },
    { entity: 'CDN', ...this.statusOptions[0] },
    { entity: 'Auth Service', ...this.statusOptions[3] },
    { entity: 'Queue Worker', ...this.statusOptions[4] },
  ];
  cycle() {
    this.statuses.forEach(s => {
      const idx = this.statusOptions.findIndex(o => o.status === s.status);
      const next = this.statusOptions[(idx + 1) % this.statusOptions.length];
      s.label = next.label;
      s.status = next.status;
    });
  }
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-status-chip');
    container.appendChild(el);
    await bootstrapApplication(StatusChipComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'inline-alert',
    description: 'Inline form validation with field-level error messages',
    tags: ['notification', 'inline', 'validation', 'form'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-inline-alert',
  imports: [FormsModule],
  template: \`

    <form class="inline-form" (ngSubmit)="submit()">
      <div class="field-group">
        <label class="field-label" for="email">Email</label>
        <input id="email" [(ngModel)]="email" name="email" type="email" [class]="'field-input' + (errors.email ? ' error' : '')" placeholder="you@example.com" (blur)="validateEmail()" />
        <p *ngIf="errors.email" class="inline-error">{{ errors.email }}</p>
      </div>
      <div class="field-group">
        <label class="field-label" for="pw">Password</label>
        <input id="pw" [(ngModel)]="password" name="password" type="password" [class]="'field-input' + (errors.password ? ' error' : '')" placeholder="Min. 8 characters" (blur)="validatePassword()" />
        <p *ngIf="errors.password" class="inline-error">{{ errors.password }}</p>
      </div>
      <div *ngIf="success" class="success-msg">✅ Account created successfully!</div>
      <button type="submit" class="submit-btn">Create Account</button>
    </form>
  
  \`,
})
export class InlineAlertComponent {
email = '';
  password = '';
  errors: Record<string, string> = {};
  success = false;
  validateEmail() { this.errors['email'] = this.email.includes('@') ? '' : 'Please enter a valid email address.'; }
  validatePassword() { this.errors['password'] = this.password.length >= 8 ? '' : 'Password must be at least 8 characters.'; }
  submit() {
    this.validateEmail();
    this.validatePassword();
    if (!this.errors['email'] && !this.errors['password'] && this.email && this.password) {
      this.success = true;
    }
  }
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-inline-alert');
    container.appendChild(el);
    await bootstrapApplication(InlineAlertComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'floating-notification',
    description: 'Floating notification stack with auto-dismiss',
    tags: ['notification', 'floating', 'stack', 'auto-dismiss'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-floating-notification',
  template: \`

    <div class="float-demo">
      <div class="float-controls">
        <button *ngFor="let type of notifTypes" class="float-btn" [style.background]="type.color" (click)="addNotif(type)">{{ type.label }}</button>
      </div>
      <div class="notif-stack">
        <div *ngFor="let n of notifications" [class]="'notif-card ' + n.type">
          <span class="notif-icon">{{ n.icon }}</span>
          <div class="notif-body">
            <p class="notif-title">{{ n.title }}</p>
            <p class="notif-msg">{{ n.message }}</p>
          </div>
          <button class="notif-close" (click)="remove(n.id)">✕</button>
        </div>
      </div>
    </div>
  
  \`,
})
export class FloatingNotificationComponent {
notifTypes = [
    { label: '✅ Success', color: '#22c55e', type: 'success', icon: '✅', title: 'Success!', message: 'Your action completed.' },
    { label: '❌ Error', color: '#ef4444', type: 'error', icon: '❌', title: 'Error', message: 'Something went wrong.' },
    { label: '⚠️ Warning', color: '#f59e0b', type: 'warning', icon: '⚠️', title: 'Warning', message: 'Please check your input.' },
  ];
  notifications: AppNotification[] = [];
  private nextId = 1;
  addNotif(type: typeof this.notifTypes[number]) {
    const id = this.nextId++;
    this.notifications.unshift({ id, type: type.type, icon: type.icon, title: type.title, message: type.message });
    setTimeout(() => this.remove(id), 4000);
  }
  remove(id: number) { this.notifications = this.notifications.filter(n => n.id !== id); }
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-floating-notification');
    container.appendChild(el);
    await bootstrapApplication(FloatingNotificationComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'announcement',
    description: 'Pinned announcement card with expand and dismiss',
    tags: ['notification', 'announcement', 'pinned', 'expandable'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-announcement',
  template: \`

    <div class="announcement-wrapper">
      <div *ngIf="!dismissed" class="announcement-card">
        <div class="announcement-header">
          <span class="announcement-tag">📌 Announcement</span>
          <span class="announcement-date">{{ date }}</span>
        </div>
        <h3 class="announcement-title">{{ title }}</h3>
        <p class="announcement-body">{{ expanded ? fullBody : shortBody }}</p>
        <div class="announcement-footer">
          <button class="btn-expand" (click)="expanded = !expanded">{{ expanded ? 'Show less' : 'Read more' }}</button>
          <button class="btn-dismiss" (click)="dismissed = true">Dismiss</button>
        </div>
      </div>
      <div *ngIf="dismissed" class="dismissed-state">
        <p>Announcement dismissed.</p>
        <button class="btn-restore" (click)="dismissed = false">Show again</button>
      </div>
    </div>
  
  \`,
})
export class AnnouncementComponent {
date = 'April 5, 2026';
  title = 'tuvix.js 2.0 — General Availability';
  shortBody = 'We are thrilled to announce that tuvix.js 2.0 is now generally available for all users.';
  fullBody = 'We are thrilled to announce that tuvix.js 2.0 is now generally available for all users. This release includes a completely rewritten core runtime, 50% smaller bundle size, first-class TypeScript support, and new adapters for React 19, Vue 3.5, Angular 18, and Svelte 5. Upgrade today with pnpm add @tuvix.js/core@latest.';
  expanded = false;
  dismissed = false;
}

const app = defineMicroApp({
  name: 'notification',
  async mount({ container }) {
    const el = document.createElement('app-announcement');
    container.appendChild(el);
    await bootstrapApplication(AnnouncementComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
];

export default templates;
