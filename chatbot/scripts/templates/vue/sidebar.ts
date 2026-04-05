import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'collapsible',
    description: 'Sidebar that collapses to icon-only mode with toggle button',
    tags: ['sidebar', 'collapsible', 'toggle'],
    code: `<template>
  <aside class="sidebar" :class="{ collapsed }">
    <button class="toggle-btn" @click="collapsed = !collapsed">
      {{ collapsed ? '&#9654;' : '&#9664;' }}
    </button>
    <nav class="sidebar-nav">
      <a v-for="item in items" :key="item.label" href="#" class="nav-item">
        <span class="icon">{{ item.icon }}</span>
        <span v-if="!collapsed" class="label">{{ item.label }}</span>
      </a>
    </nav>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const CollapsibleSidebar = defineComponent({
  name: 'CollapsibleSidebar',
  setup() {
    const collapsed = ref(false);
    const items = [
      { icon: '\\u2302', label: 'Home' },
      { icon: '\\u2630', label: 'Dashboard' },
      { icon: '\\u2709', label: 'Messages' },
      { icon: '\\u2699', label: 'Settings' },
    ];
    return { collapsed, items };
  },
});

export default createVueMicroApp({ name: 'collapsible-sidebar', App: CollapsibleSidebar });
</script>

<style scoped>
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: #1f2937;
  color: #f9fafb;
  padding: 16px 0;
  transition: width 0.3s;
}
.sidebar.collapsed {
  width: 64px;
}
.toggle-btn {
  display: block;
  margin: 0 auto 16px;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
}
.toggle-btn:hover {
  color: #f9fafb;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  text-decoration: none;
  color: #d1d5db;
  transition: background 0.2s;
}
.nav-item:hover {
  background: #374151;
  color: #f9fafb;
}
.icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}
.label {
  font-size: 14px;
  white-space: nowrap;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-icons',
    description: 'Sidebar with emoji icons and active state highlighting',
    tags: ['sidebar', 'icons', 'active-state'],
    code: `<template>
  <aside class="icon-sidebar">
    <div class="brand">Menu</div>
    <nav class="nav-list">
      <a v-for="item in items" :key="item.label" href="#"
         class="nav-item" :class="{ active: active === item.label }"
         @click.prevent="active = item.label">
        <span class="item-icon">{{ item.icon }}</span>
        <span class="item-label">{{ item.label }}</span>
      </a>
    </nav>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const IconSidebar = defineComponent({
  name: 'IconSidebar',
  setup() {
    const active = ref('Dashboard');
    const items = [
      { icon: '\\u{1F4CA}', label: 'Dashboard' },
      { icon: '\\u{1F4C1}', label: 'Projects' },
      { icon: '\\u{1F465}', label: 'Team' },
      { icon: '\\u{1F4AC}', label: 'Messages' },
      { icon: '\\u{1F514}', label: 'Notifications' },
      { icon: '\\u2699\\uFE0F', label: 'Settings' },
    ];
    return { active, items };
  },
});

export default createVueMicroApp({ name: 'icon-sidebar', App: IconSidebar });
</script>

<style scoped>
.icon-sidebar {
  width: 240px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  padding: 16px 0;
}
.brand {
  font-size: 18px;
  font-weight: 700;
  padding: 0 20px 16px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 8px;
}
.nav-list {
  display: flex;
  flex-direction: column;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}
.nav-item:hover {
  background: #f9fafb;
  color: #374151;
}
.nav-item.active {
  color: #3b82f6;
  background: #eff6ff;
  border-left-color: #3b82f6;
}
.item-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}
.item-label {
  font-size: 14px;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'nested',
    description: 'Sidebar with expandable nested sub-menus',
    tags: ['sidebar', 'nested', 'expandable'],
    code: `<template>
  <aside class="nested-sidebar">
    <div class="sidebar-title">Navigation</div>
    <div v-for="section in sections" :key="section.label" class="section">
      <button class="section-header" @click="toggle(section.label)">
        <span>{{ section.label }}</span>
        <span class="arrow">{{ expanded.includes(section.label) ? '\\u25BC' : '\\u25B6' }}</span>
      </button>
      <div v-if="expanded.includes(section.label)" class="sub-items">
        <a v-for="child in section.children" :key="child" href="#" class="sub-item">{{ child }}</a>
      </div>
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const NestedSidebar = defineComponent({
  name: 'NestedSidebar',
  setup() {
    const expanded = ref<string[]>(['Overview']);
    const sections = [
      { label: 'Overview', children: ['Dashboard', 'Analytics', 'Reports'] },
      { label: 'Management', children: ['Users', 'Roles', 'Permissions'] },
      { label: 'Content', children: ['Pages', 'Posts', 'Media'] },
      { label: 'Settings', children: ['General', 'Security', 'Billing'] },
    ];
    const toggle = (label: string) => {
      const idx = expanded.value.indexOf(label);
      if (idx >= 0) expanded.value.splice(idx, 1);
      else expanded.value.push(label);
    };
    return { expanded, sections, toggle };
  },
});

export default createVueMicroApp({ name: 'nested-sidebar', App: NestedSidebar });
</script>

<style scoped>
.nested-sidebar {
  width: 260px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid #e5e7eb;
}
.sidebar-title {
  font-size: 16px;
  font-weight: 700;
  padding: 20px 20px 12px;
  color: #111827;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 20px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  text-align: left;
}
.section-header:hover {
  background: #f9fafb;
}
.arrow {
  font-size: 10px;
  color: #9ca3af;
}
.sub-items {
  display: flex;
  flex-direction: column;
}
.sub-item {
  padding: 8px 20px 8px 36px;
  text-decoration: none;
  color: #6b7280;
  font-size: 13px;
}
.sub-item:hover {
  color: #3b82f6;
  background: #f0f9ff;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'mini',
    description: 'Mini sidebar with icon-only navigation and tooltips',
    tags: ['sidebar', 'mini', 'compact'],
    code: `<template>
  <aside class="mini-sidebar">
    <div class="mini-logo">T</div>
    <nav class="mini-nav">
      <div v-for="item in items" :key="item.label" class="mini-item"
           :class="{ active: active === item.label }"
           @click="active = item.label" :title="item.label">
        <span class="mini-icon">{{ item.icon }}</span>
      </div>
    </nav>
    <div class="mini-footer">
      <div class="mini-item" title="Help">
        <span class="mini-icon">?</span>
      </div>
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const MiniSidebar = defineComponent({
  name: 'MiniSidebar',
  setup() {
    const active = ref('Home');
    const items = [
      { icon: '\\u2302', label: 'Home' },
      { icon: '\\u{1F4CB}', label: 'Tasks' },
      { icon: '\\u{1F4E5}', label: 'Inbox' },
      { icon: '\\u{1F4C5}', label: 'Calendar' },
      { icon: '\\u2699', label: 'Settings' },
    ];
    return { active, items };
  },
});

export default createVueMicroApp({ name: 'mini-sidebar', App: MiniSidebar });
</script>

<style scoped>
.mini-sidebar {
  width: 64px;
  min-height: 100vh;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
}
.mini-logo {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
  margin-bottom: 24px;
}
.mini-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.mini-item {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.mini-item:hover {
  background: #334155;
}
.mini-item.active {
  background: #3b82f6;
}
.mini-icon {
  font-size: 20px;
  color: #cbd5e1;
}
.mini-item.active .mini-icon {
  color: #fff;
}
.mini-footer {
  margin-top: auto;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed sidebar with gradient accent and hover effects',
    tags: ['sidebar', 'dark', 'theme'],
    code: `<template>
  <aside class="dark-sidebar">
    <div class="sidebar-brand">
      <span class="brand-icon">D</span>
      <span class="brand-name">DarkPanel</span>
    </div>
    <nav class="sidebar-menu">
      <a v-for="item in menuItems" :key="item.label" href="#"
         class="menu-item" :class="{ active: activeItem === item.label }"
         @click.prevent="activeItem = item.label">
        {{ item.label }}
      </a>
    </nav>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const DarkSidebar = defineComponent({
  name: 'DarkSidebar',
  setup() {
    const activeItem = ref('Dashboard');
    const menuItems = [
      { label: 'Dashboard' },
      { label: 'Analytics' },
      { label: 'Customers' },
      { label: 'Products' },
      { label: 'Orders' },
      { label: 'Settings' },
    ];
    return { activeItem, menuItems };
  },
});

export default createVueMicroApp({ name: 'dark-sidebar', App: DarkSidebar });
</script>

<style scoped>
.dark-sidebar {
  width: 250px;
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a, #1e293b);
  color: #e2e8f0;
  padding: 20px 0;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 20px;
  border-bottom: 1px solid #334155;
  margin-bottom: 12px;
}
.brand-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  color: #fff;
}
.brand-name {
  font-size: 18px;
  font-weight: 700;
}
.sidebar-menu {
  display: flex;
  flex-direction: column;
}
.menu-item {
  padding: 12px 24px;
  text-decoration: none;
  color: #94a3b8;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}
.menu-item:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.05);
}
.menu-item.active {
  color: #fff;
  background: rgba(99, 102, 241, 0.2);
  border-left: 3px solid #6366f1;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-search',
    description: 'Sidebar with search input to filter navigation items',
    tags: ['sidebar', 'search', 'filter'],
    code: `<template>
  <aside class="search-sidebar">
    <div class="sidebar-header">
      <input type="text" v-model="query" placeholder="Search menu..." class="search-input" />
    </div>
    <nav class="sidebar-nav">
      <a v-for="item in filteredItems" :key="item" href="#" class="nav-item">{{ item }}</a>
    </nav>
    <p v-if="filteredItems.length === 0" class="no-results">No items found</p>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SearchSidebar = defineComponent({
  name: 'SearchSidebar',
  setup() {
    const query = ref('');
    const allItems = [
      'Dashboard', 'Analytics', 'Users', 'Products',
      'Orders', 'Invoices', 'Reports', 'Calendar',
      'Messages', 'Settings', 'Help', 'Integrations',
    ];
    const filteredItems = computed(() =>
      query.value
        ? allItems.filter(i => i.toLowerCase().includes(query.value.toLowerCase()))
        : allItems
    );
    return { query, filteredItems };
  },
});

export default createVueMicroApp({ name: 'search-sidebar', App: SearchSidebar });
</script>

<style scoped>
.search-sidebar {
  width: 240px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid #e5e7eb;
}
.sidebar-header {
  padding: 16px;
}
.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.search-input:focus {
  border-color: #3b82f6;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
}
.nav-item {
  padding: 10px 20px;
  text-decoration: none;
  color: #374151;
  font-size: 14px;
}
.nav-item:hover {
  background: #f3f4f6;
  color: #111827;
}
.no-results {
  padding: 12px 20px;
  color: #9ca3af;
  font-size: 13px;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-user-profile',
    description: 'Sidebar with user profile section at the top including avatar and role',
    tags: ['sidebar', 'user-profile', 'avatar'],
    code: `<template>
  <aside class="profile-sidebar">
    <div class="profile-section">
      <div class="avatar">{{ initials }}</div>
      <div class="user-details">
        <span class="user-name">{{ userName }}</span>
        <span class="user-role">{{ userRole }}</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      <a v-for="item in items" :key="item" href="#" class="nav-link">{{ item }}</a>
    </nav>
    <div class="sidebar-bottom">
      <a href="#" class="nav-link logout-link">Log Out</a>
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const UserProfileSidebar = defineComponent({
  name: 'UserProfileSidebar',
  setup() {
    const userName = ref('Jane Smith');
    const userRole = ref('Administrator');
    const initials = computed(() => userName.value.split(' ').map(n => n[0]).join(''));
    const items = ['Dashboard', 'Projects', 'Team', 'Calendar', 'Documents', 'Settings'];
    return { userName, userRole, initials, items };
  },
});

export default createVueMicroApp({ name: 'user-profile-sidebar', App: UserProfileSidebar });
</script>

<style scoped>
.profile-sidebar {
  width: 250px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}
.profile-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #8b5cf6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}
.user-details {
  display: flex;
  flex-direction: column;
}
.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
}
.user-role {
  font-size: 12px;
  color: #6b7280;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 8px 0;
}
.nav-link {
  padding: 10px 20px;
  text-decoration: none;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}
.nav-link:hover {
  background: #f3f4f6;
}
.sidebar-bottom {
  border-top: 1px solid #f3f4f6;
  padding: 8px 0;
}
.logout-link {
  color: #ef4444;
}
.logout-link:hover {
  background: #fef2f2;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-badge',
    description: 'Sidebar with notification badges on menu items',
    tags: ['sidebar', 'badge', 'notification'],
    code: `<template>
  <aside class="badge-sidebar">
    <div class="sidebar-title">Workspace</div>
    <nav class="sidebar-nav">
      <a v-for="item in items" :key="item.label" href="#" class="nav-item"
         :class="{ active: active === item.label }"
         @click.prevent="active = item.label">
        <span class="item-label">{{ item.label }}</span>
        <span v-if="item.badge > 0" class="badge">{{ item.badge }}</span>
      </a>
    </nav>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const BadgeSidebar = defineComponent({
  name: 'BadgeSidebar',
  setup() {
    const active = ref('Inbox');
    const items = reactive([
      { label: 'Inbox', badge: 12 },
      { label: 'Starred', badge: 0 },
      { label: 'Drafts', badge: 3 },
      { label: 'Sent', badge: 0 },
      { label: 'Spam', badge: 47 },
      { label: 'Trash', badge: 0 },
    ]);
    return { active, items };
  },
});

export default createVueMicroApp({ name: 'badge-sidebar', App: BadgeSidebar });
</script>

<style scoped>
.badge-sidebar {
  width: 240px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid #e5e7eb;
}
.sidebar-title {
  font-size: 16px;
  font-weight: 700;
  padding: 20px 20px 16px;
  color: #111827;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
}
.nav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  text-decoration: none;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}
.nav-item:hover {
  background: #f3f4f6;
}
.nav-item.active {
  background: #eff6ff;
  color: #3b82f6;
}
.badge {
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'responsive',
    description: 'Responsive sidebar that converts to bottom navigation on mobile',
    tags: ['sidebar', 'responsive', 'adaptive'],
    code: `<template>
  <aside class="responsive-sidebar">
    <div class="sidebar-brand">ResponsiveApp</div>
    <nav class="sidebar-nav">
      <a v-for="item in items" :key="item.label" href="#" class="nav-item"
         :class="{ active: active === item.label }" @click.prevent="active = item.label">
        <span class="item-icon">{{ item.icon }}</span>
        <span class="item-text">{{ item.label }}</span>
      </a>
    </nav>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ResponsiveSidebar = defineComponent({
  name: 'ResponsiveSidebar',
  setup() {
    const active = ref('Home');
    const items = [
      { icon: '\\u2302', label: 'Home' },
      { icon: '\\u{1F50D}', label: 'Search' },
      { icon: '\\u{1F514}', label: 'Alerts' },
      { icon: '\\u{1F464}', label: 'Profile' },
    ];
    return { active, items };
  },
});

export default createVueMicroApp({ name: 'responsive-sidebar', App: ResponsiveSidebar });
</script>

<style scoped>
.responsive-sidebar {
  width: 220px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid #e5e7eb;
}
.sidebar-brand {
  font-size: 16px;
  font-weight: 700;
  padding: 20px 16px;
  border-bottom: 1px solid #f3f4f6;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  text-decoration: none;
  color: #6b7280;
  font-size: 14px;
}
.nav-item:hover {
  background: #f9fafb;
}
.nav-item.active {
  color: #3b82f6;
  background: #eff6ff;
}
.item-icon {
  font-size: 18px;
}
@media (max-width: 768px) {
  .responsive-sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    min-height: auto;
    border-right: none;
    border-top: 1px solid #e5e7eb;
    z-index: 100;
  }
  .sidebar-brand {
    display: none;
  }
  .sidebar-nav {
    flex-direction: row;
    justify-content: space-around;
    padding: 4px 0;
  }
  .nav-item {
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    font-size: 11px;
  }
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'multi-level',
    description: 'Sidebar with three levels of nested navigation menus',
    tags: ['sidebar', 'multi-level', 'deep-nesting'],
    code: `<template>
  <aside class="multi-sidebar">
    <div class="sidebar-title">Multi-Level</div>
    <div v-for="section in menu" :key="section.label" class="level-1">
      <button class="l1-btn" @click="toggleL1(section.label)">
        <span>{{ section.label }}</span>
        <span class="caret">{{ openL1.includes(section.label) ? '-' : '+' }}</span>
      </button>
      <div v-if="openL1.includes(section.label)" class="l2-container">
        <div v-for="sub in section.children" :key="sub.label" class="level-2">
          <button v-if="sub.children" class="l2-btn" @click="toggleL2(sub.label)">
            {{ sub.label }}
            <span class="caret">{{ openL2.includes(sub.label) ? '-' : '+' }}</span>
          </button>
          <a v-else href="#" class="l2-link">{{ sub.label }}</a>
          <div v-if="sub.children && openL2.includes(sub.label)" class="l3-container">
            <a v-for="leaf in sub.children" :key="leaf" href="#" class="l3-link">{{ leaf }}</a>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

interface MenuItem {
  label: string;
  children?: MenuItem[] | string[];
}

const MultiLevelSidebar = defineComponent({
  name: 'MultiLevelSidebar',
  setup() {
    const openL1 = ref<string[]>([]);
    const openL2 = ref<string[]>([]);
    const menu: MenuItem[] = [
      { label: 'Platform', children: [
        { label: 'Compute', children: ['Instances', 'Functions', 'Containers'] },
        { label: 'Storage', children: ['Buckets', 'Volumes', 'CDN'] },
      ]},
      { label: 'Database', children: [
        { label: 'SQL', children: ['PostgreSQL', 'MySQL'] },
        { label: 'NoSQL', children: ['MongoDB', 'Redis'] },
      ]},
    ];
    const toggleL1 = (label: string) => {
      const i = openL1.value.indexOf(label);
      if (i >= 0) openL1.value.splice(i, 1); else openL1.value.push(label);
    };
    const toggleL2 = (label: string) => {
      const i = openL2.value.indexOf(label);
      if (i >= 0) openL2.value.splice(i, 1); else openL2.value.push(label);
    };
    return { menu, openL1, openL2, toggleL1, toggleL2 };
  },
});

export default createVueMicroApp({ name: 'multi-level-sidebar', App: MultiLevelSidebar });
</script>

<style scoped>
.multi-sidebar {
  width: 260px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid #e5e7eb;
}
.sidebar-title {
  font-size: 16px;
  font-weight: 700;
  padding: 20px;
}
.l1-btn {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 10px 20px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  text-align: left;
}
.l1-btn:hover { background: #f9fafb; }
.l2-btn {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 8px 20px 8px 32px;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  text-align: left;
}
.l2-btn:hover { background: #f3f4f6; }
.l2-link {
  display: block;
  padding: 8px 20px 8px 32px;
  text-decoration: none;
  color: #6b7280;
  font-size: 13px;
}
.l3-link {
  display: block;
  padding: 6px 20px 6px 48px;
  text-decoration: none;
  color: #9ca3af;
  font-size: 12px;
}
.l3-link:hover { color: #3b82f6; }
.caret { font-size: 12px; color: #9ca3af; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-footer',
    description: 'Sidebar with bottom footer section containing version and help link',
    tags: ['sidebar', 'footer', 'version'],
    code: `<template>
  <aside class="footer-sidebar">
    <div class="sidebar-header">Workspace</div>
    <nav class="sidebar-nav">
      <a v-for="item in items" :key="item" href="#" class="nav-link">{{ item }}</a>
    </nav>
    <div class="sidebar-footer">
      <a href="#" class="footer-link">Help &amp; Support</a>
      <span class="version">v{{ version }}</span>
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const FooterSidebar = defineComponent({
  name: 'FooterSidebar',
  setup() {
    const items = ref(['Dashboard', 'Projects', 'Tasks', 'Reports', 'Settings']);
    const version = ref('2.4.1');
    return { items, version };
  },
});

export default createVueMicroApp({ name: 'footer-sidebar', App: FooterSidebar });
</script>

<style scoped>
.footer-sidebar {
  width: 240px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  font-size: 16px;
  font-weight: 700;
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
}
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}
.nav-link {
  padding: 10px 20px;
  text-decoration: none;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}
.nav-link:hover {
  background: #f3f4f6;
}
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.footer-link {
  text-decoration: none;
  color: #6b7280;
  font-size: 13px;
}
.footer-link:hover {
  color: #3b82f6;
}
.version {
  font-size: 11px;
  color: #9ca3af;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'sticky',
    description: 'Sticky sidebar that stays visible while main content scrolls',
    tags: ['sidebar', 'sticky', 'scroll'],
    code: `<template>
  <aside class="sticky-sidebar">
    <div class="sidebar-brand">StickyNav</div>
    <nav class="sidebar-nav">
      <a v-for="section in sections" :key="section.id" :href="'#' + section.id"
         class="nav-link" :class="{ active: activeSection === section.id }"
         @click.prevent="activeSection = section.id">
        {{ section.label }}
      </a>
    </nav>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const StickySidebar = defineComponent({
  name: 'StickySidebar',
  setup() {
    const activeSection = ref('overview');
    const sections = [
      { id: 'overview', label: 'Overview' },
      { id: 'installation', label: 'Installation' },
      { id: 'usage', label: 'Usage' },
      { id: 'api', label: 'API Reference' },
      { id: 'examples', label: 'Examples' },
      { id: 'faq', label: 'FAQ' },
    ];
    return { activeSection, sections };
  },
});

export default createVueMicroApp({ name: 'sticky-sidebar', App: StickySidebar });
</script>

<style scoped>
.sticky-sidebar {
  width: 220px;
  position: sticky;
  top: 0;
  height: 100vh;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
}
.sidebar-brand {
  font-size: 16px;
  font-weight: 700;
  padding: 20px 16px;
  border-bottom: 1px solid #f3f4f6;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}
.nav-link {
  padding: 8px 16px;
  text-decoration: none;
  color: #6b7280;
  font-size: 14px;
  border-left: 2px solid transparent;
}
.nav-link:hover {
  color: #374151;
  background: #f9fafb;
}
.nav-link.active {
  color: #3b82f6;
  border-left-color: #3b82f6;
  background: #eff6ff;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-groups',
    description: 'Sidebar with labeled groups to organize navigation items',
    tags: ['sidebar', 'groups', 'organized'],
    code: `<template>
  <aside class="grouped-sidebar">
    <div class="sidebar-brand">AppPanel</div>
    <div v-for="group in groups" :key="group.title" class="nav-group">
      <div class="group-title">{{ group.title }}</div>
      <a v-for="item in group.items" :key="item" href="#" class="group-item">{{ item }}</a>
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const GroupedSidebar = defineComponent({
  name: 'GroupedSidebar',
  setup() {
    const groups = ref([
      { title: 'GENERAL', items: ['Dashboard', 'Analytics', 'Calendar'] },
      { title: 'MANAGEMENT', items: ['Users', 'Teams', 'Roles'] },
      { title: 'CONTENT', items: ['Pages', 'Posts', 'Media'] },
      { title: 'SYSTEM', items: ['Settings', 'Logs', 'Backups'] },
    ]);
    return { groups };
  },
});

export default createVueMicroApp({ name: 'grouped-sidebar', App: GroupedSidebar });
</script>

<style scoped>
.grouped-sidebar {
  width: 240px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid #e5e7eb;
}
.sidebar-brand {
  font-size: 18px;
  font-weight: 700;
  padding: 20px;
}
.nav-group {
  margin-bottom: 8px;
}
.group-title {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  letter-spacing: 0.05em;
  padding: 12px 20px 4px;
}
.group-item {
  display: block;
  padding: 8px 20px;
  text-decoration: none;
  color: #374151;
  font-size: 14px;
}
.group-item:hover {
  background: #f3f4f6;
  color: #111827;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'overlay',
    description: 'Overlay sidebar that slides in over content with backdrop',
    tags: ['sidebar', 'overlay', 'slide'],
    code: `<template>
  <div class="overlay-sidebar-wrapper">
    <button class="open-btn" @click="isOpen = true">Open Menu</button>
    <div v-if="isOpen" class="backdrop" @click="isOpen = false"></div>
    <aside class="overlay-sidebar" :class="{ open: isOpen }">
      <div class="sidebar-header">
        <span class="title">Menu</span>
        <button class="close-btn" @click="isOpen = false">&times;</button>
      </div>
      <nav class="sidebar-nav">
        <a v-for="item in items" :key="item" href="#" class="nav-link" @click="isOpen = false">{{ item }}</a>
      </nav>
    </aside>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const OverlaySidebar = defineComponent({
  name: 'OverlaySidebar',
  setup() {
    const isOpen = ref(false);
    const items = ref(['Home', 'About', 'Services', 'Portfolio', 'Contact']);
    return { isOpen, items };
  },
});

export default createVueMicroApp({ name: 'overlay-sidebar', App: OverlaySidebar });
</script>

<style scoped>
.open-btn {
  padding: 10px 20px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
}
.overlay-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: #fff;
  z-index: 300;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
}
.overlay-sidebar.open {
  transform: translateX(0);
}
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.title {
  font-size: 18px;
  font-weight: 700;
}
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}
.nav-link {
  padding: 12px 20px;
  text-decoration: none;
  color: #374151;
  font-size: 16px;
}
.nav-link:hover {
  background: #f3f4f6;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-toggle',
    description: 'Sidebar with smooth expand/collapse toggle and animated transitions',
    tags: ['sidebar', 'toggle', 'animated'],
    code: `<template>
  <aside class="toggle-sidebar" :class="{ expanded }">
    <button class="toggle-btn" @click="expanded = !expanded">
      {{ expanded ? '\\u00AB' : '\\u00BB' }}
    </button>
    <nav class="sidebar-nav">
      <div v-for="item in items" :key="item.label" class="nav-item"
           :class="{ active: active === item.label }"
           @click="active = item.label">
        <span class="item-icon">{{ item.icon }}</span>
        <transition name="fade">
          <span v-if="expanded" class="item-label">{{ item.label }}</span>
        </transition>
      </div>
    </nav>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ToggleSidebar = defineComponent({
  name: 'ToggleSidebar',
  setup() {
    const expanded = ref(true);
    const active = ref('Dashboard');
    const items = [
      { icon: '\\u{1F3E0}', label: 'Dashboard' },
      { icon: '\\u{1F4C4}', label: 'Documents' },
      { icon: '\\u{1F4E7}', label: 'Messages' },
      { icon: '\\u{1F4C8}', label: 'Analytics' },
      { icon: '\\u2699\\uFE0F', label: 'Settings' },
    ];
    return { expanded, active, items };
  },
});

export default createVueMicroApp({ name: 'toggle-sidebar', App: ToggleSidebar });
</script>

<style scoped>
.toggle-sidebar {
  width: 64px;
  min-height: 100vh;
  background: #111827;
  transition: width 0.3s ease;
  overflow: hidden;
}
.toggle-sidebar.expanded {
  width: 240px;
}
.toggle-btn {
  display: block;
  width: 100%;
  padding: 16px;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 18px;
  cursor: pointer;
  text-align: center;
}
.toggle-btn:hover {
  color: #fff;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s;
  white-space: nowrap;
}
.nav-item:hover {
  background: #1f2937;
  color: #e5e7eb;
}
.nav-item.active {
  background: #374151;
  color: #fff;
}
.item-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}
.item-label {
  font-size: 14px;
  font-weight: 500;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
