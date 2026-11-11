import type { ReactNode } from 'react';

import styles from './TitleBand.module.css';

interface TitleBandProps {
  children: ReactNode;
}

/**
 * The band at the top of each page, under the header, with the page's breadcrumbs, heading and
 * introduction. Its background reaches the edges of the window, with a yellow line along the bottom
 */
export function TitleBand({ children }: TitleBandProps) {
  return <div className={styles.band}>{children}</div>;
}
