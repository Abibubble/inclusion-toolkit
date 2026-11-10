import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_SETTINGS,
  type DisplaySettings,
  SETTINGS,
  SETTING_NAMES,
  STORAGE_KEY,
  applySettings,
  createDisplaySettingsStore,
  parseSettings,
} from './displaySettings';

const root = document.documentElement;

function clearAttributes() {
  for (const name of SETTING_NAMES) root.removeAttribute(SETTINGS[name].attribute);
}

function storageThatFails(): Storage {
  const fail = () => {
    throw new Error('Storage is unavailable');
  };
  return {
    length: 0,
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  };
}

afterEach(() => {
  clearAttributes();
  localStorage.clear();
});

describe('settings definitions', () => {
  it.each(SETTING_NAMES)(
    '%s has a legend, a data attribute, and a default that is an option',
    (name) => {
      const setting = SETTINGS[name];

      expect(setting.legend).not.toBe('');
      expect(setting.attribute).toMatch(/^data-[a-z-]+$/);
      expect(setting.options.map((option) => option.value)).toContain(setting.default);
    },
  );
});

describe('parseSettings', () => {
  it('gives the defaults when nothing is saved', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('reads saved settings', () => {
    const saved: DisplaySettings = { ...DEFAULT_SETTINGS, theme: 'cream', textSize: 'larger' };

    expect(parseSettings(JSON.stringify(saved))).toEqual(saved);
  });

  it('ignores values that are no longer options, keeping the rest', () => {
    const saved = JSON.stringify({ theme: 'neon', textSize: 'large', font: 42 });

    expect(parseSettings(saved)).toEqual({ ...DEFAULT_SETTINGS, textSize: 'large' });
  });

  it.each(['not json', 'null', '"a string"', '[1, 2]'])(
    'copes with saved data like %s',
    (saved) => {
      expect(parseSettings(saved)).toEqual(DEFAULT_SETTINGS);
    },
  );
});

describe('applySettings', () => {
  it('sets an attribute for each setting that differs from its default', () => {
    applySettings({ ...DEFAULT_SETTINGS, theme: 'dark', motion: 'reduce' });

    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(root).toHaveAttribute('data-motion', 'reduce');
    expect(root).not.toHaveAttribute('data-text-size');
  });

  it('removes attributes for settings back at their defaults', () => {
    applySettings({ ...DEFAULT_SETTINGS, theme: 'dark' });
    applySettings(DEFAULT_SETTINGS);

    expect(root).not.toHaveAttribute('data-theme');
  });
});

describe('the settings store', () => {
  it('starts with the saved settings', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'cream' }));
    const store = createDisplaySettingsStore(() => localStorage);

    expect(store.getSnapshot().theme).toBe('cream');
  });

  it('gives the defaults when prerendering, so the HTML is the same for everyone', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'cream' }));
    const store = createDisplaySettingsStore(() => localStorage);

    expect(store.getServerSnapshot()).toEqual(DEFAULT_SETTINGS);
  });

  it('saves, applies and announces a change', () => {
    const store = createDisplaySettingsStore(() => localStorage);
    const listener = vi.fn();
    store.subscribe(listener);

    store.update({ textSpacing: 'increased' });

    expect(store.getSnapshot().textSpacing).toBe('increased');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      textSpacing: 'increased',
    });
    expect(root).toHaveAttribute('data-text-spacing', 'increased');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('resets everything to the defaults and forgets the saved settings', () => {
    const store = createDisplaySettingsStore(() => localStorage);
    store.update({ theme: 'dark', font: 'system' });

    store.reset();

    expect(store.getSnapshot()).toEqual(DEFAULT_SETTINGS);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(root).not.toHaveAttribute('data-theme');
    expect(root).not.toHaveAttribute('data-font');
  });

  it('still applies settings when storage is unavailable, without saving them', () => {
    const store = createDisplaySettingsStore(storageThatFails);

    expect(store.getSnapshot()).toEqual(DEFAULT_SETTINGS);
    expect(() => {
      store.update({ theme: 'dark' });
    }).not.toThrow();
    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(() => {
      store.reset();
    }).not.toThrow();
  });

  it('picks up changes made in another tab', () => {
    const store = createDisplaySettingsStore(() => localStorage);
    const listener = vi.fn();
    store.subscribe(listener);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'cream' }));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));

    expect(store.getSnapshot().theme).toBe('cream');
    expect(root).toHaveAttribute('data-theme', 'cream');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores changes to other things in storage', () => {
    const store = createDisplaySettingsStore(() => localStorage);
    const listener = vi.fn();
    store.subscribe(listener);

    window.dispatchEvent(new StorageEvent('storage', { key: 'something-else' }));

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops listening once nothing is subscribed', () => {
    const store = createDisplaySettingsStore(() => localStorage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));

    expect(listener).not.toHaveBeenCalled();
  });
});
