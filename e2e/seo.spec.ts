import { pageUrl } from '../src/seo/siteUrl';
import { ROUTES } from './support/routes';
import { expect, test } from './support/test';

const SITE = 'http://localhost:4173';
const PAGES = ROUTES.filter((route) => route.name !== 'Page not found');

test.describe('Search engines and sharing', () => {
  for (const { name, path } of PAGES) {
    test(`${name} has its own description, canonical address and share preview`, async ({
      page,
    }) => {
      await page.goto(path);
      const head = page.locator('head');
      const url = pageUrl(SITE, path);

      await expect(head.locator('meta[name="description"]')).toHaveAttribute('content', /\w/);
      await expect(head.locator('link[rel="canonical"]')).toHaveAttribute('href', url);
      await expect(head.locator('meta[property="og:url"]')).toHaveAttribute('content', url);
      await expect(head.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        await page.title(),
      );
      await expect(head.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        `${SITE}/share.png`,
      );
    });
  }

  test('the not found page asks search engines not to list it, and has no canonical address', async ({
    page,
  }) => {
    await page.goto('/this-page-does-not-exist');

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });

  test('Home describes the site, with structured data', async ({ page }) => {
    await page.goto('/');

    const data = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? '',
    ) as Record<string, unknown>;
    expect(data).toMatchObject({ '@type': 'WebSite', name: 'Inclusion Toolkit', url: `${SITE}/` });
  });

  test('the sitemap lists every page except the not found page', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();

    const listed = [...sitemap.matchAll(/<loc>(.+?)<\/loc>/g)].map(([, loc]) => loc);
    expect(listed.sort()).toEqual(PAGES.map((route) => pageUrl(SITE, route.path)).sort());
  });

  test('robots.txt allows everything and points to the sitemap', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();

    expect(robots).toContain('Allow: /');
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });

  test('every icon, the share image and the web app manifest are there', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const linked = await page
      .locator('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
    const manifest = (await (await request.get('/site.webmanifest')).json()) as {
      icons: { src: string }[];
    };

    for (const path of [...linked, ...manifest.icons.map((icon) => icon.src), '/share.png']) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
    }
  });
});
