import type { ReactNode } from 'react';

import { type SpaceStep, gapClass } from '../../styles/gap';
import { cx } from '../../utils/cx';
import styles from './Stack.module.css';

interface StackProps {
  children: ReactNode;
  gap?: SpaceStep;
  as?: 'div' | 'section';
  className?: string | undefined;
  'aria-labelledby'?: string | undefined;
}

export function Stack({
  children,
  gap = 3,
  as: Element = 'div',
  className,
  'aria-labelledby': labelledBy,
}: StackProps) {
  return (
    <Element aria-labelledby={labelledBy} className={cx(styles.stack, gapClass(gap), className)}>
      {children}
    </Element>
  );
}
