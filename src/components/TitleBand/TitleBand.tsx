import type { ReactNode } from 'react';

import styles from './TitleBand.module.css';

interface TitleBandProps {
  children: ReactNode;
}

export function TitleBand({ children }: TitleBandProps) {
  return <div className={styles.band}>{children}</div>;
}
