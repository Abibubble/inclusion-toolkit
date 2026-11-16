import { expect, test } from './support/test';

import { STORAGE_KEY } from '../src/settings/displaySettings';
import { mainNav, menuButton, themeSelect } from './support/locators';
import {
  CREAM_BACKGROUND,
  DARK_BACKGROUND,
  bodyBackground,
  rootFontSize,
  saveDisplaySettings,
} from './support/settings';

test.describe('Theme switcher in the header', () => {
  test('changes the theme, and keeps it on other pages and after reloading', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    await themeSelect(page).selectOption('Dark');
    await expect.poll(() => bodyBackground(page)).toBe(DARK_BACKGROUND);

    await mainNav(page).getByRole('link', { name: 'Neurodiversity' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Neurodiversity' })).toBeVisible();
    await expect.poll(() => bodyBackground(page)).toBe(DARK_BACKGROUND);

    await page.reload();
    await expect.poll(() => bodyBackground(page)).toBe(DARK_BACKGROUND);
    await expect(themeSelect(page)).toHaveValue('dark');
  });

  test('sits in the menu on narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    await expect(themeSelect(page)).toBeHidden();

    await menuButton(page).click();

    await expect(themeSelect(page)).toBeVisible();
  });

  test('links to the rest of the display settings, on their own page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'More display settings' }).click();

    await expect(page).toHaveURL('/display-settings');
    await expect(page.getByRole('heading', { level: 1, name: 'Display settings' })).toBeVisible();
  });
});

test.describe('Saved settings, with no JavaScript files', () => {
  test.use({ waitForReact: false });

  test('apply before the page is drawn, even before any JavaScript files load', async ({
    page,
  }) => {
    await saveDisplaySettings(page, { theme: 'cream', textSize: 'larger' });
    await page.route('**/*.js', (route) => route.abort());

    await page.goto('/');

    await expect.poll(() => bodyBackground(page)).toBe(CREAM_BACKGROUND);
    expect(await rootFontSize(page)).toBe(24);
  });
});

test.describe('Saved settings', () => {
  test('are ignored if they’ve been tampered with', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, '{"theme": "<script>", "textSize": 1000}');
    }, STORAGE_KEY);

    await page.goto('/');

    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect(page.locator('html')).not.toHaveAttribute('data-text-size');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Display settings page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/display-settings');
  });

  test('makes text bigger', async ({ page }) => {
    await page.getByRole('radio', { name: 'Largest (50% bigger)' }).check();

    expect(await rootFontSize(page)).toBe(24);
  });

  test('increases text spacing to at least the WCAG 1.4.12 values', async ({ page }) => {
    await page
      .getByRole('radio', { name: 'Increased (more space between lines, words, and letters)' })
      .check();

    const spacing = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelector('p') as Element);
      const fontSize = parseFloat(style.fontSize);
      return {
        lineHeight: parseFloat(style.lineHeight) / fontSize,
        letterSpacing: parseFloat(style.letterSpacing) / fontSize,
        wordSpacing: parseFloat(style.wordSpacing) / fontSize,
      };
    });

    expect(spacing.lineHeight).toBeGreaterThanOrEqual(1.5);
    expect(spacing.letterSpacing).toBeGreaterThanOrEqual(0.12);
    expect(spacing.wordSpacing).toBeGreaterThanOrEqual(0.16);
  });

  test('switches to the device’s own font', async ({ page }) => {
    await page.getByRole('radio', { name: 'My device’s font' }).check();

    expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(
      /^system-ui/,
    );
  });

  test('stays in step with the header theme switcher', async ({ page }) => {
    await page.getByRole('radio', { name: 'Cream' }).check();

    await expect(themeSelect(page)).toHaveValue('cream');
  });

  test('resets everything, and says so', async ({ page }) => {
    await page.getByRole('radio', { name: 'Dark' }).check();
    await page.getByRole('radio', { name: 'Largest (50% bigger)' }).check();

    await page.getByRole('button', { name: 'Reset to defaults' }).click();

    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect(page.locator('html')).not.toHaveAttribute('data-text-size');
    await expect(page.getByRole('status')).toHaveText(
      'Display settings are back to their defaults.',
    );
  });
});

test.describe('Without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('explains that settings need JavaScript, and hides controls that wouldn’t work', async ({
    page,
  }) => {
    await page.goto('/display-settings');

    await expect(page.getByText('Display settings need JavaScript')).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(themeSelect(page)).toBeHidden();
  });
});
