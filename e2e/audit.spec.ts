import { ABBREVIATIONS, ALWAYS_SHORT } from '../src/content/abbreviations';
import { ROUTES } from './support/routes';
import { type Page, expect, test } from './support/test';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';

async function markFocusable(page: Page): Promise<string[]> {
  return page.evaluate((selector) => {
    const elements = [...document.querySelectorAll<HTMLElement>(selector)].filter((element) => {
      if (element.tabIndex < 0 || element.closest('[aria-hidden="true"], [inert]')) return false;

      // What's inside a closed details element can't be reached until it's opened, apart from its
      // summary. Newer browsers hide it without removing its size, so the size check misses it
      const closed = element.closest('details:not([open])');
      if (closed && !closed.querySelector(':scope > summary')?.contains(element)) return false;

      if (element instanceof HTMLInputElement && element.type === 'radio') {
        const group = [
          ...document.querySelectorAll<HTMLInputElement>(
            `input[type="radio"][name="${element.name}"]`,
          ),
        ];
        const stop = group.find((radio) => radio.checked) ?? group[0];

        if (element !== stop) return false;
      }
      const style = getComputedStyle(element);

      return style.visibility !== 'hidden' && element.getClientRects().length > 0;
    });

    return elements.map((element, index) => {
      element.dataset.audit = String(index);
      const name = element.textContent.trim() || element.id;

      return `${element.tagName.toLowerCase()} “${name.slice(0, 40)}”`;
    });
  }, FOCUSABLE);
}

interface FocusCheck {
  index: string | undefined;
  outline: number;
  inView: boolean;
  onTop: boolean;
}

async function checkFocus(page: Page): Promise<FocusCheck> {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement;
    const own = getComputedStyle(element);
    // A link that covers a whole card draws its focus ring round the card, with ::after
    const after = getComputedStyle(element, '::after');
    const style =
      own.outlineStyle === 'none' && after.content !== 'none' && after.outlineStyle !== 'none'
        ? after
        : own;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + Math.min(rect.height / 2, 10);
    const top = document.elementFromPoint(x, y);

    return {
      index: element.dataset.audit,
      outline: style.outlineStyle === 'none' ? 0 : parseFloat(style.outlineWidth),
      inView: rect.top >= 0 && rect.top < window.innerHeight && rect.left >= 0,
      onTop: top !== null && (top === element || element.contains(top) || top.contains(element)),
    };
  });
}

async function tabOrderProblems(page: Page, browserName: string): Promise<string[]> {
  const expected = await markFocusable(page);
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  const problems: string[] = [];

  for (const [position, label] of expected.entries()) {
    await page.keyboard.press(tab);
    let focus = await checkFocus(page);
    // Focusing can open something, such as an abbreviation's tooltip, while the browser scrolls to
    // it. WebKit on slower computers can take a moment to finish, so give it up to a second. Anything
    // really off screen or covered still fails
    for (let wait = 0; wait < 10 && !(focus.inView && focus.onTop); wait++) {
      await page.waitForTimeout(100);
      focus = await checkFocus(page);
    }

    if (focus.index !== String(position)) {
      problems.push(
        `Tab ${String(position + 1)} reached ${focus.index ?? 'something else'}, not ${label}`,
      );
      break;
    }
    if (focus.outline < 4) problems.push(`${label} has a ${String(focus.outline)}px focus ring`);
    if (!focus.inView) problems.push(`${label} is focused off screen`);
    if (!focus.onTop) problems.push(`${label} is hidden behind something when focused`);
  }

  return problems;
}

async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate((selector) => {
    const BLOCKS = 'p, li, dd, dt, td, th, figcaption, h1, h2, h3, h4, h5, h6, blockquote';

    return [...document.querySelectorAll<HTMLElement>(selector)]
      .filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0)
      .filter((element) => !element.closest('[aria-hidden="true"]'))
      .flatMap((element) => {
        const block = element.closest(BLOCKS);

        // Links and abbreviations in a sentence are exempt, as making them bigger would space out the text
        if (
          (element.tagName === 'A' || 'abbr' in element.dataset) &&
          block &&
          block.textContent.trim() !== element.textContent.trim()
        ) {
          return [];
        }
        element.focus();
        const target =
          element instanceof HTMLInputElement && ['radio', 'checkbox'].includes(element.type)
            ? (element.closest('label') ?? element.labels?.[0] ?? element)
            : element;
        const { width, height } = target.getBoundingClientRect();

        return width < 44 || height < 44
          ? [
              `${element.tagName.toLowerCase()} “${element.textContent.trim().slice(0, 40)}”: ${String(Math.round(width))} by ${String(Math.round(height))}`,
            ]
          : [];
      });
  }, FOCUSABLE);
}

const ABBREVIATIONS_TO_CHECK = Object.fromEntries(
  Object.entries(ABBREVIATIONS).filter(([name]) => !(ALWAYS_SHORT as string[]).includes(name)),
);

async function abbreviationsNotWrittenOut(page: Page): Promise<string[]> {
  return page.evaluate((abbreviations) => {
    const main = document.querySelector('main')?.cloneNode(true) as HTMLElement;
    const pageNames = [...document.querySelectorAll('nav[aria-label="Main"] a')].map((link) =>
      link.textContent.trim(),
    );
    main.querySelector('h1')?.remove();

    for (const heading of main.querySelectorAll('h2, h3, h4, h5, h6')) {
      if (pageNames.includes(heading.textContent.trim())) heading.remove();
    }

    main.querySelector('[aria-labelledby="abbreviations"]')?.remove();

    const text = [...main.querySelectorAll('p, li, dt, dd, h2, h3, h4, h5, h6, td, th')]
      .filter((block) => !block.querySelector('p, li, dt, dd'))
      .map((block) => block.textContent.replace(/\s+/g, ' '))
      .join(' | ');

    return Object.entries(abbreviations).flatMap(([abbreviation, fullForm]) => {
      const pattern = new RegExp(`(?<![A-Za-z])${abbreviation.replace('/', '\\/')}s?(?![A-Za-z])`);
      const match = pattern.exec(text);

      if (!match) return [];
      const before = text.slice(0, match.index).toLowerCase();

      return before.endsWith(`${fullForm.toLowerCase()} (`) ||
        before.endsWith(`${fullForm.toLowerCase()}s (`)
        ? []
        : [`${abbreviation}: …${text.slice(Math.max(0, match.index - 40), match.index + 20)}…`];
    });
  }, ABBREVIATIONS_TO_CHECK);
}

async function invisibleHighContrastControls(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        'button, input:not([type="hidden"]), select, textarea',
      ),
    ]
      .filter((element) => element.getClientRects().length > 0 && element.tabIndex >= 0)
      .filter((element) => {
        const style = getComputedStyle(element);

        return style.borderStyle === 'none' || parseFloat(style.borderWidth) === 0;
      })
      .filter((element) => !(element instanceof HTMLInputElement && element.type === 'radio'))
      // Abbreviations are part of the text, so like links they're marked by an underline, not a border
      .filter((element) => !('abbr' in element.dataset))
      .map((element) => `${element.tagName.toLowerCase()} “${element.textContent.trim()}”`),
  );
}

async function hasVisibleFocusRing(page: Page): Promise<boolean> {
  const outline = await page.evaluate(() =>
    document.activeElement ? getComputedStyle(document.activeElement).outlineStyle : 'none',
  );

  return outline !== 'none';
}

test.describe('Audit', () => {
  for (const { name, path } of ROUTES) {
    test(`${name}: Tab reaches everything in order, with a visible, unobscured focus ring`, async ({
      page,
      browserName,
    }) => {
      await page.goto(path);
      expect(await tabOrderProblems(page, browserName)).toEqual([]);
    });

    test(`${name}: every target is at least 44 by 44 pixels, apart from links and abbreviations in text (WCAG 2.5.5)`, async ({
      page,
    }) => {
      await page.goto(path);

      expect(await smallTargets(page)).toEqual([]);
    });
  }

  for (const { name, path } of ROUTES) {
    test(`${name}: writes out each abbreviation in full the first time it’s used, apart from ones most people know (WCAG 3.1.4)`, async ({
      page,
    }) => {
      await page.goto(path);

      expect(await abbreviationsNotWrittenOut(page)).toEqual([]);
    });
  }

  test.describe('in Windows high contrast mode', () => {
    test.use({ forcedColors: 'active' });

    for (const { name, path } of ROUTES) {
      test(`${name}: controls keep a visible edge, and focus stays visible`, async ({ page }) => {
        await page.goto(path);

        expect(await invisibleHighContrastControls(page)).toEqual([]);

        await page.keyboard.press('Tab');
        expect(await hasVisibleFocusRing(page)).toBe(true);
      });
    }
  });
});
