import { useId } from 'react';

import styles from './RadioGroup.module.css';

export interface RadioOption<Value extends string> {
  value: Value;
  label: string;
  hint?: string | undefined;
}

interface RadioGroupProps<Value extends string> {
  legend: string;
  name: string;
  options: readonly RadioOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}

export function RadioGroup<Value extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: RadioGroupProps<Value>) {
  const id = useId();

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => {
          const inputId = `${id}-${option.value}`;
          const hintId = option.hint ? `${inputId}-hint` : undefined;

          return (
            <div key={option.value} className={styles.option}>
              <label className={styles.label}>
                <input
                  id={inputId}
                  className={styles.input}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={option.value === value}
                  aria-describedby={hintId}
                  onChange={() => {
                    onChange(option.value);
                  }}
                />
                {option.label}
              </label>
              {option.hint && (
                <p id={hintId} className={styles.hint}>
                  {option.hint}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
