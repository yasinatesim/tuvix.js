<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  title: string;
  body: string;
  linkHref: string;
  linkLabel: string;
  /** Sent by the React host on every re-render through `app.update()`. */
  hostRenders?: number;
}>();

const likes = ref(0);
</script>

<template>
  <article class="card" data-tilt>
    <h2 class="title">{{ title }}</h2>
    <p class="body">{{ body }}</p>
    <p class="meta">
      Host renders seen:
      <output data-testid="vue-host-renders">{{ hostRenders ?? 0 }}</output>
    </p>
    <div class="actions">
      <button
        type="button"
        class="like"
        data-testid="vue-like"
        @click="likes++"
      >
        Likes: {{ likes }}
      </button>
      <a class="link" :href="linkHref" data-testid="vue-link">{{
        linkLabel
      }}</a>
    </div>
  </article>
</template>

<style scoped>
.card {
  border: 2px solid rgb(65, 184, 131);
  border-radius: 12px;
  padding: 1.25rem;
  background: rgb(240, 250, 245);
  transform: perspective(600px) rotateX(var(--tilt-x, 0deg))
    rotateY(var(--tilt-y, 0deg));
  transition: transform 120ms ease-out;
}

.title {
  margin: 0 0 0.5rem;
  color: rgb(53, 73, 94);
  font-size: 1.25rem;
}

.body {
  margin: 0 0 0.75rem;
}

.meta {
  margin: 0 0 1rem;
  font-size: 0.875rem;
}

.actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.like {
  border: 0;
  border-radius: 999px;
  padding: 0.5rem 1rem;
  background: rgb(65, 184, 131);
  color: white;
  font: inherit;
  cursor: pointer;
}

.link {
  color: rgb(53, 73, 94);
  font-weight: 600;
}
</style>
