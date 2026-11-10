import { type Page, expect, test } from './support/test';

import { expectNoHorizontalScroll } from './support/layout';
import { WIDE_SYSTEM_FONT, saveDisplaySettings } from './support/settings';
import type { DisplaySettings } from '../src/settings/displaySettings';

const SWITCH_POINT_EM = 79;

const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu' });
const mainNavLinks = (page: Page) =>
  page.getByRole('navigation', { name: 'Main' }).getByRole('link');

async function rootFontSize(page: Page) {
  return page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
}

const SETTINGS: [string, Partial<DisplaySettings>][] = [
  ['the default settings', {}],
  ['increased text spacing', { textSpacing: 'increased' }],
  ['the device’s font with increased spacing', { font: 'system', textSpacing: 'increased' }],
  [
    'larger text with every other setting',
    { textSize: 'larger', textSpacing: 'increased', font: 'system' },
  ],
];

for (const [description, settings] of SETTINGS) {
  test.describe(`Header with ${description}`, () => {
    test.beforeEach(async ({ page }) => {
      await saveDisplaySettings(page, settings);
    });

    test('fits every link on one row beside the name once there’s room', async ({ page }) => {
      await page.goto('/about');
      await page.addStyleTag(WIDE_SYSTEM_FONT);
      const width = Math.ceil(SWITCH_POINT_EM * (await rootFontSize(page))) + 1;
      await page.setViewportSize({ width, height: 800 });

      await expect(menuButton(page)).toBeHidden();
      const tops = await mainNavLinks(page).evaluateAll((links) =>
        links.map((link) => Math.round(link.getBoundingClientRect().top)),
      );
      expect(new Set(tops).size, 'links wrapped onto more than one row').toBe(1);
      await expect(page.getByRole('combobox', { name: 'Theme' })).toBeVisible();
      await expectNoHorizontalScroll(page);
    });

    test('uses the Menu button just before there’s room', async ({ page }) => {
      await page.goto('/about');
      await page.addStyleTag(WIDE_SYSTEM_FONT);
      const width = Math.floor(SWITCH_POINT_EM * (await rootFontSize(page))) - 1;
      await page.setViewportSize({ width, height: 800 });

      await expect(menuButton(page)).toBeVisible();
      await expect(mainNavLinks(page).first()).toBeHidden();
      await expectNoHorizontalScroll(page);
    });
  });
}

test.describe('Header layouts', () => {
  test('puts the display settings in a bar under the header on wide screens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const header = await page.getByRole('banner').boundingBox();
    const theme = await page.getByRole('combobox', { name: 'Theme' }).boundingBox();
    const links = await mainNavLinks(page).first().boundingBox();

    expect(theme?.y).toBeGreaterThan((links?.y ?? 0) + (links?.height ?? 0));
    expect((theme?.y ?? 0) + (theme?.height ?? 0)).toBeLessThanOrEqual(
      (header?.y ?? 0) + (header?.height ?? 0),
    );
  });

  test('puts the links and display settings in the menu on narrower screens', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('combobox', { name: 'Theme' })).toBeHidden();

    await menuButton(page).click();

    await expect(mainNavLinks(page)).toHaveCount(4);
    await expect(page.getByRole('combobox', { name: 'Theme' })).toBeVisible();
  });

  test('only ever shows one theme switcher', async ({ page }) => {
    for (const width of [320, 800, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      if (await menuButton(page).isVisible()) await menuButton(page).click();

      await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveCount(1);
    }
  });
});
