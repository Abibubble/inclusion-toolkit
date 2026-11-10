import { describe, expect, it } from 'vitest';

import { absolutePageUrl, pageMeta } from './pageMeta';
import { SHARE_IMAGE } from './shareImage';

const SITE = 'http://localhost:4173';

describe('absolutePageUrl', () => {
  it('puts the site’s address in front of a page, ending in a slash', () => {
    expect(absolutePageUrl('/about')).toBe(`${SITE}/about/`);
    expect(absolutePageUrl('/')).toBe(`${SITE}/`);
  });
});

describe('pageMeta', () => {
  const meta = pageMeta({
    title: 'About, Inclusion Toolkit',
    description: 'Who made the toolkit.',
    path: '/about',
  });

  it('has the title and description', () => {
    expect(meta).toContainEqual({ title: 'About, Inclusion Toolkit' });
    expect(meta).toContainEqual({ name: 'description', content: 'Who made the toolkit.' });
  });

  it('has the canonical address, so search engines know the one true address of the page', () => {
    expect(meta).toContainEqual({ tagName: 'link', rel: 'canonical', href: `${SITE}/about/` });
  });

  it('has Open Graph tags for share previews, matching the title and description', () => {
    expect(meta).toEqual(
      expect.arrayContaining([
        { property: 'og:url', content: `${SITE}/about/` },
        { property: 'og:title', content: 'About, Inclusion Toolkit' },
        { property: 'og:description', content: 'Who made the toolkit.' },
        { property: 'og:site_name', content: 'Inclusion Toolkit' },
        { property: 'og:locale', content: 'en_GB' },
      ]),
    );
  });

  it('has the share image, with its size and a description for people who can’t see it', () => {
    expect(meta).toEqual(
      expect.arrayContaining([
        { property: 'og:image', content: `${SITE}/share.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: SHARE_IMAGE.alt },
        { name: 'twitter:card', content: 'summary_large_image' },
      ]),
    );
  });
});
