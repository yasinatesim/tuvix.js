<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { getGlobalBus } from '@tuvix.js/core';

const received = ref(0);

const stop = getGlobalBus().on<{ count: number }>(
  'react:clicked',
  ({ count }) => {
    received.value = count;
  }
);
onBeforeUnmount(stop);
</script>

<template>
  <div class="vue-card">
    <h2>Vue 3 Micro App</h2>
    <p>
      A Vue 3 single-file component wrapped in <code>createVueMicroApp</code>.
    </p>
    <p data-testid="vue-received">Clicks received from React: {{ received }}</p>
  </div>
</template>

<style scoped>
.vue-card {
  padding: 24px;
  background: #222831;
  border-radius: 12px;
}
h2 {
  margin: 0 0 16px;
  color: #42b883;
}
p {
  color: #aaa;
  line-height: 1.6;
}
</style>
