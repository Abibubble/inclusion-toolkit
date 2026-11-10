export const STORAGE_KEY = 'display-settings';

interface SettingOption<Value extends string> {
  value: Value;
  label: string;
  hint?: string;
}

export const SETTINGS = {
  theme: {
    legend: 'Theme',
    attribute: 'data-theme',
    default: 'system',
    options: [
      { value: 'system', label: 'Match my device' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      {
        value: 'cream',
        label: 'Cream',
        hint: 'A warm background, which some people find easier to read',
      },
    ],
  },
  textSize: {
    legend: 'Text size',
    attribute: 'data-text-size',
    default: 'default',
    options: [
      { value: 'default', label: 'Default' },
      { value: 'large', label: 'Large' },
      { value: 'larger', label: 'Larger' },
    ],
  },
  textSpacing: {
    legend: 'Text spacing',
    attribute: 'data-text-spacing',
    default: 'default',
    options: [
      { value: 'default', label: 'Default' },
      {
        value: 'increased',
        label: 'Increased',
        hint: 'More space between lines, words and letters',
      },
    ],
  },
  motion: {
    legend: 'Motion',
    attribute: 'data-motion',
    default: 'system',
    options: [
      { value: 'system', label: 'Match my device' },
      { value: 'reduce', label: 'Reduce motion', hint: 'Turns off all animation and transitions' },
    ],
  },
  font: {
    legend: 'Font',
    attribute: 'data-font',
    default: 'site',
    options: [
      {
        value: 'site',
        label: 'Atkinson Hyperlegible',
        hint: 'Designed to make letters easy to tell apart',
      },
      {
        value: 'system',
        label: 'My device’s font',
        hint: 'The font you’re used to on this device',
      },
    ],
  },
} as const satisfies Record<
  string,
  { legend: string; attribute: string; default: string; options: readonly SettingOption<string>[] }
>;

export type SettingName = keyof typeof SETTINGS;
export type DisplaySettings = {
  -readonly [Name in SettingName]: (typeof SETTINGS)[Name]['options'][number]['value'];
};

export const SETTING_NAMES = Object.keys(SETTINGS) as SettingName[];

export const DEFAULT_SETTINGS = Object.fromEntries(
  SETTING_NAMES.map((name) => [name, SETTINGS[name].default]),
) as DisplaySettings;

function isOption(name: SettingName, value: unknown): boolean {
  return SETTINGS[name].options.some((option) => option.value === value);
}

export function parseSettings(saved: string | null): DisplaySettings {
  let parsed: unknown;
  try {
    parsed = JSON.parse(saved ?? '{}');
  } catch {
    return { ...DEFAULT_SETTINGS };
  }

  const record = typeof parsed === 'object' && parsed !== null ? parsed : {};
  const settings = { ...DEFAULT_SETTINGS };
  for (const name of SETTING_NAMES) {
    const value: unknown = (record as Record<string, unknown>)[name];
    if (isOption(name, value)) {
      Object.assign(settings, { [name]: value });
    }
  }
  return settings;
}

export function applySettings(settings: DisplaySettings, root = document.documentElement): void {
  for (const name of SETTING_NAMES) {
    const { attribute, default: defaultValue } = SETTINGS[name];
    if (settings[name] === defaultValue) {
      root.removeAttribute(attribute);
    } else {
      root.setAttribute(attribute, settings[name]);
    }
  }
}

type Listener = () => void;

export interface DisplaySettingsStore {
  getSnapshot: () => DisplaySettings;
  getServerSnapshot: () => DisplaySettings;
  subscribe: (listener: Listener) => () => void;
  update: (changes: Partial<DisplaySettings>) => void;
  reset: () => void;
}

export function createDisplaySettingsStore(getStorage: () => Storage): DisplaySettingsStore {
  let current: DisplaySettings | undefined;
  const listeners = new Set<Listener>();

  function read(): DisplaySettings {
    try {
      return parseSettings(getStorage().getItem(STORAGE_KEY));
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function notify() {
    listeners.forEach((listener) => {
      listener();
    });
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    current = read();
    applySettings(current);
    notify();
  }

  function getSnapshot(): DisplaySettings {
    current ??= read();
    return current;
  }

  return {
    getSnapshot,
    getServerSnapshot: () => DEFAULT_SETTINGS,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener('storage', onStorage);
      };
    },
    update(changes) {
      current = { ...getSnapshot(), ...changes };
      try {
        getStorage().setItem(STORAGE_KEY, JSON.stringify(current));
      } catch {
        // The setting still applies for this visit, it just won't be remembered
      }
      applySettings(current);
      notify();
    },
    reset() {
      current = { ...DEFAULT_SETTINGS };
      try {
        getStorage().removeItem(STORAGE_KEY);
      } catch {
        // Nothing was saved, so there's nothing to remove
      }
      applySettings(current);
      notify();
    },
  };
}

export const displaySettingsStore = createDisplaySettingsStore(() => window.localStorage);
