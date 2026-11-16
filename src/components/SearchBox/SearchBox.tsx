import { type ReactNode, useId, useRef } from 'react';

import { Button } from '../Button';
import styles from './SearchBox.module.css';

interface SearchBoxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  status: string;
  children?: ReactNode;
}

export function SearchBox({ label, value, onChange, onFocus, status, children }: SearchBoxProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);

  return (
    <div role="search" className={styles.search}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.searchRow}>
        <input
          ref={input}
          id={id}
          type="search"
          className={styles.input}
          value={value}
          autoComplete="off"
          onFocus={onFocus}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
        {value !== '' && (
          <Button
            variant="secondary"
            onClick={() => {
              onChange('');
              input.current?.focus();
            }}
          >
            Clear search
          </Button>
        )}
      </div>
      <p role="status" className={styles.status}>
        {status}
      </p>
      {children}
    </div>
  );
}
