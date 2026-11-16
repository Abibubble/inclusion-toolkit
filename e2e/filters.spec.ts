import { type Page, expect, test } from './support/test';

import { expectNoAxeViolations } from './support/axe';
import { expectNoHorizontalScroll } from './support/layout';

const resources = (page: Page) =>
  page.getByRole('region', { name: 'All resources' }).getByRole('list').getByRole('listitem');

test.describe('Filtering a section’s resources', () => {
  test('filters as boxes are ticked, announces how many show, and keeps them in the address', async ({
    page,
  }) => {
    await page.goto('/neurodiversity');
    const total = await resources(page).count();
    await expect(page.getByRole('status')).toHaveText(`Showing all ${String(total)} resources.`);

    await page.getByText('Filter by type, topic, or who it’s for').click();
    const infographics = page.getByRole('checkbox', { name: 'Infographics' });
    await infographics.focus();
    await page.keyboard.press('Space');

    await expect(page).toHaveURL('/neurodiversity?type=infographics');
    await expect(page.getByRole('status')).toHaveText(/^Showing \d+ of \d+ resources\.$/);
    const shown = await resources(page).count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(total);
    // Focus stays put, so keyboard users can carry on ticking boxes
    await expect(infographics).toBeFocused();
  });

  test('comes back to the same list after opening a resource and going Back', async ({ page }) => {
    await page.goto('/accessibility?topic=meetings');
    const shown = await resources(page).count();

    await resources(page).first().getByRole('link').click();
    // The section page has a main heading too, so wait for the resource's address
    await expect(page).toHaveURL(/^[^?]*\/accessibility\/[^?]+$/);
    await page.goBack();

    await expect(page).toHaveURL('/accessibility?topic=meetings');
    await expect(page.getByRole('checkbox', { name: 'Meetings and events' })).toBeChecked();
    await expect(resources(page)).toHaveCount(shown);
  });

  test('clears every filter at once', async ({ page }) => {
    await page.goto('/accessibility?topic=design&for=developers');
    const total = Number(
      /of (\d+)/.exec((await page.getByRole('status').textContent()) ?? '')?.[1] ?? 0,
    );

    await page.getByRole('button', { name: 'Clear filters' }).click();

    await expect(page).toHaveURL('/accessibility');
    await expect(resources(page)).toHaveCount(total);
  });

  test('opens from the home page with a topic ticked', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Browse by topic').first().click();
    const design = page.getByRole('link', { name: /^Design \(\d+\) ?, Accessibility$/ });
    const count = Number(/\((\d+)\)/.exec((await design.textContent()) ?? '')?.[1]);

    await design.click();

    await expect(page).toHaveURL('/accessibility?topic=design');
    await expect(page.getByRole('checkbox', { name: 'Design', exact: true })).toBeChecked();
    await expect(resources(page)).toHaveCount(count);
  });

  test('has no detectable accessibility issues with the filters open and ticked', async ({
    page,
  }) => {
    await page.goto('/accessibility?type=highlights&topic=design');

    await expectNoAxeViolations(page);
  });

  test('reflows at 320px wide with the filters open (WCAG 1.4.10)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/neurodiversity?topic=neurodivergent-conditions');

    await expectNoHorizontalScroll(page);
  });
});

test.describe('Without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('hides the filters, and shows every resource', async ({ page }) => {
    await page.goto('/accessibility?topic=design');

    await expect(page.getByText('Filter by type, topic, or who it’s for')).toBeHidden();
    await expect(page.getByRole('status')).toHaveText(/^Showing all \d+ resources\.$/);
  });
});
