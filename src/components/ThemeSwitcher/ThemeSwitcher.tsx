import { useId } from 'react';

import { type DisplaySettings, SETTINGS } from '../../settings/displaySettings';
import { useDisplaySettings } from '../../settings/useDisplaySettings';
import { cx } from '../../utils/cx';
import { DISPLAY_SETTINGS_PATH } from '../../content/navigation';
import { Link } from '../Link';
import styles from './ThemeSwitcher.module.css';

interface ThemeSwitcherProps {
  layout?: 'inline' | 'stacked';
}

export function ThemeSwitcher({ layout = 'inline' }: ThemeSwitcherProps) {
  const { settings, update } = useDisplaySettings();
  const id = useId();

  return (
    <div className={cx(styles.switcher, styles[layout])} data-print="hide">
      <div className={styles.field}>
        <label htmlFor={id} className={styles.label}>
          Theme
        </label>
        <span className={styles.selectWrap}>
          <select
            id={id}
            className={styles.select}
            value={settings.theme}
            onChange={(event) => {
              update({ theme: event.target.value as DisplaySettings['theme'] });
            }}
          >
            {SETTINGS.theme.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className={styles.chevron}
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m4 6 4 4 4-4" />
          </svg>
        </span>
      </div>
      <Link to={DISPLAY_SETTINGS_PATH} className={styles.link}>
        More display settings
      </Link>
    </div>
  );
}
