import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'breadcrumb',
    description: 'Breadcrumb navigation showing current page hierarchy',
    tags: ['navigation', 'breadcrumb', 'hierarchy'],
    code: `<template>
  <nav class="breadcrumb" aria-label="breadcrumb">
    <ol class="breadcrumb-list">
      <li v-for="(crumb, index) in crumbs" :key="index" class="breadcrumb-item">
        <a v-if="index < crumbs.length - 1" class="breadcrumb-link" @click.prevent="navigate(index)">{{ crumb }}</a>
        <span v-else class="breadcrumb-current" aria-current="page">{{ crumb }}</span>
        <span v-if="index < crumbs.length - 1" class="breadcrumb-separator">/</span>
      </li>
    </ol>
  </nav>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const BreadcrumbNav = defineComponent({
  name: 'BreadcrumbNav',
  setup() {
    const crumbs = ref(['Home', 'Products', 'Electronics', 'Headphones']);
    const navigate = (index: number) => {
      crumbs.value = crumbs.value.slice(0, index + 1);
    };
    return { crumbs, navigate };
  },
});

export default createVueMicroApp({ name: 'navigation', App: BreadcrumbNav });
</script>

<style scoped>
.breadcrumb { padding: 8px 0; }
.breadcrumb-list { display: flex; flex-wrap: wrap; list-style: none; margin: 0; padding: 0; gap: 4px; align-items: center; }
.breadcrumb-item { display: flex; align-items: center; gap: 4px; font-size: 14px; }
.breadcrumb-link { color: #6366f1; text-decoration: none; cursor: pointer; }
.breadcrumb-link:hover { text-decoration: underline; }
.breadcrumb-current { color: #374151; font-weight: 500; }
.breadcrumb-separator { color: #9ca3af; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'tabs',
    description: 'Horizontal tab navigation with active state and panel content',
    tags: ['navigation', 'tabs', 'panels'],
    code: `<template>
  <div class="tabs-container">
    <div class="tabs-header" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        role="tab"
        :aria-selected="activeTab === tab.id"
        @click="activeTab = tab.id"
      >{{ tab.label }}</button>
    </div>
    <div class="tab-panel">
      <p>{{ currentContent }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const TabsNav = defineComponent({
  name: 'TabsNav',
  setup() {
    const tabs = ref([
      { id: 'overview', label: 'Overview', content: 'Overview content goes here.' },
      { id: 'specs', label: 'Specifications', content: 'Technical specifications.' },
      { id: 'reviews', label: 'Reviews', content: 'Customer reviews and ratings.' },
    ]);
    const activeTab = ref('overview');
    const currentContent = computed(() => tabs.value.find(t => t.id === activeTab.value)?.content ?? '');
    return { tabs, activeTab, currentContent };
  },
});

export default createVueMicroApp({ name: 'navigation', App: TabsNav });
</script>

<style scoped>
.tabs-container { width: 100%; }
.tabs-header { display: flex; border-bottom: 2px solid #e5e7eb; }
.tab-btn { padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 500; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; }
.tab-btn.active { color: #6366f1; border-bottom-color: #6366f1; }
.tab-btn:hover:not(.active) { color: #374151; }
.tab-panel { padding: 20px 0; font-size: 14px; color: #374151; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'stepper',
    description: 'Multi-step wizard stepper with progress indicator',
    tags: ['navigation', 'stepper', 'wizard', 'progress'],
    code: `<template>
  <div class="stepper">
    <div class="stepper-header">
      <div
        v-for="(step, index) in steps"
        :key="index"
        :class="['step', { completed: index < currentStep, active: index === currentStep }]"
      >
        <div class="step-circle">{{ index < currentStep ? '✓' : index + 1 }}</div>
        <span class="step-label">{{ step }}</span>
        <div v-if="index < steps.length - 1" class="step-connector"></div>
      </div>
    </div>
    <div class="stepper-actions">
      <button class="btn-secondary" :disabled="currentStep === 0" @click="currentStep--">Back</button>
      <button class="btn-primary" :disabled="currentStep === steps.length - 1" @click="currentStep++">Next</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const StepperNav = defineComponent({
  name: 'StepperNav',
  setup() {
    const steps = ref(['Account', 'Profile', 'Settings', 'Review']);
    const currentStep = ref(0);
    return { steps, currentStep };
  },
});

export default createVueMicroApp({ name: 'navigation', App: StepperNav });
</script>

<style scoped>
.stepper { width: 100%; }
.stepper-header { display: flex; align-items: center; margin-bottom: 24px; }
.step { display: flex; flex-direction: column; align-items: center; position: relative; flex: 1; }
.step-circle { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #d1d5db; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #6b7280; }
.step.active .step-circle { border-color: #6366f1; color: #6366f1; }
.step.completed .step-circle { background: #6366f1; border-color: #6366f1; color: #fff; }
.step-label { font-size: 12px; margin-top: 6px; color: #6b7280; }
.step.active .step-label { color: #6366f1; font-weight: 600; }
.step-connector { position: absolute; top: 16px; left: 60%; width: 80%; height: 2px; background: #e5e7eb; z-index: -1; }
.stepper-actions { display: flex; gap: 12px; justify-content: flex-end; }
.btn-primary { padding: 8px 20px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { padding: 8px 20px; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'pagination',
    description: 'Page pagination control with prev/next and numbered pages',
    tags: ['navigation', 'pagination', 'pages'],
    code: `<template>
  <nav class="pagination" aria-label="Pagination">
    <button class="page-btn" :disabled="page === 1" @click="page--">&#8249;</button>
    <button
      v-for="p in visiblePages"
      :key="p"
      :class="['page-btn', { active: p === page }]"
      @click="page = p"
    >{{ p }}</button>
    <button class="page-btn" :disabled="page === totalPages" @click="page++">&#8250;</button>
  </nav>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const PaginationNav = defineComponent({
  name: 'PaginationNav',
  setup() {
    const page = ref(3);
    const totalPages = ref(10);
    const visiblePages = computed(() => {
      const start = Math.max(1, page.value - 2);
      const end = Math.min(totalPages.value, page.value + 2);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });
    return { page, totalPages, visiblePages };
  },
});

export default createVueMicroApp({ name: 'navigation', App: PaginationNav });
</script>

<style scoped>
.pagination { display: flex; gap: 4px; align-items: center; }
.page-btn { min-width: 36px; height: 36px; padding: 0 8px; border: 1px solid #e5e7eb; background: #fff; border-radius: 6px; cursor: pointer; font-size: 14px; color: #374151; transition: all 0.15s; }
.page-btn:hover:not(:disabled):not(.active) { background: #f3f4f6; }
.page-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; font-weight: 700; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'menu',
    description: 'Dropdown context menu with icons and keyboard navigation',
    tags: ['navigation', 'menu', 'dropdown', 'context'],
    code: `<template>
  <div class="menu-wrapper">
    <button class="menu-trigger" @click="open = !open">Options ▾</button>
    <ul v-if="open" class="menu-list" role="menu">
      <li v-for="item in items" :key="item.label" role="menuitem" class="menu-item" @click="select(item)">
        <span class="menu-icon">{{ item.icon }}</span>
        {{ item.label }}
      </li>
      <li class="menu-divider"></li>
      <li role="menuitem" class="menu-item danger" @click="open = false">🗑 Delete</li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ContextMenu = defineComponent({
  name: 'ContextMenu',
  setup() {
    const open = ref(false);
    const items = ref([
      { label: 'Edit', icon: '✏️' },
      { label: 'Duplicate', icon: '📋' },
      { label: 'Share', icon: '🔗' },
    ]);
    const selected = ref('');
    const select = (item: { label: string; icon: string }) => {
      selected.value = item.label;
      open.value = false;
    };
    return { open, items, selected, select };
  },
});

export default createVueMicroApp({ name: 'navigation', App: ContextMenu });
</script>

<style scoped>
.menu-wrapper { position: relative; display: inline-block; }
.menu-trigger { padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.menu-list { position: absolute; top: calc(100% + 6px); left: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 4px 0; list-style: none; min-width: 180px; z-index: 100; }
.menu-item { padding: 10px 16px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 10px; }
.menu-item:hover { background: #f3f4f6; }
.menu-item.danger { color: #ef4444; }
.menu-divider { height: 1px; background: #e5e7eb; margin: 4px 0; }
.menu-icon { font-size: 16px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'navbar',
    description: 'Responsive top navbar with logo, links and CTA button',
    tags: ['navigation', 'navbar', 'header', 'responsive'],
    code: `<template>
  <header class="navbar">
    <div class="navbar-brand">⚡ Tuvix</div>
    <nav class="navbar-links">
      <a v-for="link in links" :key="link" href="#" :class="['nav-link', { active: activeLink === link }]" @click.prevent="activeLink = link">{{ link }}</a>
    </nav>
    <button class="navbar-cta">Get Started</button>
    <button class="navbar-burger" @click="mobileOpen = !mobileOpen">☰</button>
    <div v-if="mobileOpen" class="mobile-menu">
      <a v-for="link in links" :key="link" href="#" class="mobile-link" @click.prevent="activeLink = link; mobileOpen = false">{{ link }}</a>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const TopNavbar = defineComponent({
  name: 'TopNavbar',
  setup() {
    const links = ref(['Home', 'Features', 'Pricing', 'Docs']);
    const activeLink = ref('Home');
    const mobileOpen = ref(false);
    return { links, activeLink, mobileOpen };
  },
});

export default createVueMicroApp({ name: 'navigation', App: TopNavbar });
</script>

<style scoped>
.navbar { display: flex; align-items: center; padding: 0 24px; height: 60px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.08); position: relative; }
.navbar-brand { font-size: 20px; font-weight: 800; color: #6366f1; margin-right: 32px; }
.navbar-links { display: flex; gap: 4px; flex: 1; }
.nav-link { padding: 6px 14px; border-radius: 6px; font-size: 14px; font-weight: 500; color: #374151; text-decoration: none; }
.nav-link.active, .nav-link:hover { background: #eef2ff; color: #6366f1; }
.navbar-cta { margin-left: auto; padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.navbar-burger { display: none; background: none; border: none; font-size: 20px; cursor: pointer; margin-left: 12px; }
.mobile-menu { position: absolute; top: 60px; left: 0; right: 0; background: #fff; border-top: 1px solid #e5e7eb; padding: 8px 16px; display: flex; flex-direction: column; gap: 4px; z-index: 50; }
.mobile-link { padding: 10px 12px; font-size: 14px; color: #374151; text-decoration: none; border-radius: 6px; }
.mobile-link:hover { background: #f3f4f6; }
@media (max-width: 640px) { .navbar-links { display: none; } .navbar-burger { display: block; } }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'drawer',
    description: 'Slide-in drawer navigation panel with overlay',
    tags: ['navigation', 'drawer', 'sidebar', 'overlay'],
    code: `<template>
  <div class="drawer-root">
    <button class="drawer-toggle" @click="isOpen = true">☰ Menu</button>
    <transition name="overlay-fade">
      <div v-if="isOpen" class="drawer-overlay" @click="isOpen = false"></div>
    </transition>
    <transition name="drawer-slide">
      <aside v-if="isOpen" class="drawer-panel">
        <div class="drawer-header">
          <span class="drawer-title">Navigation</span>
          <button class="drawer-close" @click="isOpen = false">✕</button>
        </div>
        <nav class="drawer-nav">
          <a v-for="item in navItems" :key="item.href" :href="item.href" class="drawer-link">
            <span class="drawer-link-icon">{{ item.icon }}</span>{{ item.label }}
          </a>
        </nav>
      </aside>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const DrawerNav = defineComponent({
  name: 'DrawerNav',
  setup() {
    const isOpen = ref(false);
    const navItems = ref([
      { label: 'Dashboard', href: '#', icon: '📊' },
      { label: 'Projects', href: '#', icon: '📁' },
      { label: 'Team', href: '#', icon: '👥' },
      { label: 'Settings', href: '#', icon: '⚙️' },
    ]);
    return { isOpen, navItems };
  },
});

export default createVueMicroApp({ name: 'navigation', App: DrawerNav });
</script>

<style scoped>
.drawer-root { position: relative; }
.drawer-toggle { padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; }
.drawer-panel { position: fixed; top: 0; left: 0; width: 280px; height: 100vh; background: #fff; box-shadow: 4px 0 16px rgba(0,0,0,0.12); z-index: 201; display: flex; flex-direction: column; }
.drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
.drawer-title { font-size: 16px; font-weight: 700; color: #111827; }
.drawer-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
.drawer-nav { display: flex; flex-direction: column; padding: 12px 0; }
.drawer-link { display: flex; align-items: center; gap: 12px; padding: 12px 20px; font-size: 14px; color: #374151; text-decoration: none; transition: background 0.15s; }
.drawer-link:hover { background: #f3f4f6; }
.drawer-link-icon { font-size: 18px; }
.overlay-fade-enter-active, .overlay-fade-leave-active { transition: opacity 0.2s; }
.overlay-fade-enter-from, .overlay-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.25s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(-100%); }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'mega-menu',
    description: 'Full-width mega menu with grouped links and feature highlights',
    tags: ['navigation', 'mega-menu', 'dropdown', 'categories'],
    code: `<template>
  <nav class="mega-nav">
    <div class="mega-nav-bar">
      <span class="mega-logo">⚡ Tuvix</span>
      <div class="mega-nav-items">
        <div
          v-for="section in sections"
          :key="section.title"
          class="mega-nav-item"
          @mouseenter="activeSection = section.title"
          @mouseleave="activeSection = ''"
        >
          <span class="mega-nav-label">{{ section.title }} ▾</span>
          <div v-if="activeSection === section.title" class="mega-panel">
            <div v-for="group in section.groups" :key="group.name" class="mega-group">
              <p class="mega-group-title">{{ group.name }}</p>
              <a v-for="link in group.links" :key="link" href="#" class="mega-link">{{ link }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const MegaMenu = defineComponent({
  name: 'MegaMenu',
  setup() {
    const activeSection = ref('');
    const sections = ref([
      {
        title: 'Products',
        groups: [
          { name: 'Frontend', links: ['React SDK', 'Vue SDK', 'Angular SDK'] },
          { name: 'Backend', links: ['Node.js API', 'GraphQL'] },
        ],
      },
      {
        title: 'Solutions',
        groups: [
          { name: 'By Team', links: ['Engineering', 'Design', 'Marketing'] },
          { name: 'By Size', links: ['Startups', 'Enterprise'] },
        ],
      },
    ]);
    return { activeSection, sections };
  },
});

export default createVueMicroApp({ name: 'navigation', App: MegaMenu });
</script>

<style scoped>
.mega-nav { width: 100%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.mega-nav-bar { display: flex; align-items: center; padding: 0 24px; height: 60px; gap: 32px; }
.mega-logo { font-size: 20px; font-weight: 800; color: #6366f1; }
.mega-nav-items { display: flex; gap: 4px; position: relative; }
.mega-nav-item { position: relative; }
.mega-nav-label { padding: 8px 14px; font-size: 14px; font-weight: 500; color: #374151; cursor: pointer; border-radius: 6px; display: block; }
.mega-nav-label:hover { background: #eef2ff; color: #6366f1; }
.mega-panel { position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); padding: 20px; display: flex; gap: 32px; min-width: 400px; z-index: 100; }
.mega-group { min-width: 150px; }
.mega-group-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 8px; }
.mega-link { display: block; padding: 6px 0; font-size: 14px; color: #374151; text-decoration: none; }
.mega-link:hover { color: #6366f1; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'bottom-bar',
    description: 'Mobile bottom navigation bar with icons and labels',
    tags: ['navigation', 'bottom-bar', 'mobile', 'tabs'],
    code: `<template>
  <div class="app-shell">
    <div class="page-content">
      <p class="page-label">{{ activeItem.label }}</p>
    </div>
    <nav class="bottom-bar">
      <button
        v-for="item in items"
        :key="item.id"
        :class="['bottom-item', { active: activeId === item.id }]"
        @click="activeId = item.id"
      >
        <span class="bottom-icon">{{ item.icon }}</span>
        <span class="bottom-label">{{ item.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const BottomBar = defineComponent({
  name: 'BottomBar',
  setup() {
    const items = ref([
      { id: 'home', label: 'Home', icon: '🏠' },
      { id: 'search', label: 'Search', icon: '🔍' },
      { id: 'cart', label: 'Cart', icon: '🛒' },
      { id: 'profile', label: 'Profile', icon: '👤' },
    ]);
    const activeId = ref('home');
    const activeItem = computed(() => items.value.find(i => i.id === activeId.value)!);
    return { items, activeId, activeItem };
  },
});

export default createVueMicroApp({ name: 'navigation', App: BottomBar });
</script>

<style scoped>
.app-shell { position: relative; height: 200px; display: flex; flex-direction: column; }
.page-content { flex: 1; display: flex; align-items: center; justify-content: center; }
.page-label { font-size: 18px; font-weight: 600; color: #374151; }
.bottom-bar { display: flex; border-top: 1px solid #e5e7eb; background: #fff; }
.bottom-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 4px; border: none; background: none; cursor: pointer; gap: 2px; }
.bottom-icon { font-size: 22px; }
.bottom-label { font-size: 10px; font-weight: 500; color: #9ca3af; }
.bottom-item.active .bottom-label { color: #6366f1; }
.bottom-item.active .bottom-icon { filter: saturate(2); }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'side-menu',
    description: 'Collapsible vertical side menu with nested items',
    tags: ['navigation', 'side-menu', 'sidebar', 'nested'],
    code: `<template>
  <aside class="side-menu">
    <div v-for="group in menuGroups" :key="group.title" class="menu-group">
      <p class="group-title">{{ group.title }}</p>
      <div v-for="item in group.items" :key="item.label">
        <button
          :class="['menu-row', { active: activeLabel === item.label }]"
          @click="toggle(item)"
        >
          <span>{{ item.icon }} {{ item.label }}</span>
          <span v-if="item.children" class="chevron">{{ expanded === item.label ? '▲' : '▼' }}</span>
        </button>
        <div v-if="item.children && expanded === item.label" class="sub-menu">
          <button
            v-for="child in item.children"
            :key="child"
            :class="['sub-item', { active: activeLabel === child }]"
            @click="activeLabel = child"
          >{{ child }}</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

interface MenuItem { label: string; icon: string; children?: string[]; }
interface MenuGroup { title: string; items: MenuItem[]; }

const SideMenu = defineComponent({
  name: 'SideMenu',
  setup() {
    const menuGroups = ref<MenuGroup[]>([
      {
        title: 'Main',
        items: [
          { label: 'Dashboard', icon: '📊' },
          { label: 'Projects', icon: '📁', children: ['All Projects', 'Archived', 'Templates'] },
        ],
      },
      {
        title: 'Settings',
        items: [
          { label: 'Account', icon: '👤' },
          { label: 'Billing', icon: '💳' },
        ],
      },
    ]);
    const activeLabel = ref('Dashboard');
    const expanded = ref('');
    const toggle = (item: MenuItem) => {
      if (item.children) {
        expanded.value = expanded.value === item.label ? '' : item.label;
      } else {
        activeLabel.value = item.label;
      }
    };
    return { menuGroups, activeLabel, expanded, toggle };
  },
});

export default createVueMicroApp({ name: 'navigation', App: SideMenu });
</script>

<style scoped>
.side-menu { width: 240px; background: #f9fafb; border-right: 1px solid #e5e7eb; padding: 16px 0; height: 100%; }
.menu-group { margin-bottom: 16px; }
.group-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; padding: 0 16px; margin: 0 0 8px; }
.menu-row { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 9px 16px; border: none; background: none; cursor: pointer; font-size: 14px; color: #374151; border-radius: 0; }
.menu-row.active, .menu-row:hover { background: #eef2ff; color: #6366f1; }
.chevron { font-size: 10px; color: #9ca3af; }
.sub-menu { padding-left: 32px; }
.sub-item { display: block; width: 100%; text-align: left; padding: 7px 12px; border: none; background: none; cursor: pointer; font-size: 13px; color: #6b7280; border-radius: 4px; }
.sub-item.active, .sub-item:hover { background: #eef2ff; color: #6366f1; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'wizard',
    description: 'Form wizard with step validation and summary review',
    tags: ['navigation', 'wizard', 'form', 'multi-step'],
    code: `<template>
  <div class="wizard">
    <div class="wizard-progress">
      <div class="wizard-progress-bar" :style="{ width: progressPercent + '%' }"></div>
    </div>
    <div class="wizard-body">
      <h2 class="wizard-step-title">{{ steps[current].title }}</h2>
      <p class="wizard-step-desc">{{ steps[current].description }}</p>
    </div>
    <div class="wizard-footer">
      <span class="wizard-counter">Step {{ current + 1 }} of {{ steps.length }}</span>
      <div class="wizard-actions">
        <button class="btn-back" v-if="current > 0" @click="current--">Back</button>
        <button class="btn-next" @click="advance">{{ current === steps.length - 1 ? 'Finish' : 'Continue' }}</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const WizardNav = defineComponent({
  name: 'WizardNav',
  setup() {
    const steps = ref([
      { title: 'Welcome', description: 'Let\'s get you set up in just a few steps.' },
      { title: 'Your Details', description: 'Tell us a bit about yourself.' },
      { title: 'Preferences', description: 'Customise your experience.' },
      { title: 'Review & Finish', description: 'Everything looks good. Ready to launch!' },
    ]);
    const current = ref(0);
    const done = ref(false);
    const progressPercent = computed(() => ((current.value) / (steps.value.length - 1)) * 100);
    const advance = () => {
      if (current.value < steps.value.length - 1) current.value++;
      else done.value = true;
    };
    return { steps, current, progressPercent, advance, done };
  },
});

export default createVueMicroApp({ name: 'navigation', App: WizardNav });
</script>

<style scoped>
.wizard { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; width: 480px; }
.wizard-progress { height: 4px; background: #e5e7eb; }
.wizard-progress-bar { height: 100%; background: #6366f1; transition: width 0.3s ease; }
.wizard-body { padding: 32px 28px 24px; }
.wizard-step-title { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #111827; }
.wizard-step-desc { font-size: 14px; color: #6b7280; margin: 0; }
.wizard-footer { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; border-top: 1px solid #e5e7eb; background: #f9fafb; }
.wizard-counter { font-size: 13px; color: #9ca3af; }
.wizard-actions { display: flex; gap: 10px; }
.btn-back { padding: 8px 18px; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-next { padding: 8px 18px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'segmented-control',
    description: 'Segmented control for mutually exclusive view selection',
    tags: ['navigation', 'segmented-control', 'toggle', 'selector'],
    code: `<template>
  <div class="segmented-wrapper">
    <div class="segmented-control" role="group">
      <button
        v-for="option in options"
        :key="option.value"
        :class="['segment', { active: selected === option.value }]"
        @click="selected = option.value"
      >{{ option.label }}</button>
    </div>
    <div class="segment-content">
      <p>Showing: <strong>{{ selectedLabel }}</strong></p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SegmentedControl = defineComponent({
  name: 'SegmentedControl',
  setup() {
    const options = ref([
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'year', label: 'Year' },
    ]);
    const selected = ref('week');
    const selectedLabel = computed(() => options.value.find(o => o.value === selected.value)?.label ?? '');
    return { options, selected, selectedLabel };
  },
});

export default createVueMicroApp({ name: 'navigation', App: SegmentedControl });
</script>

<style scoped>
.segmented-wrapper { display: inline-flex; flex-direction: column; gap: 16px; }
.segmented-control { display: inline-flex; background: #f3f4f6; border-radius: 8px; padding: 3px; }
.segment { padding: 7px 18px; border: none; background: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; color: #6b7280; transition: all 0.15s; }
.segment.active { background: #fff; color: #6366f1; box-shadow: 0 1px 4px rgba(0,0,0,0.1); font-weight: 700; }
.segment-content { font-size: 14px; color: #374151; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'anchor-nav',
    description: 'In-page anchor navigation that highlights active section on scroll',
    tags: ['navigation', 'anchor', 'scroll', 'in-page'],
    code: `<template>
  <div class="anchor-layout">
    <nav class="anchor-nav">
      <a
        v-for="section in sections"
        :key="section.id"
        :href="'#' + section.id"
        :class="['anchor-link', { active: activeId === section.id }]"
        @click.prevent="scrollTo(section.id)"
      >{{ section.label }}</a>
    </nav>
    <div class="anchor-content">
      <div v-for="section in sections" :key="section.id" :id="section.id" class="anchor-section">
        <h3>{{ section.label }}</h3>
        <p>{{ section.body }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const AnchorNav = defineComponent({
  name: 'AnchorNav',
  setup() {
    const sections = ref([
      { id: 'intro', label: 'Introduction', body: 'Getting started with tuvix.js micro-frontends.' },
      { id: 'install', label: 'Installation', body: 'Run pnpm add @tuvix.js/core to install.' },
      { id: 'usage', label: 'Usage', body: 'Import createVueMicroApp and wrap your component.' },
      { id: 'api', label: 'API Reference', body: 'Full API documentation and types.' },
    ]);
    const activeId = ref('intro');
    const scrollTo = (id: string) => { activeId.value = id; };
    return { sections, activeId, scrollTo };
  },
});

export default createVueMicroApp({ name: 'navigation', App: AnchorNav });
</script>

<style scoped>
.anchor-layout { display: flex; gap: 32px; }
.anchor-nav { width: 160px; flex-shrink: 0; position: sticky; top: 24px; display: flex; flex-direction: column; gap: 4px; }
.anchor-link { padding: 7px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; color: #6b7280; text-decoration: none; border-left: 2px solid transparent; }
.anchor-link.active { color: #6366f1; border-left-color: #6366f1; background: #eef2ff; }
.anchor-link:hover:not(.active) { color: #374151; background: #f3f4f6; }
.anchor-content { flex: 1; display: flex; flex-direction: column; gap: 24px; }
.anchor-section { padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
.anchor-section h3 { margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #111827; }
.anchor-section p { margin: 0; font-size: 14px; color: #6b7280; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'tag-nav',
    description: 'Tag-based navigation filter for content browsing',
    tags: ['navigation', 'tags', 'filter', 'categories'],
    code: `<template>
  <div class="tag-nav-wrapper">
    <div class="tag-nav">
      <button
        :class="['tag', { active: selectedTag === 'all' }]"
        @click="selectedTag = 'all'"
      >All</button>
      <button
        v-for="tag in tags"
        :key="tag"
        :class="['tag', { active: selectedTag === tag }]"
        @click="selectedTag = tag"
      >{{ tag }}</button>
    </div>
    <div class="tag-results">
      <div v-for="item in filteredItems" :key="item.title" class="tag-result-item">
        <span class="tag-result-dot" :style="{ background: tagColor(item.tag) }"></span>
        {{ item.title }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const TagNav = defineComponent({
  name: 'TagNav',
  setup() {
    const tags = ref(['Vue', 'React', 'Angular', 'Svelte']);
    const selectedTag = ref('all');
    const items = ref([
      { title: 'Build a todo app', tag: 'Vue' },
      { title: 'State management guide', tag: 'React' },
      { title: 'Dependency injection', tag: 'Angular' },
      { title: 'Reactive stores', tag: 'Svelte' },
      { title: 'Composables deep dive', tag: 'Vue' },
      { title: 'Server components', tag: 'React' },
    ]);
    const filteredItems = computed(() =>
      selectedTag.value === 'all' ? items.value : items.value.filter(i => i.tag === selectedTag.value)
    );
    const colors: Record<string, string> = { Vue: '#42b883', React: '#61dafb', Angular: '#dd0031', Svelte: '#ff3e00' };
    const tagColor = (tag: string) => colors[tag] ?? '#6366f1';
    return { tags, selectedTag, filteredItems, tagColor };
  },
});

export default createVueMicroApp({ name: 'navigation', App: TagNav });
</script>

<style scoped>
.tag-nav-wrapper { display: flex; flex-direction: column; gap: 16px; }
.tag-nav { display: flex; flex-wrap: wrap; gap: 8px; }
.tag { padding: 6px 14px; border: 1px solid #e5e7eb; background: #fff; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: 500; color: #6b7280; transition: all 0.15s; }
.tag.active { background: #6366f1; color: #fff; border-color: #6366f1; }
.tag:hover:not(.active) { border-color: #6366f1; color: #6366f1; }
.tag-results { display: flex; flex-direction: column; gap: 8px; }
.tag-result-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f9fafb; border-radius: 8px; font-size: 14px; color: #374151; }
.tag-result-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'dot-nav',
    description: 'Dot/bullet navigation for carousels and slide-based content',
    tags: ['navigation', 'dots', 'carousel', 'slides'],
    code: `<template>
  <div class="dot-nav-wrapper">
    <div class="slide">
      <p class="slide-title">{{ slides[current].title }}</p>
      <p class="slide-sub">{{ slides[current].subtitle }}</p>
    </div>
    <div class="dot-controls">
      <button class="arrow-btn" @click="prev">&#8249;</button>
      <div class="dots">
        <button
          v-for="(_, i) in slides"
          :key="i"
          :class="['dot', { active: i === current }]"
          @click="current = i"
          :aria-label="'Slide ' + (i + 1)"
        ></button>
      </div>
      <button class="arrow-btn" @click="next">&#8250;</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const DotNav = defineComponent({
  name: 'DotNav',
  setup() {
    const slides = ref([
      { title: 'Build Micro-Frontends', subtitle: 'Ship features independently with tuvix.js.' },
      { title: 'Any Framework', subtitle: 'React, Vue, Angular, Svelte — all supported.' },
      { title: 'Zero Config', subtitle: 'Get started in under 5 minutes.' },
    ]);
    const current = ref(0);
    const prev = () => current.value = (current.value - 1 + slides.value.length) % slides.value.length;
    const next = () => current.value = (current.value + 1) % slides.value.length;
    return { slides, current, prev, next };
  },
});

export default createVueMicroApp({ name: 'navigation', App: DotNav });
</script>

<style scoped>
.dot-nav-wrapper { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 32px; background: #f9fafb; border-radius: 12px; }
.slide { text-align: center; }
.slide-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 8px; }
.slide-sub { font-size: 14px; color: #6b7280; margin: 0; }
.dot-controls { display: flex; align-items: center; gap: 16px; }
.dots { display: flex; gap: 8px; }
.dot { width: 10px; height: 10px; border-radius: 50%; border: none; background: #d1d5db; cursor: pointer; padding: 0; transition: all 0.2s; }
.dot.active { background: #6366f1; transform: scale(1.3); }
.arrow-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; }
.arrow-btn:hover { background: #eef2ff; border-color: #6366f1; color: #6366f1; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
