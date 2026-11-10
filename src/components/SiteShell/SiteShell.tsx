import type { ReactNode } from 'react';

import { useFocusOnNavigation } from '../../hooks/useFocusOnNavigation';
import { Container } from '../Container';
import { SiteFooter } from '../SiteFooter';
import { SiteHeader } from '../SiteHeader';
import { MAIN_CONTENT_ID, SkipLink } from '../SkipLink';
import styles from './SiteShell.module.css';

interface SiteShellProps {
  children: ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  useFocusOnNavigation();

  return (
    <div className={styles.shell}>
      <SkipLink />
      <SiteHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main}>
        <Container>{children}</Container>
      </main>
      <SiteFooter />
    </div>
  );
}
