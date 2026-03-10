<script lang="ts">
  import { getContext } from 'svelte';
  const theme = getContext('theme');
</script>

<div class="profile-card">
  <h2>👤 Profile App</h2>
  <p>Two separate Svelte apps instantiated independently within the same window.</p>
  <div class="prop-badge">
    Theme prop: {theme || 'default'}
  </div>
</div>

<style>
  .profile-card {
    padding: 24px;
    background: #222831;
    border-radius: 12px;
  }
  h2 { margin: 0 0 16px; color: #f2a365; }
  p { color: #aaa; margin-bottom: 16px; font-size: 14px; }
  .prop-badge {
    display: inline-block;
    padding: 8px 16px;
    background: rgba(255,255,255,0.1);
    border-radius: 6px;
    font-size: 14px;
  }
</style>
