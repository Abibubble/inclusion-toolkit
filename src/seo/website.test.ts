import { describe, expect, it } from 'vitest';

import { websiteSchema } from './website';

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
