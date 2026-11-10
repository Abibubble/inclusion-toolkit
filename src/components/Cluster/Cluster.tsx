import type { ReactNode } from 'react';

import { type SpaceStep, gapClass } from '../../styles/gap';
import { cx } from '../../utils/cx';
import styles from './Cluster.module.css';

interface ClusterProps {
  children: ReactNode;
  gap?: SpaceStep;
  align?: 'start' | 'center' | 'baseline';
  justify?: 'start' | 'end' | 'spaceBetween';
  as?: 'div' | 'ul' | 'ol';
  className?: string | undefined;
  'aria-label'?: string | undefined;
}

export function Cluster({
  children,
  gap = 2,
  align = 'center',
  justify = 'start',
  as: Element = 'div',
  className,
  'aria-label': ariaLabel,
}: ClusterProps) {
  const isList = Element === 'ul' || Element === 'ol';

  return (
    // Lists keep their role, which Safari drops once list bullets are removed
    <Element
      role={isList ? 'list' : undefined}
      aria-label={ariaLabel}
      className={cx(
        styles.cluster,
        gapClass(gap),
        styles[`align-${align}`],
        styles[`justify-${justify}`],
        className,
      )}
    >
      {children}
    </Element>
  );
}
