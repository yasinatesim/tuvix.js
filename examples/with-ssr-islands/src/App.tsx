import { useEffect, useState } from 'react';
import { interceptLinks } from '@tuvix.js/router';
import { IslandHtmlContext } from './island-html';
import { findRoute, type PageComponent } from './routes';
import styles from './App.module.css';
import './styles/global.css';

export interface AppProps {
  path: string;
  Page: PageComponent;
  /** Server only: island HTML for the current page, keyed by island name. */
  islandHtml?: Record<string, string>;
}

const NO_ISLAND_HTML: Record<string, string> = {};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/lab', label: 'Lab' },
  { href: '/about', label: 'About' },
];

export function App({
  path: initialPath,
  Page: initialPage,
  islandHtml,
}: AppProps) {
  const [page, setPage] = useState({ path: initialPath, Page: initialPage });
  const [hostRenders, setHostRenders] = useState(0);

  useEffect(() => {
    let latest = 0;

    async function show(path: string, push: boolean): Promise<void> {
      const id = ++latest;
      const { default: Page } = await findRoute(path).load();
      // A newer navigation started while this page module was loading.
      if (id !== latest) return;
      if (push) history.pushState(null, '', path);
      setPage({ path, Page });
      if (push) window.scrollTo(0, 0);
    }

    // Links anywhere in the document, including inside the Vue, Svelte and
    // Angular islands, go through `show` instead of a full page load.
    const stop = interceptLinks({
      navigate: (path) => show(path, true),
      prefetch: (path) => void findRoute(path).load(),
    });
    const onPopState = (): void =>
      void show(location.pathname + location.search, false);
    window.addEventListener('popstate', onPopState);

    return () => {
      stop();
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  const { Page } = page;
  const pathname = page.path.split(/[?#]/)[0];

  return (
    <IslandHtmlContext.Provider value={islandHtml ?? NO_ISLAND_HTML}>
      <header className={styles.header}>
        <a href="/" className={styles.brand}>
          tuvix islands
        </a>
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={styles.navLink}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          className={styles.counter}
          data-testid="host-counter"
          onClick={() => setHostRenders((count) => count + 1)}
        >
          Re-render host ({hostRenders})
        </button>
      </header>
      <main className={styles.main}>
        <Page hostRenders={hostRenders} />
      </main>
    </IslandHtmlContext.Provider>
  );
}
