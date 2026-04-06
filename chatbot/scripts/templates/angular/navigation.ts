import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'breadcrumb',
    description: 'Breadcrumb navigation showing current page path',
    tags: ['navigation', 'breadcrumb', 'path'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-breadcrumb-nav',
  template: \`
<nav class="breadcrumb"><span *ngFor="let crumb of crumbs; let i = index; let last = last"><span *ngIf="i > 0" class="sep">/</span><a *ngIf="!last" [href]="crumb.href" class="link">{{ crumb.label }}</a><span *ngIf="last" class="current">{{ crumb.label }}</span></span></nav>
  \`,
})
export class BreadcrumbNavComponent {
crumbs = [{ label: 'Home', href: '#' }, { label: 'Products', href: '#products' }, { label: 'Widget Pro', href: '' }];
}

const app = defineMicroApp({
  name: 'breadcrumb-nav',
  async mount({ container }) {
    const el = document.createElement('app-breadcrumb-nav');
    container.appendChild(el);
    await bootstrapApplication(BreadcrumbNavComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'tabs',
    description: 'Tab navigation with active state and content switching',
    tags: ['navigation', 'tabs', 'switch'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-tabs-nav',
  template: \`
<div class="tabs"><button *ngFor="let tab of tabs" class="tab" [class.active]="active===tab" (click)="active=tab">{{ tab }}</button></div><div class="content">Content for {{ active }}</div>
  \`,
})
export class TabsNavComponent {
active = 'Overview'; tabs = ['Overview', 'Features', 'Pricing', 'Reviews'];
}

const app = defineMicroApp({
  name: 'tabs-nav',
  async mount({ container }) {
    const el = document.createElement('app-tabs-nav');
    container.appendChild(el);
    await bootstrapApplication(TabsNavComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'stepper',
    description: 'Step-by-step progress navigation with numbered steps',
    tags: ['navigation', 'stepper', 'progress'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-stepper-nav',
  template: \`
<div class="stepper"><div *ngFor="let step of steps; let i = index" class="step" [class.active]="i <= current" [class.done]="i < current"><div class="circle">{{ i < current ? '\\u2713' : i + 1 }}</div><span class="label">{{ step }}</span></div></div><div class="actions"><button [disabled]="current===0" (click)="current=current-1">Back</button><button [disabled]="current===steps.length-1" (click)="current=current+1">Next</button></div>
  \`,
})
export class StepperNavComponent {
current = 0; steps = ['Account', 'Profile', 'Payment', 'Confirm'];
}

const app = defineMicroApp({
  name: 'stepper-nav',
  async mount({ container }) {
    const el = document.createElement('app-stepper-nav');
    container.appendChild(el);
    await bootstrapApplication(StepperNavComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'pagination',
    description: 'Pagination navigation with page numbers and prev/next',
    tags: ['navigation', 'pagination', 'pages'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-pagination-nav',
  template: \`
<nav class="pagination"><button [disabled]="page===1" (click)="page=page-1">\\u2190 Prev</button><button *ngFor="let p of pages" class="page-btn" [class.active]="page===p" (click)="page=p">{{ p }}</button><button [disabled]="page===totalPages" (click)="page=page+1">Next \\u2192</button></nav>
  \`,
})
export class PaginationNavComponent {
page = 1; totalPages = 5;
  get pages() { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
}

const app = defineMicroApp({
  name: 'pagination-nav',
  async mount({ container }) {
    const el = document.createElement('app-pagination-nav');
    container.appendChild(el);
    await bootstrapApplication(PaginationNavComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'menu',
    description: 'Dropdown menu navigation with hover reveal',
    tags: ['navigation', 'menu', 'dropdown'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-menu-nav',
  template: \`
<div class="menu-container"><button class="trigger" (click)="open=!open">Menu \\u25BC</button><div class="menu" *ngIf="open"><a *ngFor="let item of items" [href]="'#' + item.toLowerCase()" class="menu-item" (click)="open=false">{{ item }}</a></div></div>
  \`,
})
export class MenuNavComponent {
open = false; items = ['Dashboard', 'Profile', 'Settings', 'Help', 'Log Out'];
}

const app = defineMicroApp({
  name: 'menu-nav',
  async mount({ container }) {
    const el = document.createElement('app-menu-nav');
    container.appendChild(el);
    await bootstrapApplication(MenuNavComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'navbar',
    description: 'Horizontal navigation bar with links and active state',
    tags: ['navigation', 'navbar', 'horizontal'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-navbar',
  template: \`
<nav class="navbar"><a *ngFor="let link of links" [href]="'#' + link.toLowerCase()" class="link" [class.active]="active===link" (click)="active=link">{{ link }}</a></nav>
  \`,
})
export class NavbarComponent {
active = 'Home'; links = ['Home', 'Products', 'About', 'Contact'];
}

const app = defineMicroApp({
  name: 'navbar-nav',
  async mount({ container }) {
    const el = document.createElement('app-navbar');
    container.appendChild(el);
    await bootstrapApplication(NavbarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'drawer',
    description: 'Slide-out navigation drawer for mobile interfaces',
    tags: ['navigation', 'drawer', 'mobile'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-drawer-nav',
  template: \`
<button class="toggle" (click)="open=true">\\u2630</button><div class="overlay" *ngIf="open"><div class="backdrop" (click)="open=false"></div><nav class="drawer"><button class="close" (click)="open=false">\\u2715</button><a *ngFor="let item of items" href="#" (click)="open=false">{{ item }}</a></nav></div>
  \`,
})
export class DrawerNavComponent {
open = false; items = ['Home', 'Explore', 'Notifications', 'Messages', 'Profile'];
}

const app = defineMicroApp({
  name: 'drawer-nav',
  async mount({ container }) {
    const el = document.createElement('app-drawer-nav');
    container.appendChild(el);
    await bootstrapApplication(DrawerNavComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'mega-menu',
    description: 'Mega menu navigation with multi-column dropdown',
    tags: ['navigation', 'mega-menu', 'complex'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-mega-menu',
  template: \`
<nav class="nav"><div class="menu-trigger" (mouseenter)="open=true" (mouseleave)="open=false"><button class="nav-btn">Products \\u25BC</button><div class="mega" *ngIf="open"><div class="col" *ngFor="let col of columns"><h4 class="col-title">{{ col.title }}</h4><a *ngFor="let link of col.links" href="#" class="mega-link">{{ link }}</a></div></div></div></nav>
  \`,
})
export class MegaMenuComponent {
open = false;
  columns = [
    { title: 'Platform', links: ['Overview', 'Features', 'Integrations'] },
    { title: 'Solutions', links: ['Enterprise', 'Small Business', 'Startups'] },
    { title: 'Resources', links: ['Documentation', 'Tutorials', 'Community'] },
  ];
}

const app = defineMicroApp({
  name: 'mega-menu-nav',
  async mount({ container }) {
    const el = document.createElement('app-mega-menu');
    container.appendChild(el);
    await bootstrapApplication(MegaMenuComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'bottom-bar',
    description: 'Bottom navigation bar for mobile app interfaces',
    tags: ['navigation', 'bottom-bar', 'mobile'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-bottom-bar',
  template: \`
<nav class="bottom-bar"><button *ngFor="let item of items" class="bar-item" [class.active]="active===item.label" (click)="active=item.label"><span class="icon">{{ item.icon }}</span><span class="label">{{ item.label }}</span></button></nav>
  \`,
})
export class BottomBarComponent {
active = 'Home';
  items = [{ icon: '\\u{1F3E0}', label: 'Home' }, { icon: '\\u{1F50D}', label: 'Search' }, { icon: '\\u{2795}', label: 'Create' }, { icon: '\\u{1F514}', label: 'Alerts' }, { icon: '\\u{1F464}', label: 'Profile' }];
}

const app = defineMicroApp({
  name: 'bottom-bar-nav',
  async mount({ container }) {
    const el = document.createElement('app-bottom-bar');
    container.appendChild(el);
    await bootstrapApplication(BottomBarComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'side-menu',
    description: 'Vertical side menu with grouped navigation items',
    tags: ['navigation', 'side-menu', 'vertical'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-side-menu',
  template: \`
<nav class="side-menu"><div *ngFor="let group of groups" class="group"><div class="group-title">{{ group.title }}</div><a *ngFor="let item of group.items" href="#" class="menu-item" [class.active]="active===item" (click)="active=item">{{ item }}</a></div></nav>
  \`,
})
export class SideMenuComponent {
active = 'Dashboard';
  groups = [
    { title: 'Main', items: ['Dashboard', 'Projects', 'Tasks'] },
    { title: 'Team', items: ['Members', 'Roles', 'Activity'] },
    { title: 'Account', items: ['Settings', 'Billing'] },
  ];
}

const app = defineMicroApp({
  name: 'side-menu-nav',
  async mount({ container }) {
    const el = document.createElement('app-side-menu');
    container.appendChild(el);
    await bootstrapApplication(SideMenuComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'wizard',
    description: 'Wizard navigation with connected step indicators',
    tags: ['navigation', 'wizard', 'steps'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-wizard-nav',
  template: \`
<div class="wizard"><div *ngFor="let step of steps; let i = index" class="step-item"><div class="connector" *ngIf="i > 0" [class.filled]="i <= current"></div><div class="step-circle" [class.active]="i === current" [class.done]="i < current" (click)="current=i">{{ i < current ? '\\u2713' : i + 1 }}</div><div class="step-label" [class.active]="i === current">{{ step }}</div></div></div>
  \`,
})
export class WizardNavComponent {
current = 1; steps = ['Cart', 'Shipping', 'Payment', 'Review'];
}

const app = defineMicroApp({
  name: 'wizard-nav',
  async mount({ container }) {
    const el = document.createElement('app-wizard-nav');
    container.appendChild(el);
    await bootstrapApplication(WizardNavComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'segmented-control',
    description: 'Segmented control for switching between views',
    tags: ['navigation', 'segmented', 'toggle'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-segmented-control',
  template: \`
<div class="control"><button *ngFor="let seg of segments" class="segment" [class.active]="active===seg" (click)="active=seg">{{ seg }}</button></div><div class="content">Showing: {{ active }}</div>
  \`,
})
export class SegmentedControlComponent {
active = 'Grid'; segments = ['Grid', 'List', 'Board'];
}

const app = defineMicroApp({
  name: 'segmented-control-nav',
  async mount({ container }) {
    const el = document.createElement('app-segmented-control');
    container.appendChild(el);
    await bootstrapApplication(SegmentedControlComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'anchor-nav',
    description: 'Anchor navigation for scrolling to page sections',
    tags: ['navigation', 'anchor', 'scroll'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-anchor-nav',
  template: \`
<nav class="anchor-nav"><a *ngFor="let section of sections" [href]="'#' + section.toLowerCase()" class="anchor" [class.active]="active===section" (click)="active=section">{{ section }}</a></nav>
  \`,
})
export class AnchorNavComponent {
active = 'Introduction'; sections = ['Introduction', 'Installation', 'Usage', 'API', 'Examples', 'FAQ'];
}

const app = defineMicroApp({
  name: 'anchor-nav',
  async mount({ container }) {
    const el = document.createElement('app-anchor-nav');
    container.appendChild(el);
    await bootstrapApplication(AnchorNavComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'tag-nav',
    description: 'Tag-based navigation for filtering content by tags',
    tags: ['navigation', 'tags', 'filter'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-tag-nav',
  template: \`
<div class="tags"><button *ngFor="let tag of tags" class="tag" [class.active]="selected.includes(tag)" (click)="toggle(tag)">{{ tag }}</button></div><div class="info">Selected: {{ selected.length ? selected.join(', ') : 'None' }}</div>
  \`,
})
export class TagNavComponent {
selected: string[] = [];
  tags = ['All', 'Angular', 'React', 'Vue', 'Svelte', 'TypeScript', 'CSS'];
  toggle(tag: string) { const i = this.selected.indexOf(tag); if (i >= 0) this.selected.splice(i, 1); else this.selected.push(tag); }
}

const app = defineMicroApp({
  name: 'tag-nav',
  async mount({ container }) {
    const el = document.createElement('app-tag-nav');
    container.appendChild(el);
    await bootstrapApplication(TagNavComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'dot-nav',
    description: 'Dot indicator navigation for carousels and slideshows',
    tags: ['navigation', 'dots', 'carousel'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-dot-nav',
  template: \`
<div class="slide" [style.background]="slides[current].color"><div class="slide-text">{{ slides[current].label }}</div></div><div class="dots"><button class="arrow" (click)="prev()">\\u2190</button><button *ngFor="let s of slides; let i = index" class="dot" [class.active]="i===current" (click)="current=i"></button><button class="arrow" (click)="next()">\\u2192</button></div>
  \`,
})
export class DotNavComponent {
current = 0;
  slides = [
    { label: 'Slide 1', color: 'linear-gradient(135deg, #a78bfa, #6366f1)' },
    { label: 'Slide 2', color: 'linear-gradient(135deg, #34d399, #10b981)' },
    { label: 'Slide 3', color: 'linear-gradient(135deg, #fbbf24, #f59e0b)' },
    { label: 'Slide 4', color: 'linear-gradient(135deg, #f87171, #ef4444)' },
  ];
  prev() { this.current = (this.current - 1 + this.slides.length) % this.slides.length; }
  next() { this.current = (this.current + 1) % this.slides.length; }
}

const app = defineMicroApp({
  name: 'dot-nav',
  async mount({ container }) {
    const el = document.createElement('app-dot-nav');
    container.appendChild(el);
    await bootstrapApplication(DotNavComponent);
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
