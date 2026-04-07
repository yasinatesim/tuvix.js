import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'minimal',
    description: 'Minimal header with logo and navigation links',
    tags: ['header', 'minimal', 'navigation'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-minimal-header',
  template: \`

    <header class="header">
      <span class="logo">Logo</span>
      <nav class="nav">
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  
  \`,
})
export class MinimalHeaderComponent {
}

const app = defineMicroApp({
  name: 'minimal-header',
  async mount({ container }) {
    const el = document.createElement('app-minimal-header');
    container.appendChild(el);
    await bootstrapApplication(MinimalHeaderComponent);
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
    description: 'Header with integrated search bar and suggestion dropdown',
    tags: ['header', 'search', 'interactive'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-search-header',
  template: \`

    <header class="header">
      <span class="brand">Brand</span>
      <div class="search-wrapper">
        <input type="text" placeholder="Search..." [value]="query" (input)="onInput($event)" (focus)="focused=true" (blur)="onBlur()" />
        <ul class="suggestions" *ngIf="focused && query && filtered.length">
          <li *ngFor="let s of filtered" (mousedown)="query=s">{{ s }}</li>
        </ul>
      </div>
    </header>
  
  \`,
})
export class SearchHeaderComponent {
query = '';
  focused = false;
  items = ['Dashboard', 'Settings', 'Profile', 'Help'];
  get filtered() { return this.items.filter(s => s.toLowerCase().includes(this.query.toLowerCase())); }
  onInput(e: Event) { this.query = (e.target as HTMLInputElement).value; }
  onBlur() { setTimeout(() => this.focused = false, 200); }
}

const app = defineMicroApp({
  name: 'search-header',
  async mount({ container }) {
    const el = document.createElement('app-search-header');
    container.appendChild(el);
    await bootstrapApplication(SearchHeaderComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-auth',
    description: 'Header with authentication buttons and user avatar',
    tags: ['header', 'auth', 'user'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-auth-header',
  template: \`

    <header class="header">
      <span class="brand">AppName</span>
      <nav class="nav">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <ng-container *ngIf="loggedIn; else authButtons">
          <div class="user-area">
            <div class="avatar">JD</div>
            <button class="btn-outline" (click)="loggedIn=false">Log out</button>
          </div>
        </ng-container>
        <ng-template #authButtons>
          <button class="btn-outline" (click)="loggedIn=true">Log in</button>
          <button class="btn-primary" (click)="loggedIn=true">Sign up</button>
        </ng-template>
      </nav>
    </header>
  
  \`,
})
export class AuthHeaderComponent {
loggedIn = false;
}

const app = defineMicroApp({
  name: 'auth-header',
  async mount({ container }) {
    const el = document.createElement('app-auth-header');
    container.appendChild(el);
    await bootstrapApplication(AuthHeaderComponent);
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
    description: 'Responsive header with hamburger menu toggle for mobile',
    tags: ['header', 'responsive', 'mobile'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-responsive-header',
  template: \`

    <header class="header">
      <div class="top-bar">
        <span class="brand">Brand</span>
        <button class="toggle" (click)="menuOpen=!menuOpen">{{ menuOpen ? '\\u2715' : '\\u2630' }}</button>
      </div>
      <nav class="mobile-nav" *ngIf="menuOpen">
        <a *ngFor="let link of links" [href]="'#' + link.toLowerCase()" (click)="menuOpen=false">{{ link }}</a>
      </nav>
    </header>
  
  \`,
})
export class ResponsiveHeaderComponent {
menuOpen = false;
  links = ['Home', 'Products', 'About', 'Contact'];
}

const app = defineMicroApp({
  name: 'responsive-header',
  async mount({ container }) {
    const el = document.createElement('app-responsive-header');
    container.appendChild(el);
    await bootstrapApplication(ResponsiveHeaderComponent);
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
    description: 'Dark-themed header with contrasting text and accent colors',
    tags: ['header', 'dark', 'theme'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-dark-header',
  template: \`

    <header class="header">
      <span class="brand">DarkApp</span>
      <nav class="nav">
        <a *ngFor="let link of links" [href]="'#' + link.toLowerCase()">{{ link }}</a>
      </nav>
      <button class="upgrade-btn">Upgrade</button>
    </header>
  
  \`,
})
export class DarkHeaderComponent {
links = ['Dashboard', 'Analytics', 'Reports', 'Settings'];
}

const app = defineMicroApp({
  name: 'dark-header',
  async mount({ container }) {
    const el = document.createElement('app-dark-header');
    container.appendChild(el);
    await bootstrapApplication(DarkHeaderComponent);
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
    description: 'Sticky header that remains at top on scroll with shadow',
    tags: ['header', 'sticky', 'scroll'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-sticky-header',
  template: \`

    <header class="header" [class.scrolled]="scrolled">
      <span class="brand">StickyBrand</span>
      <nav class="nav">
        <a href="#home">Home</a>
        <a href="#services">Services</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  
  \`,
})
export class StickyHeaderComponent {
scrolled = false;
  @HostListener('window:scroll') onScroll() { this.scrolled = window.scrollY > 10; }
}

const app = defineMicroApp({
  name: 'sticky-header',
  async mount({ container }) {
    const el = document.createElement('app-sticky-header');
    container.appendChild(el);
    await bootstrapApplication(StickyHeaderComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-logo',
    description: 'Header with image logo placeholder and centered navigation',
    tags: ['header', 'logo', 'centered'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-logo-header',
  template: \`

    <header class="header">
      <div class="logo-area">
        <div class="logo-icon">T</div>
        <span class="logo-text">Tuvix</span>
      </div>
      <nav class="nav">
        <a href="#docs">Docs</a>
        <a href="#api">API</a>
        <a href="#blog">Blog</a>
        <a href="#github">GitHub</a>
      </nav>
    </header>
  
  \`,
})
export class LogoHeaderComponent {
}

const app = defineMicroApp({
  name: 'logo-header',
  async mount({ container }) {
    const el = document.createElement('app-logo-header');
    container.appendChild(el);
    await bootstrapApplication(LogoHeaderComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-dropdown',
    description: 'Header with dropdown menus for nested navigation',
    tags: ['header', 'dropdown', 'nested'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-dropdown-header',
  template: \`

    <header class="header">
      <span class="brand">Brand</span>
      <nav class="nav">
        <div class="menu-item" *ngFor="let menu of menus" (mouseenter)="openMenu=menu.label" (mouseleave)="openMenu=null">
          <button class="menu-btn">{{ menu.label }}</button>
          <ul class="dropdown" *ngIf="openMenu===menu.label">
            <li *ngFor="let item of menu.items"><a [href]="'#' + item.toLowerCase()">{{ item }}</a></li>
          </ul>
        </div>
      </nav>
    </header>
  
  \`,
})
export class DropdownHeaderComponent {
openMenu: string | null = null;
  menus = [
    { label: 'Products', items: ['Widget A', 'Widget B', 'Widget C'] },
    { label: 'Solutions', items: ['Enterprise', 'Startup', 'Agency'] },
    { label: 'Resources', items: ['Docs', 'Tutorials', 'Community'] },
  ];
}

const app = defineMicroApp({
  name: 'dropdown-header',
  async mount({ container }) {
    const el = document.createElement('app-dropdown-header');
    container.appendChild(el);
    await bootstrapApplication(DropdownHeaderComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-breadcrumb',
    description: 'Header that includes a breadcrumb trail below the main nav',
    tags: ['header', 'breadcrumb', 'navigation'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-breadcrumb-header',
  template: \`

    <header class="header">
      <div class="main-bar">
        <span class="brand">Store</span>
        <nav class="nav">
          <a href="#shop">Shop</a>
          <a href="#deals">Deals</a>
          <a href="#cart">Cart (0)</a>
        </nav>
      </div>
      <div class="breadcrumb-bar">
        <span *ngFor="let crumb of crumbs; let i = index; let last = last">
          <span *ngIf="i > 0" class="sep">/</span>
          <a *ngIf="!last" [href]="crumb.href" class="crumb-link">{{ crumb.label }}</a>
          <span *ngIf="last" class="crumb-current">{{ crumb.label }}</span>
        </span>
      </div>
    </header>
  
  \`,
})
export class BreadcrumbHeaderComponent {
crumbs = [
    { label: 'Home', href: '#home' },
    { label: 'Products', href: '#products' },
    { label: 'Widget Pro', href: '#widget-pro' },
  ];
}

const app = defineMicroApp({
  name: 'breadcrumb-header',
  async mount({ container }) {
    const el = document.createElement('app-breadcrumb-header');
    container.appendChild(el);
    await bootstrapApplication(BreadcrumbHeaderComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-actions',
    description: 'Header with action buttons like notifications and settings',
    tags: ['header', 'actions', 'icons'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-actions-header',
  template: \`

    <header class="header">
      <span class="brand">Platform</span>
      <div class="actions">
        <button class="icon-btn">
          \\u{1F514}
          <span class="badge" *ngIf="notifCount > 0">{{ notifCount }}</span>
        </button>
        <button class="icon-btn">\\u2699</button>
        <div class="avatar">AB</div>
      </div>
    </header>
  
  \`,
})
export class ActionsHeaderComponent {
notifCount = 3;
}

const app = defineMicroApp({
  name: 'actions-header',
  async mount({ container }) {
    const el = document.createElement('app-actions-header');
    container.appendChild(el);
    await bootstrapApplication(ActionsHeaderComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'transparent',
    description: 'Transparent header designed for hero sections with overlay text',
    tags: ['header', 'transparent', 'hero'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-transparent-header',
  template: \`

    <header class="header">
      <span class="brand">Overlay</span>
      <nav class="nav">
        <a *ngFor="let link of links" [href]="'#' + link.toLowerCase()">{{ link }}</a>
      </nav>
    </header>
  
  \`,
})
export class TransparentHeaderComponent {
links = ['Home', 'Gallery', 'About', 'Contact'];
}

const app = defineMicroApp({
  name: 'transparent-header',
  async mount({ container }) {
    const el = document.createElement('app-transparent-header');
    container.appendChild(el);
    await bootstrapApplication(TransparentHeaderComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'fixed',
    description: 'Fixed position header that stays at viewport top',
    tags: ['header', 'fixed', 'position'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-fixed-header',
  template: \`

    <header class="header">
      <span class="brand">FixedNav</span>
      <nav class="nav">
        <a href="#overview">Overview</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
      </nav>
      <button class="cta">Get Started</button>
    </header>
  
  \`,
})
export class FixedHeaderComponent {
}

const app = defineMicroApp({
  name: 'fixed-header',
  async mount({ container }) {
    const el = document.createElement('app-fixed-header');
    container.appendChild(el);
    await bootstrapApplication(FixedHeaderComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-banner',
    description: 'Header with a promotional banner above the main nav',
    tags: ['header', 'banner', 'promotion'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-banner-header',
  template: \`

    <header>
      <div class="banner" *ngIf="bannerVisible">
        <span>New release! Check out v2.0 features</span>
        <button class="close-btn" (click)="bannerVisible=false">\\u2715</button>
      </div>
      <div class="main-bar">
        <span class="brand">Product</span>
        <nav class="nav">
          <a href="#features">Features</a>
          <a href="#changelog">Changelog</a>
          <a href="#docs">Docs</a>
        </nav>
      </div>
    </header>
  
  \`,
})
export class BannerHeaderComponent {
bannerVisible = true;
}

const app = defineMicroApp({
  name: 'banner-header',
  async mount({ container }) {
    const el = document.createElement('app-banner-header');
    container.appendChild(el);
    await bootstrapApplication(BannerHeaderComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'mobile-menu',
    description: 'Header with slide-in mobile menu panel',
    tags: ['header', 'mobile', 'slide-menu'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-mobile-menu-header',
  template: \`

    <header class="header">
      <span class="brand">MobileApp</span>
      <button class="toggle" (click)="open=true">\\u2630</button>
    </header>
    <div class="overlay" *ngIf="open">
      <div class="backdrop" (click)="open=false"></div>
      <nav class="drawer">
        <button class="close-btn" (click)="open=false">\\u2715</button>
        <a *ngFor="let link of links" [href]="'#' + link.toLowerCase()" (click)="open=false">{{ link }}</a>
      </nav>
    </div>
  
  \`,
})
export class MobileMenuHeaderComponent {
open = false;
  links = ['Home', 'Explore', 'Bookmarks', 'Profile', 'Settings'];
}

const app = defineMicroApp({
  name: 'mobile-menu-header',
  async mount({ container }) {
    const el = document.createElement('app-mobile-menu-header');
    container.appendChild(el);
    await bootstrapApplication(MobileMenuHeaderComponent);
  },
  async unmount({ container }) {
    container.innerHTML = '';
  },
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['tuvix.js', '@tuvix.js/core', '@angular/core', '@angular/platform-browser'],
  },
  {
    variant: 'with-progress',
    description: 'Header with a progress bar indicating page scroll position',
    tags: ['header', 'progress', 'scroll'],
    code: `import { defineMicroApp } from 'tuvix.js';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-progress-header',
  template: \`

    <header class="header">
      <div class="main-bar">
        <span class="brand">Reader</span>
        <nav class="nav">
          <a href="#article">Article</a>
          <a href="#comments">Comments</a>
        </nav>
      </div>
      <div class="progress-track">
        <div class="progress-fill" [style.width.%]="progress"></div>
      </div>
    </header>
  
  \`,
})
export class ProgressHeaderComponent {
progress = 0;
  @HostListener('window:scroll') onScroll() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
  }
}

const app = defineMicroApp({
  name: 'progress-header',
  async mount({ container }) {
    const el = document.createElement('app-progress-header');
    container.appendChild(el);
    await bootstrapApplication(ProgressHeaderComponent);
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
