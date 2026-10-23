import type { PageProps } from '../routes';
import styles from './Page.module.css';

export default function NotFound(_props: PageProps) {
  return (
    <section className={styles.intro}>
      <h1>Page not found</h1>
      <p>
        <a href="/">Go to the home page</a>
      </p>
    </section>
  );
}
