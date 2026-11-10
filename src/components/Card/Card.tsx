import type { ReactNode } from 'react';

import { cx } from '../../utils/cx';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  as?: 'div' | 'article' | 'section' | 'li';
  className?: string | undefined;
}

export function Card({ children, as: Element = 'div', className }: CardProps) {
  return (
    <Element className={cx(styles.card, className)} data-print="keep-together">
      {children}
    </Element>
  );
}
