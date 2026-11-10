import { type Page, expect, test } from './support/test';

const LIGHT_BACKGROUND = 'rgb(245, 239, 250)';
const DARK_BACKGROUND = 'rgb(22, 12, 36)';
const CREAM_BACKGROUND = 'rgb(251, 245, 230)';

const bodyBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

const setTheme = (page: Page, theme: string) =>
  page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
  }, theme);

test.describe('Themes', () => {
  test('follows a light system setting by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    expect(await bodyBackground(page)).toBe(LIGHT_BACKGROUND);
  });

  test('follows a dark system setting by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    expect(await bodyBackground(page)).toBe(DARK_BACKGROUND);
  });

  test('a chosen light theme overrides a dark system setting', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await setTheme(page, 'light');

    expect(await bodyBackground(page)).toBe(LIGHT_BACKGROUND);
  });

  test('a chosen dark theme overrides a light system setting', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await setTheme(page, 'dark');

    expect(await bodyBackground(page)).toBe(DARK_BACKGROUND);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`the Cream theme applies whatever the system setting (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/');
      await setTheme(page, 'cream');

      expect(await bodyBackground(page)).toBe(CREAM_BACKGROUND);
    });
  }
});

test.describe('Fonts', () => {
  test('loads Atkinson Hyperlegible Next from the site itself', async ({ page }) => {
    const fontRequests: string[] = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'font') fontRequests.push(request.url());
    });

    await page.goto('/');
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].some(
        (face) => face.family.includes('Atkinson Hyperlegible Next') && face.status === 'loaded',
      );
    });

    expect(loaded).toBe(true);
    expect(fontRequests.length).toBeGreaterThan(0);
    for (const url of fontRequests) {
      expect(new URL(url).origin).toBe(new URL(page.url()).origin);
    }
  });

  test('has no italic font, so text is never slanted', async ({ page }) => {
    await page.goto('/');
    const hasItalicFace = await page.evaluate(() =>
      [...document.fonts].some((face) => face.style === 'italic'),
    );

    expect(hasItalicFace).toBe(false);
  });

  test('shows emphasis in semi bold with extra spacing, rather than italics', async ({ page }) => {
    await page.goto('/');
    const styles = await page.evaluate(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<p>
          <em id="em">Emphasis</em> <strong id="strong">Important</strong>
          <i id="i">Title</i> <cite id="cite">Source</cite>
        </p>`,
      );
      return ['em', 'strong', 'i', 'cite'].map((id) => {
        const style = getComputedStyle(document.getElementById(id) as Element);
        return {
          id,
          fontStyle: style.fontStyle,
          fontWeight: style.fontWeight,
          letterSpacing: style.letterSpacing,
        };
      });
    });

    expect(styles).toEqual([
      { id: 'em', fontStyle: 'normal', fontWeight: '600', letterSpacing: '0.8px' },
      { id: 'strong', fontStyle: 'normal', fontWeight: '600', letterSpacing: '0.8px' },
      { id: 'i', fontStyle: 'normal', fontWeight: '400', letterSpacing: 'normal' },
      { id: 'cite', fontStyle: 'normal', fontWeight: '400', letterSpacing: 'normal' },
    ]);
  });
});

test.describe('Print', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.evaluate(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<a id="external" href="https://example.com/">Example</a>
        <a id="no-url" href="https://example.com/" data-print-url="hide">Example</a>
        <div id="hidden" data-print="hide">Not printed</div>`,
      );
    });
    await page.emulateMedia({ media: 'print' });
  });

  test('prints black text whatever the theme', async ({ page }) => {
    const colour = await page.evaluate(() => getComputedStyle(document.body).color);

    expect(colour).toBe('rgb(0, 0, 0)');
  });

  test('prints black text in the Cream theme too', async ({ page }) => {
    await setTheme(page, 'cream');
    const colour = await page.evaluate(() => getComputedStyle(document.body).color);

    expect(colour).toBe('rgb(0, 0, 0)');
  });

  test('hides anything marked data-print="hide"', async ({ page }) => {
    await expect(page.locator('#hidden')).toBeHidden();
  });

  test('prints the address after external links', async ({ page }) => {
    const after = (id: string) =>
      page.evaluate((selector) => {
        const link = document.querySelector(selector);
        return link ? getComputedStyle(link, '::after').content : null;
      }, id);

    expect(await after('#external')).toContain('https://example.com/');
    expect(await after('#no-url')).toBe('none');
  });
});
