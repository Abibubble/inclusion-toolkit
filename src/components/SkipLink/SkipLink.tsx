import styles from './SkipLink.module.css';

export const MAIN_CONTENT_ID = 'main-content';

export function SkipLink() {
  return (
    <a className={styles.skipLink} href={`#${MAIN_CONTENT_ID}`} data-print="hide">
      Skip to main content
    </a>
  );
}
