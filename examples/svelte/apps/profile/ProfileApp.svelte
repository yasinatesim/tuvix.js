<script lang="ts">
  import { createEventBus } from 'tuvix.js';
  import { onMount, onDestroy } from 'svelte';

  // bus is passed in as a prop so it can be shared across apps loaded in the
  // same context (see main.ts for the module-level bus instance).
  export let bus = createEventBus();
  export let user: string = 'Guest';

  let loggedIn = false;
  let off: (() => void) | undefined;

  onMount(() => {
    off = bus.on('user:login', (data: { name: string }) => {
      loggedIn = true;
      console.log(`[profile] ${data.name} logged in`);
    });
  });

  onDestroy(() => off?.());
</script>

<div>
  <h1>Profile</h1>
  <p>Hello, {user}!</p>
  {#if loggedIn}
    <p>You are logged in.</p>
  {/if}
  <button on:click={() => bus.emit('user:login', { name: user })}>
    Simulate Login
  </button>
</div>
