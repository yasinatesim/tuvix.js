import { renderToString } from 'react-dom/server';
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { App } from './App';
import { findRoute } from './routes';
import { renderIslands } from './server/render-islands';

const CLIENT_ENTRY = 'src/entry-client.tsx';

const titles: Record<string, string> = {
  home: 'Home',
  lab: 'Lab',
  about: 'About',
  'not-found': 'Not found',
};

export interface RenderOptions {
  /** URL of the client entry script: the source path in dev, the hashed chunk in production. */
  clientEntryUrl: string;
}

export interface RenderResult {
  status: number;
  html: string;
}

/** Renders the full HTML document for `url` (path plus query). */
export async function render(
  url: string,
  { clientEntryUrl }: RenderOptions
): Promise<RenderResult> {
  const route = findRoute(url);

  const [{ default: Page }, islandHtml, assets] = await Promise.all([
    route.load(),
    renderIslands(route),
    // The stylesheets of the shell, the page and every island on it, so the
    // first paint is styled before any JavaScript runs.
    getAssets([CLIENT_ENTRY, route.entry]),
  ]);

  const appHtml = renderToString(
    <App path={url} Page={Page} islandHtml={islandHtml} />
  );

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${titles[route.id]} · tuvix islands</title>
    ${renderAssetTags(assets)}
  </head>
  <body>
    <div id="app">${appHtml}</div>
    <script type="module" src="${clientEntryUrl}"></script>
  </body>
</html>`;

  return { status: route.id === 'not-found' ? 404 : 200, html };
}
