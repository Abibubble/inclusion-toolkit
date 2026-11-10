import { Marked, type RendererObject } from 'marked';

/**
 * Turns the toolkit's Markdown into HTML. Only loaders use this, and loaders run when the site is
 * built, so neither the Markdown nor the Markdown library are sent to visitors' browsers. They get
 * finished HTML
 */

/** The arrow icon external links use, matching the Link component */
const EXTERNAL_ICON =
  '<svg class="externalIcon" aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h7v7M13 3 4 12" /></svg>';

/**
 * Links to other sites get the same arrow and hidden “(external site)” text as the Link component,
 * so they're announced and look the same wherever they are
 */
const linkRenderer: RendererObject = {
  link({ href, tokens }) {
    const inner = this.parser.parseInline(tokens);
    const safeHref = href.replaceAll('"', '&quot;');
    if (!/^https?:\/\//.test(href)) return `<a href="${safeHref}">${inner}</a>`;

    return `<a href="${safeHref}">${inner} ${EXTERNAL_ICON}<span class="screenReaderOnly">(external site)</span></a>`;
  },
};

const markdown = new Marked({ gfm: true, renderer: linkRenderer });

/**
 * Marks list items that are only a link, such as a list of useful links. The link stands on its own
 * rather than in a sentence, so it needs a full size target (WCAG 2.5.5)
 */
export function markLinkOnlyItems(html: string): string {
  return html.replace(
    /<li>(<a [^>]*>(?:(?!<\/?a[ >]).)*<\/a>)<\/li>/g,
    '<li class="linkOnly">$1</li>',
  );
}

/**
 * Turns a resource's text into HTML. It sits under the page's "What’s in it" heading, so it uses
 * third level headings (###) and below, which a test checks
 */
export function renderMarkdown(source: string): string {
  return markLinkOnlyItems(markdown.parse(source, { async: false }));
}
