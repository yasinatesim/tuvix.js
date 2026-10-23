import { TuvixIsland } from '@tuvix.js/react';
import { labContact, labSvelteCounter } from '../content';
import { useIslandHtml } from '../island-html';
import { angularContact } from '../islands/angular-contact';
import { svelteCounter } from '../islands/svelte-counter';
import type { PageProps } from '../routes';
import styles from './Page.module.css';

export default function Lab(_props: PageProps) {
  return (
    <>
      <section className={styles.intro}>
        <h1>Lab</h1>
        <p>
          An Angular 20 standalone component, rendered on the server without
          zone.js and re-rendered in the browser without zone.js.
        </p>
      </section>
      <div className={styles.grid}>
        <TuvixIsland
          name="angular-contact"
          app={angularContact}
          props={labContact}
          ssrHtml={useIslandHtml('angular-contact')}
          className="island"
          fallback={
            <p className={styles.fallback}>The contact form failed to load.</p>
          }
        />
        <TuvixIsland
          name="svelte-counter"
          app={svelteCounter}
          props={labSvelteCounter}
          ssrHtml={useIslandHtml('svelte-counter')}
          className="island"
          fallback={
            <p className={styles.fallback}>
              The Svelte counter failed to load.
            </p>
          }
        />
      </div>
    </>
  );
}
