<script setup lang="ts">
import { withBase } from 'vitepress';
import { isExternal, type HomeFooter } from './model';

defineProps<{
  footer: HomeFooter;
  logo: { src: string; alt: string };
  siteTitle: string;
}>();
</script>

<template>
  <footer :class="$style.footer">
    <div :class="$style.inner">
      <div :class="$style.top">
        <div :class="$style.brand">
          <span :class="$style.brandRow">
            <img :src="withBase(logo.src)" alt="" width="28" height="28" />
            <span :class="$style.brandName">{{ siteTitle }}</span>
          </span>
          <p v-if="footer.tagline" :class="$style.tagline">
            {{ footer.tagline }}
          </p>
        </div>

        <nav
          v-for="column in footer.columns"
          :key="column.title"
          :class="$style.column"
          :aria-label="column.title"
        >
          <h2 :class="$style.columnTitle">
            {{ column.title }}
          </h2>
          <ul>
            <li v-for="item in column.links" :key="item.link">
              <a
                :href="isExternal(item.link) ? item.link : withBase(item.link)"
                :target="isExternal(item.link) ? '_blank' : undefined"
                :rel="isExternal(item.link) ? 'noreferrer' : undefined"
                >{{ item.text }}</a
              >
            </li>
          </ul>
        </nav>
      </div>

      <p v-if="footer.copyright" :class="$style.copyright">
        {{ footer.copyright }}
      </p>
    </div>
  </footer>
</template>

<style module lang="scss">
@use '../../styles/tokens' as *;

.footer {
  border-top: 1px solid var(--orbit-border);
  background: var(--orbit-surface-sunken);
}

.inner {
  @include container;
  padding-block: 56px 32px;
}

.top {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px 24px;

  @include up($bp-md) {
    grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr));
    gap: 40px;
  }
}

.brand {
  grid-column: 1 / -1;

  @include up($bp-md) {
    grid-column: auto;
  }
}

.brandRow {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  img {
    border-radius: 7px;
  }
}

.brandName {
  font-family: $font-heading;
  font-weight: 700;
  font-size: 17px;
  color: var(--orbit-text-1);
}

.tagline {
  max-width: 280px;
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--orbit-text-2);
}

.column {
  ul {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  a {
    font-size: 14px;
    color: var(--orbit-text-2);
    text-decoration: none;
    transition: color 0.2s;
    @include focus-ring(2px);

    &:hover {
      color: var(--orbit-accent-text);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
}

.columnTitle {
  margin: 0 0 14px;
  font-family: $font-heading;
  font-size: 14px;
  font-weight: 700;
  color: var(--orbit-text-1);
}

.copyright {
  margin: 48px 0 0;
  padding-top: 24px;
  border-top: 1px solid var(--orbit-border);
  font-size: 13px;
  color: var(--orbit-text-3);
}
</style>
