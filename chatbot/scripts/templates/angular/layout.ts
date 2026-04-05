import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'dashboard',
    description: 'Dashboard layout with sidebar, header and main content area',
    tags: ['layout', 'dashboard', 'admin'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-dashboard-layout',
  template: \`
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">Dashboard</div>
        <nav><a *ngFor="let item of navItems" [href]="'#' + item.toLowerCase()">{{ item }}</a></nav>
      </aside>
      <div class="main">
        <header class="header">
          <h1 class="page-title">Overview</h1>
          <div class="avatar">AD</div>
        </header>
        <div class="content">
          <div class="card" *ngFor="let stat of stats">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
          </div>
        </div>
      </div>
    </div>
  \`,
  styles: [\`
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 220px; background: #111827; color: #fff; padding: 20px 0; }
    .brand { font-size: 18px; font-weight: 700; padding: 0 20px 20px; color: #818cf8; }
    .sidebar nav { display: flex; flex-direction: column; }
    .sidebar nav a { padding: 10px 20px; color: #d1d5db; text-decoration: none; font-size: 14px; }
    .sidebar nav a:hover { background: #1f2937; }
    .main { flex: 1; background: #f9fafb; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: #fff; border-bottom: 1px solid #e5e7eb; }
    .page-title { font-size: 20px; margin: 0; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #6366f1; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
    .content { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding: 24px; }
    .card { background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .stat-label { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
    .stat-value { font-size: 28px; font-weight: 700; }
  \`]
})
export class DashboardLayoutComponent {
  navItems = ['Overview', 'Analytics', 'Customers', 'Products', 'Settings'];
  stats = [
    { label: 'Total Users', value: '12,847' },
    { label: 'Revenue', value: '$48.2k' },
    { label: 'Orders', value: '1,234' },
    { label: 'Conversion', value: '3.2%' },
  ];
}

@NgModule({
  declarations: [DashboardLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [DashboardLayoutComponent],
})
export class DashboardLayoutModule {}

export default createAngularMicroApp({
  name: 'dashboard-layout',
  module: DashboardLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'blog',
    description: 'Blog layout with article content area and aside widget column',
    tags: ['layout', 'blog', 'content'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-blog-layout',
  template: \`
    <div class="layout">
      <header class="header"><span class="brand">MyBlog</span><nav class="nav"><a href="#posts">Posts</a><a href="#about">About</a></nav></header>
      <div class="body">
        <main class="content">
          <article class="post" *ngFor="let post of posts">
            <h2 class="post-title">{{ post.title }}</h2>
            <p class="post-date">{{ post.date }}</p>
            <p class="post-excerpt">{{ post.excerpt }}</p>
          </article>
        </main>
        <aside class="sidebar">
          <div class="widget"><h3 class="widget-title">Categories</h3><a *ngFor="let c of categories" href="#">{{ c }}</a></div>
        </aside>
      </div>
    </div>
  \`,
  styles: [\`
    .layout { max-width: 1000px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #e5e7eb; }
    .brand { font-size: 20px; font-weight: 700; }
    .nav { display: flex; gap: 20px; }
    .nav a { text-decoration: none; color: #6b7280; }
    .body { display: flex; gap: 32px; padding: 24px 0; }
    .content { flex: 1; }
    .post { padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid #f3f4f6; }
    .post-title { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    .post-date { font-size: 12px; color: #9ca3af; margin: 0 0 8px; }
    .post-excerpt { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0; }
    .sidebar { width: 240px; flex-shrink: 0; }
    .widget { padding: 16px; background: #f9fafb; border-radius: 8px; }
    .widget-title { font-size: 14px; font-weight: 700; margin: 0 0 12px; }
    .widget a { display: block; padding: 4px 0; font-size: 13px; color: #6366f1; text-decoration: none; }
  \`]
})
export class BlogLayoutComponent {
  posts = [
    { title: 'Getting Started with Angular', date: 'Mar 10, 2024', excerpt: 'Learn the fundamentals of Angular framework...' },
    { title: 'State Management Patterns', date: 'Mar 8, 2024', excerpt: 'Explore different approaches to managing state...' },
  ];
  categories = ['Angular', 'TypeScript', 'RxJS', 'Testing'];
}

@NgModule({
  declarations: [BlogLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [BlogLayoutComponent],
})
export class BlogLayoutModule {}

export default createAngularMicroApp({
  name: 'blog-layout',
  module: BlogLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'portfolio',
    description: 'Portfolio layout with hero section and project grid',
    tags: ['layout', 'portfolio', 'showcase'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-portfolio-layout',
  template: \`
    <div class="layout">
      <header class="header"><span class="name">Jane Doe</span><nav><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a></nav></header>
      <section class="hero">
        <h1 class="hero-title">Frontend Developer & Designer</h1>
        <p class="hero-sub">Building beautiful, performant web experiences</p>
      </section>
      <section class="projects">
        <div class="project" *ngFor="let p of projects">
          <div class="project-thumb" [style.background]="p.color"></div>
          <h3 class="project-title">{{ p.name }}</h3>
          <p class="project-desc">{{ p.desc }}</p>
        </div>
      </section>
    </div>
  \`,
  styles: [\`
    .layout { max-width: 960px; margin: 0 auto; padding: 0 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; }
    .name { font-size: 18px; font-weight: 700; }
    .header nav { display: flex; gap: 20px; }
    .header nav a { text-decoration: none; color: #6b7280; font-size: 14px; }
    .hero { text-align: center; padding: 60px 0 40px; }
    .hero-title { font-size: 36px; font-weight: 700; margin: 0 0 8px; }
    .hero-sub { font-size: 16px; color: #6b7280; margin: 0; }
    .projects { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; padding-bottom: 40px; }
    .project-thumb { height: 180px; border-radius: 8px; }
    .project-title { font-size: 16px; font-weight: 700; margin: 12px 0 4px; }
    .project-desc { font-size: 13px; color: #6b7280; margin: 0; }
  \`]
})
export class PortfolioLayoutComponent {
  projects = [
    { name: 'E-commerce App', desc: 'Full-stack shopping platform', color: 'linear-gradient(135deg, #a78bfa, #6366f1)' },
    { name: 'Dashboard UI', desc: 'Analytics dashboard for SaaS', color: 'linear-gradient(135deg, #34d399, #10b981)' },
    { name: 'Mobile App', desc: 'Cross-platform mobile experience', color: 'linear-gradient(135deg, #fbbf24, #f59e0b)' },
  ];
}

@NgModule({
  declarations: [PortfolioLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [PortfolioLayoutComponent],
})
export class PortfolioLayoutModule {}

export default createAngularMicroApp({
  name: 'portfolio-layout',
  module: PortfolioLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'landing',
    description: 'Landing page layout with hero, features and CTA sections',
    tags: ['layout', 'landing', 'marketing'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-landing-layout',
  template: \`
    <div class="layout">
      <header class="header"><span class="brand">Product</span><button class="cta-btn">Get Started</button></header>
      <section class="hero">
        <h1>Build faster with micro frontends</h1>
        <p>Modular architecture for modern web applications</p>
        <button class="hero-btn">Start Free Trial</button>
      </section>
      <section class="features">
        <div class="feature" *ngFor="let f of features">
          <div class="feature-icon">{{ f.icon }}</div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </section>
    </div>
  \`,
  styles: [\`
    .layout { max-width: 960px; margin: 0 auto; padding: 0 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; }
    .brand { font-size: 20px; font-weight: 700; }
    .cta-btn { padding: 8px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .hero { text-align: center; padding: 80px 0 60px; }
    .hero h1 { font-size: 40px; font-weight: 700; margin: 0 0 12px; }
    .hero p { font-size: 18px; color: #6b7280; margin: 0 0 24px; }
    .hero-btn { padding: 14px 32px; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
    .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; padding: 40px 0; }
    .feature { text-align: center; }
    .feature-icon { font-size: 32px; margin-bottom: 12px; }
    .feature h3 { font-size: 16px; font-weight: 700; margin: 0 0 8px; }
    .feature p { font-size: 14px; color: #6b7280; margin: 0; line-height: 1.5; }
  \`]
})
export class LandingLayoutComponent {
  features = [
    { icon: '\\u26A1', title: 'Fast', desc: 'Optimized for speed with lazy loading' },
    { icon: '\\u{1F6E1}', title: 'Secure', desc: 'Built-in security best practices' },
    { icon: '\\u{1F527}', title: 'Modular', desc: 'Compose from independent micro apps' },
  ];
}

@NgModule({
  declarations: [LandingLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [LandingLayoutComponent],
})
export class LandingLayoutModule {}

export default createAngularMicroApp({
  name: 'landing-layout',
  module: LandingLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'admin',
    description: 'Admin panel layout with top bar, sidebar and tabbed content',
    tags: ['layout', 'admin', 'panel'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-admin-layout',
  template: \`
    <div class="layout">
      <header class="topbar">
        <span class="brand">Admin</span>
        <div class="topbar-actions"><span class="user">admin@example.com</span></div>
      </header>
      <div class="body">
        <aside class="sidebar">
          <a *ngFor="let item of menuItems" [href]="'#' + item.toLowerCase()" class="menu-item" [class.active]="active===item" (click)="active=item">{{ item }}</a>
        </aside>
        <main class="content">
          <h2>{{ active }}</h2>
          <p class="placeholder">Content area for {{ active }} management.</p>
        </main>
      </div>
    </div>
  \`,
  styles: [\`
    .layout { display: flex; flex-direction: column; min-height: 100vh; }
    .topbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: #1f2937; color: #fff; }
    .brand { font-size: 18px; font-weight: 700; }
    .user { font-size: 13px; color: #d1d5db; }
    .body { display: flex; flex: 1; }
    .sidebar { width: 200px; background: #f9fafb; border-right: 1px solid #e5e7eb; padding: 16px 0; }
    .menu-item { display: block; padding: 10px 20px; text-decoration: none; color: #374151; font-size: 14px; }
    .menu-item:hover { background: #f3f4f6; }
    .menu-item.active { color: #6366f1; font-weight: 600; background: #ede9fe; }
    .content { flex: 1; padding: 24px; }
    .content h2 { font-size: 22px; margin: 0 0 8px; }
    .placeholder { color: #6b7280; }
  \`]
})
export class AdminLayoutComponent {
  active = 'Users';
  menuItems = ['Users', 'Roles', 'Content', 'Media', 'Analytics', 'Settings'];
}

@NgModule({
  declarations: [AdminLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [AdminLayoutComponent],
})
export class AdminLayoutModule {}

export default createAngularMicroApp({
  name: 'admin-layout',
  module: AdminLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'e-commerce',
    description: 'E-commerce layout with product grid and filter sidebar',
    tags: ['layout', 'e-commerce', 'shop'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-ecommerce-layout',
  template: \`
    <div class="layout">
      <header class="header"><span class="brand">Shop</span><div class="cart">Cart ({{ cartCount }})</div></header>
      <div class="body">
        <aside class="filters">
          <h3 class="filter-title">Categories</h3>
          <a *ngFor="let c of categories" href="#" class="filter-item">{{ c }}</a>
        </aside>
        <main class="products">
          <div class="product" *ngFor="let p of products">
            <div class="product-img" [style.background]="p.color"></div>
            <div class="product-name">{{ p.name }}</div>
            <div class="product-price">{{ p.price }}</div>
          </div>
        </main>
      </div>
    </div>
  \`,
  styles: [\`
    .layout { max-width: 1000px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #e5e7eb; }
    .brand { font-size: 20px; font-weight: 700; }
    .cart { font-size: 14px; color: #6366f1; font-weight: 600; }
    .body { display: flex; gap: 24px; padding: 24px 0; }
    .filters { width: 180px; flex-shrink: 0; }
    .filter-title { font-size: 14px; font-weight: 700; margin: 0 0 12px; }
    .filter-item { display: block; padding: 6px 0; font-size: 13px; color: #6b7280; text-decoration: none; }
    .products { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; flex: 1; }
    .product { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .product-img { height: 140px; }
    .product-name { font-size: 14px; font-weight: 600; padding: 8px 12px 2px; }
    .product-price { font-size: 15px; font-weight: 700; color: #6366f1; padding: 0 12px 12px; }
  \`]
})
export class EcommerceLayoutComponent {
  cartCount = 2;
  categories = ['All', 'Electronics', 'Clothing', 'Books', 'Home'];
  products = [
    { name: 'Headphones', price: '$79', color: 'linear-gradient(135deg, #c7d2fe, #a78bfa)' },
    { name: 'Keyboard', price: '$129', color: 'linear-gradient(135deg, #99f6e4, #14b8a6)' },
    { name: 'Monitor', price: '$349', color: 'linear-gradient(135deg, #fde68a, #f59e0b)' },
    { name: 'Mouse', price: '$49', color: 'linear-gradient(135deg, #fca5a5, #ef4444)' },
  ];
}

@NgModule({
  declarations: [EcommerceLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [EcommerceLayoutComponent],
})
export class EcommerceLayoutModule {}

export default createAngularMicroApp({
  name: 'e-commerce-layout',
  module: EcommerceLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'docs',
    description: 'Documentation layout with navigation sidebar and content area',
    tags: ['layout', 'docs', 'documentation'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-docs-layout',
  template: \`
    <div class="layout">
      <header class="header"><span class="brand">Docs</span><input class="search" placeholder="Search docs..." /></header>
      <div class="body">
        <aside class="sidebar">
          <div *ngFor="let section of sections" class="section">
            <div class="section-title">{{ section.title }}</div>
            <a *ngFor="let link of section.links" href="#" class="doc-link">{{ link }}</a>
          </div>
        </aside>
        <main class="content">
          <h1 class="doc-title">Getting Started</h1>
          <p class="doc-text">Welcome to the documentation. Follow the guide below to set up your project.</p>
        </main>
      </div>
    </div>
  \`,
  styles: [\`
    .layout { min-height: 100vh; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; border-bottom: 1px solid #e5e7eb; }
    .brand { font-size: 18px; font-weight: 700; }
    .search { padding: 8px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; width: 240px; outline: none; }
    .body { display: flex; }
    .sidebar { width: 240px; border-right: 1px solid #e5e7eb; padding: 20px; overflow-y: auto; height: calc(100vh - 52px); }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; letter-spacing: 0.05em; }
    .doc-link { display: block; padding: 4px 0; font-size: 13px; color: #374151; text-decoration: none; }
    .doc-link:hover { color: #6366f1; }
    .content { flex: 1; padding: 32px; max-width: 720px; }
    .doc-title { font-size: 28px; font-weight: 700; margin: 0 0 16px; }
    .doc-text { font-size: 15px; color: #4b5563; line-height: 1.7; }
  \`]
})
export class DocsLayoutComponent {
  sections = [
    { title: 'Getting Started', links: ['Installation', 'Quick Start', 'Configuration'] },
    { title: 'Core Concepts', links: ['Components', 'Modules', 'Services'] },
    { title: 'API Reference', links: ['CLI', 'SDK', 'Hooks'] },
  ];
}

@NgModule({
  declarations: [DocsLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [DocsLayoutComponent],
})
export class DocsLayoutModule {}

export default createAngularMicroApp({
  name: 'docs-layout',
  module: DocsLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'saas-app',
    description: 'SaaS app layout with top navigation and card-based content',
    tags: ['layout', 'saas', 'application'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-saas-layout',
  template: \`
    <div class="layout">
      <header class="topnav">
        <span class="brand">SaaSApp</span>
        <nav class="nav"><a *ngFor="let tab of tabs" href="#" [class.active]="activeTab===tab" (click)="activeTab=tab">{{ tab }}</a></nav>
        <div class="user">JD</div>
      </header>
      <main class="content">
        <h2 class="page-title">{{ activeTab }}</h2>
        <div class="grid">
          <div class="card" *ngFor="let i of [1,2,3,4,5,6]">
            <div class="card-header">Item {{ i }}</div>
            <div class="card-body">Content placeholder for item {{ i }}.</div>
          </div>
        </div>
      </main>
    </div>
  \`,
  styles: [\`
    .layout { min-height: 100vh; background: #f9fafb; }
    .topnav { display: flex; align-items: center; padding: 12px 24px; background: #fff; border-bottom: 1px solid #e5e7eb; gap: 32px; }
    .brand { font-size: 18px; font-weight: 700; }
    .nav { display: flex; gap: 16px; }
    .nav a { text-decoration: none; color: #6b7280; font-size: 14px; padding: 4px 8px; border-radius: 4px; }
    .nav a.active { color: #6366f1; font-weight: 600; background: #ede9fe; }
    .user { margin-left: auto; width: 32px; height: 32px; border-radius: 50%; background: #6366f1; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
    .content { padding: 24px; }
    .page-title { font-size: 22px; margin: 0 0 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
    .card-header { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
    .card-body { font-size: 13px; color: #6b7280; }
  \`]
})
export class SaasLayoutComponent {
  activeTab = 'Projects';
  tabs = ['Projects', 'Team', 'Billing', 'Settings'];
}

@NgModule({
  declarations: [SaasLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [SaasLayoutComponent],
})
export class SaasLayoutModule {}

export default createAngularMicroApp({
  name: 'saas-app-layout',
  module: SaasLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'split',
    description: 'Split layout with two equal panels side by side',
    tags: ['layout', 'split', 'two-panel'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-split-layout',
  template: \`
    <div class="layout">
      <div class="panel left">
        <h2 class="panel-title">Editor</h2>
        <textarea class="editor" placeholder="Write your code here..." [value]="code" (input)="code=$any($event.target).value"></textarea>
      </div>
      <div class="panel right">
        <h2 class="panel-title">Preview</h2>
        <div class="preview">{{ code || 'Preview will appear here...' }}</div>
      </div>
    </div>
  \`,
  styles: [\`
    .layout { display: flex; height: 100vh; }
    .panel { flex: 1; display: flex; flex-direction: column; }
    .left { border-right: 1px solid #e5e7eb; }
    .panel-title { font-size: 14px; font-weight: 700; padding: 12px 16px; margin: 0; border-bottom: 1px solid #e5e7eb; }
    .editor { flex: 1; border: none; padding: 16px; font-family: monospace; font-size: 14px; resize: none; outline: none; background: #1f2937; color: #f9fafb; }
    .preview { flex: 1; padding: 16px; font-size: 14px; color: #374151; background: #fff; white-space: pre-wrap; }
  \`]
})
export class SplitLayoutComponent {
  code = '';
}

@NgModule({
  declarations: [SplitLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [SplitLayoutComponent],
})
export class SplitLayoutModule {}

export default createAngularMicroApp({
  name: 'split-layout',
  module: SplitLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'three-column',
    description: 'Three-column layout with left nav, content and right sidebar',
    tags: ['layout', 'three-column', 'complex'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-three-col-layout',
  template: \`
    <div class="layout">
      <aside class="left">
        <div class="brand">App</div>
        <a *ngFor="let item of navItems" href="#" class="nav-link">{{ item }}</a>
      </aside>
      <main class="center">
        <h1 class="title">Feed</h1>
        <div class="post" *ngFor="let i of [1,2,3]">
          <div class="post-header">Post {{ i }}</div>
          <div class="post-body">Content for post {{ i }}...</div>
        </div>
      </main>
      <aside class="right">
        <div class="widget">
          <h3 class="widget-title">Trending</h3>
          <div class="trend" *ngFor="let t of trending">{{ t }}</div>
        </div>
      </aside>
    </div>
  \`,
  styles: [\`
    .layout { display: flex; min-height: 100vh; }
    .left { width: 200px; padding: 20px; border-right: 1px solid #e5e7eb; }
    .brand { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
    .nav-link { display: block; padding: 8px 0; text-decoration: none; color: #374151; font-size: 14px; }
    .center { flex: 1; padding: 24px; max-width: 600px; }
    .title { font-size: 22px; margin: 0 0 20px; }
    .post { padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; }
    .post-header { font-weight: 600; margin-bottom: 8px; }
    .post-body { font-size: 14px; color: #6b7280; }
    .right { width: 240px; padding: 20px; border-left: 1px solid #e5e7eb; }
    .widget-title { font-size: 14px; font-weight: 700; margin: 0 0 12px; }
    .trend { padding: 6px 0; font-size: 13px; color: #6366f1; }
  \`]
})
export class ThreeColLayoutComponent {
  navItems = ['Home', 'Explore', 'Notifications', 'Messages', 'Profile'];
  trending = ['#Angular', '#TypeScript', '#MicroFrontends', '#WebDev'];
}

@NgModule({
  declarations: [ThreeColLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [ThreeColLayoutComponent],
})
export class ThreeColLayoutModule {}

export default createAngularMicroApp({
  name: 'three-column-layout',
  module: ThreeColLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'two-column',
    description: 'Two-column layout with sidebar navigation and main content',
    tags: ['layout', 'two-column', 'standard'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-two-col-layout',
  template: \`
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">TwoCol</div>
        <nav><a *ngFor="let item of items" href="#" class="nav-link">{{ item }}</a></nav>
      </aside>
      <main class="content">
        <h1>Welcome</h1>
        <p class="text">This is a standard two-column layout with sidebar navigation and a main content area.</p>
      </main>
    </div>
  \`,
  styles: [\`
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 240px; background: #f9fafb; border-right: 1px solid #e5e7eb; padding: 20px; }
    .brand { font-size: 18px; font-weight: 700; margin-bottom: 24px; }
    .nav-link { display: block; padding: 8px 12px; text-decoration: none; color: #374151; font-size: 14px; border-radius: 6px; }
    .nav-link:hover { background: #e5e7eb; }
    .content { flex: 1; padding: 32px; }
    .content h1 { font-size: 28px; margin: 0 0 12px; }
    .text { font-size: 15px; color: #6b7280; line-height: 1.6; }
  \`]
})
export class TwoColLayoutComponent {
  items = ['Dashboard', 'Projects', 'Tasks', 'Calendar', 'Reports'];
}

@NgModule({
  declarations: [TwoColLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [TwoColLayoutComponent],
})
export class TwoColLayoutModule {}

export default createAngularMicroApp({
  name: 'two-column-layout',
  module: TwoColLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'full-width',
    description: 'Full-width layout with centered content and no sidebar',
    tags: ['layout', 'full-width', 'centered'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-fullwidth-layout',
  template: \`
    <div class="layout">
      <header class="header"><span class="brand">FullWidth</span><nav class="nav"><a href="#home">Home</a><a href="#about">About</a><a href="#contact">Contact</a></nav></header>
      <main class="content">
        <section class="section">
          <h1 class="title">Full Width Layout</h1>
          <p class="text">Content stretches across the entire viewport width with a centered max-width container.</p>
        </section>
      </main>
      <footer class="footer">
        <p>&copy; 2024 FullWidth App</p>
      </footer>
    </div>
  \`,
  styles: [\`
    .layout { min-height: 100vh; display: flex; flex-direction: column; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
    .brand { font-size: 20px; font-weight: 700; }
    .nav { display: flex; gap: 20px; }
    .nav a { text-decoration: none; color: #6b7280; }
    .content { flex: 1; width: 100%; max-width: 800px; margin: 0 auto; padding: 40px 24px; }
    .title { font-size: 32px; font-weight: 700; margin: 0 0 16px; }
    .text { font-size: 16px; color: #6b7280; line-height: 1.7; }
    .footer { text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af; }
  \`]
})
export class FullWidthLayoutComponent {}

@NgModule({
  declarations: [FullWidthLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [FullWidthLayoutComponent],
})
export class FullWidthLayoutModule {}

export default createAngularMicroApp({
  name: 'full-width-layout',
  module: FullWidthLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'sticky-header',
    description: 'Layout with sticky header and scrollable content below',
    tags: ['layout', 'sticky-header', 'scroll'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-sticky-header-layout',
  template: \`
    <div class="layout">
      <header class="header">
        <span class="brand">StickyLayout</span>
        <nav class="nav"><a href="#home">Home</a><a href="#about">About</a><a href="#contact">Contact</a></nav>
      </header>
      <main class="content">
        <div class="section" *ngFor="let s of sections">
          <h2>{{ s.title }}</h2>
          <p>{{ s.content }}</p>
        </div>
      </main>
    </div>
  \`,
  styles: [\`
    .header { position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background: #fff; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .brand { font-size: 18px; font-weight: 700; }
    .nav { display: flex; gap: 20px; }
    .nav a { text-decoration: none; color: #6b7280; font-size: 14px; }
    .content { max-width: 720px; margin: 0 auto; padding: 32px 24px; }
    .section { margin-bottom: 40px; }
    .section h2 { font-size: 24px; margin: 0 0 12px; }
    .section p { font-size: 15px; color: #6b7280; line-height: 1.7; }
  \`]
})
export class StickyHeaderLayoutComponent {
  sections = [
    { title: 'Introduction', content: 'This layout features a sticky header that stays at the top as you scroll.' },
    { title: 'Features', content: 'The header uses position: sticky for a smooth scrolling experience.' },
    { title: 'Benefits', content: 'Users always have access to navigation regardless of scroll position.' },
  ];
}

@NgModule({
  declarations: [StickyHeaderLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [StickyHeaderLayoutComponent],
})
export class StickyHeaderLayoutModule {}

export default createAngularMicroApp({
  name: 'sticky-header-layout',
  module: StickyHeaderLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'sticky-sidebar',
    description: 'Layout with sticky sidebar and scrollable main content',
    tags: ['layout', 'sticky-sidebar', 'fixed'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-sticky-sidebar-layout',
  template: \`
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">StickySide</div>
        <nav><a *ngFor="let item of navItems" href="#" class="nav-link">{{ item }}</a></nav>
      </aside>
      <main class="content">
        <h1>Main Content</h1>
        <p *ngFor="let i of [1,2,3,4,5]" class="paragraph">Paragraph {{ i }}: Lorem ipsum content to demonstrate scrollable main area alongside the sticky sidebar.</p>
      </main>
    </div>
  \`,
  styles: [\`
    .layout { display: flex; min-height: 100vh; }
    .sidebar { position: sticky; top: 0; width: 220px; height: 100vh; background: #f9fafb; border-right: 1px solid #e5e7eb; padding: 20px; overflow-y: auto; flex-shrink: 0; }
    .brand { font-size: 18px; font-weight: 700; margin-bottom: 24px; }
    .nav-link { display: block; padding: 8px 0; text-decoration: none; color: #374151; font-size: 14px; }
    .content { flex: 1; padding: 32px; }
    .content h1 { font-size: 28px; margin: 0 0 20px; }
    .paragraph { font-size: 15px; color: #6b7280; line-height: 1.7; margin-bottom: 24px; }
  \`]
})
export class StickySidebarLayoutComponent {
  navItems = ['Overview', 'Components', 'Modules', 'Services', 'Routing', 'Testing'];
}

@NgModule({
  declarations: [StickySidebarLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [StickySidebarLayoutComponent],
})
export class StickySidebarLayoutModule {}

export default createAngularMicroApp({
  name: 'sticky-sidebar-layout',
  module: StickySidebarLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
  {
    variant: 'grid',
    description: 'Grid-based layout with responsive card grid and header',
    tags: ['layout', 'grid', 'responsive'],
    code: `import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-grid-layout',
  template: \`
    <div class="layout">
      <header class="header"><span class="brand">GridApp</span></header>
      <main class="grid">
        <div class="cell" *ngFor="let item of items" [style.gridColumn]="item.span">
          <h3 class="cell-title">{{ item.title }}</h3>
          <p class="cell-text">{{ item.desc }}</p>
        </div>
      </main>
    </div>
  \`,
  styles: [\`
    .layout { max-width: 960px; margin: 0 auto; padding: 0 24px; }
    .header { padding: 16px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px; }
    .brand { font-size: 20px; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .cell { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
    .cell-title { font-size: 15px; font-weight: 700; margin: 0 0 8px; }
    .cell-text { font-size: 13px; color: #6b7280; margin: 0; }
  \`]
})
export class GridLayoutComponent {
  items = [
    { title: 'Overview', desc: 'Summary of key metrics', span: 'span 2' },
    { title: 'Revenue', desc: 'Monthly revenue chart', span: 'span 2' },
    { title: 'Users', desc: 'Active user count', span: 'span 1' },
    { title: 'Orders', desc: 'Recent orders', span: 'span 1' },
    { title: 'Tasks', desc: 'Pending tasks', span: 'span 1' },
    { title: 'Alerts', desc: 'System alerts', span: 'span 1' },
  ];
}

@NgModule({
  declarations: [GridLayoutComponent],
  imports: [BrowserModule],
  bootstrap: [GridLayoutComponent],
})
export class GridLayoutModule {}

export default createAngularMicroApp({
  name: 'grid-layout',
  module: GridLayoutModule,
  platform: platformBrowserDynamic,
});`,
    dependencies: ['@tuvix.js/angular', '@tuvix.js/core', '@angular/core', '@angular/platform-browser', '@angular/platform-browser-dynamic'],
  },
];

export default templates;
