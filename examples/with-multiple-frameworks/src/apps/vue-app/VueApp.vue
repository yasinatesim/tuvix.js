<template>
  <div class="vue-card">
    <h2>🟩 Vue 3 Micro App</h2>
    <p>
      I'm a Vue 3 SFC (Single-File Component) wrapped in <code>createVueMicroApp</code>.
    </p>
    <p>Vue handles its own reactivity inside this container independently.</p>
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
