<script setup lang="ts">
import { withBase } from 'vitepress';
import OrbitIcon from './OrbitIcon.vue';
import OrbitSectionHead from './OrbitSectionHead.vue';
import { isExternal, type HomePackage, type HomeSection } from './model';

defineProps<{ section: HomeSection<HomePackage> }>();
</script>

<template>
  <section :class="$style.section" aria-labelledby="orbit-packages-title">
    <div :class="$style.inner">
      <OrbitSectionHead
        id="orbit-packages-title"
        align="split"
        :title="section.title"
        :lead="section.lead"
      />
      <ul :class="$style.grid">
        <li v-for="pkg in section.items" :key="pkg.name" :class="$style.card">
          <a
            v-if="pkg.link"
            :href="isExternal(pkg.link) ? pkg.link : withBase(pkg.link)"
            :target="isExternal(pkg.link) ? '_blank' : undefined"
            :rel="isExternal(pkg.link) ? 'noreferrer' : undefined"
            :class="$style.name"
          >
            {{ pkg.name }}
            <OrbitIcon
              :name="isExternal(pkg.link) ? 'external' : 'arrow-right'"
              :size="14"
            />
          </a>
          <span v-else :class="$style.name">{{ pkg.name }}</span>
          <p :class="$style.details">
            {{ pkg.details }}
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style module lang="scss">
@use '../../styles/tokens' as *;

.section {
  padding: 72px 0;
  border-top: 1px solid var(--orbit-border);

  @include up($bp-md) {
    padding: 96px 0;
  }
}

.inner {
  @include container;
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;

  @include up($bp-sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include up($bp-lg) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
}

.card {
  @include card;
  position: relative;
  padding: 16px 18px;
  border-radius: $radius-md;
  transition:
    border-color 0.2s,
    background-color 0.2s;

  &:hover,
  &:focus-within {
    border-color: var(--orbit-accent-line);
    background: var(--orbit-surface-2);
  }
}

.name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: $font-mono;
  font-size: 14px;
  font-weight: 600;
  color: var(--orbit-text-1);
  text-decoration: none;

  svg {
    color: var(--orbit-text-3);
    transition:
      transform 0.2s $ease,
      color 0.2s;
  }

  &:is(a) {
    @include focus-ring(2px);

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
    }
  }

  .card:hover & svg,
  &:focus-visible svg {
    color: var(--orbit-accent-text);
    transform: translateX(3px);
  }
}

.details {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--orbit-text-2);
}
</style>
