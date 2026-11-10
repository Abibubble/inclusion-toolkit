import type { ComponentPropsWithRef } from 'react';

import { cx } from '../../utils/cx';
import styles from './Button.module.css';

interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'disabled'> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', type = 'button', className, ...props }: ButtonProps) {
  return (
    <button type={type} className={cx(styles.button, styles[variant], className)} {...props} />
  );
}
