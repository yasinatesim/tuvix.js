// Island props shared by the pages (client) and src/server/render-islands.ts
// (server). Both sides must render with the same props, or hydration
// mismatches.

export const homeVueCard = {
  title: 'Vue 3 single-file component',
  body: 'Scoped styles, a click counter, and a link the host router intercepts.',
  linkHref: '/lab',
  linkLabel: 'Open the lab',
};

export const homeSvelteCounter = {
  label: 'Svelte 5 counter',
  start: 3,
  linkHref: '/about',
  linkLabel: 'About this demo',
};

export const labContact = {
  heading: 'Write to the lab',
};

export const labSvelteCounter = {
  label: 'Svelte 5 counter on the lab page',
  start: 10,
  linkHref: '/',
  linkLabel: 'Back to home',
};

export const aboutVueCard = {
  title: 'The same Vue island on another page',
  body: 'This page renders the Vue component with different props.',
  linkHref: '/',
  linkLabel: 'Back to home',
};
