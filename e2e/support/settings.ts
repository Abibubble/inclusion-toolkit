import type { Page } from '@playwright/test';

import { type DisplaySettings, STORAGE_KEY } from '../../src/settings/displaySettings';

export const LIGHT_BACKGROUND = 'rgb(239, 245, 251)';
export const DARK_BACKGROUND = 'rgb(11, 20, 34)';
export const CREAM_BACKGROUND = 'rgb(251, 245, 230)';

export const bodyBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

export async function rootFontSize(page: Page): Promise<number> {
  return page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
}

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
