import { describe, expect, it } from 'vitest';

import { markAbbreviations, markLinkOnlyItems, renderMarkdown } from './markdown';

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
    const html = renderMarkdown('[The guidelines](https://www.w3.org/TR/WCAG22/)');

    expect(html).toContain('<a href="https://www.w3.org/TR/WCAG22/">The guidelines <svg');
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

describe('markAbbreviations', () => {
  it('marks up each abbreviation with its full form (WCAG 3.1.4)', () => {
    expect(markAbbreviations('<p>Save it as a PDF, or two PDFs.</p>')).toBe(
      '<p>Save it as a <abbr title="Portable Document Format">PDF</abbr>, or two <abbr title="Portable Document Format">PDFs</abbr>.</p>',
    );
  });

  it('ignores capitals inside other words', () => {
    expect(markAbbreviations('<p>A UKULELE band.</p>')).toBe('<p>A UKULELE band.</p>');
  });

  it('leaves code, and abbreviations already marked up, as they are', () => {
    const html =
      '<pre><code>const pdf = "PDF";</code></pre><p><code>HTML</code> and <abbr title="x">CSS</abbr></p>';

    expect(markAbbreviations(html)).toBe(html);
  });

  it('marks up abbreviations after code, in headings and in links', () => {
    expect(markAbbreviations('<p><code>x</code> HTML</p><h3>CSS</h3><a href="/a">PDF</a>')).toBe(
      '<p><code>x</code> <abbr title="HyperText Markup Language">HTML</abbr></p><h3><abbr title="Cascading Style Sheets">CSS</abbr></h3><a href="/a"><abbr title="Portable Document Format">PDF</abbr></a>',
    );
  });

  it('never changes what’s inside a tag, such as an address', () => {
    const html = '<a href="https://example.com/PDF">guide</a>';

    expect(markAbbreviations(html)).toBe(html);
  });

  it('runs on every resource’s text', () => {
    expect(renderMarkdown('An ADHD guide.')).toBe(
      '<p>An <abbr title="attention deficit hyperactivity disorder">ADHD</abbr> guide.</p>\n',
    );
  });
});
