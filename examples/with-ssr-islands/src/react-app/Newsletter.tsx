import { useState } from 'react';
import styles from './Newsletter.module.css';

export interface NewsletterProps {
  topic: string;
}

/**
 * A React micro app rendered inline with `TuvixReactApp`. It is part of the
 * host's React tree, so it server-renders and hydrates with the page.
 */
export function Newsletter({ topic }: NewsletterProps) {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <section className={styles.box}>
      <h2 className={styles.title}>React micro app: {topic}</h2>
      <p className={styles.text} data-testid="react-status">
        {subscribed
          ? 'Subscribed. See you next week.'
          : 'One email a week, no tracking pixels.'}
      </p>
      <button
        type="button"
        className={styles.button}
        data-testid="react-subscribe"
        onClick={() => setSubscribed(true)}
        disabled={subscribed}
      >
        Subscribe
      </button>
    </section>
  );
}
