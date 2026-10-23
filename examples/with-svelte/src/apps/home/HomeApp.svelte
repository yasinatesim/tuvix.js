<script lang="ts">
  // The adapter passes the shell's props as component props.
  export let name = '';

  let count = 0;
</script>

<div class="home-card">
  <h2>Home App</h2>
  <p>This is a Svelte 4 Micro App mounted via <code>@tuvix.js/svelte</code>.</p>
  {#if name}
    <div class="prop-badge" data-testid="home-greeting">
      Hello, {name} (prop received from shell)
    </div>
  {/if}
  <button type="button" data-testid="home-counter" on:click={() => (count += 1)}>
    Clicked {count} times
  </button>
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
  button {
    display: block;
    margin-top: 16px;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
</style>
