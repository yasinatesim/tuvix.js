import { TuvixIsland } from '@tuvix.js/react';
import { aboutVueCard } from '../content';
import { useIslandHtml } from '../island-html';
import { vueCard } from '../islands/vue-card';
import type { PageProps } from '../routes';
import styles from './Page.module.css';

export default function About({ hostRenders }: PageProps) {
  return (
    <>
      <section className={styles.intro}>
        <h1>About this demo</h1>
        <p>
          The host is a React 19 app served by Express and Vite. Each island is
          a Tuvix micro app that the host mounts with <code>TuvixIsland</code>.
        </p>
      </section>
      <div className={styles.grid}>
        <TuvixIsland
          name="vue-card"
          app={vueCard}
          props={{ ...aboutVueCard, hostRenders }}
          ssrHtml={useIslandHtml('vue-card')}
          className="island"
          fallback={
            <p className={styles.fallback}>The Vue card failed to load.</p>
          }
        />
      </div>
    </>
  );
}
