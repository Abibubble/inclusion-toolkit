import { describe, expect, it } from 'vitest';

import { markLinkOnlyItems, renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('turns Markdown into HTML', () => {
    expect(renderMarkdown('### Colours\n\nUse **enough** contrast.')).toBe(
      '<h3>Colours</h3>\n<p>Use <strong>enough</strong> contrast.</p>\n',
    );
  });

  it('leaves links within the site as plain links', () => {
    expect(renderMarkdown('[Highlights](/highlights)')).toBe(
      '<p><a href="/highlights">Highlights</a></p>\n',
    );
  });

  it('marks links to other sites, for everyone and not just people who can see the icon', () => {
    const html = renderMarkdown('[WCAG](https://www.w3.org/TR/WCAG22/)');

    expect(html).toContain('<a href="https://www.w3.org/TR/WCAG22/">WCAG <svg');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('<span class="screenReaderOnly">(external site)</span></a>');
  });

  it('escapes quotes in addresses, so they can’t break out of the link', () => {
    expect(renderMarkdown('[Odd](https://example.com/"onclick")')).toContain(
      'href="https://example.com/&quot;onclick&quot;"',
    );
  });
});

describe('markLinkOnlyItems', () => {
  it('marks list items that are only a link, so they get a full size target', () => {
    expect(markLinkOnlyItems('<ul><li><a href="/a">A</a></li></ul>')).toBe(
      '<ul><li class="linkOnly"><a href="/a">A</a></li></ul>',
    );
  });

  it('leaves links in a sentence alone', () => {
    const html = '<ul><li>See <a href="/a">A</a> first</li></ul>';

    expect(markLinkOnlyItems(html)).toBe(html);
  });
});
