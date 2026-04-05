import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'confirmation',
    description: 'Confirmation modal with confirm and cancel buttons',
    tags: ['modal', 'confirmation', 'dialog'],
    code: `<script>
  let open = false;
  let result = '';

  function showModal() { open = true; }
  function confirm() { result = 'Confirmed!'; open = false; }
  function cancel() { result = 'Cancelled.'; open = false; }
</script>

<button on:click={showModal} class="trigger-btn">Delete Item</button>
{#if result}<p class="result">{result}</p>{/if}

{#if open}
  <div class="overlay" on:click={cancel}>
    <div class="modal" on:click|stopPropagation>
      <h3>Confirm Delete</h3>
      <p>Are you sure you want to delete this item? This action cannot be undone.</p>
      <div class="actions">
        <button on:click={cancel} class="cancel-btn">Cancel</button>
        <button on:click={confirm} class="confirm-btn">Delete</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .trigger-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #ef4444; color: #fff; font-weight: 600; cursor: pointer; }
  .result { font-size: 14px; color: #374151; margin-top: 8px; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal { background: #fff; border-radius: 12px; padding: 28px; width: 400px; max-width: 90%; }
  .modal h3 { margin: 0 0 8px; font-size: 18px; }
  .modal p { margin: 0 0 20px; font-size: 14px; color: #6b7280; }
  .actions { display: flex; gap: 8px; justify-content: flex-end; }
  .cancel-btn { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
  .confirm-btn { padding: 8px 16px; border: none; border-radius: 6px; background-color: #ef4444; color: #fff; font-weight: 600; cursor: pointer; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import ConfirmModal from './ConfirmModal.svelte';
export default createSvelteMicroApp({ name: 'confirm-modal', App: ConfirmModal });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'form',
    description: 'Modal with an embedded form for user input',
    tags: ['modal', 'form', 'input'],
    code: `<script>
  let open = false;
  let name = '';
  let email = '';

  function showModal() { open = true; }
  function closeModal() { open = false; name = ''; email = ''; }
  function handleSubmit() { alert('Submitted: ' + name + ', ' + email); closeModal(); }
</script>

<button on:click={showModal} class="trigger-btn">Add Contact</button>

{#if open}
  <div class="overlay" on:click={closeModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="header">
        <h3>Add Contact</h3>
        <button on:click={closeModal} class="close-btn">\u2715</button>
      </div>
      <form on:submit|preventDefault={handleSubmit}>
        <label class="field"><span>Name</span><input type="text" bind:value={name} /></label>
        <label class="field"><span>Email</span><input type="email" bind:value={email} /></label>
        <div class="actions">
          <button type="button" on:click={closeModal} class="cancel-btn">Cancel</button>
          <button type="submit" class="submit-btn">Save</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .trigger-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal { background: #fff; border-radius: 12px; padding: 28px; width: 440px; max-width: 90%; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .header h3 { margin: 0; font-size: 18px; }
  .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
  .field span { font-size: 14px; font-weight: 500; }
  .field input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; }
  .actions { display: flex; gap: 8px; justify-content: flex-end; }
  .cancel-btn { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
  .submit-btn { padding: 8px 16px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import FormModal from './FormModal.svelte';
export default createSvelteMicroApp({ name: 'form-modal', App: FormModal });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'lightbox',
    description: 'Lightbox modal for displaying images full-screen',
    tags: ['modal', 'lightbox', 'image'],
    code: `<script>
  let open = false;
  let currentImage = 'A';

  function openLightbox(img) { currentImage = img; open = true; }
  function closeLightbox() { open = false; }
</script>

<div class="gallery">
  {#each ['A', 'B', 'C'] as img}
    <div class="thumb" on:click={() => openLightbox(img)}>{img}</div>
  {/each}
</div>

{#if open}
  <div class="lightbox" on:click={closeLightbox}>
    <button class="close-btn">\u2715</button>
    <div class="image-display" on:click|stopPropagation>{currentImage}</div>
  </div>
{/if}

<style>
  .gallery { display: flex; gap: 12px; }
  .thumb { width: 120px; height: 90px; background-color: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #6b7280; cursor: pointer; }
  .thumb:hover { background-color: #d1d5db; }
  .lightbox { position: fixed; inset: 0; background-color: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .close-btn { position: absolute; top: 20px; right: 20px; background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
  .image-display { width: 600px; height: 400px; background-color: #374151; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 64px; color: #fff; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import LightboxModal from './LightboxModal.svelte';
export default createSvelteMicroApp({ name: 'lightbox-modal', App: LightboxModal });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'video',
    description: 'Video modal with play/pause controls and close button',
    tags: ['modal', 'video', 'media'],
    code: `<script>
  let open = false;
  let playing = false;

  function openModal() { open = true; playing = true; }
  function closeModal() { open = false; playing = false; }
  function togglePlay() { playing = !playing; }
</script>

<button on:click={openModal} class="trigger-btn">\u25B6 Watch Video</button>

{#if open}
  <div class="overlay" on:click={closeModal}>
    <div class="modal" on:click|stopPropagation>
      <button on:click={closeModal} class="close-btn">\u2715</button>
      <div class="video-area">
        <span class="play-icon" on:click={togglePlay}>{playing ? '\u23F8' : '\u25B6'}</span>
      </div>
      <div class="info">
        <h3>Product Demo</h3>
        <p>Watch how micro-frontends work in practice.</p>
      </div>
    </div>
  </div>
{/if}

<style>
  .trigger-btn { padding: 10px 24px; border: none; border-radius: 8px; background-color: #111827; color: #fff; font-weight: 600; cursor: pointer; font-size: 16px; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal { background: #111827; border-radius: 12px; overflow: hidden; width: 640px; max-width: 90%; }
  .close-btn { position: absolute; top: 12px; right: 12px; background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; z-index: 10; }
  .video-area { height: 360px; background-color: #000; display: flex; align-items: center; justify-content: center; position: relative; }
  .play-icon { font-size: 48px; color: #fff; cursor: pointer; }
  .info { padding: 16px 20px; }
  .info h3 { margin: 0 0 4px; color: #fff; font-size: 16px; }
  .info p { margin: 0; color: #9ca3af; font-size: 14px; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import VideoModal from './VideoModal.svelte';
export default createSvelteMicroApp({ name: 'video-modal', App: VideoModal });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'settings',
    description: 'Settings modal with tabs for different preference categories',
    tags: ['modal', 'settings', 'tabs'],
    code: `<script>
  let open = false;
  let activeTab = 'general';
  let tabs = ['general', 'notifications', 'privacy'];
  let darkMode = false;

  function openModal() { open = true; }
  function closeModal() { open = false; }
</script>

<button on:click={openModal} class="trigger-btn">\u2699 Settings</button>

{#if open}
  <div class="overlay" on:click={closeModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="header">
        <h3>Settings</h3>
        <button on:click={closeModal} class="close-btn">\u2715</button>
      </div>
      <div class="tabs">
        {#each tabs as tab}
          <button class="tab" class:active={activeTab === tab} on:click={() => activeTab = tab}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        {/each}
      </div>
      <div class="body">
        {#if activeTab === 'general'}
          <label class="toggle"><input type="checkbox" bind:checked={darkMode} /> Dark Mode</label>
        {:else if activeTab === 'notifications'}
          <p>Notification preferences content here.</p>
        {:else}
          <p>Privacy settings content here.</p>
        {/if}
      </div>
      <div class="footer-actions">
        <button on:click={closeModal} class="save-btn">Save Changes</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .trigger-btn { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal { background: #fff; border-radius: 12px; width: 520px; max-width: 90%; }
  .header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 0; }
  .header h3 { margin: 0; font-size: 18px; }
  .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
  .tabs { display: flex; gap: 0; padding: 16px 24px 0; border-bottom: 1px solid #e5e7eb; }
  .tab { padding: 8px 16px; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: 14px; color: #6b7280; }
  .tab.active { border-bottom-color: #6366f1; color: #6366f1; font-weight: 600; }
  .body { padding: 24px; min-height: 120px; }
  .body p { margin: 0; color: #6b7280; font-size: 14px; }
  .toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; }
  .footer-actions { padding: 0 24px 20px; display: flex; justify-content: flex-end; }
  .save-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import SettingsModal from './SettingsModal.svelte';
export default createSvelteMicroApp({ name: 'settings-modal', App: SettingsModal });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'side-panel',
    description: 'Side panel modal that slides in from the right',
    tags: ['modal', 'side-panel', 'slide'],
    code: `<script>
  let open = false;

  function openPanel() { open = true; }
  function closePanel() { open = false; }
</script>

<button on:click={openPanel} class="trigger-btn">Open Panel</button>

{#if open}
  <div class="overlay" on:click={closePanel}>
    <aside class="panel" on:click|stopPropagation>
      <div class="header">
        <h3>Details</h3>
        <button on:click={closePanel} class="close-btn">\u2715</button>
      </div>
      <div class="body">
        <p>Side panel content. Use this for detail views, editing, or additional information.</p>
      </div>
    </aside>
  </div>
{/if}

<style>
  .trigger-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.3); display: flex; justify-content: flex-end; z-index: 100; }
  .panel { width: 400px; max-width: 90%; height: 100%; background: #fff; box-shadow: -4px 0 20px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
  .header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
  .header h3 { margin: 0; font-size: 18px; }
  .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; }
  .body { flex: 1; padding: 24px; overflow-y: auto; }
  .body p { font-size: 14px; color: #6b7280; line-height: 1.6; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import SidePanelModal from './SidePanelModal.svelte';
export default createSvelteMicroApp({ name: 'side-panel-modal', App: SidePanelModal });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'image-gallery',
    description: 'Image gallery modal with next/previous navigation',
    tags: ['modal', 'gallery', 'navigation'],
    code: `<script>
  let open = false;
  let images = ['Image A', 'Image B', 'Image C', 'Image D'];
  let currentIndex = 0;

  function openGallery(index) { currentIndex = index; open = true; }
  function closeGallery() { open = false; }
  function next() { currentIndex = (currentIndex + 1) % images.length; }
  function prev() { currentIndex = (currentIndex - 1 + images.length) % images.length; }
</script>

<div class="thumbnails">
  {#each images as img, i}
    <div class="thumb" on:click={() => openGallery(i)}>{img}</div>
  {/each}
</div>

{#if open}
  <div class="gallery-overlay" on:click={closeGallery}>
    <button class="nav-btn prev" on:click|stopPropagation={prev}>\u25C0</button>
    <div class="image-display" on:click|stopPropagation>
      <div class="counter">{currentIndex + 1} / {images.length}</div>
      <div class="image">{images[currentIndex]}</div>
    </div>
    <button class="nav-btn next" on:click|stopPropagation={next}>\u25B6</button>
    <button class="close-btn" on:click={closeGallery}>\u2715</button>
  </div>
{/if}

<style>
  .thumbnails { display: flex; gap: 8px; }
  .thumb { width: 100px; height: 80px; background-color: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; color: #6b7280; }
  .gallery-overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .nav-btn { background: none; border: none; color: #fff; font-size: 32px; cursor: pointer; padding: 20px; }
  .image-display { text-align: center; }
  .counter { color: #9ca3af; font-size: 14px; margin-bottom: 12px; }
  .image { width: 500px; height: 350px; background-color: #374151; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #fff; }
  .close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import GalleryModal from './GalleryModal.svelte';
export default createSvelteMicroApp({ name: 'gallery-modal', App: GalleryModal });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'terms',
    description: 'Terms and conditions modal with scrollable content',
    tags: ['modal', 'terms', 'legal'],
    code: `<script>
  let open = false;
  let accepted = false;

  function openTerms() { open = true; }
  function accept() { accepted = true; open = false; }
  function decline() { open = false; }
</script>

<div>
  <button on:click={openTerms} class="trigger-btn">View Terms</button>
  {#if accepted}<span class="status">\u2713 Accepted</span>{/if}
</div>

{#if open}
  <div class="overlay" on:click={decline}>
    <div class="modal" on:click|stopPropagation>
      <h3>Terms & Conditions</h3>
      <div class="scroll-area">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.</p>
      </div>
      <div class="actions">
        <button on:click={decline} class="decline-btn">Decline</button>
        <button on:click={accept} class="accept-btn">I Accept</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .trigger-btn { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
  .status { margin-left: 8px; color: #16a34a; font-size: 14px; font-weight: 500; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal { background: #fff; border-radius: 12px; padding: 24px; width: 500px; max-width: 90%; }
  .modal h3 { margin: 0 0 16px; font-size: 18px; }
  .scroll-area { max-height: 300px; overflow-y: auto; margin-bottom: 20px; padding-right: 8px; }
  .scroll-area p { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 12px; }
  .actions { display: flex; gap: 8px; justify-content: flex-end; }
  .decline-btn { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
  .accept-btn { padding: 8px 16px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import TermsModal from './TermsModal.svelte';
export default createSvelteMicroApp({ name: 'terms-modal', App: TermsModal });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'alert',
    description: 'Alert modal with icon and single action button',
    tags: ['modal', 'alert', 'warning'],
    code: `<script>
  let open = false;

  function showAlert() { open = true; }
  function closeAlert() { open = false; }
</script>

<button on:click={showAlert} class="trigger-btn">Show Alert</button>

{#if open}
  <div class="overlay" on:click={closeAlert}>
    <div class="modal" on:click|stopPropagation>
      <div class="icon">\u26A0</div>
      <h3>Warning</h3>
      <p>Your session is about to expire. Please save your work before continuing.</p>
      <button on:click={closeAlert} class="ok-btn">Got it</button>
    </div>
  </div>
{/if}

<style>
  .trigger-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #f59e0b; color: #fff; font-weight: 600; cursor: pointer; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal { background: #fff; border-radius: 12px; padding: 32px; width: 360px; text-align: center; }
  .icon { font-size: 40px; margin-bottom: 12px; }
  .modal h3 { margin: 0 0 8px; font-size: 18px; }
  .modal p { margin: 0 0 20px; font-size: 14px; color: #6b7280; }
  .ok-btn { padding: 10px 32px; border: none; border-radius: 6px; background-color: #f59e0b; color: #fff; font-weight: 600; cursor: pointer; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import AlertModal from './AlertModal.svelte';
export default createSvelteMicroApp({ name: 'alert-modal', App: AlertModal });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'fullscreen',
    description: 'Fullscreen modal that covers the entire viewport',
    tags: ['modal', 'fullscreen', 'overlay'],
    code: `<script>
  let open = false;

  function openFullscreen() { open = true; }
  function closeFullscreen() { open = false; }
</script>

<button on:click={openFullscreen} class="trigger-btn">Open Fullscreen</button>

{#if open}
  <div class="fullscreen-modal">
    <header class="modal-header">
      <h3>Fullscreen View</h3>
      <button on:click={closeFullscreen} class="close-btn">\u2715 Close</button>
    </header>
    <main class="modal-body">
      <p>This content takes up the entire screen. Ideal for detailed views, editors, or immersive experiences.</p>
    </main>
  </div>
{/if}

<style>
  .trigger-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .fullscreen-modal { position: fixed; inset: 0; background: #fff; z-index: 100; display: flex; flex-direction: column; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
  .modal-header h3 { margin: 0; font-size: 18px; }
  .close-btn { background: none; border: none; font-size: 14px; cursor: pointer; color: #6b7280; }
  .modal-body { flex: 1; padding: 32px; overflow-y: auto; }
  .modal-body p { font-size: 16px; color: #374151; line-height: 1.6; max-width: 640px; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import FullscreenModal from './FullscreenModal.svelte';
export default createSvelteMicroApp({ name: 'fullscreen-modal', App: FullscreenModal });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'drawer',
    description: 'Drawer modal that slides up from the bottom',
    tags: ['modal', 'drawer', 'bottom'],
    code: `<script>
  let open = false;
  let options = ['Share', 'Copy Link', 'Download', 'Report'];

  function openDrawer() { open = true; }
  function closeDrawer() { open = false; }
  function selectOption(opt) { alert('Selected: ' + opt); closeDrawer(); }
</script>

<button on:click={openDrawer} class="trigger-btn">More Options</button>

{#if open}
  <div class="overlay" on:click={closeDrawer}>
    <div class="drawer" on:click|stopPropagation>
      <div class="handle"></div>
      {#each options as opt}
        <button class="option" on:click={() => selectOption(opt)}>{opt}</button>
      {/each}
      <button class="cancel-option" on:click={closeDrawer}>Cancel</button>
    </div>
  </div>
{/if}

<style>
  .trigger-btn { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.4); display: flex; align-items: flex-end; justify-content: center; z-index: 100; }
  .drawer { background: #fff; border-radius: 16px 16px 0 0; width: 100%; max-width: 480px; padding: 12px 16px 24px; }
  .handle { width: 40px; height: 4px; background-color: #d1d5db; border-radius: 2px; margin: 0 auto 16px; }
  .option { display: block; width: 100%; text-align: left; padding: 14px 16px; background: none; border: none; font-size: 16px; color: #374151; cursor: pointer; border-radius: 8px; }
  .option:hover { background-color: #f3f4f6; }
  .cancel-option { display: block; width: 100%; text-align: center; padding: 14px; background: none; border: none; font-size: 16px; color: #ef4444; font-weight: 600; cursor: pointer; margin-top: 8px; border-top: 1px solid #e5e7eb; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import DrawerModal from './DrawerModal.svelte';
export default createSvelteMicroApp({ name: 'drawer-modal', App: DrawerModal });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'bottom-sheet',
    description: 'Bottom sheet modal with drag handle and content',
    tags: ['modal', 'bottom-sheet', 'mobile'],
    code: `<script>
  let open = false;
  let items = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];

  function openSheet() { open = true; }
  function closeSheet() { open = false; }
</script>

<button on:click={openSheet} class="trigger-btn">Open Bottom Sheet</button>

{#if open}
  <div class="overlay" on:click={closeSheet}>
    <div class="sheet" on:click|stopPropagation>
      <div class="drag-handle"></div>
      <h3 class="sheet-title">Select an Option</h3>
      {#each items as item}
        <button class="sheet-item" on:click={() => { alert(item); closeSheet(); }}>{item}</button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .trigger-btn { padding: 10px 24px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.3); display: flex; align-items: flex-end; z-index: 100; }
  .sheet { width: 100%; background: #fff; border-radius: 16px 16px 0 0; padding: 12px 20px 32px; }
  .drag-handle { width: 36px; height: 4px; background-color: #d1d5db; border-radius: 2px; margin: 0 auto 16px; }
  .sheet-title { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
  .sheet-item { display: block; width: 100%; text-align: left; padding: 12px 12px; background: none; border: none; font-size: 15px; color: #374151; cursor: pointer; border-radius: 8px; }
  .sheet-item:hover { background-color: #f3f4f6; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import BottomSheet from './BottomSheet.svelte';
export default createSvelteMicroApp({ name: 'bottom-sheet', App: BottomSheet });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'cookie-consent',
    description: 'Cookie consent modal with accept/reject options',
    tags: ['modal', 'cookie', 'consent'],
    code: `<script>
  let visible = true;

  function acceptAll() { visible = false; }
  function rejectAll() { visible = false; }
</script>

{#if visible}
  <div class="cookie-banner">
    <div class="content">
      <h4>Cookie Preferences</h4>
      <p>We use cookies to improve your experience. You can accept all or customize your preferences.</p>
    </div>
    <div class="actions">
      <button on:click={rejectAll} class="reject-btn">Reject All</button>
      <button on:click={acceptAll} class="accept-btn">Accept All</button>
    </div>
  </div>
{/if}

<style>
  .cookie-banner { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #e5e7eb; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); z-index: 100; }
  .content h4 { margin: 0 0 4px; font-size: 15px; }
  .content p { margin: 0; font-size: 13px; color: #6b7280; max-width: 500px; }
  .actions { display: flex; gap: 8px; }
  .reject-btn { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; }
  .accept-btn { padding: 8px 16px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; font-size: 14px; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import CookieConsent from './CookieConsent.svelte';
export default createSvelteMicroApp({ name: 'cookie-consent', App: CookieConsent });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'search',
    description: 'Search modal with input, results, and keyboard navigation hints',
    tags: ['modal', 'search', 'command'],
    code: `<script>
  let open = false;
  let query = '';
  let allItems = ['Dashboard', 'Settings', 'Profile', 'Analytics', 'Users', 'Reports', 'Help'];

  $: results = query ? allItems.filter(item => item.toLowerCase().includes(query.toLowerCase())) : [];

  function openSearch() { open = true; query = ''; }
  function closeSearch() { open = false; }
  function selectResult(r) { alert('Navigate to: ' + r); closeSearch(); }
</script>

<button on:click={openSearch} class="trigger-btn">Search (Ctrl+K)</button>

{#if open}
  <div class="overlay" on:click={closeSearch}>
    <div class="search-modal" on:click|stopPropagation>
      <input type="text" bind:value={query} placeholder="Type to search..." class="search-input" />
      {#if results.length > 0}
        <ul class="results">
          {#each results as result}
            <li on:click={() => selectResult(result)}>{result}</li>
          {/each}
        </ul>
      {:else if query}
        <div class="no-results">No results for "{query}"</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .trigger-btn { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; color: #6b7280; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.4); display: flex; align-items: flex-start; justify-content: center; padding-top: 120px; z-index: 100; }
  .search-modal { background: #fff; border-radius: 12px; width: 520px; max-width: 90%; overflow: hidden; }
  .search-input { width: 100%; padding: 16px 20px; border: none; outline: none; font-size: 16px; border-bottom: 1px solid #e5e7eb; }
  .results { list-style: none; padding: 8px; margin: 0; }
  .results li { padding: 10px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; color: #374151; }
  .results li:hover { background-color: #f3f4f6; }
  .no-results { padding: 20px; text-align: center; color: #9ca3af; font-size: 14px; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import SearchModal from './SearchModal.svelte';
export default createSvelteMicroApp({ name: 'search-modal', App: SearchModal });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'command-palette',
    description: 'Command palette modal with grouped actions',
    tags: ['modal', 'command-palette', 'keyboard'],
    code: `<script>
  let open = false;
  let query = '';
  let groups = [
    { label: 'Navigation', commands: ['Go to Dashboard', 'Go to Settings', 'Go to Profile'] },
    { label: 'Actions', commands: ['Create Project', 'Invite Member', 'Export Data'] },
  ];

  $: filtered = groups.map(g => ({
    label: g.label,
    commands: g.commands.filter(c => c.toLowerCase().includes(query.toLowerCase()))
  })).filter(g => g.commands.length > 0);

  function openPalette() { open = true; query = ''; }
  function closePalette() { open = false; }
  function runCommand(cmd) { alert('Running: ' + cmd); closePalette(); }
</script>

<button on:click={openPalette} class="trigger-btn">\u2318K Command Palette</button>

{#if open}
  <div class="overlay" on:click={closePalette}>
    <div class="palette" on:click|stopPropagation>
      <input type="text" bind:value={query} placeholder="Type a command..." class="cmd-input" />
      <div class="results-area">
        {#each filtered as group}
          <div class="group-label">{group.label}</div>
          {#each group.commands as cmd}
            <button class="cmd-item" on:click={() => runCommand(cmd)}>{cmd}</button>
          {/each}
        {/each}
        {#if filtered.length === 0}
          <div class="no-results">No commands found</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .trigger-btn { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; }
  .overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: center; padding-top: 100px; z-index: 100; }
  .palette { background: #fff; border-radius: 12px; width: 520px; max-width: 90%; overflow: hidden; }
  .cmd-input { width: 100%; padding: 14px 20px; border: none; outline: none; font-size: 15px; border-bottom: 1px solid #e5e7eb; }
  .results-area { max-height: 320px; overflow-y: auto; padding: 8px; }
  .group-label { padding: 8px 12px 4px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; }
  .cmd-item { display: block; width: 100%; text-align: left; padding: 10px 12px; background: none; border: none; font-size: 14px; color: #374151; cursor: pointer; border-radius: 6px; }
  .cmd-item:hover { background-color: #ede9fe; color: #6366f1; }
  .no-results { padding: 20px; text-align: center; color: #9ca3af; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import CommandPalette from './CommandPalette.svelte';
export default createSvelteMicroApp({ name: 'command-palette', App: CommandPalette });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
];

export default templates;
