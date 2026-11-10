import { TOOLKIT, toolkitEntries, toolkitPath } from '../../src/content/toolkit';
import type { DisplaySettings } from '../../src/settings/displaySettings';

export const SITE_PAGES = [
  { name: 'Inclusion Toolkit', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Accessibility statement', path: '/accessibility-statement' },
  { name: 'Display settings', path: '/display-settings' },
  { name: 'Glossary', path: '/glossary' },
  { name: 'Privacy', path: '/privacy' },
  { name: 'Page not found', path: '/this-page-does-not-exist' },
] as const;

/**
 * Tests tagged with this only run when every page is tested: Chromium in CI (see
 * playwright.config.ts). The resources in a toolkit folder's folders, such as each single
 * highlight, all share one design, so Firefox, WebKit and `pnpm commit:check` test the sample
 * below, which keeps the runs short as the toolkit grows. lighthouserc.cjs uses the same sample
 */
export const EVERY_PAGE = '@every-page';

const TOOLKIT_SAMPLE = [
  // The biggest page, a typical one with code in it, and a typical infographic
  'accessibility/highlights/accessibility-highlights',
  'accessibility/highlights/aria',
  'accessibility/infographics/arthritis',
];

function isSampledOut(kind: 'folder' | 'item', slugs: readonly string[]): boolean {
  return kind === 'item' && slugs.length > 2 && !TOOLKIT_SAMPLE.includes(slugs.join('/'));
}

// A renamed sample would quietly test nothing in Firefox and WebKit, so this stops the tests instead
for (const sample of TOOLKIT_SAMPLE) {
  if (!toolkitEntries(TOOLKIT).some(({ slugs }) => slugs.join('/') === sample)) {
    throw new Error(`The toolkit sample ${sample} isn't on the site. Update TOOLKIT_SAMPLE.`);
  }
}

export const ROUTES: readonly { name: string; path: string }[] = [
  ...SITE_PAGES,
  // Named by address, as two folders can each have a resource with the same title
  ...toolkitEntries(TOOLKIT).map(({ kind, slugs }) => ({
    name: `Toolkit: ${slugs.join('/')}${isSampledOut(kind, slugs) ? ` ${EVERY_PAGE}` : ''}`,
    path: toolkitPath(slugs),
  })),
];

export const THEMES = [
  { name: 'light', colorScheme: 'light' },
  { name: 'dark', colorScheme: 'dark' },
  { name: 'cream', colorScheme: 'light', settings: { theme: 'cream' } },
] as const satisfies readonly {
  name: string;
  colorScheme: 'light' | 'dark';
  settings?: Partial<DisplaySettings>;
}[];
