import AxeBuilder from '@axe-core/playwright';
import { type Page, expect } from '@playwright/test';

import { WCAG_TAGS } from '../../src/test/wcag-tags';

export async function expectNoAxeViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  const summary = violations
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} elements)`)
    .join('\n');

  expect(violations, summary).toEqual([]);
}
