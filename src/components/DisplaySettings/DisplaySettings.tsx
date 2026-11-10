import { useState } from 'react';

import { SETTINGS, SETTING_NAMES } from '../../settings/displaySettings';
import { useDisplaySettings } from '../../settings/useDisplaySettings';
import { Button } from '../Button';
import { RadioGroup } from '../RadioGroup';
import styles from './DisplaySettings.module.css';

/** Every display setting, with a reset button. It has a page of its own, under the page heading */
export function DisplaySettings() {
  const { settings, update, reset } = useDisplaySettings();
  const [announcement, setAnnouncement] = useState('');

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
        {SETTING_NAMES.map((name) => (
          <RadioGroup<string>
            key={name}
            legend={SETTINGS[name].legend}
            name={name}
            options={SETTINGS[name].options}
            value={settings[name]}
            onChange={(value) => {
              update({ [name]: value });
              setAnnouncement('');
            }}
          />
        ))}
        <div className={styles.reset}>
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              setAnnouncement('Display settings are back to their defaults.');
            }}
          >
            Reset to defaults
          </Button>
          <p role="status">{announcement}</p>
        </div>
      </div>
    </div>
  );
}
