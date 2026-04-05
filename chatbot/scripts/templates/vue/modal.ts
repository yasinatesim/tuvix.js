import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'confirmation',
    description: 'Confirmation dialog with title, message, and confirm/cancel buttons',
    tags: ['modal', 'confirmation', 'dialog'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ConfirmationModal = defineComponent({
  name: 'ConfirmationModal',
  setup() {
    const isOpen = ref(true);
    const title = ref('Confirm Action');
    const message = ref('Are you sure you want to proceed? This action cannot be undone.');
    const confirmText = ref('Confirm');
    const confirm = () => { isOpen.value = false; };
    const cancel = () => { isOpen.value = false; };
    return { isOpen, title, message, confirmText, confirm, cancel };
  },
});

export default createVueMicroApp({ name: 'confirmation-modal', App: ConfirmationModal });
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-dialog {
  background: #fff; border-radius: 12px; padding: 28px; width: 420px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}
.modal-title { font-size: 18px; font-weight: 700; margin: 0 0 12px; }
.modal-message { font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0 0 24px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
.btn-cancel {
  padding: 10px 20px; background: #f3f4f6; border: none;
  border-radius: 6px; cursor: pointer; font-weight: 500;
}
.btn-confirm {
  padding: 10px 20px; background: #ef4444; color: #fff; border: none;
  border-radius: 6px; cursor: pointer; font-weight: 600;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'form',
    description: 'Modal with embedded form for data input',
    tags: ['modal', 'form', 'input'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const FormModal = defineComponent({
  name: 'FormModal',
  setup() {
    const isOpen = ref(true);
    const form = reactive({ title: '', description: '', category: 'general' });
    const submitForm = () => { isOpen.value = false; };
    return { isOpen, form, submitForm };
  },
});

export default createVueMicroApp({ name: 'form-modal', App: FormModal });
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-dialog { background: #fff; border-radius: 12px; width: 480px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 { margin: 0; font-size: 18px; }
.close-btn { background: none; border: none; font-size: 22px; color: #6b7280; cursor: pointer; }
.modal-form { padding: 24px; }
.field { margin-bottom: 16px; }
.field label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; }
.field input, .field textarea, .field select {
  width: 100%; padding: 10px 12px; border: 1px solid #d1d5db;
  border-radius: 6px; font-size: 14px; box-sizing: border-box; font-family: inherit;
}
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.btn-cancel { padding: 10px 20px; background: #f3f4f6; border: none; border-radius: 6px; cursor: pointer; }
.btn-submit { padding: 10px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'lightbox',
    description: 'Image lightbox modal with navigation arrows and counter',
    tags: ['modal', 'lightbox', 'gallery'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const LightboxModal = defineComponent({
  name: 'LightboxModal',
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
});

export default createVueMicroApp({ name: 'lightbox-modal', App: LightboxModal });
</script>

<style scoped>
.lightbox-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.9);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.lightbox-content { max-width: 640px; width: 100%; }
.image-placeholder {
  height: 400px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 600; color: #374151;
}
.lightbox-info {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; color: #fff;
}
.nav-btn {
  background: none; border: none; color: #fff; font-size: 48px;
  cursor: pointer; padding: 0 20px; opacity: 0.7;
}
.nav-btn:hover { opacity: 1; }
.close-btn { background: none; border: none; color: #fff; font-size: 28px; cursor: pointer; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'video',
    description: 'Video player modal with play controls placeholder',
    tags: ['modal', 'video', 'player'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const VideoModal = defineComponent({
  name: 'VideoModal',
  setup() {
    const isOpen = ref(true);
    const playing = ref(false);
    const progress = ref(35);
    const title = ref('Product Demo Video');
    const currentTime = ref('1:23 / 3:45');
    return { isOpen, playing, progress, title, currentTime };
  },
});

export default createVueMicroApp({ name: 'video-modal', App: VideoModal });
</script>

<style scoped>
.video-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.video-dialog { width: 640px; position: relative; }
.close-btn {
  position: absolute; top: -40px; right: 0; background: none;
  border: none; color: #fff; font-size: 28px; cursor: pointer;
}
.video-player { border-radius: 8px; overflow: hidden; background: #000; }
.video-placeholder {
  height: 360px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; background: linear-gradient(135deg, #1e293b, #0f172a);
}
.play-btn { font-size: 48px; color: #fff; opacity: 0.8; }
.pause-indicator { color: #60a5fa; font-weight: 600; }
.video-controls {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  background: #111; color: #fff;
}
.video-controls button {
  background: #3b82f6; color: #fff; border: none; border-radius: 4px;
  padding: 4px 12px; font-size: 12px; cursor: pointer;
}
.progress-bar { flex: 1; height: 4px; background: #374151; border-radius: 2px; }
.progress-fill { height: 100%; background: #3b82f6; border-radius: 2px; }
.time { font-size: 12px; color: #9ca3af; }
.video-title { color: #fff; font-size: 16px; margin: 12px 0 0; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'settings',
    description: 'Settings modal with tabbed sections for different preference groups',
    tags: ['modal', 'settings', 'tabs'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SettingsModal = defineComponent({
  name: 'SettingsModal',
  setup() {
    const isOpen = ref(true);
    const activeTab = ref('General');
    const tabs = ['General', 'Notifications', 'Privacy', 'Appearance'];
    const toggles = reactive<Record<string, boolean>>({});
    return { isOpen, activeTab, tabs, toggles };
  },
});

export default createVueMicroApp({ name: 'settings-modal', App: SettingsModal });
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.settings-dialog {
  display: flex; width: 600px; height: 400px;
  background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}
.settings-sidebar {
  width: 180px; background: #f9fafb; border-right: 1px solid #e5e7eb; padding: 20px 0;
}
.settings-sidebar h3 { padding: 0 16px 12px; font-size: 16px; margin: 0; }
.settings-sidebar a {
  display: block; padding: 8px 16px; text-decoration: none;
  color: #6b7280; font-size: 14px;
}
.settings-sidebar a.active { color: #3b82f6; background: #eff6ff; font-weight: 600; }
.settings-content { flex: 1; padding: 24px; display: flex; flex-direction: column; }
.settings-content h4 { font-size: 18px; margin: 0 0 20px; }
.setting-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px;
}
.toggle {
  width: 44px; height: 24px; border-radius: 12px; background: #d1d5db;
  border: none; position: relative; cursor: pointer; transition: background 0.2s;
}
.toggle.on { background: #3b82f6; }
.knob {
  position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
  border-radius: 50%; background: #fff; transition: transform 0.2s;
}
.toggle.on .knob { transform: translateX(20px); }
.settings-actions { margin-top: auto; text-align: right; }
.btn-save {
  padding: 10px 24px; background: #3b82f6; color: #fff; border: none;
  border-radius: 6px; font-weight: 600; cursor: pointer;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'side-panel',
    description: 'Side panel modal that slides in from the right',
    tags: ['modal', 'side-panel', 'slide'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SidePanelModal = defineComponent({
  name: 'SidePanelModal',
  setup() {
    const isOpen = ref(true);
    const title = ref('Details');
    const items = ref(['Item 1 details', 'Item 2 details', 'Item 3 details', 'Item 4 details']);
    return { isOpen, title, items };
  },
});

export default createVueMicroApp({ name: 'side-panel-modal', App: SidePanelModal });
</script>

<style scoped>
.panel-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999;
}
.side-panel {
  position: fixed; top: 0; right: 0; width: 400px; height: 100vh;
  background: #fff; z-index: 1000; display: flex; flex-direction: column;
  box-shadow: -4px 0 16px rgba(0,0,0,0.1);
}
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid #e5e7eb;
}
.panel-header h3 { margin: 0; font-size: 18px; }
.close-btn { background: none; border: none; font-size: 24px; color: #6b7280; cursor: pointer; }
.panel-body { flex: 1; padding: 24px; overflow-y: auto; }
.panel-item {
  padding: 16px; background: #f9fafb; border-radius: 8px;
  margin-bottom: 12px; font-size: 14px;
}
.panel-footer { padding: 16px 24px; border-top: 1px solid #e5e7eb; }
.btn-action {
  width: 100%; padding: 12px; background: #3b82f6; color: #fff;
  border: none; border-radius: 6px; font-weight: 600; cursor: pointer;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'image-gallery',
    description: 'Image gallery modal with thumbnail grid and preview',
    tags: ['modal', 'gallery', 'images'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const ImageGalleryModal = defineComponent({
  name: 'ImageGalleryModal',
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
});

export default createVueMicroApp({ name: 'image-gallery-modal', App: ImageGalleryModal });
</script>

<style scoped>
.gallery-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.gallery-dialog { width: 560px; position: relative; }
.close-btn {
  position: absolute; top: -40px; right: 0; background: none;
  border: none; color: #fff; font-size: 28px; cursor: pointer;
}
.gallery-preview {
  height: 360px; border-radius: 8px; display: flex;
  align-items: center; justify-content: center;
  font-size: 24px; font-weight: 600; margin-bottom: 16px;
}
.gallery-thumbs { display: flex; gap: 8px; justify-content: center; }
.thumb {
  width: 60px; height: 60px; border-radius: 6px; cursor: pointer;
  border: 2px solid transparent; transition: border-color 0.2s;
}
.thumb.active { border-color: #fff; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'terms',
    description: 'Terms and conditions modal with scrollable content and accept button',
    tags: ['modal', 'terms', 'legal'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const TermsModal = defineComponent({
  name: 'TermsModal',
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
});

export default createVueMicroApp({ name: 'terms-modal', App: TermsModal });
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.terms-dialog {
  background: #fff; border-radius: 12px; width: 520px; max-height: 80vh;
  display: flex; flex-direction: column; box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}
.modal-title { padding: 20px 24px; margin: 0; font-size: 18px; border-bottom: 1px solid #e5e7eb; }
.terms-content {
  padding: 20px 24px; overflow-y: auto; flex: 1; max-height: 400px;
}
.terms-content p { font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 16px; }
.terms-footer {
  padding: 16px 24px; border-top: 1px solid #e5e7eb;
  display: flex; justify-content: space-between; align-items: center;
}
.accept-label { font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 8px; }
.btn-accept {
  padding: 10px 24px; background: #3b82f6; color: #fff; border: none;
  border-radius: 6px; font-weight: 600; cursor: pointer;
}
.btn-accept:disabled { opacity: 0.5; cursor: not-allowed; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'alert',
    description: 'Alert modal with icon, message, and single dismiss action',
    tags: ['modal', 'alert', 'warning'],
    code: `<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="isOpen = false">
    <div class="alert-dialog" :class="type">
      <div class="alert-icon">{{ typeIcon }}</div>
      <h3 class="alert-title">{{ title }}</h3>
      <p class="alert-message">{{ message }}</p>
      <button class="btn-dismiss" @click="isOpen = false">{{ dismissText }}</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const AlertModal = defineComponent({
  name: 'AlertModal',
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
});

export default createVueMicroApp({ name: 'alert-modal', App: AlertModal });
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.alert-dialog {
  background: #fff; border-radius: 12px; padding: 32px;
  width: 380px; text-align: center; box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}
.alert-icon {
  width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 16px;
  display: flex; align-items: center; justify-content: center; font-size: 28px;
}
.error .alert-icon { background: #fef2f2; color: #ef4444; }
.success .alert-icon { background: #f0fdf4; color: #10b981; }
.warning .alert-icon { background: #fffbeb; color: #f59e0b; }
.info .alert-icon { background: #eff6ff; color: #3b82f6; }
.alert-title { font-size: 18px; margin: 0 0 8px; }
.alert-message { font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0 0 24px; }
.btn-dismiss {
  padding: 10px 32px; background: #3b82f6; color: #fff; border: none;
  border-radius: 6px; font-weight: 600; cursor: pointer;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'fullscreen',
    description: 'Fullscreen modal with close button and centered content',
    tags: ['modal', 'fullscreen', 'immersive'],
    code: `<template>
  <div v-if="isOpen" class="fullscreen-modal">
    <button class="close-btn" @click="isOpen = false">&times;</button>
    <div class="modal-content">
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <button class="action-btn" @click="isOpen = false">Continue</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const FullscreenModal = defineComponent({
  name: 'FullscreenModal',
  setup() {
    const isOpen = ref(true);
    const title = ref('Welcome to the Experience');
    const description = ref('This fullscreen modal creates an immersive, focused experience for onboarding or showcasing content.');
    return { isOpen, title, description };
  },
});

export default createVueMicroApp({ name: 'fullscreen-modal', App: FullscreenModal });
</script>

<style scoped>
.fullscreen-modal {
  position: fixed; inset: 0; background: linear-gradient(135deg, #1e293b, #0f172a);
  z-index: 1000; display: flex; align-items: center; justify-content: center;
}
.close-btn {
  position: absolute; top: 20px; right: 24px; background: none;
  border: none; color: #fff; font-size: 32px; cursor: pointer; opacity: 0.7;
}
.close-btn:hover { opacity: 1; }
.modal-content { text-align: center; max-width: 600px; color: #fff; }
.modal-content h1 { font-size: 40px; margin: 0 0 16px; }
.modal-content p { font-size: 18px; opacity: 0.7; line-height: 1.6; margin: 0 0 32px; }
.action-btn {
  padding: 14px 40px; background: #3b82f6; color: #fff; border: none;
  border-radius: 8px; font-size: 18px; font-weight: 600; cursor: pointer;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'drawer',
    description: 'Bottom drawer modal that slides up with drag handle',
    tags: ['modal', 'drawer', 'bottom-sheet'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const DrawerModal = defineComponent({
  name: 'DrawerModal',
  setup() {
    const isOpen = ref(true);
    const title = ref('Choose an action');
    const options = ref(['Share', 'Copy Link', 'Save', 'Report', 'Cancel']);
    return { isOpen, title, options };
  },
});

export default createVueMicroApp({ name: 'drawer-modal', App: DrawerModal });
</script>

<style scoped>
.drawer-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999;
}
.drawer-panel {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #fff; border-radius: 16px 16px 0 0;
  z-index: 1000; padding: 12px 24px 24px;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
}
.drag-handle {
  width: 40px; height: 4px; background: #d1d5db; border-radius: 2px;
  margin: 0 auto 16px;
}
.drawer-title { font-size: 18px; margin: 0 0 16px; }
.drawer-option {
  padding: 14px 0; border-bottom: 1px solid #f3f4f6;
  font-size: 16px; color: #374151; cursor: pointer;
}
.drawer-option:hover { color: #3b82f6; }
.drawer-option:last-child { border-bottom: none; color: #ef4444; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'bottom-sheet',
    description: 'Bottom sheet modal with expandable content and snap points',
    tags: ['modal', 'bottom-sheet', 'mobile'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const BottomSheetModal = defineComponent({
  name: 'BottomSheetModal',
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
});

export default createVueMicroApp({ name: 'bottom-sheet-modal', App: BottomSheetModal });
</script>

<style scoped>
.sheet-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 999; }
.bottom-sheet {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #fff; border-radius: 16px 16px 0 0;
  z-index: 1000; max-height: 40vh; transition: max-height 0.3s;
  overflow: hidden;
}
.bottom-sheet.expanded { max-height: 80vh; }
.sheet-handle {
  width: 40px; height: 4px; background: #d1d5db; border-radius: 2px;
  margin: 12px auto 0; cursor: pointer;
}
.sheet-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px;
}
.sheet-header h3 { margin: 0; font-size: 18px; }
.toggle-text { font-size: 13px; color: #3b82f6; cursor: pointer; }
.sheet-content { padding: 0 24px 24px; overflow-y: auto; }
.sheet-item {
  display: flex; align-items: center; gap: 14px; padding: 14px 0;
  border-bottom: 1px solid #f3f4f6; font-size: 16px; cursor: pointer;
}
.sheet-item:hover { color: #3b82f6; }
.item-icon { font-size: 20px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'cookie-consent',
    description: 'Cookie consent modal with category toggles and accept/reject buttons',
    tags: ['modal', 'cookie', 'consent'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const CookieConsentModal = defineComponent({
  name: 'CookieConsentModal',
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
});

export default createVueMicroApp({ name: 'cookie-consent-modal', App: CookieConsentModal });
</script>

<style scoped>
.cookie-banner {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #fff; border-top: 1px solid #e5e7eb;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1); z-index: 1000;
}
.cookie-content { max-width: 720px; margin: 0 auto; padding: 24px 32px; }
.cookie-content h3 { font-size: 18px; margin: 0 0 8px; }
.cookie-content p { font-size: 14px; color: #6b7280; margin: 0 0 20px; }
.cookie-category {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid #f3f4f6;
}
.cat-name { display: block; font-weight: 600; font-size: 14px; }
.cat-desc { display: block; font-size: 12px; color: #9ca3af; }
.toggle {
  width: 44px; height: 24px; border-radius: 12px; background: #d1d5db;
  border: none; position: relative; cursor: pointer; transition: background 0.2s;
}
.toggle.on { background: #3b82f6; }
.toggle.required { opacity: 0.6; cursor: not-allowed; }
.knob {
  position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
  border-radius: 50%; background: #fff; transition: transform 0.2s;
}
.toggle.on .knob { transform: translateX(20px); }
.cookie-actions { display: flex; gap: 8px; margin-top: 20px; justify-content: flex-end; }
.btn-reject { padding: 10px 20px; background: #f3f4f6; border: none; border-radius: 6px; cursor: pointer; }
.btn-accept { padding: 10px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-save { padding: 10px 20px; background: #fff; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'search',
    description: 'Search modal with input, recent searches, and live results',
    tags: ['modal', 'search', 'spotlight'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

const SearchModal = defineComponent({
  name: 'SearchModal',
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
});

export default createVueMicroApp({ name: 'search-modal', App: SearchModal });
</script>

<style scoped>
.search-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 120px; z-index: 1000;
}
.search-dialog { width: 520px; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
.search-input {
  width: 100%; padding: 16px 20px; border: none; font-size: 16px;
  outline: none; border-bottom: 1px solid #e5e7eb; box-sizing: border-box;
}
.recent-section, .results-section { padding: 12px; max-height: 300px; overflow-y: auto; }
.recent-section h4 { font-size: 12px; color: #9ca3af; margin: 0 0 8px; padding: 0 8px; text-transform: uppercase; }
.search-item {
  padding: 10px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; color: #374151;
}
.search-item:hover { background: #f3f4f6; }
.no-results { text-align: center; color: #9ca3af; font-size: 14px; padding: 20px; }
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
  {
    variant: 'command-palette',
    description: 'Command palette modal with keyboard shortcut hints and categorized actions',
    tags: ['modal', 'command-palette', 'keyboard'],
    code: `<template>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { createVueMicroApp } from '@tuvix.js/vue';

interface Command { label: string; shortcut: string; }
interface CommandGroup { category: string; commands: Command[]; }

const CommandPaletteModal = defineComponent({
  name: 'CommandPaletteModal',
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
});

export default createVueMicroApp({ name: 'command-palette-modal', App: CommandPaletteModal });
</script>

<style scoped>
.palette-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 100px; z-index: 1000;
}
.palette-dialog {
  width: 560px; background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
}
.palette-input {
  width: 100%; padding: 16px 20px; border: none; font-size: 16px;
  outline: none; border-bottom: 1px solid #e5e7eb; box-sizing: border-box;
}
.palette-results { max-height: 320px; overflow-y: auto; }
.group-label {
  padding: 8px 20px; font-size: 11px; font-weight: 700; color: #9ca3af;
  text-transform: uppercase; background: #f9fafb;
}
.result-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 20px; cursor: pointer;
}
.result-item:hover { background: #eff6ff; }
.cmd-label { font-size: 14px; color: #374151; }
.cmd-shortcut {
  font-size: 12px; color: #9ca3af; background: #f3f4f6;
  padding: 2px 8px; border-radius: 4px; font-family: monospace;
}
.palette-footer {
  display: flex; gap: 16px; padding: 10px 20px;
  border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;
}
</style>`,
    dependencies: ['@tuvix.js/vue', '@tuvix.js/core'],
  },
];

export default templates;
