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
  /** See src/styles/print.css */
  'data-print-compact'?: 'hide' | undefined;
}

export function Stack({
  children,
  gap = 3,
  as: Element = 'div',
  className,
  'aria-labelledby': labelledBy,
  'data-print-compact': printCompact,
}: StackProps) {
  const isList = Element === 'ul' || Element === 'ol';

  return (
    // Lists keep their role, which Safari drops once list bullets are removed
    <Element
      role={isList ? 'list' : undefined}
      aria-labelledby={labelledBy}
      className={cx(styles.stack, gapClass(gap), className)}
      data-print-compact={printCompact}
    >
      {children}
    </Element>
  );
}
