import { Marked, type RendererObject } from 'marked';

import { ABBREVIATIONS, ALWAYS_SHORT, type Abbreviation } from './abbreviations';
import { GLOSSARY, glossaryId } from './glossary';
import { GLOSSARY_PATH } from './navigation';

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

const NAMES = (Object.keys(ABBREVIATIONS) as Abbreviation[]).sort((a, b) => b.length - a.length);

// Each abbreviation as a whole word, with an optional plural "s", as in "PDFs". The same as AbbrText
const ABBREVIATION = new RegExp(
  `(?<![A-Za-z])(${NAMES.map((name) => name.replace('/', '\\/')).join('|')})(s?)(?![A-Za-z])`,
  'g',
);

// The HTML split into tags and the text between them
const TAG = /(<[^>]+>)/;

/** Elements whose text is left alone, and elements that start a new block of text */
const NO_ABBREVIATIONS = ['code', 'pre', 'abbr'];
const NO_GLOSSARY_LINKS = ['code', 'pre', 'abbr', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const BLOCKS = [
  'p',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'td',
  'th',
  'dt',
  'dd',
  'blockquote',
];

interface TextPart {
  text: string;
  /** Whether the text is inside one of the elements being skipped */
  skipped: boolean;
  /** Whether this is the first text in a block, such as a paragraph or list item */
  blockStart: boolean;
}

/**
 * Changes the text between the tags, and never the tags themselves, so addresses and other
 * attributes stay as they are. Elements in `skip` are left alone, along with everything in them
 */
function mapText(
  html: string,
  skip: readonly string[],
  change: (part: TextPart) => string,
): string {
  let skippedDepth = 0;
  let blockStart = false;

  return html
    .split(TAG)
    .map((part) => {
      const tag = /^<(\/?)([a-z0-9]+)/i.exec(part);
      if (tag) {
        const [, closing, name = ''] = tag;
        if (skip.includes(name.toLowerCase())) skippedDepth += closing ? -1 : 1;
        if (!closing && BLOCKS.includes(name.toLowerCase())) blockStart = true;
        return part;
      }
      if (!part) return part;
      const changed = change({ text: part, skipped: skippedDepth > 0, blockStart });
      if (part.trim()) blockStart = false;
      return changed;
    })
    .join('');
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Marks up every abbreviation in the text with its full form, the same way the Abbr component does
 * without JavaScript (WCAG 3.1.4). The first time an abbreviation is used, it's also written out in
 * full, unless the text already does that, or it's one most people know (ALWAYS_SHORT). The end to
 * end tests check every page does this. Text in code, and abbreviations already marked up, are
 * left as they are
 */
export function markAbbreviations(html: string): string {
  const used = new Set<Abbreviation>();
  let textSoFar = '';

  return mapText(html, NO_ABBREVIATIONS, ({ text, skipped, blockStart }) => {
    const before = textSoFar;
    textSoFar += text;
    if (skipped) return text;

    return text.replace(
      ABBREVIATION,
      (_match: string, name: Abbreviation, ending: string, index: number) => {
        const fullForm = ABBREVIATIONS[name];
        const abbr = `<abbr title="${fullForm}">${name}${ending}</abbr>`;
        const first = !used.has(name);
        used.add(name);
        if (!first || ALWAYS_SHORT.includes(name)) return abbr;

        const textBefore = `${before}${text.slice(0, index)}`.toLowerCase();
        const writtenOut = [`${fullForm} (`, `${fullForm}s (`].some((form) =>
          textBefore.endsWith(form.toLowerCase()),
        );
        if (writtenOut) return abbr;

        const startsSentence =
          (blockStart && !text.slice(0, index).trim()) || /[.!?]\s*$/.test(textBefore);
        const written = `${fullForm}${ending}`;
        return `${startsSentence ? capitalise(written) : written} (${abbr})`;
      },
    );
  });
}

/** The other names a glossary term goes by, which are split by a slash with a space either side */
export function termForms(term: string): string[] {
  return term.split(' / ').map((form) => form.trim());
}

/**
 * A pattern for one form of a glossary term, as a whole word, with or without a plural ending. A
 * straight or curly apostrophe matches either, as the text uses both
 */
export function termPattern(form: string): string {
  const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/['’]/g, "['’]");
  return /s$/i.test(escaped) && escaped.length > 3
    ? `${escaped.slice(0, -1)}s?`
    : `${escaped}(?:s|es)?`;
}

const LINKED_TERMS = GLOSSARY.filter(({ link }) => link !== false).map((entry) => ({
  entry,
  pattern: new RegExp(`^(?:${termForms(entry.term).map(termPattern).join('|')})$`, 'i'),
}));

const GLOSSARY_TERM = new RegExp(
  `(?<![A-Za-z-])(${LINKED_TERMS.flatMap(({ entry }) => termForms(entry.term).map(termPattern))
    .sort((a, b) => b.length - a.length)
    .join('|')})(?![A-Za-z-])`,
  'gi',
);

/**
 * Links the first use of each glossary term on a page to its explanation on the Glossary page
 * (WCAG 3.1.3). The link's name says it goes to the glossary, so it makes sense on its own (WCAG
 * 2.4.9). Terms in headings, links and code aren't linked
 */
export function linkGlossaryTerms(html: string): string {
  const linked = new Set<string>();

  return mapText(html, NO_GLOSSARY_LINKS, ({ text, skipped }) => {
    if (skipped) return text;

    return text.replace(GLOSSARY_TERM, (match: string) => {
      const term = LINKED_TERMS.find(({ pattern }) => pattern.test(match))?.entry;
      if (!term || linked.has(term.term)) return match;
      linked.add(term.term);
      return `<a href="${GLOSSARY_PATH}#${glossaryId(term.term)}" aria-label="${match}, in the glossary">${match}</a>`;
    });
  });
}

/**
 * Puts each "In short" heading and the paragraph after it in a box, so the summary stands out. The
 * box is only a div, so screen readers still find the summary by its heading
 */
export function markSummaries(html: string): string {
  return html.replace(
    /<(h[34])>In short<\/\1>\s*<p>([\s\S]*?)<\/p>/g,
    '<div class="summary"><$1>In short</$1>\n<p>$2</p></div>',
  );
}

/**
 * Turns a resource's text into HTML. It sits under the page's "What’s in it" heading, so it uses
 * third level headings (###) and below, which a test checks
 */
export function renderMarkdown(source: string): string {
  return markSummaries(
    markAbbreviations(
      markLinkOnlyItems(linkGlossaryTerms(markdown.parse(source, { async: false }))),
    ),
  );
}
