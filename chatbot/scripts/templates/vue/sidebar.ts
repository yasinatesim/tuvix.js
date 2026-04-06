import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'collapsible',
    description: 'Sidebar that collapses to icon-only mode with toggle button',
    tags: ['sidebar', 'collapsible', 'toggle'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const CollapsibleSidebar = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'collapsible-sidebar',
  App: CollapsibleSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-icons',
    description: 'Sidebar with emoji icons and active state highlighting',
    tags: ['sidebar', 'icons', 'active-state'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const IconSidebar = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'icon-sidebar',
  App: IconSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'nested',
    description: 'Sidebar with expandable nested sub-menus',
    tags: ['sidebar', 'nested', 'expandable'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const NestedSidebar = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'nested-sidebar',
  App: NestedSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'mini',
    description: 'Mini sidebar with icon-only navigation and tooltips',
    tags: ['sidebar', 'mini', 'compact'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const MiniSidebar = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'mini-sidebar',
  App: MiniSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed sidebar with gradient accent and hover effects',
    tags: ['sidebar', 'dark', 'theme'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const DarkSidebar = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'dark-sidebar',
  App: DarkSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-search',
    description: 'Sidebar with search input to filter navigation items',
    tags: ['sidebar', 'search', 'filter'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const SearchSidebar = defineComponent({
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
  template: \`
    <aside class="search-sidebar">
    <div class="sidebar-header">
      <input type="text" v-model="query" placeholder="Search menu..." class="search-input" />
    </div>
    <nav class="sidebar-nav">
      <a v-for="item in filteredItems" :key="item" href="#" class="nav-item">{{ item }}</a>
    </nav>
    <p v-if="filteredItems.length === 0" class="no-results">No items found</p>
  </aside>
  \`,
});

const app = createVueMicroApp({
  name: 'search-sidebar',
  App: SearchSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-user-profile',
    description: 'Sidebar with user profile section at the top including avatar and role',
    tags: ['sidebar', 'user-profile', 'avatar'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const UserProfileSidebar = defineComponent({
  setup() {
  const userName = ref('Jane Smith');
      const userRole = ref('Administrator');
      const initials = computed(() => userName.value.split(' ').map(n => n[0]).join(''));
      const items = ['Dashboard', 'Projects', 'Team', 'Calendar', 'Documents', 'Settings'];
      return { userName, userRole, initials, items };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'user-profile-sidebar',
  App: UserProfileSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-badge',
    description: 'Sidebar with notification badges on menu items',
    tags: ['sidebar', 'badge', 'notification'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, reactive } from 'vue';

const BadgeSidebar = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'badge-sidebar',
  App: BadgeSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'responsive',
    description: 'Responsive sidebar that converts to bottom navigation on mobile',
    tags: ['sidebar', 'responsive', 'adaptive'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ResponsiveSidebar = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'responsive-sidebar',
  App: ResponsiveSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'multi-level',
    description: 'Sidebar with three levels of nested navigation menus',
    tags: ['sidebar', 'multi-level', 'deep-nesting'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const MultiLevelSidebar = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'multi-level-sidebar',
  App: MultiLevelSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-footer',
    description: 'Sidebar with bottom footer section containing version and help link',
    tags: ['sidebar', 'footer', 'version'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const FooterSidebar = defineComponent({
  setup() {
  const items = ref(['Dashboard', 'Projects', 'Tasks', 'Reports', 'Settings']);
      const version = ref('2.4.1');
      return { items, version };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'footer-sidebar',
  App: FooterSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'sticky',
    description: 'Sticky sidebar that stays visible while main content scrolls',
    tags: ['sidebar', 'sticky', 'scroll'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const StickySidebar = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'sticky-sidebar',
  App: StickySidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-groups',
    description: 'Sidebar with labeled groups to organize navigation items',
    tags: ['sidebar', 'groups', 'organized'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const GroupedSidebar = defineComponent({
  setup() {
  const groups = ref([
        { title: 'GENERAL', items: ['Dashboard', 'Analytics', 'Calendar'] },
        { title: 'MANAGEMENT', items: ['Users', 'Teams', 'Roles'] },
        { title: 'CONTENT', items: ['Pages', 'Posts', 'Media'] },
        { title: 'SYSTEM', items: ['Settings', 'Logs', 'Backups'] },
      ]);
      return { groups };
  },
  template: \`
    <aside class="grouped-sidebar">
    <div class="sidebar-brand">AppPanel</div>
    <div v-for="group in groups" :key="group.title" class="nav-group">
      <div class="group-title">{{ group.title }}</div>
      <a v-for="item in group.items" :key="item" href="#" class="group-item">{{ item }}</a>
    </div>
  </aside>
  \`,
});

const app = createVueMicroApp({
  name: 'grouped-sidebar',
  App: GroupedSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'overlay',
    description: 'Overlay sidebar that slides in over content with backdrop',
    tags: ['sidebar', 'overlay', 'slide'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const OverlaySidebar = defineComponent({
  setup() {
  const isOpen = ref(false);
      const items = ref(['Home', 'About', 'Services', 'Portfolio', 'Contact']);
      return { isOpen, items };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'overlay-sidebar',
  App: OverlaySidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-toggle',
    description: 'Sidebar with smooth expand/collapse toggle and animated transitions',
    tags: ['sidebar', 'toggle', 'animated'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ToggleSidebar = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'toggle-sidebar',
  App: ToggleSidebar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
