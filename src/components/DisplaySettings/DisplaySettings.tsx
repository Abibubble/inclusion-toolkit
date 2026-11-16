import { useEffect, useRef, useState } from 'react';

import { SETTINGS, SETTING_NAMES } from '../../settings/displaySettings';
import { useDisplaySettings } from '../../settings/useDisplaySettings';
import { Button } from '../Button';
import { RadioGroup } from '../RadioGroup';
import styles from './DisplaySettings.module.css';

/** Every display setting, with a reset button. It has a page of its own, under the page heading */
export function DisplaySettings() {
  const { settings, update, reset } = useDisplaySettings();
  // Each message gets a new number, so it goes into a new element, which screen readers announce
  // even when the words are the same as last time
  const [announcement, setAnnouncement] = useState({ message: '', count: 0 });
  const announceTimer = useRef<number>(undefined);

  /**
   * Empties the message first, then shows it in a new element, so pressing Reset again is announced
   * again (WCAG 4.1.3)
   */
  function announce(message: string) {
    window.clearTimeout(announceTimer.current);
    setAnnouncement(({ count }) => ({ message: '', count }));
    if (message) {
      announceTimer.current = window.setTimeout(() => {
        setAnnouncement(({ count }) => ({ message, count: count + 1 }));
      }, 100);
    }
  }

  useEffect(
    () => () => {
      window.clearTimeout(announceTimer.current);
    },
    [],
  );

  return (
    <div className={styles.section}>
      <p className={styles.withoutJavaScript}>
        Display settings need JavaScript, which isn’t running in your browser. You can still make
        text bigger or smaller using your browser’s zoom.
      </p>
      <div className={styles.controls}>
        <p>
          Changes apply straight away. They’re saved in this browser only, and never sent anywhere.
        </p>
        <div className={styles.settings}>
          {SETTING_NAMES.map((name) => (
            // A wrapper for the line between settings, as a line on the group itself would run
            // through its name
            <div key={name}>
              <RadioGroup<string>
                legend={SETTINGS[name].legend}
                name={name}
                options={SETTINGS[name].options}
                value={settings[name]}
                inline={SETTINGS[name].options.every((option) => !('hint' in option))}
                onChange={(value) => {
                  update({ [name]: value });
                  announce('');
                }}
              />
            </div>
          ))}
        </div>
        <div className={styles.reset}>
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              announce('Display settings are back to their defaults.');
            }}
          >
            Reset to defaults
          </Button>
          <p role="status">
            {announcement.message && <span key={announcement.count}>{announcement.message}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
