import { type ReactNode, type Ref, useId } from 'react';

import { cx } from '../../utils/cx';
import styles from './Notice.module.css';

interface NoticeProps {
  variant: 'success' | 'error';
  title: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

const ICONS = {
  success: <path d="M7 12.5l3.5 3.5L17 9" />,
  error: <path d="M12 7v6M12 17h.01" />,
};

export function Notice({ variant, title, children, ref }: NoticeProps) {
  const titleId = useId();

  return (
    <div ref={ref} tabIndex={-1} className={cx(styles.notice, styles[variant])}>
      <div role="alert" aria-labelledby={titleId} className={styles.inner}>
        <svg
          className={styles.icon}
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          {ICONS[variant]}
        </svg>
        <div className={styles.content}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
}
