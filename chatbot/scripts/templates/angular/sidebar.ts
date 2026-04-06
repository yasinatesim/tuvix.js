import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'collapsible',
    description: 'Collapsible sidebar that toggles between full and icon-only mode',
    tags: ['sidebar', 'collapsible', 'toggle'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
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

const app = defineMicroApp({
  name: 'collapsible-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-collapsible-sidebar');
    container.appendChild(el);
    await bootstrapApplication(CollapsibleSidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-icons',
    description: 'Sidebar with icon-based navigation and active state indicator',
    tags: ['sidebar', 'icons', 'active-state'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
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

const app = defineMicroApp({
  name: 'icon-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-icon-sidebar');
    container.appendChild(el);
    await bootstrapApplication(IconSidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'nested',
    description: 'Sidebar with nested expandable sub-menus',
    tags: ['sidebar', 'nested', 'expandable'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
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

const app = defineMicroApp({
  name: 'nested-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-nested-sidebar');
    container.appendChild(el);
    await bootstrapApplication(NestedSidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'mini',
    description: 'Mini sidebar showing only icons with tooltips on hover',
    tags: ['sidebar', 'mini', 'icons'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-mini-sidebar',
  template: \`

    <aside class="sidebar">
      <a *ngFor="let item of items" [href]="'#' + item.label.toLowerCase()" class="nav-item" [title]="item.label" [class.active]="active===item.label" (click)="active=item.label">
        {{ item.icon }}
      </a>
    </aside>
  
  \`,
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

const app = defineMicroApp({
  name: 'mini-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-mini-sidebar');
    container.appendChild(el);
    await bootstrapApplication(MiniSidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed sidebar with contrasting text and accent highlight',
    tags: ['sidebar', 'dark', 'theme'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-dark-sidebar',
  template: \`

    <aside class="sidebar">
      <div class="brand">DarkPanel</div>
      <nav class="nav">
        <a *ngFor="let item of items" [href]="'#' + item.toLowerCase()" class="nav-item" [class.active]="active===item" (click)="active=item">{{ item }}</a>
      </nav>
    </aside>
  
  \`,
})
export class DarkSidebarComponent {
active = 'Dashboard';
  items = ['Dashboard', 'Analytics', 'Customers', 'Products', 'Settings'];
}

const app = defineMicroApp({
  name: 'dark-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-dark-sidebar');
    container.appendChild(el);
    await bootstrapApplication(DarkSidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-search',
    description: 'Sidebar with a search input to filter navigation items',
    tags: ['sidebar', 'search', 'filter'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
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
})
export class SearchSidebarComponent {
query = '';
  items = ['Dashboard', 'Users', 'Products', 'Orders', 'Analytics', 'Reports', 'Settings', 'Help'];
  get filtered() { return this.items.filter(i => i.toLowerCase().includes(this.query.toLowerCase())); }
  onInput(e: Event) { this.query = (e.target as HTMLInputElement).value; }
}

const app = defineMicroApp({
  name: 'search-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-search-sidebar');
    container.appendChild(el);
    await bootstrapApplication(SearchSidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-user-profile',
    description: 'Sidebar with user profile section at top and navigation below',
    tags: ['sidebar', 'user', 'profile'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
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
})
export class ProfileSidebarComponent {
items = ['Dashboard', 'My Projects', 'Team', 'Calendar', 'Documents', 'Settings'];
}

const app = defineMicroApp({
  name: 'profile-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-profile-sidebar');
    container.appendChild(el);
    await bootstrapApplication(ProfileSidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-badge',
    description: 'Sidebar with notification badges on navigation items',
    tags: ['sidebar', 'badge', 'notification'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
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

const app = defineMicroApp({
  name: 'badge-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-badge-sidebar');
    container.appendChild(el);
    await bootstrapApplication(BadgeSidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'responsive',
    description: 'Responsive sidebar that collapses to overlay on small screens',
    tags: ['sidebar', 'responsive', 'overlay'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
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
})
export class ResponsiveSidebarComponent {
open = false;
  items = ['Home', 'Dashboard', 'Projects', 'Team', 'Reports', 'Settings'];
}

const app = defineMicroApp({
  name: 'responsive-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-responsive-sidebar');
    container.appendChild(el);
    await bootstrapApplication(ResponsiveSidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'multi-level',
    description: 'Multi-level sidebar with three levels of nested navigation',
    tags: ['sidebar', 'multi-level', 'deep-nesting'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
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

const app = defineMicroApp({
  name: 'multi-level-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-multilevel-sidebar');
    container.appendChild(el);
    await bootstrapApplication(MultiLevelSidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-footer',
    description: 'Sidebar with navigation at top and footer section with version info',
    tags: ['sidebar', 'footer', 'version'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
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
})
export class FooterSidebarComponent {
items = ['Dashboard', 'Analytics', 'Users', 'Content', 'Settings'];
}

const app = defineMicroApp({
  name: 'footer-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-footer-sidebar');
    container.appendChild(el);
    await bootstrapApplication(FooterSidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'sticky',
    description: 'Sticky sidebar that stays fixed while main content scrolls',
    tags: ['sidebar', 'sticky', 'fixed'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-sticky-sidebar',
  template: \`

    <aside class="sidebar">
      <div class="brand">Sticky</div>
      <nav class="nav">
        <a *ngFor="let item of items" [href]="'#' + item.toLowerCase()" class="nav-item" [class.active]="active===item" (click)="active=item">{{ item }}</a>
      </nav>
    </aside>
  
  \`,
})
export class StickySidebarComponent {
active = 'Overview';
  items = ['Overview', 'Metrics', 'Logs', 'Alerts', 'Config'];
}

const app = defineMicroApp({
  name: 'sticky-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-sticky-sidebar');
    container.appendChild(el);
    await bootstrapApplication(StickySidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-groups',
    description: 'Sidebar with labeled group sections separating navigation items',
    tags: ['sidebar', 'groups', 'sections'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-groups-sidebar',
  template: \`

    <aside class="sidebar">
      <div *ngFor="let group of groups" class="group">
        <div class="group-label">{{ group.label }}</div>
        <a *ngFor="let item of group.items" [href]="'#' + item.toLowerCase()" class="nav-item">{{ item }}</a>
      </div>
    </aside>
  
  \`,
})
export class GroupsSidebarComponent {
groups = [
    { label: 'General', items: ['Dashboard', 'Profile', 'Notifications'] },
    { label: 'Management', items: ['Users', 'Teams', 'Billing'] },
    { label: 'Support', items: ['Tickets', 'Knowledge Base', 'Contact'] },
  ];
}

const app = defineMicroApp({
  name: 'groups-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-groups-sidebar');
    container.appendChild(el);
    await bootstrapApplication(GroupsSidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'overlay',
    description: 'Overlay sidebar that slides over content with a backdrop',
    tags: ['sidebar', 'overlay', 'backdrop'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
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
})
export class OverlaySidebarComponent {
open = false;
  items = ['Home', 'Products', 'Services', 'Portfolio', 'About', 'Contact'];
}

const app = defineMicroApp({
  name: 'overlay-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-overlay-sidebar');
    container.appendChild(el);
    await bootstrapApplication(OverlaySidebarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-toggle',
    description: 'Sidebar with a toggle switch for compact mode',
    tags: ['sidebar', 'toggle', 'compact'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
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

const app = defineMicroApp({
  name: 'toggle-sidebar',
  async mount({ container }) {
    const el = document.createElement('app-toggle-sidebar');
    container.appendChild(el);
    await bootstrapApplication(ToggleSidebarComponent);
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
