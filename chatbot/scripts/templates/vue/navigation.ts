import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'breadcrumb',
    description: 'Breadcrumb navigation showing current page hierarchy',
    tags: ['navigation', 'breadcrumb', 'hierarchy'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const BreadcrumbNav = defineComponent({
  setup() {
  const crumbs = ref(['Home', 'Products', 'Electronics', 'Headphones']);
      const navigate = (index: number) => {
        crumbs.value = crumbs.value.slice(0, index + 1);
      };
      return { crumbs, navigate };
  },
  template: \`
    <nav class="breadcrumb" aria-label="breadcrumb">
    <ol class="breadcrumb-list">
      <li v-for="(crumb, index) in crumbs" :key="index" class="breadcrumb-item">
        <a v-if="index < crumbs.length - 1" class="breadcrumb-link" @click.prevent="navigate(index)">{{ crumb }}</a>
        <span v-else class="breadcrumb-current" aria-current="page">{{ crumb }}</span>
        <span v-if="index < crumbs.length - 1" class="breadcrumb-separator">/</span>
      </li>
    </ol>
  </nav>
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: BreadcrumbNav,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'tabs',
    description: 'Horizontal tab navigation with active state and panel content',
    tags: ['navigation', 'tabs', 'panels'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const TabsNav = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: TabsNav,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'stepper',
    description: 'Multi-step wizard stepper with progress indicator',
    tags: ['navigation', 'stepper', 'wizard', 'progress'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const StepperNav = defineComponent({
  setup() {
  const steps = ref(['Account', 'Profile', 'Settings', 'Review']);
      const currentStep = ref(0);
      return { steps, currentStep };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: StepperNav,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'pagination',
    description: 'Page pagination control with prev/next and numbered pages',
    tags: ['navigation', 'pagination', 'pages'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const PaginationNav = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: PaginationNav,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'menu',
    description: 'Dropdown context menu with icons and keyboard navigation',
    tags: ['navigation', 'menu', 'dropdown', 'context'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ContextMenu = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: ContextMenu,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'navbar',
    description: 'Responsive top navbar with logo, links and CTA button',
    tags: ['navigation', 'navbar', 'header', 'responsive'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const TopNavbar = defineComponent({
  setup() {
  const links = ref(['Home', 'Features', 'Pricing', 'Docs']);
      const activeLink = ref('Home');
      const mobileOpen = ref(false);
      return { links, activeLink, mobileOpen };
  },
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: TopNavbar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'drawer',
    description: 'Slide-in drawer navigation panel with overlay',
    tags: ['navigation', 'drawer', 'sidebar', 'overlay'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const DrawerNav = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: DrawerNav,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'mega-menu',
    description: 'Full-width mega menu with grouped links and feature highlights',
    tags: ['navigation', 'mega-menu', 'dropdown', 'categories'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const MegaMenu = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: MegaMenu,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'bottom-bar',
    description: 'Mobile bottom navigation bar with icons and labels',
    tags: ['navigation', 'bottom-bar', 'mobile', 'tabs'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const BottomBar = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: BottomBar,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'side-menu',
    description: 'Collapsible vertical side menu with nested items',
    tags: ['navigation', 'side-menu', 'sidebar', 'nested'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const SideMenu = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: SideMenu,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'wizard',
    description: 'Form wizard with step validation and summary review',
    tags: ['navigation', 'wizard', 'form', 'multi-step'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const WizardNav = defineComponent({
  setup() {
  const steps = ref([
        { title: 'Welcome', description: "Let's get you set up in just a few steps." },
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: WizardNav,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'segmented-control',
    description: 'Segmented control for mutually exclusive view selection',
    tags: ['navigation', 'segmented-control', 'toggle', 'selector'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const SegmentedControl = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: SegmentedControl,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'anchor-nav',
    description: 'In-page anchor navigation that highlights active section on scroll',
    tags: ['navigation', 'anchor', 'scroll', 'in-page'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const AnchorNav = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: AnchorNav,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'tag-nav',
    description: 'Tag-based navigation filter for content browsing',
    tags: ['navigation', 'tags', 'filter', 'categories'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const TagNav = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: TagNav,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'dot-nav',
    description: 'Dot/bullet navigation for carousels and slide-based content',
    tags: ['navigation', 'dots', 'carousel', 'slides'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const DotNav = defineComponent({
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
  template: \`
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
  \`,
});

const app = createVueMicroApp({
  name: 'navigation',
  App: DotNav,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
