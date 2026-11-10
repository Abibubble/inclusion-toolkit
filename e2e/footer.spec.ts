import { expect, test } from './support/test';

test.describe('Footer', () => {
  test('links to the About page, where the licence credit is, on every page', async ({ page }) => {
    await page.goto('/highlights');

    await page.getByRole('contentinfo').getByRole('link', { name: 'About' }).click();

    await expect(page).toHaveURL('/about');
    await expect(
      page.getByText(/first made the Inclusion Toolkit for giffgaff and HAND/),
    ).toBeVisible();
  });

  test('loads without React reporting a hydration mismatch', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await expect(page.getByRole('contentinfo')).toBeVisible();

    expect(errors).toEqual([]);
  });
});
