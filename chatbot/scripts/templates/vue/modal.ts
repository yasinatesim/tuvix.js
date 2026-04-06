import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'confirmation',
    description: 'Confirmation dialog with title, message, and confirm/cancel buttons',
    tags: ['modal', 'confirmation', 'dialog'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ConfirmationModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const title = ref('Confirm Action');
      const message = ref('Are you sure you want to proceed? This action cannot be undone.');
      const confirmText = ref('Confirm');
      const confirm = () => { isOpen.value = false; };
      const cancel = () => { isOpen.value = false; };
      return { isOpen, title, message, confirmText, confirm, cancel };
  },
  template: \`
    <div v-if="isOpen" class="modal-overlay" @click.self="cancel">
    <div class="modal-dialog">
      <h3 class="modal-title">{{ title }}</h3>
      <p class="modal-message">{{ message }}</p>
      <div class="modal-actions">
        <button class="btn-cancel" @click="cancel">Cancel</button>
        <button class="btn-confirm" @click="confirm">{{ confirmText }}</button>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'confirmation-modal',
  App: ConfirmationModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'form',
    description: 'Modal with embedded form for data input',
    tags: ['modal', 'form', 'input'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, reactive } from 'vue';

const FormModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const form = reactive({ title: '', description: '', category: 'general' });
      const submitForm = () => { isOpen.value = false; };
      return { isOpen, form, submitForm };
  },
  template: \`
    <div v-if="isOpen" class="modal-overlay" @click.self="isOpen = false">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>Create Item</h3>
        <button class="close-btn" @click="isOpen = false">&times;</button>
      </div>
      <form @submit.prevent="submitForm" class="modal-form">
        <div class="field">
          <label>Title</label>
          <input v-model="form.title" type="text" required />
        </div>
        <div class="field">
          <label>Description</label>
          <textarea v-model="form.description" rows="3"></textarea>
        </div>
        <div class="field">
          <label>Category</label>
          <select v-model="form.category">
            <option value="general">General</option>
            <option value="feature">Feature</option>
            <option value="bug">Bug</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="isOpen = false">Cancel</button>
          <button type="submit" class="btn-submit">Create</button>
        </div>
      </form>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'form-modal',
  App: FormModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'lightbox',
    description: 'Image lightbox modal with navigation arrows and counter',
    tags: ['modal', 'lightbox', 'gallery'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const LightboxModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const currentIndex = ref(0);
      const images = [
        { label: 'Photo 1', color: '#dbeafe' },
        { label: 'Photo 2', color: '#fce7f3' },
        { label: 'Photo 3', color: '#d1fae5' },
        { label: 'Photo 4', color: '#fef3c7' },
      ];
      const next = () => { currentIndex.value = (currentIndex.value + 1) % images.length; };
      const prev = () => { currentIndex.value = (currentIndex.value - 1 + images.length) % images.length; };
      return { isOpen, currentIndex, images, next, prev };
  },
  template: \`
    <div v-if="isOpen" class="lightbox-overlay" @click.self="isOpen = false">
    <button class="nav-btn prev" @click="prev">&lsaquo;</button>
    <div class="lightbox-content">
      <div class="image-placeholder" :style="{ background: images[currentIndex].color }">
        {{ images[currentIndex].label }}
      </div>
      <div class="lightbox-info">
        <span>{{ currentIndex + 1 }} / {{ images.length }}</span>
        <button class="close-btn" @click="isOpen = false">&times;</button>
      </div>
    </div>
    <button class="nav-btn next" @click="next">&rsaquo;</button>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'lightbox-modal',
  App: LightboxModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'video',
    description: 'Video player modal with play controls placeholder',
    tags: ['modal', 'video', 'player'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const VideoModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const playing = ref(false);
      const progress = ref(35);
      const title = ref('Product Demo Video');
      const currentTime = ref('1:23 / 3:45');
      return { isOpen, playing, progress, title, currentTime };
  },
  template: \`
    <div v-if="isOpen" class="video-overlay" @click.self="isOpen = false">
    <div class="video-dialog">
      <button class="close-btn" @click="isOpen = false">&times;</button>
      <div class="video-player">
        <div class="video-placeholder" @click="playing = !playing">
          <span v-if="!playing" class="play-btn">&#9654;</span>
          <span v-else class="pause-indicator">Playing...</span>
        </div>
        <div class="video-controls">
          <button @click="playing = !playing">{{ playing ? 'Pause' : 'Play' }}</button>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <span class="time">{{ currentTime }}</span>
        </div>
      </div>
      <h3 class="video-title">{{ title }}</h3>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'video-modal',
  App: VideoModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'settings',
    description: 'Settings modal with tabbed sections for different preference groups',
    tags: ['modal', 'settings', 'tabs'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, reactive } from 'vue';

const SettingsModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const activeTab = ref('General');
      const tabs = ['General', 'Notifications', 'Privacy', 'Appearance'];
      const toggles = reactive<Record<string, boolean>>({});
      return { isOpen, activeTab, tabs, toggles };
  },
  template: \`
    <div v-if="isOpen" class="modal-overlay" @click.self="isOpen = false">
    <div class="settings-dialog">
      <div class="settings-sidebar">
        <h3>Settings</h3>
        <a v-for="tab in tabs" :key="tab" href="#"
           :class="{ active: activeTab === tab }" @click.prevent="activeTab = tab">{{ tab }}</a>
      </div>
      <div class="settings-content">
        <h4>{{ activeTab }}</h4>
        <div class="setting-item" v-for="n in 3" :key="n">
          <span>Option {{ n }} for {{ activeTab }}</span>
          <button class="toggle" :class="{ on: toggles[activeTab + n] }"
                  @click="toggles[activeTab + n] = !toggles[activeTab + n]">
            <span class="knob"></span>
          </button>
        </div>
        <div class="settings-actions">
          <button class="btn-save" @click="isOpen = false">Save</button>
        </div>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'settings-modal',
  App: SettingsModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'side-panel',
    description: 'Side panel modal that slides in from the right',
    tags: ['modal', 'side-panel', 'slide'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const SidePanelModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const title = ref('Details');
      const items = ref(['Item 1 details', 'Item 2 details', 'Item 3 details', 'Item 4 details']);
      return { isOpen, title, items };
  },
  template: \`
    <div v-if="isOpen" class="panel-wrapper">
    <div class="panel-backdrop" @click="isOpen = false"></div>
    <aside class="side-panel">
      <div class="panel-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="isOpen = false">&times;</button>
      </div>
      <div class="panel-body">
        <div v-for="item in items" :key="item" class="panel-item">{{ item }}</div>
      </div>
      <div class="panel-footer">
        <button class="btn-action" @click="isOpen = false">Done</button>
      </div>
    </aside>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'side-panel-modal',
  App: SidePanelModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'image-gallery',
    description: 'Image gallery modal with thumbnail grid and preview',
    tags: ['modal', 'gallery', 'images'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const ImageGalleryModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const selectedIndex = ref(0);
      const images = [
        { label: 'Image 1', color: '#dbeafe' },
        { label: 'Image 2', color: '#fce7f3' },
        { label: 'Image 3', color: '#d1fae5' },
        { label: 'Image 4', color: '#fef3c7' },
        { label: 'Image 5', color: '#ede9fe' },
        { label: 'Image 6', color: '#fee2e2' },
      ];
      return { isOpen, selectedIndex, images };
  },
  template: \`
    <div v-if="isOpen" class="gallery-overlay" @click.self="isOpen = false">
    <div class="gallery-dialog">
      <button class="close-btn" @click="isOpen = false">&times;</button>
      <div class="gallery-preview" :style="{ background: images[selectedIndex].color }">
        {{ images[selectedIndex].label }}
      </div>
      <div class="gallery-thumbs">
        <div v-for="(img, idx) in images" :key="idx"
             class="thumb" :class="{ active: selectedIndex === idx }"
             :style="{ background: img.color }" @click="selectedIndex = idx">
        </div>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'image-gallery-modal',
  App: ImageGalleryModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'terms',
    description: 'Terms and conditions modal with scrollable content and accept button',
    tags: ['modal', 'terms', 'legal'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const TermsModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const accepted = ref(false);
      const scrolledToBottom = ref(false);
      const checkScroll = (e: Event) => {
        const el = e.target as HTMLElement;
        scrolledToBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
      };
      return { isOpen, accepted, scrolledToBottom, checkScroll };
  },
  template: \`
    <div v-if="isOpen" class="modal-overlay">
    <div class="terms-dialog">
      <h3 class="modal-title">Terms &amp; Conditions</h3>
      <div class="terms-content" @scroll="checkScroll">
        <p v-for="n in 8" :key="n">Section {{ n }}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.</p>
      </div>
      <div class="terms-footer">
        <label class="accept-label">
          <input type="checkbox" v-model="accepted" :disabled="!scrolledToBottom" />
          I have read and agree to the terms
        </label>
        <button class="btn-accept" :disabled="!accepted" @click="isOpen = false">Accept</button>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'terms-modal',
  App: TermsModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'alert',
    description: 'Alert modal with icon, message, and single dismiss action',
    tags: ['modal', 'alert', 'warning'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const AlertModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const type = ref<'success' | 'error' | 'warning' | 'info'>('error');
      const title = ref('Something went wrong');
      const message = ref('An unexpected error occurred. Please try again or contact support.');
      const dismissText = ref('Got it');
      const typeIcon = computed(() => {
        const icons = { success: '\\u2713', error: '\\u2717', warning: '\\u26A0', info: '\\u2139' };
        return icons[type.value];
      });
      return { isOpen, type, title, message, dismissText, typeIcon };
  },
  template: \`
    <div v-if="isOpen" class="modal-overlay" @click.self="isOpen = false">
    <div class="alert-dialog" :class="type">
      <div class="alert-icon">{{ typeIcon }}</div>
      <h3 class="alert-title">{{ title }}</h3>
      <p class="alert-message">{{ message }}</p>
      <button class="btn-dismiss" @click="isOpen = false">{{ dismissText }}</button>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'alert-modal',
  App: AlertModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'fullscreen',
    description: 'Fullscreen modal with close button and centered content',
    tags: ['modal', 'fullscreen', 'immersive'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const FullscreenModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const title = ref('Welcome to the Experience');
      const description = ref('This fullscreen modal creates an immersive, focused experience for onboarding or showcasing content.');
      return { isOpen, title, description };
  },
  template: \`
    <div v-if="isOpen" class="fullscreen-modal">
    <button class="close-btn" @click="isOpen = false">&times;</button>
    <div class="modal-content">
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <button class="action-btn" @click="isOpen = false">Continue</button>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'fullscreen-modal',
  App: FullscreenModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'drawer',
    description: 'Bottom drawer modal that slides up with drag handle',
    tags: ['modal', 'drawer', 'bottom-sheet'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const DrawerModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const title = ref('Choose an action');
      const options = ref(['Share', 'Copy Link', 'Save', 'Report', 'Cancel']);
      return { isOpen, title, options };
  },
  template: \`
    <div v-if="isOpen" class="drawer-wrapper">
    <div class="drawer-backdrop" @click="isOpen = false"></div>
    <div class="drawer-panel">
      <div class="drag-handle"></div>
      <h3 class="drawer-title">{{ title }}</h3>
      <div class="drawer-content">
        <div v-for="option in options" :key="option" class="drawer-option" @click="isOpen = false">
          {{ option }}
        </div>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'drawer-modal',
  App: DrawerModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'bottom-sheet',
    description: 'Bottom sheet modal with expandable content and snap points',
    tags: ['modal', 'bottom-sheet', 'mobile'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref } from 'vue';

const BottomSheetModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const expanded = ref(false);
      const title = ref('Quick Actions');
      const items = ref([
        { icon: '\\u{1F4F7}', label: 'Take Photo' },
        { icon: '\\u{1F4C1}', label: 'Upload File' },
        { icon: '\\u{1F517}', label: 'Share Link' },
        { icon: '\\u{1F4CB}', label: 'Create Note' },
        { icon: '\\u{1F4CD}', label: 'Add Location' },
      ]);
      return { isOpen, expanded, title, items };
  },
  template: \`
    <div v-if="isOpen" class="sheet-wrapper">
    <div class="sheet-backdrop" @click="isOpen = false"></div>
    <div class="bottom-sheet" :class="{ expanded }">
      <div class="sheet-handle" @click="expanded = !expanded"></div>
      <div class="sheet-header">
        <h3>{{ title }}</h3>
        <span class="toggle-text">{{ expanded ? 'Collapse' : 'Expand' }}</span>
      </div>
      <div class="sheet-content">
        <div v-for="item in items" :key="item.label" class="sheet-item">
          <span class="item-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'bottom-sheet-modal',
  App: BottomSheetModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'cookie-consent',
    description: 'Cookie consent modal with category toggles and accept/reject buttons',
    tags: ['modal', 'cookie', 'consent'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, reactive } from 'vue';

const CookieConsentModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const categories = reactive([
        { name: 'Essential', desc: 'Required for basic functionality', enabled: true, required: true },
        { name: 'Analytics', desc: 'Help us improve with usage data', enabled: false, required: false },
        { name: 'Marketing', desc: 'Personalized ads and content', enabled: false, required: false },
        { name: 'Preferences', desc: 'Remember your settings', enabled: true, required: false },
      ]);
      const acceptAll = () => { categories.forEach(c => c.enabled = true); isOpen.value = false; };
      const rejectAll = () => { categories.forEach(c => { if (!c.required) c.enabled = false; }); isOpen.value = false; };
      const savePreferences = () => { isOpen.value = false; };
      return { isOpen, categories, acceptAll, rejectAll, savePreferences };
  },
  template: \`
    <div v-if="isOpen" class="cookie-banner">
    <div class="cookie-content">
      <h3>Cookie Preferences</h3>
      <p>We use cookies to improve your experience. Manage your preferences below.</p>
      <div class="cookie-categories">
        <div v-for="cat in categories" :key="cat.name" class="cookie-category">
          <div class="cat-info">
            <span class="cat-name">{{ cat.name }}</span>
            <span class="cat-desc">{{ cat.desc }}</span>
          </div>
          <button class="toggle" :class="{ on: cat.enabled, required: cat.required }"
                  @click="!cat.required && (cat.enabled = !cat.enabled)" :disabled="cat.required">
            <span class="knob"></span>
          </button>
        </div>
      </div>
      <div class="cookie-actions">
        <button class="btn-reject" @click="rejectAll">Reject All</button>
        <button class="btn-accept" @click="acceptAll">Accept All</button>
        <button class="btn-save" @click="savePreferences">Save Preferences</button>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'cookie-consent-modal',
  App: CookieConsentModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'search',
    description: 'Search modal with input, recent searches, and live results',
    tags: ['modal', 'search', 'spotlight'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const SearchModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const query = ref('');
      const recent = ['Dashboard', 'User settings', 'API docs'];
      const allItems = ['Dashboard', 'Analytics', 'User settings', 'API docs', 'Billing', 'Team management', 'Integrations', 'Notifications'];
      const filteredResults = computed(() =>
        allItems.filter(i => i.toLowerCase().includes(query.value.toLowerCase()))
      );
      return { isOpen, query, recent, filteredResults };
  },
  template: \`
    <div v-if="isOpen" class="search-overlay" @click.self="isOpen = false">
    <div class="search-dialog">
      <input type="text" v-model="query" placeholder="Search..." class="search-input" autofocus />
      <div v-if="!query" class="recent-section">
        <h4>Recent Searches</h4>
        <div v-for="item in recent" :key="item" class="search-item" @click="query = item">{{ item }}</div>
      </div>
      <div v-else class="results-section">
        <div v-for="result in filteredResults" :key="result" class="search-item" @click="isOpen = false">
          {{ result }}
        </div>
        <p v-if="!filteredResults.length" class="no-results">No results found</p>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'search-modal',
  App: SearchModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'command-palette',
    description: 'Command palette modal with keyboard shortcut hints and categorized actions',
    tags: ['modal', 'command-palette', 'keyboard'],
    code: `import { createVueMicroApp } from '@tuvix.js/vue';
import { defineComponent, ref, computed } from 'vue';

const CommandPaletteModal = defineComponent({
  setup() {
  const isOpen = ref(true);
      const query = ref('');
      const groups: CommandGroup[] = [
        { category: 'Navigation', commands: [
          { label: 'Go to Dashboard', shortcut: 'G D' },
          { label: 'Go to Settings', shortcut: 'G S' },
          { label: 'Go to Profile', shortcut: 'G P' },
        ]},
        { category: 'Actions', commands: [
          { label: 'Create New Project', shortcut: 'Ctrl+N' },
          { label: 'Search Files', shortcut: 'Ctrl+P' },
          { label: 'Toggle Dark Mode', shortcut: 'Ctrl+D' },
        ]},
      ];
      const filteredGroups = computed(() => {
        if (!query.value) return groups;
        return groups.map(g => ({
          ...g,
          commands: g.commands.filter(c => c.label.toLowerCase().includes(query.value.toLowerCase())),
        })).filter(g => g.commands.length > 0);
      });
      return { isOpen, query, filteredGroups };
  },
  template: \`
    <div v-if="isOpen" class="palette-overlay" @click.self="isOpen = false">
    <div class="palette-dialog">
      <input type="text" v-model="query" placeholder="Type a command..." class="palette-input" />
      <div class="palette-results">
        <div v-for="group in filteredGroups" :key="group.category" class="result-group">
          <div class="group-label">{{ group.category }}</div>
          <div v-for="cmd in group.commands" :key="cmd.label" class="result-item"
               @click="isOpen = false">
            <span class="cmd-label">{{ cmd.label }}</span>
            <span class="cmd-shortcut">{{ cmd.shortcut }}</span>
          </div>
        </div>
      </div>
      <div class="palette-footer">
        <span>Navigate with arrow keys</span>
        <span>Enter to select</span>
        <span>Esc to close</span>
      </div>
    </div>
  </div>
  \`,
});

const app = createVueMicroApp({
  name: 'command-palette-modal',
  App: CommandPaletteModal,
});

app.mount({ container: document.getElementById('app') as HTMLElement });`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
