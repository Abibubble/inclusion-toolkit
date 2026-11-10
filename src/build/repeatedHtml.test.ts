import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RichText } from '../components/RichText';
import { PAGE_HTML_ATTRIBUTE, markedId, pageHtmlMarker, withoutRepeatedHtml } from './repeatedHtml';

const SHOWN = '<h3>Introduction</h3><p>This guide is <strong>free</strong> & open.</p>';

/** Encodes page data the way React Router does: a JSON array, as a string in a script */
function dataScript(values: unknown[], rest: string[] = []): string {
  const data = [JSON.stringify(values), ...rest].join('\n');
  const escaped = JSON.stringify(data).replace(
    /[&<>]/g,
    (match) => `\\u00${match.charCodeAt(0).toString(16)}`,
  );
  return `<script>window.__reactRouterContext.streamController.enqueue(${escaped});</script>`;
}

/** The values in a page's data, decoded */
function dataValues(page: string): unknown[] {
  const match = /enqueue\(("(?:[^"\\]|\\.)*")\)/.exec(page);
  const data = JSON.parse(match?.[1] ?? '""') as string;
  return JSON.parse(data.split('\n')[0] ?? '[]') as unknown[];
}

function page(body: string, values: unknown[], rest: string[] = []): string {
  return `<!DOCTYPE html><html><head></head><body>${body}${dataScript(values, rest)}</body></html>`;
}

const shownDiv = (id: string, html: string) =>
  `<div class="richText" ${PAGE_HTML_ATTRIBUTE}="${id}">${html}</div>`;

describe('pageHtmlMarker and markedId', () => {
  it('gives back the ID a marker was made with', () => {
    expect(markedId(pageHtmlMarker('_R_6r5_'))).toBe('_R_6r5_');
  });

  it('gives nothing for ordinary text', () => {
    expect(markedId('<p>Hello</p>')).toBeUndefined();
  });
});

describe('withoutRepeatedHtml', () => {
  it('swaps HTML that’s already on the page for a marker, and keeps everything else', () => {
    const before = page(shownDiv('_R_1_', SHOWN), [{ _1: 2 }, 'textHtml', SHOWN, 'Title'], [
      'P3:[]',
    ]);
    const after = withoutRepeatedHtml(before);

    expect(dataValues(after)).toEqual([
      { _1: 2 },
      'textHtml',
      pageHtmlMarker('_R_1_'),
      'Title',
    ]);
    expect(after).toContain('P3:[]');
    expect(after).toContain(shownDiv('_R_1_', SHOWN));
    expect(after.length).toBeLessThan(before.length);
  });

  it('matches each piece of HTML to the element showing it', () => {
    const other = '<p>Slide 2</p>';
    const after = withoutRepeatedHtml(
      page(shownDiv('_R_1_', SHOWN) + shownDiv('_R_2_', other), [other, SHOWN]),
    );

    expect(dataValues(after)).toEqual([pageHtmlMarker('_R_2_'), pageHtmlMarker('_R_1_')]);
  });

  it('keeps the data safe inside its script', () => {
    const after = withoutRepeatedHtml(page(shownDiv('_R_1_', SHOWN), [SHOWN, '</script><b>&']));
    const script = /<script>window[\s\S]*?<\/script>/.exec(after)?.[0] ?? '';

    expect(script.slice('<script>'.length, -'</script>'.length)).not.toMatch(/[<>&]/);
    expect(dataValues(after)).toEqual([pageHtmlMarker('_R_1_'), '</script><b>&']);
  });

  it('leaves HTML that isn’t shown exactly as it is, such as part of a longer text', () => {
    const before = page(shownDiv('_R_1_', SHOWN), ['<h3>Introduction</h3>', SHOWN.toUpperCase()]);

    expect(withoutRepeatedHtml(before)).toBe(before);
  });

  it('leaves pages that show no HTML as they are, even without data', () => {
    const plain = '<!DOCTYPE html><html><head></head><body><p>Hi</p></body></html>';

    expect(withoutRepeatedHtml(plain)).toBe(plain);
  });

  it('stops the build if the data isn’t in exactly 1 script, in case React Router changes', () => {
    const body = shownDiv('_R_1_', SHOWN);

    expect(() => withoutRepeatedHtml(`<body>${body}</body>`)).toThrow(/has 0/);
    expect(() =>
      withoutRepeatedHtml(`<body>${body}${dataScript([SHOWN])}${dataScript([])}</body>`),
    ).toThrow(/has 2/);
  });

  it('finds the HTML that the RichText component renders', () => {
    const body = renderToString(createElement(RichText, { html: SHOWN }));
    const id = new RegExp(`${PAGE_HTML_ATTRIBUTE}="([^"]+)"`).exec(body)?.[1] ?? '';

    expect(dataValues(withoutRepeatedHtml(page(body, [SHOWN])))).toEqual([pageHtmlMarker(id)]);
  });
});
