import type { ComponentTemplate } from '../../generate-dataset';

const templates: ComponentTemplate[] = [
  {
    variant: 'toast',
    description: 'Toast notification that auto-dismisses after a timeout',
    tags: ['notification', 'toast', 'auto-dismiss'],
    code: `<script>
  let toasts = [];
  let nextId = 1;

  function addToast() {
    let id = nextId++;
    toasts = [...toasts, { id, message: 'Action completed successfully!', type: 'success' }];
    setTimeout(() => { toasts = toasts.filter(t => t.id !== id); }, 3000);
  }

  function removeToast(id) {
    toasts = toasts.filter(t => t.id !== id);
  }
</script>

<button on:click={addToast} class="trigger-btn">Show Toast</button>

<div class="toast-container">
  {#each toasts as toast}
    <div class="toast">
      <span class="toast-icon">\u2713</span>
      <span class="toast-msg">{toast.message}</span>
      <button on:click={() => removeToast(toast.id)} class="close-btn">\u2715</button>
    </div>
  {/each}
</div>

<style>
  .trigger-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .toast-container { position: fixed; top: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 100; }
  .toast { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background-color: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 280px; }
  .toast-icon { color: #16a34a; font-size: 16px; }
  .toast-msg { flex: 1; font-size: 14px; color: #374151; }
  .close-btn { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 14px; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Toast from './Toast.svelte';
export default createSvelteMicroApp({ name: 'toast-notification', App: Toast });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'alert',
    description: 'Static alert notification with different severity levels',
    tags: ['notification', 'alert', 'severity'],
    code: `<script>
  let alerts = [
    { type: 'info', message: 'A new update is available.' },
    { type: 'success', message: 'Your changes have been saved.' },
    { type: 'warning', message: 'Your trial expires in 3 days.' },
    { type: 'error', message: 'Failed to load data. Please try again.' },
  ];

  function dismiss(index) {
    alerts = alerts.filter((_, i) => i !== index);
  }
</script>

<div class="alerts">
  {#each alerts as alert, i}
    <div class="alert {alert.type}">
      <span class="message">{alert.message}</span>
      <button on:click={() => dismiss(i)} class="dismiss-btn">\u2715</button>
    </div>
  {/each}
</div>

<style>
  .alerts { display: flex; flex-direction: column; gap: 8px; max-width: 500px; }
  .alert { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 8px; font-size: 14px; }
  .alert.info { background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .alert.success { background-color: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .alert.warning { background-color: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .alert.error { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .dismiss-btn { background: none; border: none; color: inherit; cursor: pointer; font-size: 14px; opacity: 0.6; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import AlertNotification from './AlertNotification.svelte';
export default createSvelteMicroApp({ name: 'alert-notification', App: AlertNotification });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'badge',
    description: 'Badge notification counter on icons and buttons',
    tags: ['notification', 'badge', 'counter'],
    code: `<script>
  let count = 5;

  function increment() { count += 1; }
  function decrement() { if (count > 0) count -= 1; }
  function reset() { count = 0; }
</script>

<div class="badge-demo">
  <div class="icon-wrapper">
    <span class="icon">\u{1F514}</span>
    {#if count > 0}
      <span class="badge">{count > 99 ? '99+' : count}</span>
    {/if}
  </div>
  <div class="controls">
    <button on:click={increment}>+1</button>
    <button on:click={decrement}>-1</button>
    <button on:click={reset}>Clear</button>
  </div>
</div>

<style>
  .badge-demo { display: flex; align-items: center; gap: 24px; padding: 16px; }
  .icon-wrapper { position: relative; font-size: 32px; }
  .badge { position: absolute; top: -6px; right: -10px; background-color: #ef4444; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 10px; min-width: 18px; text-align: center; }
  .controls { display: flex; gap: 8px; }
  .controls button { padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import BadgeNotification from './BadgeNotification.svelte';
export default createSvelteMicroApp({ name: 'badge-notification', App: BadgeNotification });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'banner',
    description: 'Full-width banner notification at the top of the page',
    tags: ['notification', 'banner', 'top'],
    code: `<script>
  let visible = true;
  let message = 'We are experiencing high traffic. Some features may be slower than usual.';

  function dismiss() { visible = false; }
</script>

{#if visible}
  <div class="banner">
    <span class="message">{message}</span>
    <button on:click={dismiss} class="dismiss-btn">\u2715</button>
  </div>
{/if}

<style>
  .banner { display: flex; align-items: center; justify-content: center; padding: 12px 24px; background-color: #fef3c7; color: #92400e; font-size: 14px; position: relative; }
  .message { text-align: center; flex: 1; }
  .dismiss-btn { position: absolute; right: 16px; background: none; border: none; color: #92400e; cursor: pointer; font-size: 16px; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import BannerNotification from './BannerNotification.svelte';
export default createSvelteMicroApp({ name: 'banner-notification', App: BannerNotification });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'snackbar',
    description: 'Snackbar notification at the bottom with action button',
    tags: ['notification', 'snackbar', 'action'],
    code: `<script>
  let visible = false;
  let message = '';

  function showSnackbar(msg) {
    message = msg;
    visible = true;
    setTimeout(() => { visible = false; }, 4000);
  }

  function undo() {
    visible = false;
    alert('Undo action performed!');
  }
</script>

<button on:click={() => showSnackbar('Item deleted.')} class="trigger-btn">Delete Item</button>

{#if visible}
  <div class="snackbar">
    <span>{message}</span>
    <button on:click={undo} class="action-btn">Undo</button>
  </div>
{/if}

<style>
  .trigger-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #ef4444; color: #fff; font-weight: 600; cursor: pointer; }
  .snackbar { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 16px; padding: 12px 20px; background-color: #1f2937; color: #fff; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 100; }
  .action-btn { background: none; border: none; color: #818cf8; font-weight: 600; cursor: pointer; font-size: 14px; text-transform: uppercase; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Snackbar from './Snackbar.svelte';
export default createSvelteMicroApp({ name: 'snackbar', App: Snackbar });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'progress-bar',
    description: 'Progress bar notification showing operation status',
    tags: ['notification', 'progress', 'loading'],
    code: `<script>
  let progress = 0;
  let running = false;

  function startProgress() {
    progress = 0;
    running = true;
    let interval = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        clearInterval(interval);
        running = false;
      }
    }, 200);
  }
</script>

<div class="progress-notification">
  <button on:click={startProgress} class="start-btn" disabled={running}>
    {running ? 'Uploading...' : 'Start Upload'}
  </button>
  {#if progress > 0}
    <div class="progress-container">
      <div class="progress-label">{progress}%</div>
      <div class="progress-track">
        <div class="progress-fill" style="width: {progress}%"></div>
      </div>
      {#if progress >= 100}
        <div class="complete-msg">\u2713 Upload complete!</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .progress-notification { max-width: 400px; }
  .start-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .start-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .progress-container { margin-top: 16px; }
  .progress-label { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px; }
  .progress-track { height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; background-color: #6366f1; border-radius: 4px; transition: width 0.2s; }
  .complete-msg { margin-top: 8px; font-size: 14px; color: #16a34a; font-weight: 500; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import ProgressBar from './ProgressBar.svelte';
export default createSvelteMicroApp({ name: 'progress-bar', App: ProgressBar });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'skeleton',
    description: 'Skeleton loading placeholder for content',
    tags: ['notification', 'skeleton', 'loading'],
    code: `<script>
  let loading = true;

  function toggleLoading() {
    loading = !loading;
  }
</script>

<button on:click={toggleLoading} class="toggle-btn">
  {loading ? 'Show Content' : 'Show Skeleton'}
</button>

<div class="card">
  {#if loading}
    <div class="skeleton-img"></div>
    <div class="skeleton-line wide"></div>
    <div class="skeleton-line medium"></div>
    <div class="skeleton-line short"></div>
  {:else}
    <div class="content-img">Image</div>
    <h3>Real Content Title</h3>
    <p>This is the actual loaded content replacing the skeleton.</p>
  {/if}
</div>

<style>
  .toggle-btn { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; margin-bottom: 16px; }
  .card { width: 300px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .skeleton-img { height: 120px; background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%); background-size: 200% 100%; border-radius: 8px; margin-bottom: 16px; animation: shimmer 1.5s infinite; }
  .skeleton-line { height: 14px; background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%); background-size: 200% 100%; border-radius: 4px; margin-bottom: 10px; animation: shimmer 1.5s infinite; }
  .skeleton-line.wide { width: 100%; }
  .skeleton-line.medium { width: 75%; }
  .skeleton-line.short { width: 50%; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .content-img { height: 120px; background-color: #ede9fe; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6366f1; font-weight: 700; margin-bottom: 12px; }
  h3 { margin: 0 0 8px; font-size: 16px; }
  p { margin: 0; font-size: 14px; color: #6b7280; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Skeleton from './Skeleton.svelte';
export default createSvelteMicroApp({ name: 'skeleton-loader', App: Skeleton });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'empty-state',
    description: 'Empty state notification when no data is available',
    tags: ['notification', 'empty-state', 'placeholder'],
    code: `<script>
  let items = [];

  function addItem() {
    items = [...items, 'Item ' + (items.length + 1)];
  }

  function clearAll() {
    items = [];
  }
</script>

<div class="container">
  {#if items.length === 0}
    <div class="empty-state">
      <div class="icon">\u{1F4ED}</div>
      <h3>No items yet</h3>
      <p>Get started by adding your first item.</p>
      <button on:click={addItem} class="action-btn">Add Item</button>
    </div>
  {:else}
    <div class="items-list">
      {#each items as item}
        <div class="item">{item}</div>
      {/each}
      <div class="actions-row">
        <button on:click={addItem} class="action-btn">Add More</button>
        <button on:click={clearAll} class="clear-btn">Clear All</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .container { max-width: 400px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; }
  .empty-state { text-align: center; }
  .icon { font-size: 48px; margin-bottom: 12px; }
  .empty-state h3 { margin: 0 0 8px; font-size: 18px; }
  .empty-state p { margin: 0 0 20px; font-size: 14px; color: #6b7280; }
  .action-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .items-list { display: flex; flex-direction: column; gap: 8px; }
  .item { padding: 12px; background-color: #f9fafb; border-radius: 6px; font-size: 14px; }
  .actions-row { display: flex; gap: 8px; margin-top: 12px; }
  .clear-btn { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import EmptyState from './EmptyState.svelte';
export default createSvelteMicroApp({ name: 'empty-state', App: EmptyState });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'error-boundary',
    description: 'Error boundary notification for displaying caught errors',
    tags: ['notification', 'error', 'boundary'],
    code: `<script>
  let hasError = false;
  let errorMessage = '';

  function triggerError() {
    hasError = true;
    errorMessage = 'Something went wrong while loading the component.';
  }

  function recover() {
    hasError = false;
    errorMessage = '';
  }
</script>

<div class="container">
  {#if hasError}
    <div class="error-boundary">
      <div class="error-icon">\u26A0</div>
      <h3>An error occurred</h3>
      <p>{errorMessage}</p>
      <button on:click={recover} class="retry-btn">Try Again</button>
    </div>
  {:else}
    <div class="content">
      <p>Normal content is rendered here.</p>
      <button on:click={triggerError} class="break-btn">Simulate Error</button>
    </div>
  {/if}
</div>

<style>
  .container { max-width: 400px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .error-boundary { text-align: center; padding: 40px 24px; background-color: #fef2f2; }
  .error-icon { font-size: 40px; margin-bottom: 12px; }
  .error-boundary h3 { margin: 0 0 8px; color: #dc2626; font-size: 18px; }
  .error-boundary p { margin: 0 0 20px; color: #6b7280; font-size: 14px; }
  .retry-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #dc2626; color: #fff; font-weight: 600; cursor: pointer; }
  .content { padding: 32px 24px; text-align: center; }
  .content p { margin: 0 0 16px; font-size: 14px; color: #374151; }
  .break-btn { padding: 8px 20px; border: 1px solid #fca5a5; border-radius: 6px; background: #fff; color: #dc2626; cursor: pointer; font-weight: 500; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import ErrorBoundary from './ErrorBoundary.svelte';
export default createSvelteMicroApp({ name: 'error-boundary', App: ErrorBoundary });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'spinner',
    description: 'Loading spinner notification with optional message',
    tags: ['notification', 'spinner', 'loading'],
    code: `<script>
  let loading = false;

  function startLoading() {
    loading = true;
    setTimeout(() => { loading = false; }, 3000);
  }
</script>

<button on:click={startLoading} class="load-btn" disabled={loading}>
  {loading ? 'Loading...' : 'Load Data'}
</button>

{#if loading}
  <div class="spinner-overlay">
    <div class="spinner"></div>
    <span class="spinner-text">Loading data...</span>
  </div>
{/if}

<style>
  .load-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .load-btn:disabled { opacity: 0.6; }
  .spinner-overlay { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 32px; }
  .spinner { width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner-text { font-size: 14px; color: #6b7280; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Spinner from './Spinner.svelte';
export default createSvelteMicroApp({ name: 'spinner', App: Spinner });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'countdown',
    description: 'Countdown notification with timer display',
    tags: ['notification', 'countdown', 'timer'],
    code: `<script>
  import { onMount, onDestroy } from 'svelte';

  let seconds = 60;
  let running = false;
  let interval;

  function start() {
    if (running) return;
    running = true;
    interval = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        clearInterval(interval);
        running = false;
        seconds = 0;
      }
    }, 1000);
  }

  function reset() {
    clearInterval(interval);
    running = false;
    seconds = 60;
  }

  onDestroy(() => { clearInterval(interval); });

  $: minutes = Math.floor(seconds / 60);
  $: secs = seconds % 60;
  $: display = String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
</script>

<div class="countdown">
  <div class="timer" class:urgent={seconds <= 10 && seconds > 0}>{display}</div>
  {#if seconds === 0}
    <div class="expired">Time expired!</div>
  {/if}
  <div class="controls">
    <button on:click={start} disabled={running || seconds === 0} class="start-btn">Start</button>
    <button on:click={reset} class="reset-btn">Reset</button>
  </div>
</div>

<style>
  .countdown { text-align: center; padding: 24px; }
  .timer { font-size: 48px; font-weight: 700; color: #111827; font-variant-numeric: tabular-nums; }
  .timer.urgent { color: #dc2626; }
  .expired { color: #dc2626; font-size: 16px; font-weight: 600; margin: 8px 0; }
  .controls { display: flex; gap: 8px; justify-content: center; margin-top: 16px; }
  .start-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .start-btn:disabled { opacity: 0.4; }
  .reset-btn { padding: 8px 20px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Countdown from './Countdown.svelte';
export default createSvelteMicroApp({ name: 'countdown', App: Countdown });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'status-chip',
    description: 'Status chip indicators for different states',
    tags: ['notification', 'status', 'chip'],
    code: `<script>
  let statuses = [
    { label: 'Online', type: 'success' },
    { label: 'Away', type: 'warning' },
    { label: 'Busy', type: 'error' },
    { label: 'Offline', type: 'neutral' },
  ];
  let current = 'Online';

  function setStatus(label) { current = label; }
</script>

<div class="status-container">
  <p class="current-label">Current: {current}</p>
  <div class="chips">
    {#each statuses as status}
      <button
        class="chip {status.type}"
        class:active={current === status.label}
        on:click={() => setStatus(status.label)}
      >
        <span class="dot"></span>
        {status.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .status-container { padding: 16px; }
  .current-label { margin: 0 0 12px; font-size: 14px; color: #374151; }
  .chips { display: flex; gap: 8px; }
  .chip { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid #e5e7eb; border-radius: 20px; background: #fff; cursor: pointer; font-size: 13px; font-weight: 500; }
  .chip.active { border-width: 2px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .chip.success .dot { background-color: #16a34a; }
  .chip.success.active { border-color: #16a34a; }
  .chip.warning .dot { background-color: #d97706; }
  .chip.warning.active { border-color: #d97706; }
  .chip.error .dot { background-color: #dc2626; }
  .chip.error.active { border-color: #dc2626; }
  .chip.neutral .dot { background-color: #9ca3af; }
  .chip.neutral.active { border-color: #9ca3af; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import StatusChip from './StatusChip.svelte';
export default createSvelteMicroApp({ name: 'status-chip', App: StatusChip });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'inline-alert',
    description: 'Inline alert message shown within form or content context',
    tags: ['notification', 'inline', 'alert'],
    code: `<script>
  let email = '';
  let error = '';
  let success = '';

  function validate() {
    error = '';
    success = '';
    if (!email) {
      error = 'Email is required.';
    } else if (!email.includes('@')) {
      error = 'Please enter a valid email address.';
    } else {
      success = 'Email is valid!';
    }
  }
</script>

<div class="form-context">
  <label class="field">
    <span>Email</span>
    <input type="text" bind:value={email} on:input={validate} placeholder="you@example.com" />
  </label>
  {#if error}
    <div class="inline-alert error">\u26A0 {error}</div>
  {/if}
  {#if success}
    <div class="inline-alert success">\u2713 {success}</div>
  {/if}
</div>

<style>
  .form-context { max-width: 400px; padding: 16px; }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .field span { font-size: 14px; font-weight: 500; color: #374151; }
  .field input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 14px; }
  .inline-alert { margin-top: 8px; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
  .inline-alert.error { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .inline-alert.success { background-color: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import InlineAlert from './InlineAlert.svelte';
export default createSvelteMicroApp({ name: 'inline-alert', App: InlineAlert });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'floating-notification',
    description: 'Floating notification bubble in the corner of the screen',
    tags: ['notification', 'floating', 'bubble'],
    code: `<script>
  let notifications = [];
  let nextId = 1;

  function addNotification() {
    let id = nextId++;
    let types = ['info', 'success', 'warning'];
    let messages = ['New message received', 'Upload complete', 'Low disk space'];
    let idx = id % 3;
    notifications = [...notifications, { id, type: types[idx], message: messages[idx] }];
  }

  function dismiss(id) {
    notifications = notifications.filter(n => n.id !== id);
  }
</script>

<button on:click={addNotification} class="trigger-btn">Add Notification</button>

<div class="float-container">
  {#each notifications as notif}
    <div class="float-notif {notif.type}">
      <span>{notif.message}</span>
      <button on:click={() => dismiss(notif.id)} class="dismiss">\u2715</button>
    </div>
  {/each}
</div>

<style>
  .trigger-btn { padding: 8px 20px; border: none; border-radius: 6px; background-color: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .float-container { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 100; }
  .float-notif { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; min-width: 260px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .float-notif.info { background-color: #eff6ff; color: #1d4ed8; }
  .float-notif.success { background-color: #f0fdf4; color: #16a34a; }
  .float-notif.warning { background-color: #fffbeb; color: #d97706; }
  .dismiss { background: none; border: none; color: inherit; cursor: pointer; font-size: 14px; opacity: 0.6; margin-left: auto; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import FloatingNotification from './FloatingNotification.svelte';
export default createSvelteMicroApp({ name: 'floating-notification', App: FloatingNotification });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
  {
    variant: 'announcement',
    description: 'Announcement notification with rich content and CTA',
    tags: ['notification', 'announcement', 'cta'],
    code: `<script>
  let dismissed = false;

  function dismiss() { dismissed = true; }
</script>

{#if !dismissed}
  <div class="announcement">
    <div class="content">
      <div class="icon">\u{1F389}</div>
      <div class="text">
        <h4>Version 3.0 Released!</h4>
        <p>Check out the new features including improved performance, better DX, and more micro-frontend patterns.</p>
      </div>
      <div class="actions">
        <a href="#changelog" class="learn-btn">Learn More</a>
        <button on:click={dismiss} class="dismiss-btn">Dismiss</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .announcement { padding: 16px 24px; background: linear-gradient(135deg, #ede9fe, #dbeafe); border-radius: 12px; }
  .content { display: flex; align-items: flex-start; gap: 16px; }
  .icon { font-size: 28px; }
  .text { flex: 1; }
  .text h4 { margin: 0 0 4px; font-size: 16px; color: #111827; }
  .text p { margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5; }
  .actions { display: flex; flex-direction: column; gap: 8px; }
  .learn-btn { padding: 8px 16px; background-color: #6366f1; color: #fff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; }
  .dismiss-btn { padding: 6px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; }
</style>

<!--
// main.ts — tuvix.js entry
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Announcement from './Announcement.svelte';
export default createSvelteMicroApp({ name: 'announcement', App: Announcement });
-->`,
    dependencies: ['@tuvix.js/svelte', '@tuvix.js/core'],
  },
];

export default templates;
