<script setup lang="ts">
import { withBase } from 'vitepress';
import CopyButton from './CopyButton.vue';
import OrbitSectionHead from './OrbitSectionHead.vue';
import { isExternal, type HomeModel } from './model';

defineProps<{ section: NonNullable<HomeModel['frameworks']> }>();

const PALETTE_KEYS: Record<string, true> = {
  react: true,
  vue: true,
  svelte: true,
  angular: true,
};

const tileColor = (color: string) =>
  PALETTE_KEYS[color] === true
    ? `var(--orbit-${color})`
    : 'var(--orbit-accent-text)';

/** Splits `npm i @tuvix.js/react` into the command and the package name. */
const splitInstall = (install: string): [string, string] => {
  const at = install.lastIndexOf(' ');
  return at === -1
    ? ['', install]
    : [install.slice(0, at), install.slice(at + 1)];
};
</script>

<template>
  <section :class="$style.section" aria-labelledby="orbit-frameworks-title">
    <div :class="$style.inner">
      <OrbitSectionHead
        id="orbit-frameworks-title"
        align="split"
        :eyebrow="section.eyebrow"
        :title="section.title"
        :lead="section.lead"
      />
      <ul :class="$style.grid">
        <li
          v-for="item in section.items"
          :key="item.name"
          :class="$style.card"
          :style="{ '--fw-color': tileColor(item.color) }"
        >
          <span :class="$style.mark" aria-hidden="true">{{ item.mark }}</span>
          <h3 :class="$style.name">
            <a
              v-if="item.link"
              :href="isExternal(item.link) ? item.link : withBase(item.link)"
              :class="$style.nameLink"
              >{{ item.name }}</a
            >
            <template v-else>
              {{ item.name }}
            </template>
          </h3>
          <p :class="$style.details">
            {{ item.details }}
          </p>
          <div :class="$style.install">
            <code>
              <span :class="$style.cmd">{{
                splitInstall(item.install)[0]
              }}</span>
              {{ splitInstall(item.install)[1] }}
            </code>
            <CopyButton
              :text="item.install"
              :label="`${section.copyLabel}: ${item.install}`"
              :copied-label="section.copiedLabel"
            />
          </div>
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
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;

  @include up($bp-sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include up($bp-lg) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.card {
  @include card;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px 18px;
  transition: border-color 0.2s;

  &:hover,
  &:focus-within {
    border-color: color-mix(in srgb, var(--fw-color) 55%, transparent);
  }
}

.mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-bottom: 16px;
  border: 1px solid color-mix(in srgb, var(--fw-color) 40%, transparent);
  border-radius: $radius-md;
  background: color-mix(in srgb, var(--fw-color) 12%, transparent);
  color: var(--fw-color);
  font-family: $font-mono;
  font-size: 13px;
  font-weight: 700;
}

.name {
  margin: 0 0 6px;
  font-family: $font-heading;
  font-size: 17px;
  font-weight: 700;
  color: var(--orbit-text-1);
}

.nameLink {
  color: inherit;
  text-decoration: none;
  @include focus-ring(2px);

  // Stretch the link over the card; the copy button sits above it.
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  &:hover {
    color: var(--fw-color);
  }
}

.details {
  flex: 1;
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--orbit-text-2);
}

.install {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 4px 4px 10px;
  border: 1px solid var(--orbit-border);
  border-radius: $radius-sm;
  background: var(--orbit-surface-sunken);

  code {
    min-width: 0;
    overflow-wrap: anywhere;
    padding: 0;
    background: none;
    color: var(--orbit-accent-text);
    @include mono-label;

    @include up($bp-lg) {
      font-size: 11px;
      letter-spacing: 0;
    }
  }
}

.cmd {
  color: var(--orbit-text-3);

  // Five columns leave too little room for one line: put the package name on its own line.
  @include up($bp-lg) {
    display: block;
  }
}
</style>
