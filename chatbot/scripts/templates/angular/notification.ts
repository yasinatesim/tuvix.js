import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'toast',
    description: 'Auto-dismissing toast notification with type variants',
    tags: ['notification', 'toast', 'auto-dismiss'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .toast-demo { display: flex; flex-direction: column; gap: 16px; }
    .toast-controls { display: flex; gap: 8px; flex-wrap: wrap; }
    .toast-trigger { padding: 7px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; color: #fff; text-transform: capitalize; }
    .success { background: #22c55e; } .error { background: #ef4444; } .warning { background: #f59e0b; } .info { background: #3b82f6; }
    .toast { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 8px; font-size: 14px; min-width: 280px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .toast.success { background: #f0fdf4; border-left: 4px solid #22c55e; color: #166534; }
    .toast.error { background: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b; }
    .toast.warning { background: #fffbeb; border-left: 4px solid #f59e0b; color: #92400e; }
    .toast.info { background: #eff6ff; border-left: 4px solid #3b82f6; color: #1e40af; }
    .toast-icon { font-size: 16px; flex-shrink: 0; } .toast-msg { flex: 1; }
    .toast-close { background: none; border: none; cursor: pointer; opacity: 0.6; font-size: 14px; }
  \`]
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

@NgModule({ declarations: [ToastComponent], imports: [BrowserModule], bootstrap: [ToastComponent] })
export class ToastModule {}

export default createAngularMicroApp({ name: 'notification', module: ToastModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'alert',
    description: 'Dismissible alert boxes with severity levels',
    tags: ['notification', 'alert', 'dismissible', 'severity'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
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
    .alert-dismiss { background: none; border: none; cursor: pointer; font-size: 14px; color: #9ca3af; }
  \`]
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

@NgModule({ declarations: [AlertComponent], imports: [BrowserModule], bootstrap: [AlertComponent] })
export class AlertModule {}

export default createAngularMicroApp({ name: 'notification', module: AlertModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'badge',
    description: 'Notification badge with count overlay on icon buttons',
    tags: ['notification', 'badge', 'count', 'icon'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .badge-demo { display: flex; gap: 24px; align-items: flex-end; flex-wrap: wrap; }
    .badge-wrapper { display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; }
    .badge-icon { font-size: 28px; position: relative; }
    .badge { position: absolute; top: -6px; right: -10px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 4px; border: 2px solid #fff; }
    .badge-label { font-size: 12px; color: #6b7280; }
    .badge-reset { padding: 6px 14px; background: #f3f4f6; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; color: #374151; }
  \`]
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

@NgModule({ declarations: [BadgeComponent], imports: [BrowserModule], bootstrap: [BadgeComponent] })
export class BadgeModule {}

export default createAngularMicroApp({ name: 'notification', module: BadgeModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'banner',
    description: 'Full-width dismissible announcement banner',
    tags: ['notification', 'banner', 'announcement', 'full-width'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .banner-demo { display: flex; flex-direction: column; }
    .banner { display: flex; align-items: center; gap: 12px; padding: 12px 20px; background: linear-gradient(90deg, #6366f1, #8b5cf6); color: #fff; font-size: 14px; }
    .banner-icon { font-size: 18px; flex-shrink: 0; } .banner-text { flex: 1; }
    .banner-action { color: #fff; font-weight: 700; text-decoration: underline; }
    .banner-dismiss { background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 16px; }
    .banner-content { padding: 24px; font-size: 14px; color: #374151; }
    .btn-restore { margin-top: 12px; padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
  \`]
})
export class BannerComponent {
  visible = true;
  message = '🎉 New: tuvix.js 2.0 is here with better performance and DX!';
}

@NgModule({ declarations: [BannerComponent], imports: [BrowserModule], bootstrap: [BannerComponent] })
export class BannerModule {}

export default createAngularMicroApp({ name: 'notification', module: BannerModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'snackbar',
    description: 'Bottom snackbar with undo action support',
    tags: ['notification', 'snackbar', 'undo', 'bottom'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .snackbar-demo { position: relative; min-height: 80px; display: flex; flex-direction: column; gap: 12px; }
    .snackbar-triggers { display: flex; gap: 10px; }
    .trigger-btn { padding: 8px 16px; background: #374151; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
    .snackbar { background: #1f2937; color: #fff; padding: 12px 20px; border-radius: 8px; display: flex; align-items: center; gap: 16px; font-size: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.25); }
    .snackbar-text { flex: 1; }
    .snackbar-undo { background: none; border: none; color: #a5b4fc; cursor: pointer; font-weight: 700; font-size: 13px; }
    .snackbar-close { background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 14px; }
  \`]
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

@NgModule({ declarations: [SnackbarComponent], imports: [BrowserModule], bootstrap: [SnackbarComponent] })
export class SnackbarModule {}

export default createAngularMicroApp({ name: 'notification', module: SnackbarModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'progress-bar',
    description: 'Animated progress bars with labels and percentage',
    tags: ['notification', 'progress', 'loading', 'percentage'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .progress-demo { display: flex; flex-direction: column; gap: 16px; }
    .progress-group { display: flex; flex-direction: column; gap: 6px; }
    .progress-meta { display: flex; justify-content: space-between; }
    .progress-label { font-size: 13px; font-weight: 500; color: #374151; }
    .progress-pct { font-size: 13px; color: #6b7280; }
    .progress-track { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .btn-run { align-self: flex-start; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
  \`]
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

@NgModule({ declarations: [ProgressBarComponent], imports: [BrowserModule], bootstrap: [ProgressBarComponent] })
export class ProgressBarModule {}

export default createAngularMicroApp({ name: 'notification', module: ProgressBarModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'skeleton',
    description: 'Skeleton loading placeholder with shimmer animation',
    tags: ['notification', 'skeleton', 'loading', 'shimmer'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-skeleton',
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
  styles: [\`
    .skeleton-demo { display: flex; flex-direction: column; gap: 16px; }
    .skeleton-toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
    .skeleton-card { display: flex; gap: 16px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; }
    .sk { background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .sk-avatar { width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0; }
    .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 10px; justify-content: center; }
    .sk-line { height: 12px; }
    .sk-lg { width: 70%; } .sk-md { width: 50%; } .sk-sm { width: 35%; }
    .real-card { display: flex; gap: 16px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; }
    .real-avatar { width: 56px; height: 56px; border-radius: 50%; background: #6366f1; color: #fff; font-weight: 700; font-size: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .real-content { display: flex; flex-direction: column; gap: 2px; }
    .real-name { font-size: 16px; font-weight: 700; margin: 0; color: #111827; }
    .real-role { font-size: 13px; color: #6366f1; margin: 0; }
    .real-bio { font-size: 13px; color: #6b7280; margin: 4px 0 0; }
  \`]
})
export class SkeletonComponent {
  loading = true;
}

import { FormsModule } from '@angular/forms';

@NgModule({ declarations: [SkeletonComponent], imports: [BrowserModule, FormsModule], bootstrap: [SkeletonComponent] })
export class SkeletonModule {}

export default createAngularMicroApp({ name: 'notification', module: SkeletonModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'empty-state',
    description: 'Empty state placeholder with illustration and call-to-action',
    tags: ['notification', 'empty-state', 'no-data', 'cta'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .empty-demo { min-height: 200px; display: flex; flex-direction: column; }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; }
    .empty-icon { font-size: 56px; margin-bottom: 16px; }
    .empty-title { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px; }
    .empty-desc { font-size: 14px; color: #6b7280; margin: 0 0 24px; }
    .empty-cta { padding: 10px 24px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px; }
    .item-list { display: flex; flex-direction: column; gap: 8px; padding: 12px 0; }
    .item-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f9fafb; border-radius: 8px; font-size: 14px; color: #374151; }
    .item-delete { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 14px; }
    .add-more { padding: 8px; background: none; border: 1px dashed #d1d5db; border-radius: 8px; cursor: pointer; font-size: 14px; color: #6b7280; }
  \`]
})
export class EmptyStateComponent {
  items: string[] = [];
  private counter = 1;
  addItem() { this.items.push(\`Project \${this.counter++}\`); }
  remove(item: string) { this.items = this.items.filter(i => i !== item); }
}

@NgModule({ declarations: [EmptyStateComponent], imports: [BrowserModule], bootstrap: [EmptyStateComponent] })
export class EmptyStateModule {}

export default createAngularMicroApp({ name: 'notification', module: EmptyStateModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'error-boundary',
    description: 'Error fallback UI with retry and report actions',
    tags: ['notification', 'error', 'fallback', 'retry'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .error-demo { min-height: 200px; }
    .error-boundary { padding: 32px 24px; border: 1px solid #fecaca; border-radius: 12px; background: #fef2f2; text-align: center; }
    .error-icon { font-size: 48px; margin-bottom: 12px; }
    .error-title { font-size: 18px; font-weight: 700; color: #991b1b; margin: 0 0 8px; }
    .error-msg { font-size: 14px; color: #b91c1c; margin: 0 0 20px; }
    .error-actions { display: flex; gap: 10px; justify-content: center; margin-bottom: 16px; }
    .btn-retry { padding: 8px 18px; background: #ef4444; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 700; }
    .btn-report { padding: 8px 18px; background: #fff; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .error-details summary { font-size: 13px; color: #6b7280; cursor: pointer; }
    .error-trace { font-size: 12px; background: #fff; border: 1px solid #fecaca; border-radius: 4px; padding: 10px; overflow-x: auto; color: #374151; white-space: pre; }
    .component-ok { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px; }
    .ok-label { font-size: 16px; color: #166534; margin: 0; }
    .btn-break { padding: 8px 18px; background: #ef4444; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
  \`]
})
export class ErrorBoundaryComponent {
  hasError = false;
  errorMessage = '';
  errorTrace = '';
  triggerError() {
    this.hasError = true;
    this.errorMessage = 'Failed to load the requested resource.';
    this.errorTrace = "TypeError: Cannot read property 'data' of undefined\n  at fetchUser (api.ts:42)";
  }
  retry() { this.hasError = false; this.errorMessage = ''; }
  report() { alert('Error reported to monitoring service.'); }
}

@NgModule({ declarations: [ErrorBoundaryComponent], imports: [BrowserModule], bootstrap: [ErrorBoundaryComponent] })
export class ErrorBoundaryModule {}

export default createAngularMicroApp({ name: 'notification', module: ErrorBoundaryModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'spinner',
    description: 'Loading spinner with size variants and color selector',
    tags: ['notification', 'spinner', 'loading', 'size-variants'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .spinner-demo { display: flex; flex-direction: column; gap: 24px; }
    .spinner-row { display: flex; gap: 32px; align-items: flex-end; }
    .spinner-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .spinner { border-radius: 50%; border: 3px solid #e5e7eb; animation: spin 0.75s linear infinite; }
    .spinner-sm { width: 20px; height: 20px; } .spinner-md { width: 36px; height: 36px; } .spinner-lg { width: 52px; height: 52px; border-width: 4px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner-label { font-size: 12px; color: #6b7280; }
    .color-picker { display: flex; align-items: center; gap: 12px; }
    .picker-label { font-size: 13px; color: #374151; font-weight: 500; }
    .swatches { display: flex; gap: 8px; }
    .swatch { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
    .swatch.selected { border-color: #111827; }
    .btn-load { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .btn-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); animation: spin 0.75s linear infinite; flex-shrink: 0; }
  \`]
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

@NgModule({ declarations: [SpinnerComponent], imports: [BrowserModule], bootstrap: [SpinnerComponent] })
export class SpinnerModule {}

export default createAngularMicroApp({ name: 'notification', module: SpinnerModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'countdown',
    description: 'Countdown timer with days, hours, minutes, seconds',
    tags: ['notification', 'countdown', 'timer', 'deadline'],
    code: `import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .countdown-wrapper { display: inline-flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px; background: linear-gradient(135deg, #1e1b4b, #312e81); border-radius: 12px; }
    .countdown-label { font-size: 14px; font-weight: 600; color: #c7d2fe; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .countdown-grid { display: flex; gap: 12px; }
    .countdown-unit { display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 16px; min-width: 64px; }
    .countdown-value { font-size: 32px; font-weight: 800; color: #fff; }
    .countdown-name { font-size: 10px; font-weight: 600; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }
    .btn-reset { padding: 6px 16px; background: rgba(255,255,255,0.15); color: #e0e7ff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
  \`]
})
export class CountdownComponent implements OnInit, OnDestroy {
  units: { name: string; value: number }[] = [];
  private target = Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000;
  private interval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.tick();
    this.interval = setInterval(() => this.tick(), 1000);
  }
  ngOnDestroy() { if (this.interval) clearInterval(this.interval); }

  tick() {
    const totalSecs = Math.max(0, Math.floor((this.target - Date.now()) / 1000));
    this.units = [
      { name: 'Days', value: Math.floor(totalSecs / 86400) },
      { name: 'Hours', value: Math.floor((totalSecs % 86400) / 3600) },
      { name: 'Minutes', value: Math.floor((totalSecs % 3600) / 60) },
      { name: 'Seconds', value: totalSecs % 60 },
    ];
  }
  pad(n: number) { return String(n).padStart(2, '0'); }
  reset() { this.target = Date.now() + 3 * 24 * 60 * 60 * 1000; this.tick(); }
}

@NgModule({ declarations: [CountdownComponent], imports: [BrowserModule], bootstrap: [CountdownComponent] })
export class CountdownModule {}

export default createAngularMicroApp({ name: 'notification', module: CountdownModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'status-chip',
    description: 'Status chip indicators for system service states',
    tags: ['notification', 'status', 'chip', 'service'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
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
  \`]
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

@NgModule({ declarations: [StatusChipComponent], imports: [BrowserModule], bootstrap: [StatusChipComponent] })
export class StatusChipModule {}

export default createAngularMicroApp({ name: 'notification', module: StatusChipModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'inline-alert',
    description: 'Inline form validation with field-level error messages',
    tags: ['notification', 'inline', 'validation', 'form'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-inline-alert',
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
  styles: [\`
    .inline-form { display: flex; flex-direction: column; gap: 16px; max-width: 360px; }
    .field-group { display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 13px; font-weight: 600; color: #374151; }
    .field-input { padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; color: #111827; outline: none; }
    .field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .field-input.error { border-color: #ef4444; }
    .inline-error { font-size: 12px; color: #ef4444; margin: 0; }
    .success-msg { padding: 10px 14px; background: #f0fdf4; border-radius: 6px; font-size: 13px; color: #166534; border: 1px solid #bbf7d0; }
    .submit-btn { padding: 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 14px; }
  \`]
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

@NgModule({ declarations: [InlineAlertComponent], imports: [BrowserModule, FormsModule], bootstrap: [InlineAlertComponent] })
export class InlineAlertModule {}

export default createAngularMicroApp({ name: 'notification', module: InlineAlertModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'floating-notification',
    description: 'Floating notification stack with auto-dismiss',
    tags: ['notification', 'floating', 'stack', 'auto-dismiss'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

interface AppNotification { id: number; type: string; icon: string; title: string; message: string; }

@Component({
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
  styles: [\`
    .float-demo { display: flex; flex-direction: column; gap: 16px; }
    .float-controls { display: flex; gap: 8px; flex-wrap: wrap; }
    .float-btn { padding: 8px 14px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; color: #fff; }
    .notif-stack { display: flex; flex-direction: column; gap: 8px; max-width: 340px; }
    .notif-card { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-left: 4px solid transparent; background: #fff; }
    .notif-card.success { border-left-color: #22c55e; }
    .notif-card.error { border-left-color: #ef4444; }
    .notif-card.warning { border-left-color: #f59e0b; }
    .notif-icon { font-size: 20px; flex-shrink: 0; }
    .notif-body { flex: 1; }
    .notif-title { font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 2px; }
    .notif-msg { font-size: 13px; color: #6b7280; margin: 0; }
    .notif-close { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 14px; padding: 0; }
  \`]
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

@NgModule({ declarations: [FloatingNotificationComponent], imports: [BrowserModule], bootstrap: [FloatingNotificationComponent] })
export class FloatingNotificationModule {}

export default createAngularMicroApp({ name: 'notification', module: FloatingNotificationModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'announcement',
    description: 'Pinned announcement card with expand and dismiss',
    tags: ['notification', 'announcement', 'pinned', 'expandable'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
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
  \`]
})
export class AnnouncementComponent {
  date = 'April 5, 2026';
  title = 'tuvix.js 2.0 — General Availability';
  shortBody = 'We are thrilled to announce that tuvix.js 2.0 is now generally available for all users.';
  fullBody = 'We are thrilled to announce that tuvix.js 2.0 is now generally available for all users. This release includes a completely rewritten core runtime, 50% smaller bundle size, first-class TypeScript support, and new adapters for React 19, Vue 3.5, Angular 18, and Svelte 5. Upgrade today with pnpm add @tuvix.js/core@latest.';
  expanded = false;
  dismissed = false;
}

@NgModule({ declarations: [AnnouncementComponent], imports: [BrowserModule], bootstrap: [AnnouncementComponent] })
export class AnnouncementModule {}

export default createAngularMicroApp({ name: 'notification', module: AnnouncementModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
];

export default templates;
