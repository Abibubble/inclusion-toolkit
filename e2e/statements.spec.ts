import { expect, test } from './support/test';

test.describe('Accessibility and Privacy pages', () => {
  for (const path of ['/accessibility', '/privacy']) {
    test(`${path} contents move focus to each section`, async ({ page }) => {
      await page.goto(path);
      const contents = page.getByRole('navigation', { name: 'On this page' });
      const links = await contents.getByRole('link').all();
      expect(links.length).toBeGreaterThan(5);

      for (const link of links) {
        const name = (await link.textContent()) ?? '';
        await link.click();
        const heading = page.getByRole('heading', { level: 2, name, exact: true });
        await expect(heading).toBeFocused();
        await expect(heading).toBeInViewport();
        await page.keyboard.press('Shift+Tab');
      }
    });
  }

  test('the privacy notice’s link goes to the display settings', async ({ page }) => {
    await page.goto('/privacy');

    await page
      .getByRole('region', { name: 'What’s saved in your browser' })
      .getByRole('link', { name: 'display settings' })
      .click();

    await expect(page).toHaveURL(/\/display-settings$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Display settings' })).toBeVisible();
  });
});
