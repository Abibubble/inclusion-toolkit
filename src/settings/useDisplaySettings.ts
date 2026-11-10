import { useSyncExternalStore } from 'react';

import { type DisplaySettings, displaySettingsStore } from './displaySettings';

export function useDisplaySettings(store = displaySettingsStore): {
  settings: DisplaySettings;
  update: (changes: Partial<DisplaySettings>) => void;
  reset: () => void;
} {
  const settings = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  return { settings, update: store.update, reset: store.reset };
}
