import { type RefObject, useEffect, useId, useRef } from 'react';
import { useInRouterContext, useNavigate } from 'react-router';

import { PAGE_HTML_ATTRIBUTE, markedId } from '../../build/repeatedHtml';
import styles from './RichText.module.css';

interface RichTextProps {
  html: string;
}

const readBack = new Map<string, string>();

/**
 * On the first page, the build swaps this HTML for a marker, as it's already on the page (see
 * src/build/repeatedHtml.ts). So it's read back from the page
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

/** A link to a page on this site, rather than a file, another site, or a new tab */
function sitePage(link: HTMLAnchorElement): string | undefined {
  const href = link.getAttribute('href') ?? '';
  if (!href.startsWith('/') || href.startsWith('//')) return undefined;
  if (link.target || link.hasAttribute('download')) return undefined;
  if (/\.[a-z0-9]+$/i.test(href.split(/[?#]/)[0] ?? '')) return undefined;
  return href;
}

/**
 * Sends site links in the text through the router, like every other link, so focus moves to the
 * new page's heading rather than the top (WCAG 2.4.3). New tab and window clicks are left to the
 * browser
 */
function SiteLinks({ text }: { text: RefObject<HTMLDivElement | null> }) {
  const navigate = useNavigate();

  useEffect(() => {
    const element = text.current;
    if (!element) return;

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      const page = link ? sitePage(link) : undefined;
      if (page === undefined) return;
      event.preventDefault();
      void navigate(page);
    }

    element.addEventListener('click', onClick);
    return () => {
      element.removeEventListener('click', onClick);
    };
  }, [navigate, text]);

  return null;
}

/** Built from the site's own Markdown at build time, so it's safe to insert */
export function RichText({ html }: RichTextProps) {
  const id = useId();
  const text = useRef<HTMLDivElement>(null);
  const inRouter = useInRouterContext();

  return (
    <>
      {inRouter && <SiteLinks text={text} />}
      <div
        ref={text}
        className={styles.richText}
        // PAGE_HTML_ATTRIBUTE. It must stay the last attribute, as the build looks for the HTML
        // straight after it
        data-page-html={id}
        dangerouslySetInnerHTML={{ __html: htmlToShow(html) }}
      />
    </>
  );
}
