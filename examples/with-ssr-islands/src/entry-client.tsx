import { hydrateRoot } from 'react-dom/client';
import { App } from './App';
import { findRoute } from './routes';
import { startIslandRuntime } from './runtime/islands';

// Listen before hydration so no `tuvix:mounted` event is missed.
startIslandRuntime();

async function start(): Promise<void> {
  const path = location.pathname + location.search;
  // Load the page module first so the first client render matches the server HTML.
  const { default: Page } = await findRoute(path).load();
  hydrateRoot(document.getElementById('app')!, <App path={path} Page={Page} />);
}

void start();
