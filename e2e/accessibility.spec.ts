import { test } from './support/test';

import { expectNoAxeViolations } from './support/axe';
import { ROUTES, THEMES } from './support/routes';
import { STRONGEST_SETTINGS, saveDisplaySettings } from './support/settings';

for (const route of ROUTES) {
  for (const theme of THEMES) {
    test(`${route.name} page has no detectable accessibility issues in the ${theme.name} theme`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme.colorScheme });
      if ('settings' in theme) await saveDisplaySettings(page, theme.settings);
      await page.goto(route.path);

      await expectNoAxeViolations(page);
    });
  }

  test(`${route.name} page has no detectable accessibility issues with the strongest display settings`, async ({
    page,
  }) => {
    await saveDisplaySettings(page, { ...STRONGEST_SETTINGS, theme: 'dark' });
    await page.goto(route.path);

    await expectNoAxeViolations(page);
  });
}
