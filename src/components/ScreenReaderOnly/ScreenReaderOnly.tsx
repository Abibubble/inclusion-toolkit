import type { ReactNode } from 'react';

import styles from './ScreenReaderOnly.module.css';

interface ScreenReaderOnlyProps {
  children: ReactNode;
}

export function ScreenReaderOnly({ children }: ScreenReaderOnlyProps) {
  return <span className={styles.screenReaderOnly}>{children}</span>;
}
