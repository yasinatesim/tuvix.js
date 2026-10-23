// Like a framework adapter that loads its runtime with import(): `lib` is
// both a static import of the page and an import() target, so Rollup merges
// the two dynamic entries into one chunk with no manifest key of its own.
export const loadLib = () => import('./lib');
export const loadOther = () => import('./other');
