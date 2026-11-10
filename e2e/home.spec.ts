import { expect, test } from './support/test';

test.describe('Home page', () => {
  test('is served as prerendered HTML', async ({ request }) => {
    const response = await request.get('/');
    const html = await response.text();

    expect(response.ok()).toBe(true);
    expect(/<h1[^>]*>(.*?)<\/h1>/.exec(html)?.[1]?.replace(/<[^>]+>/g, '')).toBe(
      'Inclusion Toolkit',
    );
  });

  test('sets the page language and title', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(page).toHaveTitle('Inclusion Toolkit');
  });
});
