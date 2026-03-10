<script lang="ts">
  import { getContext } from 'svelte';
  
  // In Svelte 4, we use context to receive Tuvix props injected by the wrapper.
  const name = getContext('name');
</script>

<div class="home-card">
  <h2>🏠 Home App</h2>
  <p>This is a Svelte 4 Micro App mounted via <code>@tuvix.js/svelte</code>.</p>
  {#if name}
    <div class="prop-badge">
      Hello, {name} (prop received from shell)
    </div>
  {/if}
</div>

<style>
  .home-card {
    padding: 24px;
    background: #30475e;
    border-radius: 12px;
  }
  h2 { margin: 0 0 16px; color: #f05454; }
  p { color: #e0e0e0; margin-bottom: 16px; font-size: 14px; }
  .prop-badge {
    display: inline-block;
    padding: 8px 16px;
    background: rgba(0,0,0,0.3);
    border-radius: 6px;
    font-size: 14px;
    color: #a7f3d0;
  }
</style>
