import axe, { type Result, type RunOptions } from 'axe-core';
import { expect } from 'vitest';

import { WCAG_TAGS } from './wcag-tags';

// jsdom doesn't do layout, so contrast can't be measured here. The end to end tests check it in real browsers
const JSDOM_UNSUPPORTED_RULES = ['color-contrast', 'color-contrast-enhanced'];

interface AxeCheckOptions {
  // Extra rules to turn off, for example `region` when testing a component outside a page
  disableRules?: string[];
}

function formatViolations(violations: Result[]): string {
  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => `    ${node.target.join(' ')}`).join('\n');

      return `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}\n${targets}`;
    })
    .join('\n\n');
}

export async function expectNoAxeViolations(
  container: Element,
  { disableRules = [] }: AxeCheckOptions = {},
): Promise<void> {
  const rules = Object.fromEntries(
    [...JSDOM_UNSUPPORTED_RULES, ...disableRules].map((id) => [id, { enabled: false }]),
  );
  const options: RunOptions = { runOnly: { type: 'tag', values: WCAG_TAGS }, rules };
  const { violations } = await axe.run(container, options);

  expect(violations, formatViolations(violations)).toHaveLength(0);
}
