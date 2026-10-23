<script setup lang="ts">
import { useCssModule } from 'vue';

const styles = useCssModule();
</script>

<template>
  <section class="vue-island" :class="styles.panel">
    <h2 class="heading">Vue island</h2>
  </section>
</template>

<style scoped>
.heading {
  color: rgb(7, 8, 9);
}
</style>

<style module>
.panel {
  border: 2px solid rgb(11, 12, 13);
}
</style>
