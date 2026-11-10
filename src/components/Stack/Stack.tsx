import type { ReactNode } from 'react';

import { type SpaceStep, gapClass } from '../../styles/gap';
import { cx } from '../../utils/cx';
import styles from './Stack.module.css';

interface StackProps {
  children: ReactNode;
  gap?: SpaceStep;
  as?: 'div' | 'section' | 'article' | 'ul' | 'ol';
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
  const isList = Element === 'ul' || Element === 'ol';

  return (
    // Lists keep their role, which Safari drops once list bullets are removed
    <Element
      role={isList ? 'list' : undefined}
      aria-labelledby={labelledBy}
      className={cx(styles.stack, gapClass(gap), className)}
    >
      {children}
    </Element>
  );
}
