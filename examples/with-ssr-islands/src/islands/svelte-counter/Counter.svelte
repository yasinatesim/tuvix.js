<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    label: string;
    start?: number;
    linkHref: string;
    linkLabel: string;
  }

  let { label, start = 0, linkHref, linkLabel }: Props = $props();

  // Initialised from props once; the counter owns the value afterwards.
  // svelte-ignore state_referenced_locally
  let count = $state(start);
  // `onMount` never runs on the server, so the server HTML says "pending".
  let entered = $state(false);

  onMount(() => {
    entered = true;
  });
</script>

<section class="counter" class:entered data-onmount={entered ? 'ran' : 'pending'}>
  <h2>{label}</h2>
  <p class="value" data-testid="svelte-count">{count}</p>
  <div class="row">
    <button type="button" data-testid="svelte-increment" onclick={() => (count += 1)}>
      Add one
    </button>
    <a href={linkHref} data-testid="svelte-link">{linkLabel}</a>
  </div>
</section>

<style>
  .counter {
    border: 2px solid rgb(255, 62, 0);
    border-radius: 12px;
    padding: 1.25rem;
    background: rgb(255, 245, 240);
    opacity: 0.6;
    transform: translateY(8px);
    transition:
      opacity 400ms ease-out,
      transform 400ms ease-out;
  }

  .counter.entered {
    opacity: 1;
    transform: none;
  }

  h2 {
    margin: 0 0 0.5rem;
    color: rgb(255, 62, 0);
    font-size: 1.25rem;
  }

  .value {
    margin: 0 0 1rem;
    font-size: 2rem;
    font-weight: 700;
  }

  .row {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  button {
    border: 0;
    border-radius: 999px;
    padding: 0.5rem 1rem;
    background: rgb(255, 62, 0);
    color: white;
    font: inherit;
    cursor: pointer;
  }

  a {
    color: rgb(255, 62, 0);
    font-weight: 600;
  }
</style>
