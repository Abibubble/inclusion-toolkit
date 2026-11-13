import { expect, test } from './support/test';

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

    test('keeps lines of text to 80 characters or fewer on a wide screen (WCAG 1.4.8)', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route.path);

      // Counts the characters on each line as the browser lays them out, a word at a time. Text
      // that's hidden visually, for screen readers, is left out
      const longest = await page.evaluate(() => {
        let most = 0;
        for (const element of document.querySelectorAll('main :is(p, li, dd, blockquote)')) {
          // The letters and the number of words on each line, which have a space between them
          const lines = new Map<number, { letters: number; words: number }>();
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const text = node.textContent ?? '';
            if (!text.trim() || (node.parentElement?.getBoundingClientRect().width ?? 0) <= 2) {
              continue;
            }
            for (const word of text.matchAll(/\S+\s*/g)) {
              const range = document.createRange();
              range.setStart(node, word.index);
              const length = word[0].trimEnd().length;
              range.setEnd(node, word.index + length);
              const rects = [...range.getClientRects()];
              // A long word, such as a web address, can be split across lines. Its parts can't be
              // told apart here, so it's left out
              const tops = new Set(rects.map((rect) => Math.round(rect.top)));
              if (tops.size !== 1) continue;
              const [top = 0] = tops;
              const line = lines.get(top) ?? { letters: 0, words: 0 };
              lines.set(top, { letters: line.letters + length, words: line.words + 1 });
            }
          }
          for (const { letters, words } of lines.values()) {
            most = Math.max(most, letters + words - 1);
          }
        }
        return most;
      });

      expect(longest).toBeLessThanOrEqual(80);
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
