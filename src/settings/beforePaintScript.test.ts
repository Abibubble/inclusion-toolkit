import { afterEach, describe, expect, it } from 'vitest';

import { BEFORE_PAINT_SCRIPT } from './beforePaintScript';
import { SETTINGS, SETTING_NAMES, STORAGE_KEY } from './displaySettings';

const root = document.documentElement;

function runScript() {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- running our own build time script
  const script = new Function(BEFORE_PAINT_SCRIPT) as () => void;
  script();
}

afterEach(() => {
  root.removeAttribute('data-js');
  for (const name of SETTING_NAMES) root.removeAttribute(SETTINGS[name].attribute);
  localStorage.clear();
});

describe('the before paint script', () => {
  it('marks that JavaScript is running', () => {
    runScript();

    expect(root).toHaveAttribute('data-js', '');
  });

  it('applies saved settings', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme: 'dark', textSize: 'larger', font: 'system' }),
    );

    runScript();

    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(root).toHaveAttribute('data-text-size', 'larger');
    expect(root).toHaveAttribute('data-font', 'system');
  });

  it('leaves default settings off the page', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'system', textSize: 'default' }));

    runScript();

    expect(root).not.toHaveAttribute('data-theme');
    expect(root).not.toHaveAttribute('data-text-size');
  });

  it('ignores values that are not options, so nothing unexpected reaches the page', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: '"><script>', motion: 'reduce' }));

    runScript();

    expect(root).not.toHaveAttribute('data-theme');
    expect(root).toHaveAttribute('data-motion', 'reduce');
  });

  it.each(['not json', 'null'])('carries on without settings if the saved data is %s', (saved) => {
    localStorage.setItem(STORAGE_KEY, saved);

    expect(runScript).not.toThrow();
    expect(root).toHaveAttribute('data-js', '');
  });

  it('knows about every setting', () => {
    for (const name of SETTING_NAMES) {
      expect(BEFORE_PAINT_SCRIPT).toContain(SETTINGS[name].attribute);
    }
  });
});
