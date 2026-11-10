import { cx } from '../../utils/cx';
import { Heading } from '../Heading';
import styles from './PageContents.module.css';

export interface PageSection {
  id: string;
  title: string;
}

interface PageContentsProps {
  sections: readonly PageSection[];
}

const HEADING_ID = 'page-contents';

/** Longer lists than this are shown in columns on wide screens, so they don't fill the screen */
const COLUMNS_FROM = 9;

export function PageContents({ sections }: PageContentsProps) {
  return (
    <nav aria-labelledby={HEADING_ID} className={styles.contents}>
      <Heading level={2} id={HEADING_ID} className={styles.heading}>
        On this page
      </Heading>
      <ul className={cx(styles.list, sections.length >= COLUMNS_FROM && styles.columns)}>
        {sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`}>{section.title}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
