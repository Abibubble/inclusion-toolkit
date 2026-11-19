import { describe, expect, it } from 'vitest';

import { breadcrumbSchema, websiteSchema } from './website';

describe('websiteSchema', () => {
  it('describes the site, with its name, address and description', () => {
    expect(websiteSchema()).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Inclusion Toolkit',
      url: 'http://localhost:4173/',
      description: 'Free resources about accessibility and neurodiversity.',
      inLanguage: 'en-GB',
    });
  });

  it('says the content is shared under CC BY 4.0', () => {
    expect(websiteSchema().license).toBe('https://creativecommons.org/licenses/by/4.0/');
  });
});

describe('breadcrumbSchema', () => {
  it('lists each step from Home to the page, in order, at the addresses they’re served from', () => {
    expect(
      breadcrumbSchema(
        [
          { title: 'Home', path: '/' },
          { title: 'Neurodiversity', path: '/neurodiversity' },
        ],
        { title: 'ADHD', path: '/neurodiversity/infographics/adhd' },
      ),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'http://localhost:4173/' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Neurodiversity',
          item: 'http://localhost:4173/neurodiversity/',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'ADHD',
          item: 'http://localhost:4173/neurodiversity/infographics/adhd/',
        },
      ],
    });
  });
});
