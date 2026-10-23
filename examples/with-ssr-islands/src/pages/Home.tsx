import { TuvixIsland, TuvixReactApp } from '@tuvix.js/react';
import { homeSvelteCounter, homeVueCard } from '../content';
import { useIslandHtml } from '../island-html';
import { svelteCounter } from '../islands/svelte-counter';
import { ticker } from '../islands/ticker';
import { vueCard } from '../islands/vue-card';
import { Newsletter } from '../react-app/Newsletter';
import type { PageProps } from '../routes';
import styles from './Page.module.css';

export default function Home({ hostRenders }: PageProps) {
  return (
    <>
      <section className={styles.intro}>
        <h1>Islands in a React host</h1>
        <p>
          The server renders every island below. The browser hydrates each one
          with its own framework, and the React host never touches the islands'
          DOM again.
        </p>
      </section>
      <div className={styles.grid}>
        <TuvixIsland
          name="vue-card"
          app={vueCard}
          props={{ ...homeVueCard, hostRenders }}
          ssrHtml={useIslandHtml('vue-card')}
          className="island"
          fallback={
            <p className={styles.fallback}>The Vue card failed to load.</p>
          }
        />
        <TuvixIsland
          name="svelte-counter"
          app={svelteCounter}
          props={homeSvelteCounter}
          ssrHtml={useIslandHtml('svelte-counter')}
          className="island"
          fallback={
            <p className={styles.fallback}>
              The Svelte counter failed to load.
            </p>
          }
        />
        <TuvixReactApp
          name="newsletter"
          App={Newsletter}
          topic="micro frontends"
          fallback={
            <p className={styles.fallback}>
              The newsletter form failed to load.
            </p>
          }
        />
        <TuvixIsland
          name="ticker"
          app={ticker}
          ssrHtml={useIslandHtml('ticker')}
          className="island"
          fallback={
            <p className={styles.fallback} data-testid="ticker-fallback">
              Live prices are unavailable right now.
            </p>
          }
        />
      </div>
    </>
  );
}
