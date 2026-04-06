import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'minimal',
    description: 'Minimal header with logo and navigation links',
    tags: ['header', 'minimal', 'navigation'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent } from 'vue';

const MinimalHeader = defineComponent({
  setup() {
  return {};
  },
  template: \`
    <header class="minimal-header">
    <span class="logo">Logo</span>
    <nav class="nav-links">
      <a href="#home">Home</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>
  \`,
});

const app = createVueMicroApp({
  name: 'minimal-header',
  App: MinimalHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-search',
    description: 'Header with integrated search bar and autocomplete suggestions',
    tags: ['header', 'search', 'interactive'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const SearchHeader = defineComponent({
  setup() {
  const query = ref('');
      const focused = ref(false);
      const items = ['Dashboard', 'Settings', 'Profile', 'Help'];
      const filteredSuggestions = computed(() =>
        items.filter(i => i.toLowerCase().includes(query.value.toLowerCase()))
      );
      const onBlur = () => {
        setTimeout(() => { focused.value = false; }, 200);
      };
      return { query, focused, filteredSuggestions, onBlur };
  },
  template: \`
    <header class="search-header">
    <span class="brand">Brand</span>
    <div class="search-wrapper">
      <input
        type="text"
        placeholder="Search..."
        v-model="query"
        @focus="focused = true"
        @blur="onBlur"
        class="search-input"
      />
      <ul v-if="focused && query && filteredSuggestions.length" class="suggestions">
        <li v-for="s in filteredSuggestions" :key="s" @mousedown="query = s">{{ s }}</li>
      </ul>
    </div>
  </header>
  \`,
});

const app = createVueMicroApp({
  name: 'search-header',
  App: SearchHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-auth',
    description: 'Header with authentication buttons and user avatar',
    tags: ['header', 'auth', 'user'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const AuthHeader = defineComponent({
  setup() {
  const loggedIn = ref(false);
      const userName = ref('Jane Doe');
      const initials = computed(() =>
        userName.value.split(' ').map(n => n[0]).join('')
      );
      return { loggedIn, initials };
  },
  template: \`
    <header class="auth-header">
    <span class="app-name">AppName</span>
    <nav class="auth-nav">
      <template v-if="loggedIn">
        <div class="avatar">{{ initials }}</div>
        <button class="btn-logout" @click="loggedIn = false">Logout</button>
  \`,
});

const app = createVueMicroApp({
  name: 'auth-header',
  App: AuthHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'responsive',
    description: 'Responsive header with hamburger menu toggle for mobile',
    tags: ['header', 'responsive', 'mobile'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ResponsiveHeader = defineComponent({
  setup() {
  const menuOpen = ref(false);
      return { menuOpen };
  },
  template: \`
    <header class="responsive-header">
    <span class="logo">Brand</span>
    <button class="hamburger" @click="menuOpen = !menuOpen">
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </button>
    <nav class="nav-menu" :class="{ open: menuOpen }">
      <a href="#home" @click="menuOpen = false">Home</a>
      <a href="#features" @click="menuOpen = false">Features</a>
      <a href="#pricing" @click="menuOpen = false">Pricing</a>
      <a href="#contact" @click="menuOpen = false">Contact</a>
    </nav>
  </header>
  \`,
});

const app = createVueMicroApp({
  name: 'responsive-header',
  App: ResponsiveHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'dark',
    description: 'Dark-themed header with contrasting text and hover effects',
    tags: ['header', 'dark', 'theme'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const DarkHeader = defineComponent({
  setup() {
  const activeLink = ref('#home');
      const links = [
        { href: '#home', label: 'Home' },
        { href: '#explore', label: 'Explore' },
        { href: '#library', label: 'Library' },
        { href: '#settings', label: 'Settings' },
      ];
      return { activeLink, links };
  },
  template: \`
    <header class="dark-header">
    <span class="logo">DarkApp</span>
    <nav class="nav-links">
      <a v-for="link in links" :key="link.href" :href="link.href"
         :class="{ active: activeLink === link.href }"
         @click.prevent="activeLink = link.href">
        {{ link.label }}
      </a>
    </nav>
  </header>
  \`,
});

const app = createVueMicroApp({
  name: 'dark-header',
  App: DarkHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'sticky',
    description: 'Sticky header that stays fixed at the top on scroll',
    tags: ['header', 'sticky', 'scroll'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';

const StickyHeader = defineComponent({
  setup() {
  const isScrolled = ref(false);
      const handleScroll = () => {
        isScrolled.value = window.scrollY > 50;
      };
      onMounted(() => window.addEventListener('scroll', handleScroll));
      onUnmounted(() => window.removeEventListener('scroll', handleScroll));
      return { isScrolled };
  },
  template: \`
    <header class="sticky-header" :class="{ scrolled: isScrolled }">
    <span class="logo">StickyBrand</span>
    <nav class="nav-links">
      <a href="#home">Home</a>
      <a href="#about">About</a>
      <a href="#services">Services</a>
    </nav>
  </header>
  \`,
});

const app = createVueMicroApp({
  name: 'sticky-header',
  App: StickyHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-logo',
    description: 'Header with image logo and centered navigation',
    tags: ['header', 'logo', 'centered'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const LogoHeader = defineComponent({
  setup() {
  const navItems = ref(['Products', 'Solutions', 'Resources', 'Pricing']);
      return { navItems };
  },
  template: \`
    <header class="logo-header">
    <div class="logo-section">
      <div class="logo-icon">T</div>
      <span class="logo-text">Tuvix</span>
    </div>
    <nav class="center-nav">
      <a v-for="item in navItems" :key="item" href="#">{{ item }}</a>
    </nav>
    <div class="actions">
      <button class="btn-cta">Get Started</button>
    </div>
  </header>
  \`,
});

const app = createVueMicroApp({
  name: 'logo-header',
  App: LogoHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-dropdown',
    description: 'Header with dropdown menus on hover for sub-navigation',
    tags: ['header', 'dropdown', 'submenu'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const DropdownHeader = defineComponent({
  setup() {
  const openMenu = ref('');
      const menuItems = [
        { label: 'Products', children: ['Analytics', 'Automation', 'Integrations'] },
        { label: 'Solutions', children: ['Enterprise', 'Startup', 'Agency'] },
        { label: 'Company', children: ['About', 'Careers', 'Blog'] },
        { label: 'Pricing', children: [] },
      ];
      return { openMenu, menuItems };
  },
  template: \`
    <header class="dropdown-header">
    <span class="logo">DropNav</span>
    <nav class="nav-items">
      <div v-for="item in menuItems" :key="item.label" class="nav-item"
           @mouseenter="openMenu = item.label" @mouseleave="openMenu = ''">
        <span class="nav-label">{{ item.label }}</span>
        <ul v-if="item.children.length && openMenu === item.label" class="dropdown">
          <li v-for="child in item.children" :key="child">
            <a href="#">{{ child }}</a>
          </li>
        </ul>
      </div>
    </nav>
  </header>
  \`,
});

const app = createVueMicroApp({
  name: 'dropdown-header',
  App: DropdownHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-breadcrumb',
    description: 'Header with breadcrumb trail for hierarchical navigation',
    tags: ['header', 'breadcrumb', 'hierarchy'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const BreadcrumbHeader = defineComponent({
  setup() {
  const breadcrumbs = ref([
        { label: 'Home', path: '/' },
        { label: 'Projects', path: '/projects' },
        { label: 'Alpha', path: '/projects/alpha' },
        { label: 'Settings', path: '/projects/alpha/settings' },
      ]);
      const navigateTo = (index: number) => {
        breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
      };
      return { breadcrumbs, navigateTo };
  },
  template: \`
    <header class="breadcrumb-header">
    <div class="top-bar">
      <span class="logo">Portal</span>
      <nav class="main-nav">
        <a href="#">Dashboard</a>
        <a href="#">Projects</a>
        <a href="#">Settings</a>
      </nav>
    </div>
    <div class="breadcrumb-bar">
      <span v-for="(crumb, index) in breadcrumbs" :key="crumb.label" class="crumb">
        <a v-if="index < breadcrumbs.length - 1" href="#" @click.prevent="navigateTo(index)">{{ crumb.label }}</a>
        <span v-else class="current">{{ crumb.label }}</span>
        <span v-if="index < breadcrumbs.length - 1" class="separator">/</span>
      </span>
    </div>
  </header>
  \`,
});

const app = createVueMicroApp({
  name: 'breadcrumb-header',
  App: BreadcrumbHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-actions',
    description: 'Header with action buttons like notifications and settings',
    tags: ['header', 'actions', 'toolbar'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ActionsHeader = defineComponent({
  setup() {
  const unreadCount = ref(3);
      const showSettings = ref(false);
      const toggleNotifications = () => {
        unreadCount.value = 0;
      };
      return { unreadCount, showSettings, toggleNotifications };
  },
  template: \`
    <header class="actions-header">
    <span class="logo">WorkHub</span>
    <div class="action-bar">
      <button class="action-btn" @click="toggleNotifications">
        <span class="icon">&#128276;</span>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </button>
      <button class="action-btn" @click="showSettings = !showSettings">
        <span class="icon">&#9881;</span>
      </button>
      <div class="user-info">
        <div class="user-avatar">JD</div>
      </div>
    </div>
  </header>
  \`,
});

const app = createVueMicroApp({
  name: 'actions-header',
  App: ActionsHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'transparent',
    description: 'Transparent header that overlays content with light text',
    tags: ['header', 'transparent', 'overlay'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const TransparentHeader = defineComponent({
  setup() {
  const navItems = ref(['Features', 'Pricing', 'Docs', 'Blog']);
      return { navItems };
  },
  template: \`
    <header class="transparent-header">
    <span class="logo">Overlay</span>
    <nav class="nav-links">
      <a v-for="item in navItems" :key="item" href="#">{{ item }}</a>
    </nav>
    <button class="btn-cta">Try Free</button>
  </header>
  \`,
});

const app = createVueMicroApp({
  name: 'transparent-header',
  App: TransparentHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'fixed',
    description: 'Fixed-position header with scroll progress indicator',
    tags: ['header', 'fixed', 'progress'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';

const FixedHeader = defineComponent({
  setup() {
  const scrollProgress = ref(0);
      const updateProgress = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress.value = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      };
      onMounted(() => window.addEventListener('scroll', updateProgress));
      onUnmounted(() => window.removeEventListener('scroll', updateProgress));
      return { scrollProgress };
  },
  template: \`
    <header class="fixed-header">
    <div class="header-content">
      <span class="logo">FixedNav</span>
      <nav class="nav-links">
        <a href="#intro">Intro</a>
        <a href="#features">Features</a>
        <a href="#faq">FAQ</a>
      </nav>
    </div>
    <div class="progress-bar" :style="{ width: scrollProgress + '%' }"></div>
  </header>
  \`,
});

const app = createVueMicroApp({
  name: 'fixed-header',
  App: FixedHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-banner',
    description: 'Header with dismissible announcement banner above navigation',
    tags: ['header', 'banner', 'announcement'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const BannerHeader = defineComponent({
  setup() {
  const bannerVisible = ref(true);
      const bannerMessage = ref('New release v2.0 is out! Check out the latest features.');
      return { bannerVisible, bannerMessage };
  },
  template: \`
    <div class="header-with-banner">
    <div v-if="bannerVisible" class="banner">
      <span>{{ bannerMessage }}</span>
      <button class="banner-close" @click="bannerVisible = false">&times;</button>
    </div>
    <header class="main-header">
      <span class="logo">BannerApp</span>
      <nav class="nav-links">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#docs">Docs</a>
      </nav>
    </header>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'banner-header',
  App: BannerHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'mobile-menu',
    description: 'Header with slide-in mobile menu panel and overlay',
    tags: ['header', 'mobile', 'slide-menu'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const MobileMenuHeader = defineComponent({
  setup() {
  const isOpen = ref(false);
      const menuItems = ref(['Home', 'Products', 'About', 'Blog', 'Contact']);
      return { isOpen, menuItems };
  },
  template: \`
    <div class="mobile-header-wrapper">
    <header class="mobile-header">
      <span class="logo">MobileApp</span>
      <button class="menu-toggle" @click="isOpen = true">&#9776;</button>
    </header>
    <div v-if="isOpen" class="overlay" @click="isOpen = false"></div>
    <aside class="slide-menu" :class="{ open: isOpen }">
      <button class="close-btn" @click="isOpen = false">&times;</button>
      <nav class="slide-nav">
        <a v-for="item in menuItems" :key="item" href="#" @click="isOpen = false">{{ item }}</a>
      </nav>
    </aside>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'mobile-menu-header',
  App: MobileMenuHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'with-progress',
    description: 'Header with step progress indicator for multi-step flows',
    tags: ['header', 'progress', 'stepper'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ProgressHeader = defineComponent({
  setup() {
  const currentStep = ref(2);
      const totalSteps = 4;
      const stepLabels = ['Account', 'Profile', 'Preferences', 'Review'];
      const goToStep = (step: number) => {
        if (step <= currentStep.value) {
          currentStep.value = step;
        }
      };
      return { currentStep, totalSteps, stepLabels, goToStep };
  },
  template: \`
    <header class="progress-header">
    <div class="header-top">
      <span class="logo">SetupWizard</span>
      <span class="step-label">Step {{ currentStep }} of {{ totalSteps }}</span>
    </div>
    <div class="steps-bar">
      <div v-for="step in totalSteps" :key="step" class="step"
           :class="{ completed: step < currentStep, active: step === currentStep }"
           @click="goToStep(step)">
        <div class="step-circle">{{ step }}</div>
        <span class="step-text">{{ stepLabels[step - 1] }}</span>
      </div>
    </div>
  </header>
  \`,
});

const app = createVueMicroApp({
  name: 'progress-header',
  App: ProgressHeader,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
