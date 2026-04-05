import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'dashboard',
    description: 'Dashboard layout with sidebar, topbar, and main content area with grid widgets',
    tags: ['layout', 'dashboard', 'admin'],
    code: `<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="sidebar-brand">Dashboard</div>
      <nav class="sidebar-nav">
        <a v-for="item in navItems" :key="item" href="#"
           :class="{ active: active === item }" @click.prevent="active = item">{{ item }}</a>
      </nav>
    </aside>
    <div class="main-area">
      <header class="topbar">
        <h2 class="page-title">{{ active }}</h2>
        <div class="topbar-actions">
          <span class="user-name">Admin</span>
        </div>
      </header>
      <main class="content-grid">
        <div v-for="widget in widgets" :key="widget" class="widget">{{ widget }}</div>
      </main>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const DashboardLayout = defineComponent({
  name: 'DashboardLayout',
  setup() {
    const active = ref('Overview');
    const navItems = ['Overview', 'Analytics', 'Users', 'Reports', 'Settings'];
    const widgets = ['Revenue', 'Users', 'Orders', 'Conversion'];
    return { active, navItems, widgets };
  },
});

export default createVueMicroApp({ name: 'dashboard-layout', App: DashboardLayout });
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 220px;
  background: #1f2937;
  color: #f9fafb;
  flex-shrink: 0;
}
.sidebar-brand {
  padding: 20px;
  font-size: 18px;
  font-weight: 700;
  border-bottom: 1px solid #374151;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}
.sidebar-nav a {
  padding: 10px 20px;
  color: #9ca3af;
  text-decoration: none;
  font-size: 14px;
}
.sidebar-nav a:hover { color: #f9fafb; background: #374151; }
.sidebar-nav a.active { color: #fff; background: #3b82f6; }
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.page-title { font-size: 20px; margin: 0; }
.user-name { font-size: 14px; color: #6b7280; }
.content-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 24px;
  background: #f9fafb;
  flex: 1;
}
.widget {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  font-weight: 600;
  font-size: 16px;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'blog',
    description: 'Blog layout with header, article content area, and right sidebar',
    tags: ['layout', 'blog', 'content'],
    code: `<template>
  <div class="blog-layout">
    <header class="blog-header">
      <span class="blog-name">{{ blogName }}</span>
      <nav class="header-nav">
        <a v-for="link in navLinks" :key="link" href="#">{{ link }}</a>
      </nav>
    </header>
    <div class="blog-content">
      <main class="article-area">
        <article class="article">
          <h1 class="article-title">{{ articleTitle }}</h1>
          <p class="article-meta">By {{ author }} &middot; {{ date }}</p>
          <div class="article-body">
            <p>{{ excerpt }}</p>
          </div>
        </article>
      </main>
      <aside class="blog-sidebar">
        <div class="sidebar-section">
          <h3>Categories</h3>
          <a v-for="cat in categories" :key="cat" href="#">{{ cat }}</a>
        </div>
      </aside>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const BlogLayout = defineComponent({
  name: 'BlogLayout',
  setup() {
    const blogName = ref('DevBlog');
    const navLinks = ['Home', 'Articles', 'About'];
    const articleTitle = ref('Getting Started with Micro-Frontends');
    const author = ref('Jane Doe');
    const date = ref('March 15, 2024');
    const excerpt = ref('Micro-frontends extend the concept of microservices to the frontend world, allowing teams to build and deploy independently.');
    const categories = ['Frontend', 'Architecture', 'DevOps', 'Design'];
    return { blogName, navLinks, articleTitle, author, date, excerpt, categories };
  },
});

export default createVueMicroApp({ name: 'blog-layout', App: BlogLayout });
</script>

<style scoped>
.blog-layout {
  min-height: 100vh;
  background: #f9fafb;
}
.blog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.blog-name { font-size: 22px; font-weight: 700; }
.header-nav { display: flex; gap: 24px; }
.header-nav a { text-decoration: none; color: #6b7280; font-weight: 500; }
.blog-content {
  display: flex;
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px;
  gap: 32px;
}
.article-area { flex: 1; }
.article {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.article-title { font-size: 28px; margin: 0 0 8px; }
.article-meta { font-size: 14px; color: #6b7280; margin: 0 0 20px; }
.article-body p { font-size: 16px; line-height: 1.7; color: #374151; }
.blog-sidebar { width: 240px; flex-shrink: 0; }
.sidebar-section {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.sidebar-section h3 { font-size: 16px; margin: 0 0 12px; }
.sidebar-section a {
  display: block;
  padding: 6px 0;
  text-decoration: none;
  color: #3b82f6;
  font-size: 14px;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'portfolio',
    description: 'Portfolio layout with hero section and project grid',
    tags: ['layout', 'portfolio', 'showcase'],
    code: `<template>
  <div class="portfolio-layout">
    <header class="portfolio-header">
      <span class="logo">Portfolio</span>
      <nav class="nav-links">
        <a href="#work">Work</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
    <section class="hero">
      <h1 class="hero-title">{{ heroTitle }}</h1>
      <p class="hero-subtitle">{{ heroSubtitle }}</p>
    </section>
    <section class="projects-grid">
      <div v-for="project in projects" :key="project.title" class="project-card"
           @click="selectedProject = project.title">
        <div class="project-thumb" :style="{ background: project.color }"></div>
        <h3 class="project-title">{{ project.title }}</h3>
        <p class="project-type">{{ project.type }}</p>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const PortfolioLayout = defineComponent({
  name: 'PortfolioLayout',
  setup() {
    const heroTitle = ref('Creative Developer');
    const heroSubtitle = ref('I build beautiful, interactive web experiences.');
    const selectedProject = ref('');
    const projects = [
      { title: 'E-Commerce Platform', type: 'Web App', color: '#dbeafe' },
      { title: 'Analytics Dashboard', type: 'SaaS', color: '#fce7f3' },
      { title: 'Mobile Banking', type: 'Mobile', color: '#d1fae5' },
      { title: 'Social Network', type: 'Web App', color: '#fef3c7' },
      { title: 'Design System', type: 'Library', color: '#ede9fe' },
      { title: 'AI Assistant', type: 'Product', color: '#fee2e2' },
    ];
    return { heroTitle, heroSubtitle, selectedProject, projects };
  },
});

export default createVueMicroApp({ name: 'portfolio-layout', App: PortfolioLayout });
</script>

<style scoped>
.portfolio-layout { min-height: 100vh; background: #fff; }
.portfolio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
}
.logo { font-size: 22px; font-weight: 700; }
.nav-links { display: flex; gap: 28px; }
.nav-links a { text-decoration: none; color: #6b7280; font-weight: 500; }
.hero {
  text-align: center;
  padding: 80px 40px 60px;
}
.hero-title { font-size: 48px; font-weight: 800; margin: 0 0 16px; }
.hero-subtitle { font-size: 20px; color: #6b7280; margin: 0; }
.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 0 40px 60px;
  max-width: 1100px;
  margin: 0 auto;
}
.project-card {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}
.project-card:hover { transform: translateY(-4px); }
.project-thumb { height: 180px; }
.project-title { font-size: 16px; font-weight: 600; margin: 12px 0 4px; padding: 0 4px; }
.project-type { font-size: 13px; color: #6b7280; margin: 0; padding: 0 4px 12px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'landing',
    description: 'Landing page layout with hero, features, and CTA sections',
    tags: ['layout', 'landing', 'marketing'],
    code: `<template>
  <div class="landing-layout">
    <header class="landing-header">
      <span class="brand">Product</span>
      <button class="cta-header-btn">Get Started</button>
    </header>
    <section class="hero-section">
      <h1>{{ headline }}</h1>
      <p>{{ subheadline }}</p>
      <div class="hero-actions">
        <button class="primary-btn">Start Free Trial</button>
        <button class="secondary-btn">Watch Demo</button>
      </div>
    </section>
    <section class="features-section">
      <div v-for="feat in features" :key="feat.title" class="feature-item">
        <span class="feat-icon">{{ feat.icon }}</span>
        <h3>{{ feat.title }}</h3>
        <p>{{ feat.desc }}</p>
      </div>
    </section>
    <section class="cta-section">
      <h2>Ready to get started?</h2>
      <button class="primary-btn">Sign Up Free</button>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const LandingLayout = defineComponent({
  name: 'LandingLayout',
  setup() {
    const headline = ref('Build Faster, Ship Smarter');
    const subheadline = ref('The modern platform for building scalable micro-frontend applications.');
    const features = [
      { icon: '\\u26A1', title: 'Fast Builds', desc: 'Sub-second hot reload with optimized bundling.' },
      { icon: '\\u{1F512}', title: 'Secure', desc: 'Built-in security policies and sandboxing.' },
      { icon: '\\u{1F4E6}', title: 'Modular', desc: 'Compose apps from independent micro-frontends.' },
    ];
    return { headline, subheadline, features };
  },
});

export default createVueMicroApp({ name: 'landing-layout', App: LandingLayout });
</script>

<style scoped>
.landing-layout { min-height: 100vh; }
.landing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
}
.brand { font-size: 22px; font-weight: 700; }
.cta-header-btn {
  padding: 8px 20px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.hero-section {
  text-align: center;
  padding: 80px 32px;
  background: linear-gradient(180deg, #eff6ff, #fff);
}
.hero-section h1 { font-size: 44px; font-weight: 800; margin: 0 0 16px; }
.hero-section p { font-size: 18px; color: #6b7280; margin: 0 0 32px; }
.hero-actions { display: flex; gap: 12px; justify-content: center; }
.primary-btn {
  padding: 14px 28px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.secondary-btn {
  padding: 14px 28px;
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.features-section {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 60px 32px;
}
.feature-item { text-align: center; max-width: 280px; }
.feat-icon { font-size: 32px; }
.feature-item h3 { font-size: 18px; margin: 12px 0 8px; }
.feature-item p { font-size: 14px; color: #6b7280; line-height: 1.5; }
.cta-section {
  text-align: center;
  padding: 60px 32px;
  background: #1f2937;
  color: #fff;
}
.cta-section h2 { font-size: 28px; margin: 0 0 24px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'admin',
    description: 'Admin panel layout with collapsible sidebar, breadcrumb, and content area',
    tags: ['layout', 'admin', 'panel'],
    code: `<template>
  <div class="admin-layout">
    <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-top">
        <span v-if="!sidebarCollapsed" class="brand">Admin</span>
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '\\u00BB' : '\\u00AB' }}
        </button>
      </div>
      <nav class="admin-nav">
        <a v-for="item in navItems" :key="item" href="#">
          <span v-if="!sidebarCollapsed">{{ item }}</span>
          <span v-else>{{ item[0] }}</span>
        </a>
      </nav>
    </aside>
    <div class="admin-main">
      <div class="breadcrumb">
        <span v-for="(crumb, i) in breadcrumbs" :key="crumb">
          {{ crumb }}<span v-if="i < breadcrumbs.length - 1"> / </span>
        </span>
      </div>
      <div class="admin-content">
        <slot>
          <div class="content-placeholder">Admin content area</div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const AdminLayout = defineComponent({
  name: 'AdminLayout',
  setup() {
    const sidebarCollapsed = ref(false);
    const navItems = ['Dashboard', 'Users', 'Content', 'Analytics', 'Settings'];
    const breadcrumbs = ['Admin', 'Dashboard', 'Overview'];
    return { sidebarCollapsed, navItems, breadcrumbs };
  },
});

export default createVueMicroApp({ name: 'admin-layout', App: AdminLayout });
</script>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; }
.admin-sidebar {
  width: 220px;
  background: #111827;
  color: #e5e7eb;
  transition: width 0.3s;
  flex-shrink: 0;
}
.admin-sidebar.collapsed { width: 60px; }
.sidebar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #374151;
}
.brand { font-weight: 700; font-size: 16px; }
.collapse-btn {
  background: none; border: none; color: #9ca3af;
  font-size: 16px; cursor: pointer;
}
.admin-nav { display: flex; flex-direction: column; padding: 8px 0; }
.admin-nav a {
  padding: 10px 16px;
  color: #9ca3af;
  text-decoration: none;
  font-size: 14px;
}
.admin-nav a:hover { color: #fff; background: #1f2937; }
.admin-main { flex: 1; background: #f3f4f6; }
.breadcrumb {
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  color: #6b7280;
}
.admin-content { padding: 24px; }
.content-placeholder {
  background: #fff;
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  color: #9ca3af;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'e-commerce',
    description: 'E-commerce layout with category sidebar, product grid, and cart summary',
    tags: ['layout', 'e-commerce', 'shop'],
    code: `<template>
  <div class="ecommerce-layout">
    <header class="shop-header">
      <span class="shop-name">ShopVue</span>
      <div class="cart-icon" @click="cartOpen = !cartOpen">
        Cart ({{ cartCount }})
      </div>
    </header>
    <div class="shop-body">
      <aside class="category-sidebar">
        <h3>Categories</h3>
        <a v-for="cat in categories" :key="cat" href="#"
           :class="{ active: selectedCategory === cat }"
           @click.prevent="selectedCategory = cat">{{ cat }}</a>
      </aside>
      <main class="product-grid">
        <div v-for="p in products" :key="p.name" class="product-item">
          <div class="product-img" :style="{ background: p.color }"></div>
          <div class="product-info">
            <span class="product-name">{{ p.name }}</span>
            <span class="product-price">\${{ p.price }}</span>
          </div>
          <button class="add-btn" @click="cartCount++">Add</button>
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const EcommerceLayout = defineComponent({
  name: 'EcommerceLayout',
  setup() {
    const selectedCategory = ref('All');
    const categories = ['All', 'Electronics', 'Clothing', 'Home', 'Books'];
    const cartCount = ref(0);
    const cartOpen = ref(false);
    const products = [
      { name: 'Laptop', price: 999, color: '#dbeafe' },
      { name: 'Headphones', price: 79, color: '#fce7f3' },
      { name: 'Keyboard', price: 129, color: '#d1fae5' },
      { name: 'Monitor', price: 449, color: '#fef3c7' },
    ];
    return { selectedCategory, categories, cartCount, cartOpen, products };
  },
});

export default createVueMicroApp({ name: 'ecommerce-layout', App: EcommerceLayout });
</script>

<style scoped>
.ecommerce-layout { min-height: 100vh; background: #f9fafb; }
.shop-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px; background: #fff; border-bottom: 1px solid #e5e7eb;
}
.shop-name { font-size: 22px; font-weight: 700; }
.cart-icon { cursor: pointer; font-weight: 600; color: #3b82f6; }
.shop-body { display: flex; }
.category-sidebar {
  width: 200px; padding: 20px; background: #fff;
  border-right: 1px solid #e5e7eb; flex-shrink: 0;
}
.category-sidebar h3 { font-size: 14px; margin: 0 0 12px; color: #9ca3af; text-transform: uppercase; }
.category-sidebar a {
  display: block; padding: 8px 0; text-decoration: none;
  color: #6b7280; font-size: 14px;
}
.category-sidebar a.active { color: #3b82f6; font-weight: 600; }
.product-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px; padding: 24px; flex: 1;
}
.product-item {
  background: #fff; border-radius: 10px; overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.product-img { height: 140px; }
.product-info { padding: 12px; display: flex; justify-content: space-between; }
.product-name { font-weight: 600; font-size: 14px; }
.product-price { color: #10b981; font-weight: 700; }
.add-btn {
  display: block; width: calc(100% - 24px); margin: 0 12px 12px;
  padding: 8px; background: #3b82f6; color: #fff; border: none;
  border-radius: 6px; cursor: pointer; font-weight: 600;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'docs',
    description: 'Documentation layout with left nav, content area, and table of contents',
    tags: ['layout', 'docs', 'documentation'],
    code: `<template>
  <div class="docs-layout">
    <aside class="docs-nav">
      <div class="docs-brand">Docs</div>
      <div v-for="section in sections" :key="section.title" class="nav-section">
        <h4>{{ section.title }}</h4>
        <a v-for="page in section.pages" :key="page" href="#"
           :class="{ active: activePage === page }"
           @click.prevent="activePage = page">{{ page }}</a>
      </div>
    </aside>
    <main class="docs-content">
      <h1>{{ activePage }}</h1>
      <p class="docs-intro">Documentation for {{ activePage.toLowerCase() }}.</p>
      <div class="docs-body">
        <div class="placeholder-block"></div>
        <div class="placeholder-block short"></div>
      </div>
    </main>
    <aside class="toc">
      <h4>On this page</h4>
      <a v-for="item in tocItems" :key="item" href="#">{{ item }}</a>
    </aside>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const DocsLayout = defineComponent({
  name: 'DocsLayout',
  setup() {
    const activePage = ref('Getting Started');
    const sections = [
      { title: 'Guide', pages: ['Getting Started', 'Installation', 'Configuration'] },
      { title: 'API', pages: ['Core', 'Plugins', 'CLI'] },
      { title: 'Advanced', pages: ['Custom Modules', 'Performance'] },
    ];
    const tocItems = ['Overview', 'Prerequisites', 'Quick Start', 'Next Steps'];
    return { activePage, sections, tocItems };
  },
});

export default createVueMicroApp({ name: 'docs-layout', App: DocsLayout });
</script>

<style scoped>
.docs-layout { display: flex; min-height: 100vh; }
.docs-nav {
  width: 240px; padding: 20px 0; background: #fff;
  border-right: 1px solid #e5e7eb; flex-shrink: 0;
}
.docs-brand { padding: 0 20px 16px; font-size: 18px; font-weight: 700; }
.nav-section { padding: 8px 0; }
.nav-section h4 {
  padding: 0 20px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; color: #9ca3af; margin: 8px 0 4px;
}
.nav-section a {
  display: block; padding: 6px 20px; text-decoration: none;
  color: #6b7280; font-size: 14px;
}
.nav-section a.active { color: #3b82f6; font-weight: 600; background: #eff6ff; }
.docs-content {
  flex: 1; padding: 32px 48px; max-width: 720px;
}
.docs-content h1 { font-size: 32px; margin: 0 0 8px; }
.docs-intro { font-size: 16px; color: #6b7280; margin: 0 0 32px; }
.placeholder-block { height: 120px; background: #f3f4f6; border-radius: 8px; margin-bottom: 16px; }
.placeholder-block.short { height: 60px; }
.toc {
  width: 200px; padding: 32px 16px; flex-shrink: 0;
  border-left: 1px solid #e5e7eb;
}
.toc h4 { font-size: 12px; font-weight: 700; color: #9ca3af; margin: 0 0 12px; }
.toc a {
  display: block; padding: 4px 0; text-decoration: none;
  color: #6b7280; font-size: 13px;
}
.toc a:hover { color: #3b82f6; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'saas-app',
    description: 'SaaS application layout with top nav, sidebar, and main workspace',
    tags: ['layout', 'saas', 'app'],
    code: `<template>
  <div class="saas-layout">
    <header class="saas-topbar">
      <span class="app-name">SaaSApp</span>
      <div class="topbar-right">
        <span class="plan-badge">Pro Plan</span>
        <div class="user-avatar">A</div>
      </div>
    </header>
    <div class="saas-body">
      <aside class="saas-sidebar">
        <a v-for="item in menuItems" :key="item.label" href="#"
           :class="{ active: activeMenu === item.label }"
           @click.prevent="activeMenu = item.label">
          <span class="menu-icon">{{ item.icon }}</span>
          {{ item.label }}
        </a>
      </aside>
      <main class="saas-workspace">
        <div class="workspace-header">
          <h2>{{ activeMenu }}</h2>
          <button class="action-btn">+ New</button>
        </div>
        <div class="workspace-content">
          <div class="empty-state">Select or create an item to get started</div>
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SaasLayout = defineComponent({
  name: 'SaasLayout',
  setup() {
    const activeMenu = ref('Projects');
    const menuItems = [
      { icon: '\\u{1F4C1}', label: 'Projects' },
      { icon: '\\u{1F4CB}', label: 'Tasks' },
      { icon: '\\u{1F465}', label: 'Team' },
      { icon: '\\u{1F4CA}', label: 'Reports' },
      { icon: '\\u2699', label: 'Settings' },
    ];
    return { activeMenu, menuItems };
  },
});

export default createVueMicroApp({ name: 'saas-layout', App: SaasLayout });
</script>

<style scoped>
.saas-layout { min-height: 100vh; display: flex; flex-direction: column; }
.saas-topbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 24px; background: #0f172a; color: #fff;
}
.app-name { font-size: 18px; font-weight: 700; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.plan-badge {
  padding: 4px 10px; background: #6366f1; border-radius: 4px;
  font-size: 12px; font-weight: 600;
}
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%; background: #3b82f6;
  display: flex; align-items: center; justify-content: center; font-weight: 700;
}
.saas-body { display: flex; flex: 1; }
.saas-sidebar {
  width: 200px; background: #fff; border-right: 1px solid #e5e7eb;
  padding: 12px 0;
}
.saas-sidebar a {
  display: flex; align-items: center; gap: 10px; padding: 10px 16px;
  text-decoration: none; color: #6b7280; font-size: 14px;
}
.saas-sidebar a:hover { background: #f9fafb; }
.saas-sidebar a.active { color: #3b82f6; background: #eff6ff; font-weight: 600; }
.menu-icon { font-size: 16px; }
.saas-workspace { flex: 1; background: #f9fafb; }
.workspace-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; background: #fff; border-bottom: 1px solid #e5e7eb;
}
.workspace-header h2 { margin: 0; font-size: 20px; }
.action-btn {
  padding: 8px 16px; background: #3b82f6; color: #fff; border: none;
  border-radius: 6px; font-weight: 600; cursor: pointer;
}
.workspace-content { padding: 24px; }
.empty-state {
  text-align: center; padding: 60px; color: #9ca3af; font-size: 16px;
  background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'split',
    description: 'Split layout with resizable left and right panels',
    tags: ['layout', 'split', 'panels'],
    code: `<template>
  <div class="split-layout">
    <div class="panel left-panel" :style="{ width: leftWidth + '%' }">
      <div class="panel-header">Editor</div>
      <div class="panel-body">
        <textarea v-model="editorContent" class="editor-textarea" placeholder="Type here..."></textarea>
      </div>
    </div>
    <div class="divider" @mousedown="startResize"></div>
    <div class="panel right-panel" :style="{ width: (100 - leftWidth) + '%' }">
      <div class="panel-header">Preview</div>
      <div class="panel-body">
        <div class="preview-content">{{ editorContent || 'Preview will appear here...' }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onUnmounted } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SplitLayout = defineComponent({
  name: 'SplitLayout',
  setup() {
    const leftWidth = ref(50);
    const editorContent = ref('');
    let resizing = false;
    const onMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      leftWidth.value = Math.max(20, Math.min(80, pct));
    };
    const onMouseUp = () => { resizing = false; };
    const startResize = () => {
      resizing = true;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp, { once: true });
    };
    onUnmounted(() => {
      document.removeEventListener('mousemove', onMouseMove);
    });
    return { leftWidth, editorContent, startResize };
  },
});

export default createVueMicroApp({ name: 'split-layout', App: SplitLayout });
</script>

<style scoped>
.split-layout { display: flex; height: 100vh; }
.panel { display: flex; flex-direction: column; overflow: hidden; }
.panel-header {
  padding: 10px 16px; background: #f3f4f6; border-bottom: 1px solid #e5e7eb;
  font-weight: 600; font-size: 14px;
}
.panel-body { flex: 1; overflow: auto; }
.divider {
  width: 6px; background: #e5e7eb; cursor: col-resize;
  transition: background 0.2s; flex-shrink: 0;
}
.divider:hover { background: #3b82f6; }
.editor-textarea {
  width: 100%; height: 100%; border: none; padding: 16px;
  font-family: monospace; font-size: 14px; resize: none; outline: none;
  box-sizing: border-box;
}
.preview-content {
  padding: 16px; font-size: 14px; line-height: 1.6; color: #374151;
  white-space: pre-wrap;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'three-column',
    description: 'Three-column layout with navigation, content, and detail panels',
    tags: ['layout', 'three-column', 'master-detail'],
    code: `<template>
  <div class="three-col-layout">
    <aside class="col-nav">
      <h3>Inbox</h3>
      <div v-for="item in items" :key="item.id" class="list-item"
           :class="{ active: selected === item.id }" @click="selected = item.id">
        <span class="item-title">{{ item.title }}</span>
        <span class="item-preview">{{ item.preview }}</span>
      </div>
    </aside>
    <main class="col-content">
      <template v-if="selectedItem">
        <h2>{{ selectedItem.title }}</h2>
        <p>{{ selectedItem.body }}</p>
      </template>
      <p v-else class="empty">Select an item</p>
    </main>
    <aside class="col-detail">
      <h4>Details</h4>
      <template v-if="selectedItem">
        <div class="detail-row"><span>From:</span> {{ selectedItem.from }}</div>
        <div class="detail-row"><span>Date:</span> {{ selectedItem.date }}</div>
      </template>
    </aside>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ThreeColumnLayout = defineComponent({
  name: 'ThreeColumnLayout',
  setup() {
    const selected = ref<number | null>(null);
    const items = [
      { id: 1, title: 'Welcome', preview: 'Getting started...', body: 'Welcome to the platform! Here is how to get started.', from: 'Team', date: 'Today' },
      { id: 2, title: 'Update v2.1', preview: 'New features...', body: 'Version 2.1 includes new dashboard widgets and performance improvements.', from: 'Release Bot', date: 'Yesterday' },
      { id: 3, title: 'Reminder', preview: 'Meeting at 3pm...', body: 'Don\'t forget the standup meeting at 3pm today.', from: 'Calendar', date: 'Mar 12' },
    ];
    const selectedItem = computed(() => items.find(i => i.id === selected.value) || null);
    return { selected, items, selectedItem };
  },
});

export default createVueMicroApp({ name: 'three-column-layout', App: ThreeColumnLayout });
</script>

<style scoped>
.three-col-layout { display: flex; min-height: 100vh; }
.col-nav {
  width: 260px; background: #fff; border-right: 1px solid #e5e7eb;
  overflow-y: auto; flex-shrink: 0;
}
.col-nav h3 { padding: 16px; margin: 0; font-size: 16px; }
.list-item {
  padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f3f4f6;
}
.list-item:hover { background: #f9fafb; }
.list-item.active { background: #eff6ff; border-left: 3px solid #3b82f6; }
.item-title { display: block; font-weight: 600; font-size: 14px; }
.item-preview { display: block; font-size: 12px; color: #9ca3af; margin-top: 2px; }
.col-content { flex: 1; padding: 32px; }
.col-content h2 { margin: 0 0 16px; }
.empty { color: #9ca3af; }
.col-detail {
  width: 220px; background: #f9fafb; padding: 24px;
  border-left: 1px solid #e5e7eb; flex-shrink: 0;
}
.col-detail h4 { margin: 0 0 16px; font-size: 14px; color: #6b7280; }
.detail-row { font-size: 13px; margin-bottom: 8px; }
.detail-row span { font-weight: 600; margin-right: 4px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'two-column',
    description: 'Simple two-column layout with main content and sidebar',
    tags: ['layout', 'two-column', 'sidebar'],
    code: `<template>
  <div class="two-col-layout">
    <main class="main-column">
      <h1>{{ pageTitle }}</h1>
      <div class="content-block" v-for="n in 3" :key="n">
        <h3>Section {{ n }}</h3>
        <p>Content for section {{ n }} goes here with relevant information.</p>
      </div>
    </main>
    <aside class="side-column">
      <div class="side-widget">
        <h3>Quick Links</h3>
        <a v-for="link in quickLinks" :key="link" href="#">{{ link }}</a>
      </div>
      <div class="side-widget">
        <h3>Tags</h3>
        <div class="tag-cloud">
          <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
    </aside>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const TwoColumnLayout = defineComponent({
  name: 'TwoColumnLayout',
  setup() {
    const pageTitle = ref('Content Page');
    const quickLinks = ['Getting Started', 'API Reference', 'Tutorials', 'Community'];
    const tags = ['Vue', 'TypeScript', 'Frontend', 'Components', 'Design'];
    return { pageTitle, quickLinks, tags };
  },
});

export default createVueMicroApp({ name: 'two-column-layout', App: TwoColumnLayout });
</script>

<style scoped>
.two-col-layout {
  display: flex; gap: 32px; max-width: 1100px;
  margin: 0 auto; padding: 32px;
}
.main-column { flex: 1; }
.main-column h1 { font-size: 28px; margin: 0 0 24px; }
.content-block {
  background: #fff; padding: 24px; border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 16px;
}
.content-block h3 { margin: 0 0 8px; font-size: 18px; }
.content-block p { color: #6b7280; line-height: 1.6; margin: 0; }
.side-column { width: 280px; flex-shrink: 0; }
.side-widget {
  background: #fff; padding: 20px; border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 16px;
}
.side-widget h3 { font-size: 16px; margin: 0 0 12px; }
.side-widget a {
  display: block; padding: 6px 0; text-decoration: none;
  color: #3b82f6; font-size: 14px;
}
.tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
.tag {
  padding: 4px 10px; background: #f3f4f6; border-radius: 4px;
  font-size: 12px; color: #374151;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'full-width',
    description: 'Full-width layout with centered content sections',
    tags: ['layout', 'full-width', 'centered'],
    code: `<template>
  <div class="fullwidth-layout">
    <section v-for="section in sections" :key="section.title"
             class="fw-section" :class="section.theme">
      <div class="section-inner">
        <h2>{{ section.title }}</h2>
        <p>{{ section.content }}</p>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const FullWidthLayout = defineComponent({
  name: 'FullWidthLayout',
  setup() {
    const sections = ref([
      { title: 'Welcome', content: 'A full-width layout for impactful content presentation.', theme: 'light' },
      { title: 'Features', content: 'Showcase your product features with alternating sections.', theme: 'dark' },
      { title: 'Testimonials', content: 'What users are saying about the platform.', theme: 'light' },
      { title: 'Get Started', content: 'Ready to build something amazing?', theme: 'accent' },
    ]);
    return { sections };
  },
});

export default createVueMicroApp({ name: 'full-width-layout', App: FullWidthLayout });
</script>

<style scoped>
.fullwidth-layout { min-height: 100vh; }
.fw-section { padding: 80px 24px; }
.fw-section.light { background: #fff; }
.fw-section.dark { background: #1f2937; color: #f9fafb; }
.fw-section.accent { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; }
.section-inner {
  max-width: 720px; margin: 0 auto; text-align: center;
}
.section-inner h2 { font-size: 32px; margin: 0 0 16px; }
.section-inner p { font-size: 18px; line-height: 1.6; opacity: 0.8; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'sticky-header',
    description: 'Layout with sticky header, scrollable content, and fixed footer',
    tags: ['layout', 'sticky-header', 'fixed-footer'],
    code: `<template>
  <div class="sticky-layout">
    <header class="sticky-header">
      <span class="logo">StickyLayout</span>
      <nav class="header-nav">
        <a v-for="item in navItems" :key="item" href="#">{{ item }}</a>
      </nav>
    </header>
    <main class="scroll-content">
      <div v-for="n in 8" :key="n" class="content-block">
        <h3>Section {{ n }}</h3>
        <p>Scroll to see the sticky header and footer behavior.</p>
      </div>
    </main>
    <footer class="sticky-footer">
      <span>&copy; 2024 StickyLayout</span>
      <span>All rights reserved</span>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const StickyHeaderLayout = defineComponent({
  name: 'StickyHeaderLayout',
  setup() {
    const navItems = ref(['Home', 'About', 'Blog', 'Contact']);
    return { navItems };
  },
});

export default createVueMicroApp({ name: 'sticky-header-layout', App: StickyHeaderLayout });
</script>

<style scoped>
.sticky-layout {
  display: flex; flex-direction: column; height: 100vh;
}
.sticky-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 24px; background: #fff; border-bottom: 1px solid #e5e7eb;
  position: sticky; top: 0; z-index: 10;
}
.logo { font-size: 18px; font-weight: 700; }
.header-nav { display: flex; gap: 20px; }
.header-nav a { text-decoration: none; color: #6b7280; font-size: 14px; }
.scroll-content {
  flex: 1; overflow-y: auto; padding: 24px; background: #f9fafb;
}
.content-block {
  background: #fff; padding: 24px; border-radius: 8px;
  margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.content-block h3 { margin: 0 0 8px; }
.content-block p { color: #6b7280; margin: 0; }
.sticky-footer {
  display: flex; justify-content: space-between;
  padding: 12px 24px; background: #1f2937; color: #9ca3af;
  font-size: 13px;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'sticky-sidebar',
    description: 'Layout with sticky sidebar and scrollable main content area',
    tags: ['layout', 'sticky-sidebar', 'scroll'],
    code: `<template>
  <div class="sticky-sidebar-layout">
    <aside class="sticky-side">
      <div class="side-brand">App</div>
      <nav class="side-nav">
        <a v-for="item in navItems" :key="item" href="#"
           :class="{ active: activeItem === item }" @click.prevent="activeItem = item">
          {{ item }}
        </a>
      </nav>
    </aside>
    <main class="scrollable-main">
      <h1>{{ activeItem }}</h1>
      <div v-for="n in 10" :key="n" class="content-section">
        <p>Content block {{ n }} for {{ activeItem }}.</p>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const StickySidebarLayout = defineComponent({
  name: 'StickySidebarLayout',
  setup() {
    const activeItem = ref('Dashboard');
    const navItems = ['Dashboard', 'Projects', 'Tasks', 'Messages', 'Settings'];
    return { activeItem, navItems };
  },
});

export default createVueMicroApp({ name: 'sticky-sidebar-layout', App: StickySidebarLayout });
</script>

<style scoped>
.sticky-sidebar-layout { display: flex; min-height: 100vh; }
.sticky-side {
  width: 200px; position: sticky; top: 0; height: 100vh;
  background: #fff; border-right: 1px solid #e5e7eb; flex-shrink: 0;
}
.side-brand { padding: 20px 16px; font-size: 18px; font-weight: 700; }
.side-nav { display: flex; flex-direction: column; }
.side-nav a {
  padding: 10px 16px; text-decoration: none; color: #6b7280;
  font-size: 14px; border-left: 3px solid transparent;
}
.side-nav a:hover { background: #f9fafb; }
.side-nav a.active {
  color: #3b82f6; background: #eff6ff; border-left-color: #3b82f6;
}
.scrollable-main { flex: 1; padding: 32px; background: #f9fafb; }
.scrollable-main h1 { font-size: 28px; margin: 0 0 24px; }
.content-section {
  background: #fff; padding: 20px; border-radius: 8px;
  margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.content-section p { margin: 0; color: #6b7280; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'grid',
    description: 'CSS grid layout with configurable rows and columns for widget placement',
    tags: ['layout', 'grid', 'widgets'],
    code: `<template>
  <div class="grid-layout">
    <header class="grid-header">
      <h2>Grid Dashboard</h2>
      <div class="col-controls">
        <button @click="cols = Math.max(2, cols - 1)">-</button>
        <span>{{ cols }} columns</span>
        <button @click="cols = Math.min(5, cols + 1)">+</button>
      </div>
    </header>
    <div class="widget-grid" :style="{ gridTemplateColumns: 'repeat(' + cols + ', 1fr)' }">
      <div v-for="widget in widgetList" :key="widget.id" class="grid-widget"
           :style="{ gridColumn: 'span ' + widget.span }">
        <h4>{{ widget.title }}</h4>
        <p>{{ widget.content }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const GridLayout = defineComponent({
  name: 'GridLayout',
  setup() {
    const cols = ref(3);
    const widgetList = ref([
      { id: 1, title: 'Sales', content: '$12,450', span: 1 },
      { id: 2, title: 'Users', content: '3,280', span: 1 },
      { id: 3, title: 'Revenue Chart', content: 'Chart placeholder', span: 2 },
      { id: 4, title: 'Orders', content: '156 pending', span: 1 },
      { id: 5, title: 'Activity Feed', content: 'Recent activities', span: 1 },
      { id: 6, title: 'Top Products', content: 'Product rankings', span: 1 },
    ]);
    return { cols, widgetList };
  },
});

export default createVueMicroApp({ name: 'grid-layout', App: GridLayout });
</script>

<style scoped>
.grid-layout { min-height: 100vh; background: #f3f4f6; }
.grid-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; background: #fff; border-bottom: 1px solid #e5e7eb;
}
.grid-header h2 { margin: 0; font-size: 20px; }
.col-controls {
  display: flex; align-items: center; gap: 8px;
}
.col-controls button {
  width: 32px; height: 32px; border: 1px solid #d1d5db;
  border-radius: 6px; background: #fff; cursor: pointer;
  font-size: 16px; font-weight: 600;
}
.col-controls span { font-size: 14px; color: #6b7280; }
.widget-grid {
  display: grid; gap: 16px; padding: 24px;
}
.grid-widget {
  background: #fff; border-radius: 10px; padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.grid-widget h4 { font-size: 14px; color: #6b7280; margin: 0 0 8px; }
.grid-widget p { font-size: 20px; font-weight: 700; margin: 0; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
