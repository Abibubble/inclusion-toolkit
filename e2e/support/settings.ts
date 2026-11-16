import type { Page } from '@playwright/test';

import { type DisplaySettings, STORAGE_KEY } from '../../src/settings/displaySettings';

export const STRONGEST_SETTINGS: Partial<DisplaySettings> = {
  textSize: 'larger',
  textSpacing: 'increased',
  font: 'system',
};

/**
 * A wide system font (Verdana on a Mac, DejaVu Sans on Linux in CI), to catch layouts that only
 * break with wide fonts.
 */
export const WIDE_SYSTEM_FONT = {
  content: ":root { --font-family-system: verdana, 'DejaVu Sans', sans-serif; }",
};

export async function saveDisplaySettings(
  page: Page,
  settings: Partial<DisplaySettings>,
): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(settings)] as const,
  );
}
