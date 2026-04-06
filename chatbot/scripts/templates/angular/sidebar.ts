import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'collapsible',
    description: 'Collapsible sidebar that toggles between full and icon-only mode',
    tags: ['sidebar', 'collapsible', 'toggle'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-collapsible-sidebar',
  template: \`
    <aside class="sidebar" [class.collapsed]="collapsed">
      <button class="toggle-btn" (click)="collapsed=!collapsed">{{ collapsed ? '\\u25B6' : '\\u25C0' }}</button>
      <nav class="nav">
        <a *ngFor="let item of items" [href]="'#' + item.label.toLowerCase()" class="nav-item">
          <span class="icon">{{ item.icon }}</span>
          <span class="label" *ngIf="!collapsed">{{ item.label }}</span>
        </a>
      </nav>
    </aside>
  \`,
  styles: [\`
    .sidebar { width: 240px; height: 100vh; background: #fff; border-right: 1px solid #e5e7eb; padding: 16px 0; transition: width 0.2s; display: flex; flex-direction: column; }
    .sidebar.collapsed { width: 64px; }
    .toggle-btn { align-self: flex-end; margin: 0 12px 16px; background: none; border: none; cursor: pointer; font-size: 14px; }
    .nav { display: flex; flex-direction: column; gap: 2px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; text-decoration: none; color: #374151; border-radius: 6px; margin: 0 8px; }
    .nav-item:hover { background: #f3f4f6; }
    .icon { font-size: 18px; }
    .label { font-size: 14px; }
  \`]
})
export class CollapsibleSidebarComponent {
  collapsed = false;
  items = [
    { icon: '\\u{1F3E0}', label: 'Home' },
    { icon: '\\u{1F4CA}', label: 'Analytics' },
    { icon: '\\u{1F4C1}', label: 'Projects' },
    { icon: '\\u2699', label: 'Settings' },
  ];
}

@NgModule({
  declarations: [CollapsibleSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [CollapsibleSidebarComponent],
})
export class CollapsibleSidebarModule {}

export default createAngularMicroApp({
  name: 'collapsible-sidebar',
  module: CollapsibleSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-icons',
    description: 'Sidebar with icon-based navigation and active state indicator',
    tags: ['sidebar', 'icons', 'active-state'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-icon-sidebar',
  template: \`
    <aside class="sidebar">
      <div class="brand">App</div>
      <nav class="nav">
        <a *ngFor="let item of items" [href]="'#' + item.label.toLowerCase()" class="nav-item" [class.active]="active===item.label" (click)="active=item.label">
          <span class="icon">{{ item.icon }}</span>
          <span class="label">{{ item.label }}</span>
        </a>
      </nav>
    </aside>
  \`,
  styles: [\`
    .sidebar { width: 220px; height: 100vh; background: #fff; border-right: 1px solid #e5e7eb; padding: 20px 0; }
    .brand { font-size: 18px; font-weight: 700; padding: 0 20px 20px; border-bottom: 1px solid #e5e7eb; margin-bottom: 12px; }
    .nav { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; }
    .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; text-decoration: none; color: #6b7280; border-radius: 6px; }
    .nav-item:hover { background: #f3f4f6; }
    .nav-item.active { background: #ede9fe; color: #6366f1; }
    .icon { font-size: 18px; }
    .label { font-size: 14px; font-weight: 500; }
  \`]
})
export class IconSidebarComponent {
  active = 'Dashboard';
  items = [
    { icon: '\\u{1F4CA}', label: 'Dashboard' },
    { icon: '\\u{1F465}', label: 'Users' },
    { icon: '\\u{1F4E6}', label: 'Products' },
    { icon: '\\u{1F4B0}', label: 'Revenue' },
    { icon: '\\u2699', label: 'Settings' },
  ];
}

@NgModule({
  declarations: [IconSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [IconSidebarComponent],
})
export class IconSidebarModule {}

export default createAngularMicroApp({
  name: 'icon-sidebar',
  module: IconSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'nested',
    description: 'Sidebar with nested expandable sub-menus',
    tags: ['sidebar', 'nested', 'expandable'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-nested-sidebar',
  template: \`
    <aside class="sidebar">
      <div class="brand">Nested Nav</div>
      <nav class="nav">
        <div *ngFor="let group of groups" class="group">
          <button class="group-btn" (click)="toggle(group.label)">
            {{ group.label }}
            <span class="arrow">{{ expanded[group.label] ? '\\u25BC' : '\\u25B6' }}</span>
          </button>
          <div class="sub-items" *ngIf="expanded[group.label]">
            <a *ngFor="let sub of group.children" [href]="'#' + sub.toLowerCase()" class="sub-item">{{ sub }}</a>
          </div>
        </div>
      </nav>
    </aside>
  \`,
  styles: [\`
    .sidebar { width: 240px; height: 100vh; background: #fff; border-right: 1px solid #e5e7eb; padding: 20px 0; }
    .brand { font-size: 18px; font-weight: 700; padding: 0 20px 20px; }
    .nav { display: flex; flex-direction: column; }
    .group-btn { display: flex; justify-content: space-between; width: 100%; padding: 10px 20px; background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 600; color: #374151; text-align: left; }
    .group-btn:hover { background: #f9fafb; }
    .arrow { font-size: 10px; }
    .sub-items { display: flex; flex-direction: column; }
    .sub-item { padding: 8px 20px 8px 36px; text-decoration: none; color: #6b7280; font-size: 13px; }
    .sub-item:hover { color: #6366f1; background: #f3f4f6; }
  \`]
})
export class NestedSidebarComponent {
  expanded: Record<string, boolean> = {};
  groups = [
    { label: 'Dashboard', children: ['Overview', 'Analytics', 'Reports'] },
    { label: 'Content', children: ['Pages', 'Posts', 'Media'] },
    { label: 'Users', children: ['All Users', 'Roles', 'Permissions'] },
  ];
  toggle(label: string) { this.expanded[label] = !this.expanded[label]; }
}

@NgModule({
  declarations: [NestedSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [NestedSidebarComponent],
})
export class NestedSidebarModule {}

export default createAngularMicroApp({
  name: 'nested-sidebar',
  module: NestedSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'mini',
    description: 'Mini sidebar showing only icons with tooltips on hover',
    tags: ['sidebar', 'mini', 'icons'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-mini-sidebar',
  template: \`
    <aside class="sidebar">
      <a *ngFor="let item of items" [href]="'#' + item.label.toLowerCase()" class="nav-item" [title]="item.label" [class.active]="active===item.label" (click)="active=item.label">
        {{ item.icon }}
      </a>
    </aside>
  \`,
  styles: [\`
    .sidebar { width: 56px; height: 100vh; background: #1f2937; display: flex; flex-direction: column; align-items: center; padding: 16px 0; gap: 8px; }
    .nav-item { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 20px; color: #9ca3af; transition: background 0.15s; }
    .nav-item:hover { background: #374151; }
    .nav-item.active { background: #6366f1; color: #fff; }
  \`]
})
export class MiniSidebarComponent {
  active = 'Home';
  items = [
    { icon: '\\u{1F3E0}', label: 'Home' },
    { icon: '\\u{1F50D}', label: 'Search' },
    { icon: '\\u{1F4AC}', label: 'Messages' },
    { icon: '\\u2764', label: 'Favorites' },
    { icon: '\\u{1F464}', label: 'Profile' },
  ];
}

@NgModule({
  declarations: [MiniSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [MiniSidebarComponent],
})
export class MiniSidebarModule {}

export default createAngularMicroApp({
  name: 'mini-sidebar',
  module: MiniSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed sidebar with contrasting text and accent highlight',
    tags: ['sidebar', 'dark', 'theme'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-dark-sidebar',
  template: \`
    <aside class="sidebar">
      <div class="brand">DarkPanel</div>
      <nav class="nav">
        <a *ngFor="let item of items" [href]="'#' + item.toLowerCase()" class="nav-item" [class.active]="active===item" (click)="active=item">{{ item }}</a>
      </nav>
    </aside>
  \`,
  styles: [\`
    .sidebar { width: 220px; height: 100vh; background: #111827; color: #f9fafb; padding: 24px 0; }
    .brand { font-size: 18px; font-weight: 700; padding: 0 20px 24px; color: #818cf8; }
    .nav { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; }
    .nav-item { padding: 10px 12px; text-decoration: none; color: #d1d5db; border-radius: 6px; font-size: 14px; }
    .nav-item:hover { background: #1f2937; }
    .nav-item.active { background: #312e81; color: #c7d2fe; }
  \`]
})
export class DarkSidebarComponent {
  active = 'Dashboard';
  items = ['Dashboard', 'Analytics', 'Customers', 'Products', 'Settings'];
}

@NgModule({
  declarations: [DarkSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [DarkSidebarComponent],
})
export class DarkSidebarModule {}

export default createAngularMicroApp({
  name: 'dark-sidebar',
  module: DarkSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-search',
    description: 'Sidebar with a search input to filter navigation items',
    tags: ['sidebar', 'search', 'filter'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-search-sidebar',
  template: \`
    <aside class="sidebar">
      <div class="search-box">
        <input type="text" placeholder="Search menu..." [value]="query" (input)="onInput($event)" />
      </div>
      <nav class="nav">
        <a *ngFor="let item of filtered" [href]="'#' + item.toLowerCase()" class="nav-item">{{ item }}</a>
      </nav>
    </aside>
  \`,
  styles: [\`
    .sidebar { width: 240px; height: 100vh; background: #fff; border-right: 1px solid #e5e7eb; padding: 16px 0; }
    .search-box { padding: 0 16px 16px; }
    .search-box input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 13px; box-sizing: border-box; }
    .nav { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; }
    .nav-item { padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
    .nav-item:hover { background: #f3f4f6; }
  \`]
})
export class SearchSidebarComponent {
  query = '';
  items = ['Dashboard', 'Users', 'Products', 'Orders', 'Analytics', 'Reports', 'Settings', 'Help'];
  get filtered() { return this.items.filter(i => i.toLowerCase().includes(this.query.toLowerCase())); }
  onInput(e: Event) { this.query = (e.target as HTMLInputElement).value; }
}

@NgModule({
  declarations: [SearchSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [SearchSidebarComponent],
})
export class SearchSidebarModule {}

export default createAngularMicroApp({
  name: 'search-sidebar',
  module: SearchSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-user-profile',
    description: 'Sidebar with user profile section at top and navigation below',
    tags: ['sidebar', 'user', 'profile'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-profile-sidebar',
  template: \`
    <aside class="sidebar">
      <div class="profile">
        <div class="avatar">JD</div>
        <div class="info">
          <div class="name">Jane Doe</div>
          <div class="role">Admin</div>
        </div>
      </div>
      <nav class="nav">
        <a *ngFor="let item of items" [href]="'#' + item.toLowerCase()" class="nav-item">{{ item }}</a>
      </nav>
    </aside>
  \`,
  styles: [\`
    .sidebar { width: 240px; height: 100vh; background: #fff; border-right: 1px solid #e5e7eb; }
    .profile { display: flex; align-items: center; gap: 12px; padding: 20px 16px; border-bottom: 1px solid #e5e7eb; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #6366f1; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; }
    .name { font-size: 14px; font-weight: 600; }
    .role { font-size: 12px; color: #6b7280; }
    .nav { display: flex; flex-direction: column; gap: 2px; padding: 12px 8px; }
    .nav-item { padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
    .nav-item:hover { background: #f3f4f6; }
  \`]
})
export class ProfileSidebarComponent {
  items = ['Dashboard', 'My Projects', 'Team', 'Calendar', 'Documents', 'Settings'];
}

@NgModule({
  declarations: [ProfileSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [ProfileSidebarComponent],
})
export class ProfileSidebarModule {}

export default createAngularMicroApp({
  name: 'profile-sidebar',
  module: ProfileSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-badge',
    description: 'Sidebar with notification badges on navigation items',
    tags: ['sidebar', 'badge', 'notification'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-badge-sidebar',
  template: \`
    <aside class="sidebar">
      <div class="brand">Inbox</div>
      <nav class="nav">
        <a *ngFor="let item of items" [href]="'#' + item.label.toLowerCase()" class="nav-item">
          <span>{{ item.label }}</span>
          <span class="badge" *ngIf="item.count > 0">{{ item.count }}</span>
        </a>
      </nav>
    </aside>
  \`,
  styles: [\`
    .sidebar { width: 240px; height: 100vh; background: #fff; border-right: 1px solid #e5e7eb; padding: 20px 0; }
    .brand { font-size: 18px; font-weight: 700; padding: 0 20px 20px; }
    .nav { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; }
    .nav-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
    .nav-item:hover { background: #f3f4f6; }
    .badge { background: #ef4444; color: #fff; font-size: 11px; border-radius: 10px; padding: 2px 8px; min-width: 20px; text-align: center; }
  \`]
})
export class BadgeSidebarComponent {
  items = [
    { label: 'Inbox', count: 12 },
    { label: 'Sent', count: 0 },
    { label: 'Drafts', count: 3 },
    { label: 'Spam', count: 47 },
    { label: 'Trash', count: 0 },
  ];
}

@NgModule({
  declarations: [BadgeSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [BadgeSidebarComponent],
})
export class BadgeSidebarModule {}

export default createAngularMicroApp({
  name: 'badge-sidebar',
  module: BadgeSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'responsive',
    description: 'Responsive sidebar that collapses to overlay on small screens',
    tags: ['sidebar', 'responsive', 'overlay'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-responsive-sidebar',
  template: \`
    <button class="open-btn" (click)="open=true">\\u2630 Menu</button>
    <div class="overlay" *ngIf="open" (click)="open=false"></div>
    <aside class="sidebar" [class.open]="open">
      <div class="sidebar-header">
        <span class="brand">Menu</span>
        <button class="close-btn" (click)="open=false">\\u2715</button>
      </div>
      <nav class="nav">
        <a *ngFor="let item of items" [href]="'#' + item.toLowerCase()" class="nav-item" (click)="open=false">{{ item }}</a>
      </nav>
    </aside>
  \`,
  styles: [\`
    .open-btn { position: fixed; top: 12px; left: 12px; z-index: 10; padding: 8px 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 40; }
    .sidebar { position: fixed; left: -280px; top: 0; bottom: 0; width: 260px; background: #fff; z-index: 50; padding: 0; transition: left 0.2s; border-right: 1px solid #e5e7eb; }
    .sidebar.open { left: 0; }
    .sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
    .brand { font-weight: 700; font-size: 16px; }
    .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; }
    .nav { display: flex; flex-direction: column; padding: 12px 8px; gap: 2px; }
    .nav-item { padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
    .nav-item:hover { background: #f3f4f6; }
  \`]
})
export class ResponsiveSidebarComponent {
  open = false;
  items = ['Home', 'Dashboard', 'Projects', 'Team', 'Reports', 'Settings'];
}

@NgModule({
  declarations: [ResponsiveSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [ResponsiveSidebarComponent],
})
export class ResponsiveSidebarModule {}

export default createAngularMicroApp({
  name: 'responsive-sidebar',
  module: ResponsiveSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'multi-level',
    description: 'Multi-level sidebar with three levels of nested navigation',
    tags: ['sidebar', 'multi-level', 'deep-nesting'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-multilevel-sidebar',
  template: \`
    <aside class="sidebar">
      <div class="brand">Deep Nav</div>
      <nav class="nav">
        <div *ngFor="let section of sections" class="section">
          <button class="section-btn" (click)="toggleSection(section.label)">{{ section.label }}</button>
          <div *ngIf="expanded[section.label]" class="sub-nav">
            <a *ngFor="let child of section.children" [href]="'#' + child.toLowerCase()" class="sub-item">{{ child }}</a>
          </div>
        </div>
      </nav>
    </aside>
  \`,
  styles: [\`
    .sidebar { width: 250px; height: 100vh; background: #fff; border-right: 1px solid #e5e7eb; padding: 20px 0; overflow-y: auto; }
    .brand { font-size: 18px; font-weight: 700; padding: 0 20px 20px; }
    .section-btn { display: block; width: 100%; padding: 10px 20px; background: none; border: none; text-align: left; font-weight: 600; font-size: 14px; color: #374151; cursor: pointer; }
    .section-btn:hover { background: #f9fafb; }
    .sub-nav { display: flex; flex-direction: column; }
    .sub-item { padding: 8px 20px 8px 36px; text-decoration: none; color: #6b7280; font-size: 13px; }
    .sub-item:hover { color: #6366f1; }
  \`]
})
export class MultiLevelSidebarComponent {
  expanded: Record<string, boolean> = {};
  sections = [
    { label: 'Commerce', children: ['Products', 'Inventory', 'Orders', 'Customers'] },
    { label: 'Marketing', children: ['Campaigns', 'Audience', 'Coupons'] },
    { label: 'System', children: ['Users', 'Roles', 'Logs', 'Integrations'] },
  ];
  toggleSection(label: string) { this.expanded[label] = !this.expanded[label]; }
}

@NgModule({
  declarations: [MultiLevelSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [MultiLevelSidebarComponent],
})
export class MultiLevelSidebarModule {}

export default createAngularMicroApp({
  name: 'multi-level-sidebar',
  module: MultiLevelSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-footer',
    description: 'Sidebar with navigation at top and footer section with version info',
    tags: ['sidebar', 'footer', 'version'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-footer-sidebar',
  template: \`
    <aside class="sidebar">
      <div class="brand">AdminPanel</div>
      <nav class="nav">
        <a *ngFor="let item of items" [href]="'#' + item.toLowerCase()" class="nav-item">{{ item }}</a>
      </nav>
      <div class="footer">
        <div class="version">v2.4.1</div>
        <a href="#help" class="help-link">Help & Support</a>
      </div>
    </aside>
  \`,
  styles: [\`
    .sidebar { width: 240px; height: 100vh; background: #fff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; }
    .brand { font-size: 18px; font-weight: 700; padding: 20px; }
    .nav { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; flex: 1; }
    .nav-item { padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
    .nav-item:hover { background: #f3f4f6; }
    .footer { padding: 16px 20px; border-top: 1px solid #e5e7eb; }
    .version { font-size: 11px; color: #9ca3af; margin-bottom: 8px; }
    .help-link { font-size: 13px; color: #6366f1; text-decoration: none; }
  \`]
})
export class FooterSidebarComponent {
  items = ['Dashboard', 'Analytics', 'Users', 'Content', 'Settings'];
}

@NgModule({
  declarations: [FooterSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [FooterSidebarComponent],
})
export class FooterSidebarModule {}

export default createAngularMicroApp({
  name: 'footer-sidebar',
  module: FooterSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'sticky',
    description: 'Sticky sidebar that stays fixed while main content scrolls',
    tags: ['sidebar', 'sticky', 'fixed'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-sticky-sidebar',
  template: \`
    <aside class="sidebar">
      <div class="brand">Sticky</div>
      <nav class="nav">
        <a *ngFor="let item of items" [href]="'#' + item.toLowerCase()" class="nav-item" [class.active]="active===item" (click)="active=item">{{ item }}</a>
      </nav>
    </aside>
  \`,
  styles: [\`
    .sidebar { position: sticky; top: 0; width: 220px; height: 100vh; background: #fff; border-right: 1px solid #e5e7eb; padding: 20px 0; overflow-y: auto; }
    .brand { font-size: 18px; font-weight: 700; padding: 0 20px 20px; }
    .nav { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; }
    .nav-item { padding: 10px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 14px; }
    .nav-item:hover { background: #f3f4f6; }
    .nav-item.active { background: #ede9fe; color: #6366f1; font-weight: 600; }
  \`]
})
export class StickySidebarComponent {
  active = 'Overview';
  items = ['Overview', 'Metrics', 'Logs', 'Alerts', 'Config'];
}

@NgModule({
  declarations: [StickySidebarComponent],
  imports: [BrowserModule],
  bootstrap: [StickySidebarComponent],
})
export class StickySidebarModule {}

export default createAngularMicroApp({
  name: 'sticky-sidebar',
  module: StickySidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-groups',
    description: 'Sidebar with labeled group sections separating navigation items',
    tags: ['sidebar', 'groups', 'sections'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-groups-sidebar',
  template: \`
    <aside class="sidebar">
      <div *ngFor="let group of groups" class="group">
        <div class="group-label">{{ group.label }}</div>
        <a *ngFor="let item of group.items" [href]="'#' + item.toLowerCase()" class="nav-item">{{ item }}</a>
      </div>
    </aside>
  \`,
  styles: [\`
    .sidebar { width: 240px; height: 100vh; background: #fff; border-right: 1px solid #e5e7eb; padding: 16px 0; }
    .group { margin-bottom: 16px; }
    .group-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; padding: 0 20px 8px; letter-spacing: 0.05em; }
    .nav-item { display: block; padding: 8px 20px; text-decoration: none; color: #374151; font-size: 14px; }
    .nav-item:hover { background: #f3f4f6; }
  \`]
})
export class GroupsSidebarComponent {
  groups = [
    { label: 'General', items: ['Dashboard', 'Profile', 'Notifications'] },
    { label: 'Management', items: ['Users', 'Teams', 'Billing'] },
    { label: 'Support', items: ['Tickets', 'Knowledge Base', 'Contact'] },
  ];
}

@NgModule({
  declarations: [GroupsSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [GroupsSidebarComponent],
})
export class GroupsSidebarModule {}

export default createAngularMicroApp({
  name: 'groups-sidebar',
  module: GroupsSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'overlay',
    description: 'Overlay sidebar that slides over content with a backdrop',
    tags: ['sidebar', 'overlay', 'backdrop'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-overlay-sidebar',
  template: \`
    <button class="open-btn" (click)="open=true">Open Menu</button>
    <div class="overlay-container" *ngIf="open">
      <div class="backdrop" (click)="open=false"></div>
      <aside class="sidebar">
        <div class="header">
          <span class="title">Menu</span>
          <button class="close-btn" (click)="open=false">\\u2715</button>
        </div>
        <nav class="nav">
          <a *ngFor="let item of items" [href]="'#' + item.toLowerCase()" class="nav-item" (click)="open=false">{{ item }}</a>
        </nav>
      </aside>
    </div>
  \`,
  styles: [\`
    .open-btn { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .overlay-container { position: fixed; inset: 0; z-index: 50; display: flex; }
    .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
    .sidebar { position: relative; width: 300px; height: 100%; background: #fff; box-shadow: 4px 0 12px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
    .title { font-size: 16px; font-weight: 700; }
    .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; }
    .nav { display: flex; flex-direction: column; padding: 12px 8px; gap: 2px; }
    .nav-item { padding: 12px 12px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 15px; }
    .nav-item:hover { background: #f3f4f6; }
  \`]
})
export class OverlaySidebarComponent {
  open = false;
  items = ['Home', 'Products', 'Services', 'Portfolio', 'About', 'Contact'];
}

@NgModule({
  declarations: [OverlaySidebarComponent],
  imports: [BrowserModule],
  bootstrap: [OverlaySidebarComponent],
})
export class OverlaySidebarModule {}

export default createAngularMicroApp({
  name: 'overlay-sidebar',
  module: OverlaySidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-toggle',
    description: 'Sidebar with a toggle switch for compact mode',
    tags: ['sidebar', 'toggle', 'compact'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-toggle-sidebar',
  template: \`
    <aside class="sidebar" [class.compact]="compact">
      <div class="top">
        <span class="brand" *ngIf="!compact">Navigation</span>
        <button class="toggle-btn" (click)="compact=!compact">{{ compact ? '\\u25B6' : '\\u25C0' }}</button>
      </div>
      <nav class="nav">
        <a *ngFor="let item of items" [href]="'#' + item.label.toLowerCase()" class="nav-item" [title]="item.label">
          <span class="icon">{{ item.icon }}</span>
          <span class="label" *ngIf="!compact">{{ item.label }}</span>
        </a>
      </nav>
    </aside>
  \`,
  styles: [\`
    .sidebar { width: 240px; height: 100vh; background: #fff; border-right: 1px solid #e5e7eb; transition: width 0.2s; display: flex; flex-direction: column; }
    .sidebar.compact { width: 60px; }
    .top { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e5e7eb; }
    .brand { font-weight: 700; font-size: 15px; }
    .toggle-btn { background: none; border: none; cursor: pointer; font-size: 12px; }
    .nav { display: flex; flex-direction: column; gap: 2px; padding: 8px; }
    .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 8px; text-decoration: none; color: #374151; border-radius: 6px; }
    .nav-item:hover { background: #f3f4f6; }
    .icon { font-size: 18px; flex-shrink: 0; }
    .label { font-size: 14px; white-space: nowrap; }
  \`]
})
export class ToggleSidebarComponent {
  compact = false;
  items = [
    { icon: '\\u{1F3E0}', label: 'Home' },
    { icon: '\\u{1F4CA}', label: 'Stats' },
    { icon: '\\u{1F4DD}', label: 'Notes' },
    { icon: '\\u{1F512}', label: 'Security' },
    { icon: '\\u2699', label: 'Settings' },
  ];
}

@NgModule({
  declarations: [ToggleSidebarComponent],
  imports: [BrowserModule],
  bootstrap: [ToggleSidebarComponent],
})
export class ToggleSidebarModule {}

export default createAngularMicroApp({
  name: 'toggle-sidebar',
  module: ToggleSidebarModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
];

export default templates;
