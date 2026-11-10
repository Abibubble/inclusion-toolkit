import { describe, expect, it } from 'vitest';

import { LOCAL_SITE_URL, basePathOf, fileUrl, pageUrl, siteUrlFromEnv } from './siteUrl';

describe('siteUrlFromEnv', () => {
  it('uses SITE_URL, without a trailing slash', () => {
    expect(siteUrlFromEnv({ SITE_URL: 'https://example.com/' })).toBe('https://example.com');
  });

  it('keeps a path, for a site that isn’t at the root of its domain', () => {
    expect(siteUrlFromEnv({ SITE_URL: 'https://abibubble.github.io/inclusion-toolkit/' })).toBe(
      'https://abibubble.github.io/inclusion-toolkit',
    );
  });

  it('uses the local preview address for builds that aren’t for GitHub Pages', () => {
    expect(siteUrlFromEnv({})).toBe(LOCAL_SITE_URL);
    expect(siteUrlFromEnv({ SITE_URL: '  ' })).toBe(LOCAL_SITE_URL);
  });

  it('stops the GitHub Pages build without SITE_URL, so the live site never points at localhost', () => {
    expect(() => siteUrlFromEnv({ GITHUB_PAGES: 'true' })).toThrow('Set SITE_URL');
  });

  it.each(['example.com', 'not a url'])('rejects %s, which isn’t a full address', (value) => {
    expect(() => siteUrlFromEnv({ SITE_URL: value })).toThrow('must be a full address');
  });

  it.each(['https://example.com/?a=1', 'https://example.com/#top'])(
    'rejects %s, which has something after the address',
    (value) => {
      expect(() => siteUrlFromEnv({ SITE_URL: value })).toThrow('nothing after it');
    },
  );
});

describe('basePathOf', () => {
  it('is the root for a site at the root of its domain', () => {
    expect(basePathOf('https://example.com')).toBe('/');
  });

  it('is the path for a site under one, ending in a slash', () => {
    expect(basePathOf('https://abibubble.github.io/inclusion-toolkit')).toBe('/inclusion-toolkit/');
  });
});

describe('pageUrl', () => {
  const site = 'https://abibubble.github.io/inclusion-toolkit';

  it('ends each page’s address in a slash, as GitHub Pages serves it', () => {
    expect(pageUrl(site, '/highlights')).toBe(`${site}/highlights/`);
    expect(pageUrl(site, '/highlights/accessibility/')).toBe(`${site}/highlights/accessibility/`);
  });

  it('gives Home the site’s own address', () => {
    expect(pageUrl(site, '/')).toBe(`${site}/`);
  });
});

describe('fileUrl', () => {
  it('keeps the site’s path in front of a file', () => {
    expect(fileUrl('https://abibubble.github.io/inclusion-toolkit', '/share.png')).toBe(
      'https://abibubble.github.io/inclusion-toolkit/share.png',
    );
  });
});
