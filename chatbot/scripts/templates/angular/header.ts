import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'minimal',
    description: 'Minimal header with logo and navigation links',
    tags: ['header', 'minimal', 'navigation'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 20px; font-weight: 700; }
    .nav { display: flex; gap: 24px; }
    .nav a { text-decoration: none; color: #374151; }
  \`]
})
export class MinimalHeaderComponent {}

@NgModule({
  declarations: [MinimalHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [MinimalHeaderComponent],
})
export class MinimalHeaderModule {}

export default createAngularMicroApp({
  name: 'minimal-header',
  module: MinimalHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-search',
    description: 'Header with integrated search bar and suggestion dropdown',
    tags: ['header', 'search', 'interactive'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { display: flex; align-items: center; padding: 12px 24px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .brand { font-size: 20px; font-weight: 700; margin-right: 32px; }
    .search-wrapper { position: relative; flex: 1; max-width: 480px; }
    input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; box-sizing: border-box; }
    .suggestions { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; list-style: none; padding: 4px 0; margin: 4px 0 0; z-index: 10; }
    .suggestions li { padding: 8px 12px; cursor: pointer; }
    .suggestions li:hover { background: #f3f4f6; }
  \`]
})
export class SearchHeaderComponent {
  query = '';
  focused = false;
  items = ['Dashboard', 'Settings', 'Profile', 'Help'];
  get filtered() { return this.items.filter(s => s.toLowerCase().includes(this.query.toLowerCase())); }
  onInput(e: Event) { this.query = (e.target as HTMLInputElement).value; }
  onBlur() { setTimeout(() => this.focused = false, 200); }
}

@NgModule({
  declarations: [SearchHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [SearchHeaderComponent],
})
export class SearchHeaderModule {}

export default createAngularMicroApp({
  name: 'search-header',
  module: SearchHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-auth',
    description: 'Header with authentication buttons and user avatar',
    tags: ['header', 'auth', 'user'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: #fff; border-bottom: 1px solid #e5e7eb; }
    .brand { font-size: 20px; font-weight: 700; }
    .nav { display: flex; gap: 20px; align-items: center; }
    .nav a { text-decoration: none; color: #6b7280; }
    .user-area { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #6366f1; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 600; }
    .btn-outline { padding: 6px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: transparent; cursor: pointer; }
    .btn-primary { padding: 6px 16px; border: none; border-radius: 6px; background: #6366f1; color: #fff; cursor: pointer; }
  \`]
})
export class AuthHeaderComponent {
  loggedIn = false;
}

@NgModule({
  declarations: [AuthHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [AuthHeaderComponent],
})
export class AuthHeaderModule {}

export default createAngularMicroApp({
  name: 'auth-header',
  module: AuthHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'responsive',
    description: 'Responsive header with hamburger menu toggle for mobile',
    tags: ['header', 'responsive', 'mobile'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { background: #fff; border-bottom: 1px solid #e5e7eb; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; }
    .brand { font-size: 20px; font-weight: 700; }
    .toggle { background: none; border: none; font-size: 24px; cursor: pointer; }
    .mobile-nav { display: flex; flex-direction: column; padding: 0 24px 16px; }
    .mobile-nav a { padding: 10px 0; text-decoration: none; color: #374151; border-bottom: 1px solid #f3f4f6; }
  \`]
})
export class ResponsiveHeaderComponent {
  menuOpen = false;
  links = ['Home', 'Products', 'About', 'Contact'];
}

@NgModule({
  declarations: [ResponsiveHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [ResponsiveHeaderComponent],
})
export class ResponsiveHeaderModule {}

export default createAngularMicroApp({
  name: 'responsive-header',
  module: ResponsiveHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed header with contrasting text and accent colors',
    tags: ['header', 'dark', 'theme'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { display: flex; justify-content: space-between; align-items: center; padding: 14px 28px; background: #111827; color: #f9fafb; }
    .brand { font-size: 20px; font-weight: 700; color: #818cf8; }
    .nav { display: flex; gap: 24px; }
    .nav a { text-decoration: none; color: #d1d5db; font-size: 14px; }
    .upgrade-btn { padding: 8px 18px; border: none; border-radius: 6px; background: #818cf8; color: #fff; cursor: pointer; font-weight: 600; }
  \`]
})
export class DarkHeaderComponent {
  links = ['Dashboard', 'Analytics', 'Reports', 'Settings'];
}

@NgModule({
  declarations: [DarkHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [DarkHeaderComponent],
})
export class DarkHeaderModule {}

export default createAngularMicroApp({
  name: 'dark-header',
  module: DarkHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'sticky',
    description: 'Sticky header that remains at top on scroll with shadow',
    tags: ['header', 'sticky', 'scroll'],
    code: `import { Component, HostListener } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { position: sticky; top: 0; z-index: 50; display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: #fff; transition: box-shadow 0.2s; }
    .header.scrolled { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .brand { font-size: 20px; font-weight: 700; }
    .nav { display: flex; gap: 20px; }
    .nav a { text-decoration: none; color: #374151; }
  \`]
})
export class StickyHeaderComponent {
  scrolled = false;
  @HostListener('window:scroll') onScroll() { this.scrolled = window.scrollY > 10; }
}

@NgModule({
  declarations: [StickyHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [StickyHeaderComponent],
})
export class StickyHeaderModule {}

export default createAngularMicroApp({
  name: 'sticky-header',
  module: StickyHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-logo',
    description: 'Header with image logo placeholder and centered navigation',
    tags: ['header', 'logo', 'centered'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; border-bottom: 2px solid #e5e7eb; }
    .logo-area { display: flex; align-items: center; gap: 12px; }
    .logo-icon { width: 40px; height: 40px; border-radius: 8px; background: #6366f1; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 18px; }
    .logo-text { font-size: 18px; font-weight: 700; }
    .nav { display: flex; gap: 28px; }
    .nav a { text-decoration: none; color: #374151; font-weight: 500; }
  \`]
})
export class LogoHeaderComponent {}

@NgModule({
  declarations: [LogoHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [LogoHeaderComponent],
})
export class LogoHeaderModule {}

export default createAngularMicroApp({
  name: 'logo-header',
  module: LogoHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-dropdown',
    description: 'Header with dropdown menus for nested navigation',
    tags: ['header', 'dropdown', 'nested'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { display: flex; align-items: center; padding: 12px 24px; background: #fff; border-bottom: 1px solid #e5e7eb; }
    .brand { font-size: 20px; font-weight: 700; margin-right: 40px; }
    .nav { display: flex; gap: 4px; }
    .menu-item { position: relative; }
    .menu-btn { padding: 8px 14px; background: none; border: none; cursor: pointer; font-weight: 500; color: #374151; }
    .dropdown { position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; list-style: none; padding: 8px 0; margin: 0; min-width: 160px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 20; }
    .dropdown li a { display: block; padding: 8px 16px; text-decoration: none; color: #374151; }
    .dropdown li a:hover { background: #f3f4f6; }
  \`]
})
export class DropdownHeaderComponent {
  openMenu: string | null = null;
  menus = [
    { label: 'Products', items: ['Widget A', 'Widget B', 'Widget C'] },
    { label: 'Solutions', items: ['Enterprise', 'Startup', 'Agency'] },
    { label: 'Resources', items: ['Docs', 'Tutorials', 'Community'] },
  ];
}

@NgModule({
  declarations: [DropdownHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [DropdownHeaderComponent],
})
export class DropdownHeaderModule {}

export default createAngularMicroApp({
  name: 'dropdown-header',
  module: DropdownHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-breadcrumb',
    description: 'Header that includes a breadcrumb trail below the main nav',
    tags: ['header', 'breadcrumb', 'navigation'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { border-bottom: 1px solid #e5e7eb; }
    .main-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; }
    .brand { font-size: 20px; font-weight: 700; }
    .nav { display: flex; gap: 20px; }
    .nav a { text-decoration: none; color: #374151; }
    .breadcrumb-bar { padding: 8px 24px; background: #f9fafb; font-size: 13px; }
    .sep { margin: 0 8px; color: #9ca3af; }
    .crumb-link { text-decoration: none; color: #6366f1; }
    .crumb-current { color: #6b7280; }
  \`]
})
export class BreadcrumbHeaderComponent {
  crumbs = [
    { label: 'Home', href: '#home' },
    { label: 'Products', href: '#products' },
    { label: 'Widget Pro', href: '#widget-pro' },
  ];
}

@NgModule({
  declarations: [BreadcrumbHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [BreadcrumbHeaderComponent],
})
export class BreadcrumbHeaderModule {}

export default createAngularMicroApp({
  name: 'breadcrumb-header',
  module: BreadcrumbHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-actions',
    description: 'Header with action buttons like notifications and settings',
    tags: ['header', 'actions', 'icons'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: #fff; border-bottom: 1px solid #e5e7eb; }
    .brand { font-size: 20px; font-weight: 700; }
    .actions { display: flex; align-items: center; gap: 16px; }
    .icon-btn { position: relative; background: none; border: none; cursor: pointer; font-size: 20px; }
    .badge { position: absolute; top: -4px; right: -6px; background: #ef4444; color: #fff; font-size: 11px; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #10b981; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; }
  \`]
})
export class ActionsHeaderComponent {
  notifCount = 3;
}

@NgModule({
  declarations: [ActionsHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [ActionsHeaderComponent],
})
export class ActionsHeaderModule {}

export default createAngularMicroApp({
  name: 'actions-header',
  module: ActionsHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'transparent',
    description: 'Transparent header designed for hero sections with overlay text',
    tags: ['header', 'transparent', 'hero'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-transparent-header',
  template: \`
    <header class="header">
      <span class="brand">Overlay</span>
      <nav class="nav">
        <a *ngFor="let link of links" [href]="'#' + link.toLowerCase()">{{ link }}</a>
      </nav>
    </header>
  \`,
  styles: [\`
    .header { position: absolute; top: 0; left: 0; right: 0; z-index: 20; display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; background: transparent; }
    .brand { font-size: 22px; font-weight: 700; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
    .nav { display: flex; gap: 24px; }
    .nav a { text-decoration: none; color: #fff; font-weight: 500; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
  \`]
})
export class TransparentHeaderComponent {
  links = ['Home', 'Gallery', 'About', 'Contact'];
}

@NgModule({
  declarations: [TransparentHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [TransparentHeaderComponent],
})
export class TransparentHeaderModule {}

export default createAngularMicroApp({
  name: 'transparent-header',
  module: TransparentHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'fixed',
    description: 'Fixed position header that stays at viewport top',
    tags: ['header', 'fixed', 'position'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
    .brand { font-size: 20px; font-weight: 700; color: #111827; }
    .nav { display: flex; gap: 24px; }
    .nav a { text-decoration: none; color: #4b5563; }
    .cta { padding: 8px 20px; border-radius: 6px; border: none; background: #2563eb; color: #fff; cursor: pointer; font-weight: 600; }
  \`]
})
export class FixedHeaderComponent {}

@NgModule({
  declarations: [FixedHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [FixedHeaderComponent],
})
export class FixedHeaderModule {}

export default createAngularMicroApp({
  name: 'fixed-header',
  module: FixedHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-banner',
    description: 'Header with a promotional banner above the main nav',
    tags: ['header', 'banner', 'promotion'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .banner { display: flex; justify-content: center; align-items: center; padding: 8px 16px; background: #6366f1; color: #fff; font-size: 14px; position: relative; }
    .close-btn { position: absolute; right: 16px; background: none; border: none; color: #fff; cursor: pointer; font-size: 16px; }
    .main-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: #fff; border-bottom: 1px solid #e5e7eb; }
    .brand { font-size: 20px; font-weight: 700; }
    .nav { display: flex; gap: 20px; }
    .nav a { text-decoration: none; color: #374151; }
  \`]
})
export class BannerHeaderComponent {
  bannerVisible = true;
}

@NgModule({
  declarations: [BannerHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [BannerHeaderComponent],
})
export class BannerHeaderModule {}

export default createAngularMicroApp({
  name: 'banner-header',
  module: BannerHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'mobile-menu',
    description: 'Header with slide-in mobile menu panel',
    tags: ['header', 'mobile', 'slide-menu'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #fff; border-bottom: 1px solid #e5e7eb; }
    .brand { font-size: 20px; font-weight: 700; }
    .toggle { background: none; border: none; font-size: 24px; cursor: pointer; }
    .overlay { position: fixed; inset: 0; z-index: 100; display: flex; }
    .backdrop { flex: 1; background: rgba(0,0,0,0.4); }
    .drawer { width: 280px; background: #fff; padding: 24px; display: flex; flex-direction: column; gap: 4px; }
    .close-btn { align-self: flex-end; background: none; border: none; font-size: 20px; cursor: pointer; margin-bottom: 16px; }
    .drawer a { padding: 12px 8px; text-decoration: none; color: #374151; border-radius: 6px; font-size: 16px; }
  \`]
})
export class MobileMenuHeaderComponent {
  open = false;
  links = ['Home', 'Explore', 'Bookmarks', 'Profile', 'Settings'];
}

@NgModule({
  declarations: [MobileMenuHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [MobileMenuHeaderComponent],
})
export class MobileMenuHeaderModule {}

export default createAngularMicroApp({
  name: 'mobile-menu-header',
  module: MobileMenuHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'with-progress',
    description: 'Header with a progress bar indicating page scroll position',
    tags: ['header', 'progress', 'scroll'],
    code: `import { Component, HostListener } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
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
  styles: [\`
    .header { position: sticky; top: 0; z-index: 50; background: #fff; }
    .main-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; }
    .brand { font-size: 20px; font-weight: 700; }
    .nav { display: flex; gap: 20px; }
    .nav a { text-decoration: none; color: #374151; }
    .progress-track { height: 3px; background: #e5e7eb; }
    .progress-fill { height: 100%; background: #6366f1; transition: width 0.1s; }
  \`]
})
export class ProgressHeaderComponent {
  progress = 0;
  @HostListener('window:scroll') onScroll() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
  }
}

@NgModule({
  declarations: [ProgressHeaderComponent],
  imports: [BrowserModule],
  bootstrap: [ProgressHeaderComponent],
})
export class ProgressHeaderModule {}

export default createAngularMicroApp({
  name: 'progress-header',
  module: ProgressHeaderModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
];

export default templates;
