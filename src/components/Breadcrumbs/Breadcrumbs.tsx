import { Link } from '../Link';
import styles from './Breadcrumbs.module.css';

export interface Crumb {
  title: string;
  path: string;
}

interface BreadcrumbsProps {
  /** The pages above this one, from the top down */
  trail: readonly Crumb[];
  /** This page's title */
  current: string;
}

/** Where the page sits, with a link to each page above it (WCAG 2.4.8) */
export function Breadcrumbs({ trail, current }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumbs" className={styles.breadcrumbs} data-print="hide">
      <ol className={styles.list}>
        {trail.map((crumb) => (
          <li key={crumb.path} className={styles.item}>
            <Link to={crumb.path}>{crumb.title}</Link>
            <svg
              className={styles.separator}
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 4 4 4-4 4" />
            </svg>
          </li>
        ))}
        <li className={styles.item}>
          <span aria-current="page">{current}</span>
        </li>
      </ol>
    </nav>
  );
}
