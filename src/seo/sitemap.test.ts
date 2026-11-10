import { describe, expect, it } from 'vitest';

import { pagePaths, robotsTxt, sitemapXml } from './sitemap';

describe('pagePaths', () => {
  it('turns each page’s HTML file into its address, Home first, then in order', () => {
    expect(
      pagePaths([
        'privacy/index.html',
        'index.html',
        'highlights/accessibility/index.html',
        'about/index.html',
      ]),
    ).toEqual(['/', '/about', '/highlights/accessibility', '/privacy']);
  });

  it('leaves out files that aren’t pages, such as the not found page', () => {
    expect(pagePaths(['404.html', 'index.html', 'assets/notindex.html'])).toEqual(['/']);
  });

  it('handles Windows paths', () => {
    expect(pagePaths(['highlights\\index.html'])).toEqual(['/highlights']);
  });
});

describe('sitemapXml', () => {
  it('lists the full address of every page, ending in a slash as they’re served', () => {
    expect(sitemapXml('https://example.com', ['/', '/about'])).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        '    <loc>https://example.com/</loc>',
        '  </url>',
        '  <url>',
        '    <loc>https://example.com/about/</loc>',
        '  </url>',
        '</urlset>',
        '',
      ].join('\n'),
    );
  });

  it('escapes characters XML treats specially', () => {
    expect(sitemapXml('https://example.com', ["/a&b'"])).toContain(
      '<loc>https://example.com/a&amp;b&apos;/</loc>',
    );
  });
});

describe('robotsTxt', () => {
  it('allows everything, and points to the sitemap', () => {
    expect(robotsTxt('https://example.com')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml\n',
    );
  });
});
