import { describe, expect, it } from 'vitest';

import {
  linkGlossaryTerms,
  markAbbreviations,
  markLinkOnlyItems,
  markSummaries,
  renderMarkdown,
} from './markdown';

describe('markSummaries', () => {
  it('puts the "In short" heading and its paragraph in a box', () => {
    expect(renderMarkdown('### In short\n\nKeep it simple.\n\n### What is it for?')).toBe(
      '<div class="summary"><h3>In short</h3>\n<p>Keep it simple.</p></div>\n<h3>What is it for?</h3>\n',
    );
  });

  it('works for the fourth level summaries on the all-in-one pages', () => {
    expect(markSummaries('<h4>In short</h4>\n<p>One.</p>\n<h4>In short</h4>\n<p>Two.</p>')).toBe(
      '<div class="summary"><h4>In short</h4>\n<p>One.</p></div>\n<div class="summary"><h4>In short</h4>\n<p>Two.</p></div>',
    );
  });

  it('leaves other headings alone', () => {
    const html = '<h3>Overview</h3>\n<p>Text.</p>';

    expect(markSummaries(html)).toBe(html);
  });
});

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

describe('writing out abbreviations', () => {
  it('writes an abbreviation out in full the first time, and only marks it up after that', () => {
    expect(markAbbreviations('<p>Meet SC 2.5.8, then SC 2.5.5.</p>')).toBe(
      '<p>Meet success criterion (<abbr title="success criterion">SC</abbr>) 2.5.8, then <abbr title="success criterion">SC</abbr> 2.5.5.</p>',
    );
  });

  it('starts with a capital letter at the start of a sentence or block', () => {
    expect(markAbbreviations('<p>SC 1.4.3 matters. SC 1.4.6 too.</p><li>MDN Web Docs</li>')).toBe(
      '<p>Success criterion (<abbr title="success criterion">SC</abbr>) 1.4.3 matters. <abbr title="success criterion">SC</abbr> 1.4.6 too.</p><li>Mozilla Developer Network (<abbr title="Mozilla Developer Network">MDN</abbr>) Web Docs</li>',
    );
  });

  it('leaves it alone when the text already writes it out, including in a plural', () => {
    expect(
      markAbbreviations('<p>Assistive Technology (AT) and IQs. Intelligence quotients (IQs)</p>'),
    ).toBe(
      '<p>Assistive Technology (<abbr title="assistive technology">AT</abbr>) and intelligence quotients (<abbr title="intelligence quotient">IQs</abbr>). Intelligence quotients (<abbr title="intelligence quotient">IQs</abbr>)</p>',
    );
  });

  it('never writes out ones most people know, or text in code', () => {
    expect(markAbbreviations('<p>A TV and <code>WAI</code>, then WAI.</p>')).toBe(
      '<p>A <abbr title="television">TV</abbr> and <code>WAI</code>, then Web Accessibility Initiative (<abbr title="Web Accessibility Initiative">WAI</abbr>).</p>',
    );
  });
});

describe('linkGlossaryTerms', () => {
  it('links the first use of each glossary term to the glossary, saying so in its name', () => {
    expect(linkGlossaryTerms('<p>Add alt text. Good alt text helps.</p>')).toBe(
      '<p>Add <a href="/glossary#alt-text" aria-label="alt text, in the glossary">alt text</a>. Good alt text helps.</p>',
    );
  });

  it('finds plurals and other names for the same thing', () => {
    expect(linkGlossaryTerms('<p>Use landmarks and popovers.</p>')).toBe(
      '<p>Use <a href="/glossary#landmark" aria-label="landmarks, in the glossary">landmarks</a> and <a href="/glossary#tooltip-popover" aria-label="popovers, in the glossary">popovers</a>.</p>',
    );
  });

  it('only matches whole words', () => {
    const html = '<p>A personal reflowable page.</p>';

    expect(linkGlossaryTerms(html)).toBe(html);
  });

  it('leaves headings, links, code and everyday words alone', () => {
    const html =
      '<h3>Alt text</h3><p><a href="/x">alt text</a> <code>modal</code>, and focus on people.</p>';

    expect(linkGlossaryTerms(html)).toBe(html);
  });
});
