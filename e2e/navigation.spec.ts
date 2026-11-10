import { type Locator, type Page, expect, test } from './support/test';

import { SITE_PAGES } from './support/routes';

const mainNav = (page: Page) => page.getByRole('navigation', { name: 'Main' });
const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu' });

async function expectTargetSize(locator: Locator) {
  for (const target of await locator.all()) {
    const box = await target.boundingBox();
    const name = (await target.textContent()) ?? '';

    expect(box, `${name} is not visible`).not.toBeNull();
    expect(box?.width, `${name} is too narrow`).toBeGreaterThanOrEqual(48);
    expect(box?.height, `${name} is too short`).toBeGreaterThanOrEqual(48);
  }
}

test.describe('Skip link', () => {
  test('is the first thing keyboard users reach, and moves them to the main content', async ({
    page,
    browserName,
  }) => {
    await page.goto('/');
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');

    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();

    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('appears as a compact button at the top left, without moving the page', async ({ page }) => {
    await page.goto('/');
    const headerBefore = await page.getByRole('banner').boundingBox();

    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await skipLink.focus();
    const link = await skipLink.boundingBox();
    const headerAfter = await page.getByRole('banner').boundingBox();
    const viewport = page.viewportSize();

    expect(link?.x).toBeLessThan(48);
    expect(link?.y).toBeLessThan(48);
    expect(link?.width).toBeLessThan((viewport?.width ?? 0) / 2);
    expect(link?.height).toBeGreaterThanOrEqual(48);
    expect(headerAfter?.y).toBe(headerBefore?.y);
  });
});

test.describe('Moving between pages', () => {
  test('marks the current page in the navigation', async ({ page }) => {
    await page.goto('/about');

    await expect(mainNav(page).getByRole('link', { name: 'About' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(mainNav(page).getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  test('leaves focus alone when a page first loads', async ({ page }) => {
    await page.goto('/about');

    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
  });

  test('works when coming back to a page first opened with a slash at the end of its address', async ({
    page,
  }) => {
    const resource = '/highlights/accessibility/aria';
    const firstHeading = page.locator('[data-page-html] h3').first();
    await page.goto(`${resource}/`);

    await expect(page).toHaveURL(resource);
    const heading = await firstHeading.textContent();

    await page
      .getByRole('navigation', { name: 'Breadcrumbs' })
      .getByRole('link', { name: 'Accessibility' })
      .click();
    await expect(page).toHaveURL('/highlights/accessibility');
    await page.goBack();

    await expect(page).toHaveURL(resource);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ARIA');
    await expect(firstHeading).toHaveText(heading ?? '');
  });

  const linkedPages = SITE_PAGES.filter(
    ({ path }) => path !== '/' && path !== '/this-page-does-not-exist',
  );

  for (const route of linkedPages) {
    test(`moves focus to the heading and updates the title after choosing ${route.name}`, async ({
      page,
    }) => {
      await page.goto('/');
      // Some pages are in both the menu and the footer
      const link = page
        .getByRole('navigation')
        .getByRole('link', { name: route.name, exact: true })
        .first();
      await link.click();

      await expect(page).toHaveURL(route.path);
      await expect(page.getByRole('heading', { level: 1, name: route.name })).toBeFocused();
      await expect(page).toHaveTitle(`${route.name}, Inclusion Toolkit`);
    });
  }
});

test.describe('Navigation on wide screens', () => {
  test('shows every link, with no Menu button', async ({ page }) => {
    await page.goto('/');

    await expect(menuButton(page)).toBeHidden();
    await expect(mainNav(page).getByRole('link')).toHaveCount(4);
    for (const link of await mainNav(page).getByRole('link').all()) {
      await expect(link).toBeVisible();
    }
  });

  test('has targets of at least 48px in the header and footer (WCAG 2.5.5)', async ({ page }) => {
    await page.goto('/');

    await expectTargetSize(page.getByRole('banner').getByRole('link'));
    await expectTargetSize(page.getByRole('contentinfo').getByRole('link'));
  });
});

test.describe('Navigation on narrow screens', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('hides the links behind a Menu button', async ({ page }) => {
    await page.goto('/');

    await expect(menuButton(page)).toBeVisible();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(mainNav(page).getByRole('link', { name: 'Highlights' })).toBeHidden();
  });

  test('opens the menu in the page, pushing content down rather than covering it', async ({
    page,
  }) => {
    await page.goto('/');
    const headingBefore = await page.getByRole('heading', { level: 1 }).boundingBox();

    await menuButton(page).click();

    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(mainNav(page).getByRole('link', { name: 'Highlights' })).toBeVisible();
    const headingAfter = await page.getByRole('heading', { level: 1 }).boundingBox();
    expect(headingAfter?.y).toBeGreaterThan(headingBefore?.y ?? Infinity);
  });

  test('has targets of at least 48px in the open menu (WCAG 2.5.5)', async ({ page }) => {
    await page.goto('/');
    await menuButton(page).click();

    await expectTargetSize(page.getByRole('banner').getByRole('link'));
    await expectTargetSize(menuButton(page));
  });

  test('closes with Escape and returns focus to the Menu button', async ({ page }) => {
    await page.goto('/');
    await menuButton(page).click();
    await mainNav(page).getByRole('link', { name: 'Highlights' }).focus();

    await page.keyboard.press('Escape');

    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton(page)).toBeFocused();
  });

  test('closes after choosing a page, and moves focus to its heading', async ({ page }) => {
    await page.goto('/');
    await menuButton(page).click();
    await mainNav(page).getByRole('link', { name: 'Highlights' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Highlights' })).toBeFocused();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Navigation without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });

  test('shows every link even on narrow screens, with no Menu button', async ({ page }) => {
    await page.goto('/');

    await expect(menuButton(page)).toBeHidden();
    for (const link of await mainNav(page).getByRole('link').all()) {
      await expect(link).toBeVisible();
    }
  });
});

test.describe('Page not found', () => {
  test('is served with a 404 status for unknown addresses', async ({ request }) => {
    const response = await request.get('/this-page-does-not-exist');

    expect(response.status()).toBe(404);
    expect(await response.text()).toMatch(/<h1[^>]*>Page not found<\/h1>/);
  });

  test('shows for an address in a toolkit folder that isn’t a resource, with no errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    const response = await page.goto('/highlights/not-a-real-highlight');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('works as a normal page, with a way back home', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page).toHaveTitle('Page not found, Inclusion Toolkit');

    await page.getByRole('link', { name: 'go to the home page' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Inclusion Toolkit' })).toBeFocused();
  });
});

test.describe('Printing', () => {
  test('leaves out the navigation, menu button and footer, but keeps the site name', async ({
    page,
  }) => {
    await page.goto('/');
    await page.emulateMedia({ media: 'print' });

    await expect(mainNav(page)).toBeHidden();
    await expect(menuButton(page)).toBeHidden();
    await expect(page.getByRole('contentinfo')).toBeHidden();
    await expect(page.getByRole('link', { name: 'Inclusion Toolkit home page' })).toBeVisible();
  });
});
