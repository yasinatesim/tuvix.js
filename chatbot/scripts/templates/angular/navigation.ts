import type { ComponentTemplate } from '@scripts/generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'breadcrumb',
    description: 'Breadcrumb navigation showing current page path',
    tags: ['navigation', 'breadcrumb', 'path'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-breadcrumb-nav',
  template: \`<nav class="breadcrumb"><span *ngFor="let crumb of crumbs; let i = index; let last = last"><span *ngIf="i > 0" class="sep">/</span><a *ngIf="!last" [href]="crumb.href" class="link">{{ crumb.label }}</a><span *ngIf="last" class="current">{{ crumb.label }}</span></span></nav>\`,
  styles: [\`.breadcrumb { display: flex; align-items: center; gap: 4px; font-size: 14px; padding: 12px 0; } .sep { color: #9ca3af; margin: 0 4px; } .link { color: #6366f1; text-decoration: none; } .current { color: #374151; font-weight: 600; }\`]
})
export class BreadcrumbNavComponent { crumbs = [{ label: 'Home', href: '#' }, { label: 'Products', href: '#products' }, { label: 'Widget Pro', href: '' }]; }

@NgModule({ declarations: [BreadcrumbNavComponent], imports: [BrowserModule], bootstrap: [BreadcrumbNavComponent] })
export class BreadcrumbNavModule {}
export default createAngularMicroApp({ name: 'breadcrumb-nav', module: BreadcrumbNavModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'tabs',
    description: 'Tab navigation with active state and content switching',
    tags: ['navigation', 'tabs', 'switch'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-tabs-nav',
  template: \`<div class="tabs"><button *ngFor="let tab of tabs" class="tab" [class.active]="active===tab" (click)="active=tab">{{ tab }}</button></div><div class="content">Content for {{ active }}</div>\`,
  styles: [\`.tabs { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; } .tab { padding: 10px 20px; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; font-size: 14px; font-weight: 500; color: #6b7280; } .tab.active { border-bottom-color: #6366f1; color: #6366f1; font-weight: 600; } .content { padding: 20px 0; font-size: 14px; color: #6b7280; }\`]
})
export class TabsNavComponent { active = 'Overview'; tabs = ['Overview', 'Features', 'Pricing', 'Reviews']; }

@NgModule({ declarations: [TabsNavComponent], imports: [BrowserModule], bootstrap: [TabsNavComponent] })
export class TabsNavModule {}
export default createAngularMicroApp({ name: 'tabs-nav', module: TabsNavModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'stepper',
    description: 'Step-by-step progress navigation with numbered steps',
    tags: ['navigation', 'stepper', 'progress'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-stepper-nav',
  template: \`<div class="stepper"><div *ngFor="let step of steps; let i = index" class="step" [class.active]="i <= current" [class.done]="i < current"><div class="circle">{{ i < current ? '\\u2713' : i + 1 }}</div><span class="label">{{ step }}</span></div></div><div class="actions"><button [disabled]="current===0" (click)="current=current-1">Back</button><button [disabled]="current===steps.length-1" (click)="current=current+1">Next</button></div>\`,
  styles: [\`.stepper { display: flex; align-items: center; gap: 8px; padding: 20px 0; } .step { display: flex; align-items: center; gap: 8px; } .step::after { content: ''; width: 40px; height: 2px; background: #e5e7eb; } .step:last-child::after { display: none; } .step.active::after { background: #6366f1; } .circle { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; } .step.active .circle { border-color: #6366f1; color: #6366f1; } .step.done .circle { background: #6366f1; color: #fff; border-color: #6366f1; } .label { font-size: 13px; color: #6b7280; } .step.active .label { color: #6366f1; font-weight: 600; } .actions { display: flex; gap: 8px; padding: 16px 0; } .actions button { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; } .actions button:disabled { opacity: 0.4; }\`]
})
export class StepperNavComponent { current = 0; steps = ['Account', 'Profile', 'Payment', 'Confirm']; }

@NgModule({ declarations: [StepperNavComponent], imports: [BrowserModule], bootstrap: [StepperNavComponent] })
export class StepperNavModule {}
export default createAngularMicroApp({ name: 'stepper-nav', module: StepperNavModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'pagination',
    description: 'Pagination navigation with page numbers and prev/next',
    tags: ['navigation', 'pagination', 'pages'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-pagination-nav',
  template: \`<nav class="pagination"><button [disabled]="page===1" (click)="page=page-1">\\u2190 Prev</button><button *ngFor="let p of pages" class="page-btn" [class.active]="page===p" (click)="page=p">{{ p }}</button><button [disabled]="page===totalPages" (click)="page=page+1">Next \\u2192</button></nav>\`,
  styles: [\`.pagination { display: flex; align-items: center; gap: 4px; } button { padding: 8px 14px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; } button:disabled { opacity: 0.4; cursor: default; } .page-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }\`]
})
export class PaginationNavComponent {
  page = 1; totalPages = 5;
  get pages() { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
}

@NgModule({ declarations: [PaginationNavComponent], imports: [BrowserModule], bootstrap: [PaginationNavComponent] })
export class PaginationNavModule {}
export default createAngularMicroApp({ name: 'pagination-nav', module: PaginationNavModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'menu',
    description: 'Dropdown menu navigation with hover reveal',
    tags: ['navigation', 'menu', 'dropdown'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-menu-nav',
  template: \`<div class="menu-container"><button class="trigger" (click)="open=!open">Menu \\u25BC</button><div class="menu" *ngIf="open"><a *ngFor="let item of items" [href]="'#' + item.toLowerCase()" class="menu-item" (click)="open=false">{{ item }}</a></div></div>\`,
  styles: [\`.menu-container { position: relative; display: inline-block; } .trigger { padding: 10px 20px; background: #fff; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 14px; } .menu { position: absolute; top: 100%; left: 0; margin-top: 4px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; min-width: 180px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; padding: 4px 0; } .menu-item { display: block; padding: 10px 16px; text-decoration: none; color: #374151; font-size: 14px; } .menu-item:hover { background: #f3f4f6; }\`]
})
export class MenuNavComponent { open = false; items = ['Dashboard', 'Profile', 'Settings', 'Help', 'Log Out']; }

@NgModule({ declarations: [MenuNavComponent], imports: [BrowserModule], bootstrap: [MenuNavComponent] })
export class MenuNavModule {}
export default createAngularMicroApp({ name: 'menu-nav', module: MenuNavModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'navbar',
    description: 'Horizontal navigation bar with links and active state',
    tags: ['navigation', 'navbar', 'horizontal'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-navbar',
  template: \`<nav class="navbar"><a *ngFor="let link of links" [href]="'#' + link.toLowerCase()" class="link" [class.active]="active===link" (click)="active=link">{{ link }}</a></nav>\`,
  styles: [\`.navbar { display: flex; gap: 8px; padding: 8px; background: #f9fafb; border-radius: 8px; } .link { padding: 8px 16px; text-decoration: none; color: #6b7280; border-radius: 6px; font-size: 14px; font-weight: 500; } .link:hover { background: #e5e7eb; } .link.active { background: #6366f1; color: #fff; }\`]
})
export class NavbarComponent { active = 'Home'; links = ['Home', 'Products', 'About', 'Contact']; }

@NgModule({ declarations: [NavbarComponent], imports: [BrowserModule], bootstrap: [NavbarComponent] })
export class NavbarModule {}
export default createAngularMicroApp({ name: 'navbar-nav', module: NavbarModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'drawer',
    description: 'Slide-out navigation drawer for mobile interfaces',
    tags: ['navigation', 'drawer', 'mobile'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-drawer-nav',
  template: \`<button class="toggle" (click)="open=true">\\u2630</button><div class="overlay" *ngIf="open"><div class="backdrop" (click)="open=false"></div><nav class="drawer"><button class="close" (click)="open=false">\\u2715</button><a *ngFor="let item of items" href="#" (click)="open=false">{{ item }}</a></nav></div>\`,
  styles: [\`.toggle { padding: 10px 16px; background: #fff; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 20px; } .overlay { position: fixed; inset: 0; z-index: 50; display: flex; } .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); } .drawer { position: relative; width: 260px; background: #fff; padding: 20px; display: flex; flex-direction: column; gap: 4px; } .close { align-self: flex-end; background: none; border: none; font-size: 18px; cursor: pointer; margin-bottom: 16px; } .drawer a { padding: 12px 8px; text-decoration: none; color: #374151; font-size: 15px; border-radius: 6px; } .drawer a:hover { background: #f3f4f6; }\`]
})
export class DrawerNavComponent { open = false; items = ['Home', 'Explore', 'Notifications', 'Messages', 'Profile']; }

@NgModule({ declarations: [DrawerNavComponent], imports: [BrowserModule], bootstrap: [DrawerNavComponent] })
export class DrawerNavModule {}
export default createAngularMicroApp({ name: 'drawer-nav', module: DrawerNavModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'mega-menu',
    description: 'Mega menu navigation with multi-column dropdown',
    tags: ['navigation', 'mega-menu', 'complex'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-mega-menu',
  template: \`<nav class="nav"><div class="menu-trigger" (mouseenter)="open=true" (mouseleave)="open=false"><button class="nav-btn">Products \\u25BC</button><div class="mega" *ngIf="open"><div class="col" *ngFor="let col of columns"><h4 class="col-title">{{ col.title }}</h4><a *ngFor="let link of col.links" href="#" class="mega-link">{{ link }}</a></div></div></div></nav>\`,
  styles: [\`.nav { position: relative; } .nav-btn { padding: 10px 20px; background: none; border: none; font-size: 14px; font-weight: 600; cursor: pointer; } .mega { position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; display: flex; gap: 32px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); z-index: 20; } .col-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #9ca3af; margin: 0 0 8px; } .mega-link { display: block; padding: 4px 0; font-size: 14px; color: #374151; text-decoration: none; } .mega-link:hover { color: #6366f1; }\`]
})
export class MegaMenuComponent {
  open = false;
  columns = [
    { title: 'Platform', links: ['Overview', 'Features', 'Integrations'] },
    { title: 'Solutions', links: ['Enterprise', 'Small Business', 'Startups'] },
    { title: 'Resources', links: ['Documentation', 'Tutorials', 'Community'] },
  ];
}

@NgModule({ declarations: [MegaMenuComponent], imports: [BrowserModule], bootstrap: [MegaMenuComponent] })
export class MegaMenuModule {}
export default createAngularMicroApp({ name: 'mega-menu-nav', module: MegaMenuModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'bottom-bar',
    description: 'Bottom navigation bar for mobile app interfaces',
    tags: ['navigation', 'bottom-bar', 'mobile'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-bottom-bar',
  template: \`<nav class="bottom-bar"><button *ngFor="let item of items" class="bar-item" [class.active]="active===item.label" (click)="active=item.label"><span class="icon">{{ item.icon }}</span><span class="label">{{ item.label }}</span></button></nav>\`,
  styles: [\`.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; background: #fff; border-top: 1px solid #e5e7eb; padding: 8px 0 12px; } .bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: none; cursor: pointer; padding: 4px; } .icon { font-size: 20px; } .label { font-size: 11px; color: #6b7280; } .bar-item.active .label { color: #6366f1; font-weight: 600; }\`]
})
export class BottomBarComponent {
  active = 'Home';
  items = [{ icon: '\\u{1F3E0}', label: 'Home' }, { icon: '\\u{1F50D}', label: 'Search' }, { icon: '\\u{2795}', label: 'Create' }, { icon: '\\u{1F514}', label: 'Alerts' }, { icon: '\\u{1F464}', label: 'Profile' }];
}

@NgModule({ declarations: [BottomBarComponent], imports: [BrowserModule], bootstrap: [BottomBarComponent] })
export class BottomBarModule {}
export default createAngularMicroApp({ name: 'bottom-bar-nav', module: BottomBarModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'side-menu',
    description: 'Vertical side menu with grouped navigation items',
    tags: ['navigation', 'side-menu', 'vertical'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-side-menu',
  template: \`<nav class="side-menu"><div *ngFor="let group of groups" class="group"><div class="group-title">{{ group.title }}</div><a *ngFor="let item of group.items" href="#" class="menu-item" [class.active]="active===item" (click)="active=item">{{ item }}</a></div></nav>\`,
  styles: [\`.side-menu { width: 220px; padding: 16px 0; } .group { margin-bottom: 20px; } .group-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; padding: 0 16px 8px; letter-spacing: 0.05em; } .menu-item { display: block; padding: 8px 16px; text-decoration: none; color: #374151; font-size: 14px; border-radius: 6px; margin: 0 8px; } .menu-item:hover { background: #f3f4f6; } .menu-item.active { background: #ede9fe; color: #6366f1; font-weight: 600; }\`]
})
export class SideMenuComponent {
  active = 'Dashboard';
  groups = [
    { title: 'Main', items: ['Dashboard', 'Projects', 'Tasks'] },
    { title: 'Team', items: ['Members', 'Roles', 'Activity'] },
    { title: 'Account', items: ['Settings', 'Billing'] },
  ];
}

@NgModule({ declarations: [SideMenuComponent], imports: [BrowserModule], bootstrap: [SideMenuComponent] })
export class SideMenuModule {}
export default createAngularMicroApp({ name: 'side-menu-nav', module: SideMenuModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'wizard',
    description: 'Wizard navigation with connected step indicators',
    tags: ['navigation', 'wizard', 'steps'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-wizard-nav',
  template: \`<div class="wizard"><div *ngFor="let step of steps; let i = index" class="step-item"><div class="connector" *ngIf="i > 0" [class.filled]="i <= current"></div><div class="step-circle" [class.active]="i === current" [class.done]="i < current" (click)="current=i">{{ i < current ? '\\u2713' : i + 1 }}</div><div class="step-label" [class.active]="i === current">{{ step }}</div></div></div>\`,
  styles: [\`.wizard { display: flex; align-items: flex-start; padding: 20px 0; } .step-item { display: flex; flex-direction: column; align-items: center; position: relative; flex: 1; } .connector { position: absolute; top: 16px; right: 50%; width: 100%; height: 2px; background: #e5e7eb; z-index: 0; } .connector.filled { background: #6366f1; } .step-circle { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; background: #fff; z-index: 1; cursor: pointer; } .step-circle.active { border-color: #6366f1; color: #6366f1; } .step-circle.done { background: #6366f1; color: #fff; border-color: #6366f1; } .step-label { font-size: 12px; color: #6b7280; margin-top: 8px; } .step-label.active { color: #6366f1; font-weight: 600; }\`]
})
export class WizardNavComponent { current = 1; steps = ['Cart', 'Shipping', 'Payment', 'Review']; }

@NgModule({ declarations: [WizardNavComponent], imports: [BrowserModule], bootstrap: [WizardNavComponent] })
export class WizardNavModule {}
export default createAngularMicroApp({ name: 'wizard-nav', module: WizardNavModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'segmented-control',
    description: 'Segmented control for switching between views',
    tags: ['navigation', 'segmented', 'toggle'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-segmented-control',
  template: \`<div class="control"><button *ngFor="let seg of segments" class="segment" [class.active]="active===seg" (click)="active=seg">{{ seg }}</button></div><div class="content">Showing: {{ active }}</div>\`,
  styles: [\`.control { display: inline-flex; background: #f3f4f6; border-radius: 8px; padding: 4px; } .segment { padding: 8px 20px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; color: #6b7280; } .segment.active { background: #fff; color: #374151; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 600; } .content { padding: 16px 0; font-size: 14px; color: #6b7280; }\`]
})
export class SegmentedControlComponent { active = 'Grid'; segments = ['Grid', 'List', 'Board']; }

@NgModule({ declarations: [SegmentedControlComponent], imports: [BrowserModule], bootstrap: [SegmentedControlComponent] })
export class SegmentedControlModule {}
export default createAngularMicroApp({ name: 'segmented-control-nav', module: SegmentedControlModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'anchor-nav',
    description: 'Anchor navigation for scrolling to page sections',
    tags: ['navigation', 'anchor', 'scroll'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-anchor-nav',
  template: \`<nav class="anchor-nav"><a *ngFor="let section of sections" [href]="'#' + section.toLowerCase()" class="anchor" [class.active]="active===section" (click)="active=section">{{ section }}</a></nav>\`,
  styles: [\`.anchor-nav { display: flex; flex-direction: column; gap: 2px; width: 180px; border-left: 2px solid #e5e7eb; padding-left: 12px; } .anchor { padding: 6px 12px; text-decoration: none; color: #6b7280; font-size: 13px; border-radius: 4px; } .anchor:hover { color: #374151; } .anchor.active { color: #6366f1; font-weight: 600; background: #ede9fe; }\`]
})
export class AnchorNavComponent { active = 'Introduction'; sections = ['Introduction', 'Installation', 'Usage', 'API', 'Examples', 'FAQ']; }

@NgModule({ declarations: [AnchorNavComponent], imports: [BrowserModule], bootstrap: [AnchorNavComponent] })
export class AnchorNavModule {}
export default createAngularMicroApp({ name: 'anchor-nav', module: AnchorNavModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'tag-nav',
    description: 'Tag-based navigation for filtering content by tags',
    tags: ['navigation', 'tags', 'filter'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-tag-nav',
  template: \`<div class="tags"><button *ngFor="let tag of tags" class="tag" [class.active]="selected.includes(tag)" (click)="toggle(tag)">{{ tag }}</button></div><div class="info">Selected: {{ selected.length ? selected.join(', ') : 'None' }}</div>\`,
  styles: [\`.tags { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 0; } .tag { padding: 6px 14px; border: 1px solid #d1d5db; border-radius: 20px; background: #fff; cursor: pointer; font-size: 13px; color: #374151; } .tag:hover { border-color: #6366f1; } .tag.active { background: #6366f1; color: #fff; border-color: #6366f1; } .info { font-size: 13px; color: #6b7280; padding: 8px 0; }\`]
})
export class TagNavComponent {
  selected: string[] = [];
  tags = ['All', 'Angular', 'React', 'Vue', 'Svelte', 'TypeScript', 'CSS'];
  toggle(tag: string) { const i = this.selected.indexOf(tag); if (i >= 0) this.selected.splice(i, 1); else this.selected.push(tag); }
}

@NgModule({ declarations: [TagNavComponent], imports: [BrowserModule], bootstrap: [TagNavComponent] })
export class TagNavModule {}
export default createAngularMicroApp({ name: 'tag-nav', module: TagNavModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'dot-nav',
    description: 'Dot indicator navigation for carousels and slideshows',
    tags: ['navigation', 'dots', 'carousel'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-dot-nav',
  template: \`<div class="slide" [style.background]="slides[current].color"><div class="slide-text">{{ slides[current].label }}</div></div><div class="dots"><button class="arrow" (click)="prev()">\\u2190</button><button *ngFor="let s of slides; let i = index" class="dot" [class.active]="i===current" (click)="current=i"></button><button class="arrow" (click)="next()">\\u2192</button></div>\`,
  styles: [\`.slide { height: 200px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; } .slide-text { color: #fff; font-size: 20px; font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,0.3); } .dots { display: flex; align-items: center; justify-content: center; gap: 8px; } .dot { width: 10px; height: 10px; border-radius: 50%; border: none; background: #d1d5db; cursor: pointer; padding: 0; } .dot.active { background: #6366f1; width: 24px; border-radius: 5px; } .arrow { background: none; border: none; font-size: 18px; cursor: pointer; padding: 4px 8px; }\`]
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

@NgModule({ declarations: [DotNavComponent], imports: [BrowserModule], bootstrap: [DotNavComponent] })
export class DotNavModule {}
export default createAngularMicroApp({ name: 'dot-nav', module: DotNavModule, platform: platformBrowserDynamic });`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
];

export default templates;
