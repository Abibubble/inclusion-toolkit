import { useId } from 'react';

import { PAGE_HTML_ATTRIBUTE, markedId } from '../../build/repeatedHtml';
import styles from './RichText.module.css';

interface RichTextProps {
  html: string;
}

/** HTML read back from the page, by element ID, so it's only read once */
const readBack = new Map<string, string>();

/**
 * The HTML to show. On the first page someone opens, the build swaps the HTML in the page's data for
 * a marker, as the same HTML is already on the page (see src/build/repeatedHtml.ts). So it's read
 * back from the page, which gives React exactly what's already there
 */
function htmlToShow(html: string): string {
  const id = markedId(html);
  if (id === undefined) return html;

  const known = readBack.get(id);
  if (known !== undefined) return known;

  const element = document.querySelector(`[${PAGE_HTML_ATTRIBUTE}="${CSS.escape(id)}"]`);
  if (!element) throw new Error(`The page has no element with ${PAGE_HTML_ATTRIBUTE}="${id}".`);
  readBack.set(id, element.innerHTML);

  return element.innerHTML;
}

/**
 * A resource's full text, or other long text. It's the site's own content, turned from Markdown into
 * HTML at build time, so it's safe to insert directly
 */
export function RichText({ html }: RichTextProps) {
  const id = useId();

  return (
    <div
      className={styles.richText}
      // PAGE_HTML_ATTRIBUTE. It must stay the last attribute, as the build looks for the HTML
      // straight after it
      data-page-html={id}
      dangerouslySetInnerHTML={{ __html: htmlToShow(html) }}
    />
  );
}
