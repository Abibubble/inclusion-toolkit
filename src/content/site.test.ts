import { describe, expect, it } from 'vitest';

import { pageTitle } from './site';

describe('pageTitle', () => {
  it('puts the page name before the site name', () => {
    expect(pageTitle('Highlights')).toBe('Highlights, Inclusion Toolkit');
  });
});
