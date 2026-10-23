<script setup lang="ts">
/**
 * Orbit home page. Replaces VitePress's VPHome for every `layout: home` page
 * (see the alias in .vitepress/config.mts) and keeps the VPHome slot names so
 * layout slot overrides still work.
 */
import { computed } from 'vue';
import { useData } from 'vitepress';
import OrbitFeatures from './OrbitFeatures.vue';
import OrbitFooter from './OrbitFooter.vue';
import OrbitFrameworks from './OrbitFrameworks.vue';
import OrbitHero from './OrbitHero.vue';
import OrbitPackages from './OrbitPackages.vue';
import OrbitShowcase from './OrbitShowcase.vue';
import { resolveHome } from './model';

const { frontmatter, theme, site } = useData();

const siteTitle = computed(() =>
  typeof theme.value.siteTitle === 'string'
    ? theme.value.siteTitle
    : site.value.title
);

const logoPath = computed(() => {
  const logo = theme.value.logo;
  if (typeof logo === 'string') return logo;
  if (logo && 'src' in logo) return logo.src;
  return undefined;
});

const home = computed(() =>
  resolveHome(frontmatter.value, {
    logo: logoPath.value,
    siteTitle: siteTitle.value,
  })
);
</script>

<template>
  <div class="VPHome" :class="$style.home">
    <div :class="$style.backdrop" aria-hidden="true" />
    <slot name="home-hero-before" />
    <OrbitHero :hero="home.hero" />
    <OrbitShowcase :showcase="home.showcase" />
    <slot name="home-hero-after" />

    <slot name="home-features-before" />
    <OrbitFeatures v-if="home.features.items.length" :section="home.features" />
    <slot name="home-features-after" />

    <OrbitFrameworks v-if="home.frameworks" :section="home.frameworks" />
    <OrbitPackages v-if="home.packages" :section="home.packages" />

    <div v-if="home.showMarkdown" class="vp-doc" :class="$style.content">
      <Content />
    </div>

    <OrbitFooter
      :footer="home.footer"
      :logo="home.hero.logo"
      :site-title="siteTitle"
    />
  </div>
</template>

<style module lang="scss">
@use '../../styles/tokens' as *;

.home {
  position: relative;
  isolation: isolate;
  // Run the backdrop under the transparent home nav.
  margin-top: calc(var(--vp-nav-height) * -1);
  padding-top: var(--vp-nav-height);
  overflow: hidden;
}

.backdrop {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: radial-gradient(var(--orbit-dot) 1px, transparent 1px);
  background-size: 24px 24px;

  &::before {
    content: '';
    position: absolute;
    top: -160px;
    left: 50%;
    width: min(960px, 100%);
    height: 560px;
    transform: translateX(-50%);
    background: radial-gradient(
      ellipse at center,
      var(--orbit-glow),
      transparent 70%
    );
  }
}

.content {
  @include container;

  > div:not(:empty) {
    padding-block: 72px;
    border-top: 1px solid var(--orbit-border);
  }
}
</style>
