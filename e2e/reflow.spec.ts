import { test } from './support/test';

import { TEXT_SPACING_CSS, expectNoHorizontalScroll } from './support/layout';
import { ROUTES } from './support/routes';
import { STRONGEST_SETTINGS, WIDE_SYSTEM_FONT, saveDisplaySettings } from './support/settings';

for (const route of ROUTES) {
  test.describe(`${route.name} page`, () => {
    test('reflows at 320px wide without scrolling sideways (WCAG 1.4.10)', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(route.path);

      await expectNoHorizontalScroll(page);
    });

    test('works with text at 200% (WCAG 1.4.4 and 1.4.8)', async ({ page }) => {
      await page.goto(route.path);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });

      await expectNoHorizontalScroll(page);
    });

    test('works with increased text spacing (WCAG 1.4.12)', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(route.path);
      await page.addStyleTag({ content: TEXT_SPACING_CSS });

      await expectNoHorizontalScroll(page);
    });

    test('reflows at 320px with the largest text and widest spacing in the display settings', async ({
      page,
    }) => {
      await saveDisplaySettings(page, STRONGEST_SETTINGS);
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(route.path);
      await page.addStyleTag(WIDE_SYSTEM_FONT);
      await page.getByRole('button', { name: 'Menu' }).click();

      await expectNoHorizontalScroll(page);
    });
  });
}
