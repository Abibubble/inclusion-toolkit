import { SITE_PAGES } from '../e2e/support/routes';
import { type Page, expect, test } from '../e2e/support/test';
import { basePathOf, pageUrl, siteUrlFromEnv } from '../src/seo/siteUrl';

const SITE_URL = siteUrlFromEnv(process.env);
const BASE = basePathOf(SITE_URL);
const PAGES = SITE_PAGES.filter((page) => page.name !== 'Page not found');

const served = (path: string) => (path === '/' ? BASE : `${BASE}${path.slice(1)}/`);

function recordProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('requestfailed', (request) => problems.push(`failed: ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`${String(response.status())}: ${response.url()}`);
  });
  page.on('pageerror', (error) => problems.push(`error: ${error.message}`));
  return problems;
}

test.describe(`GitHub Pages, under ${BASE}`, () => {
  for (const { name, path } of PAGES) {
    test(`${name} loads every file it needs and starts up`, async ({ page }) => {
      const problems = recordProblems(page);
      await page.goto(served(path));

      await expect(page.getByRole('combobox', { name: 'Theme' })).toBeEnabled();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        pageUrl(SITE_URL, path),
      );
      await page.waitForLoadState('networkidle');
      expect(problems).toEqual([]);
    });
  }

  test('moves between pages without leaving the base path', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto(served('/'));

    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Neurodiversity' })
      .click();

    await expect(page.getByRole('heading', { level: 1, name: 'Neurodiversity' })).toBeFocused();
    expect(new URL(page.url()).pathname).toBe(`${BASE}neurodiversity`);
    expect(problems).toEqual([]);
  });

  test('has the icons and web app manifest where the pages link to them', async ({
    page,
    request,
  }) => {
    await page.goto(served('/'));
    const linked = await page
      .locator('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));

    for (const href of linked) {
      expect(href.startsWith(BASE), href).toBe(true);
      expect((await request.get(href)).status(), href).toBe(200);
    }
  });

  test('has the not found page, which starts up too', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto(`${BASE}404.html`);

    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'go to the home page' })).toHaveAttribute(
      'href',
      BASE,
    );
    expect(problems).toEqual([]);
  });
});
