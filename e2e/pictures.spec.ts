import { type Locator, expect, test } from './support/test';

async function expectLoaded(picture: Locator) {
  await expect(picture).toBeVisible();
  await expect
    .poll(() => picture.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth))
    .toBeGreaterThan(0);
}

test.describe('Pictures of the infographics and visual summaries', () => {
  test('shows the infographic on its page', async ({ page }) => {
    await page.goto('/neurodiversity/infographics/adhd');

    await expectLoaded(page.getByRole('img', { name: 'The ADHD infographic.' }));
  });

  test('shows the visual summary on a highlight’s page', async ({ page }) => {
    await page.goto('/accessibility/highlights/dark-mode');

    await expectLoaded(page.getByRole('img', { name: /^The Dark Mode visual summary\.$/i }));
  });

  test('shows no picture for an all-in-one file, which has many slides', async ({ page }) => {
    await page.goto('/neurodiversity/infographics/neurodiversity-infographics');

    await expect(page.getByRole('main').getByRole('img')).toHaveCount(0);
  });

  test('links from the caption to the page’s text, and moves focus there', async ({ page }) => {
    await page.goto('/neurodiversity/infographics/adhd');

    await page.getByRole('figure').getByRole('link', { name: 'What’s in it' }).click();

    await expect(page.getByRole('heading', { level: 2, name: 'What’s in it' })).toBeFocused();
  });
});
