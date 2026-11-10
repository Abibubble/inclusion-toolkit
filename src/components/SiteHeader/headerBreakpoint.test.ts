// @vitest-environment node
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

// The width where the full nav replaces the menu button. Other queries, such as the smaller site
// name on the narrowest screens, don't count
const queries = (css: string) =>
  [...css.matchAll(/@container site-header \(([^)]+)\)/g)]
    .map(([, q = '']) => q)
    .filter((q) => q.startsWith('width >='));

describe('header switch point', () => {
  it('is the same in the header and the nav, so they always switch together', () => {
    const header = queries(read('./SiteHeader.module.css'));
    const nav = queries(read('../SiteNav/SiteNav.module.css'));

    expect(header).toHaveLength(1);
    expect(nav).toEqual(header);
  });

  it('is measured in em, so it moves with the text size setting', () => {
    expect(queries(read('./SiteHeader.module.css'))[0]).toMatch(/^width >= [\d.]+em$/);
  });
});
