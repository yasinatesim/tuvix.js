// Client entry. Vite drops entry exports in app builds, so the lazy page has
// to be used for Rollup to keep it.
void import('./page').then(async (page) => {
  (globalThis as Record<string, unknown>).__mergedPage = page.page();
  await page.loadLib();
  await page.loadOther();
});
