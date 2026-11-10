/**
 * Long pages, such as toolkit resources, are turned from Markdown into HTML
 * when the site is built. Each page also carries its loader data in a script, so the browser can
 * take over the page without fetching anything. That data includes the same HTML, so the text was
 * sent twice.
 *
 * After the build, withoutRepeatedHtml swaps each piece of HTML in that data for a short marker,
 * when the same HTML is already on the page. When the page loads, the RichText component reads
 * the HTML back from the page instead. Pages reached by following a link fetch their data from a
 * separate file, with the HTML in full, so they don't need this.
 *
 * This file has no Node-only imports, as the browser uses the marker functions too
 */

/** Marks each element that shows HTML, with an ID that's the same in the build and the browser */
export const PAGE_HTML_ATTRIBUTE = 'data-page-html';

const MARKER_START = '\u0000page-html:';

/** The marker that stands in for the HTML shown in the element with this ID */
export function pageHtmlMarker(id: string): string {
  return `${MARKER_START}${id}`;
}

/** The ID of the element that shows this HTML, if it's a marker */
export function markedId(value: string): string | undefined {
  return value.startsWith(MARKER_START) ? value.slice(MARKER_START.length) : undefined;
}

const PAGE_DATA =
  /<script>window\.__reactRouterContext\.streamController\.enqueue\((?<data>"(?:[^"\\]|\\.)*")\);<\/script>/g;
const SHOWN_HTML = new RegExp(`${PAGE_HTML_ATTRIBUTE}="(?<id>[^"]*)">`, 'g');

/** The same escaping React Router uses, so the data is still safe inside a script */
const SCRIPT_ESCAPES: Record<string, string> = {
  '&': '\\u0026',
  '>': '\\u003e',
  '<': '\\u003c',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

function scriptString(value: string): string {
  return JSON.stringify(value).replace(/[&><\u2028\u2029]/g, (match) => SCRIPT_ESCAPES[match] ?? '');
}

/** Where the HTML in each marked element starts in the page, by the element's ID */
function shownHtmlStarts(html: string): Map<number, string> {
  return new Map(
    [...html.matchAll(SHOWN_HTML)].map((match) => [
      match.index + match[0].length,
      match.groups?.id ?? '',
    ]),
  );
}

/** The ID of the element showing exactly this HTML, if there is one */
function shownIn(html: string, starts: Map<number, string>, value: string): string | undefined {
  for (const [start, id] of starts) {
    if (html.startsWith(`${value}</div>`, start)) return id;
  }
  return undefined;
}

/** The page, with each piece of HTML in its data that's already shown on the page swapped for a marker */
export function withoutRepeatedHtml(html: string): string {
  const starts = shownHtmlStarts(html);
  if (starts.size === 0) return html;

  const scripts = [...html.matchAll(PAGE_DATA)];
  if (scripts.length !== 1) {
    throw new Error(
      `A page that shows HTML should have its data in 1 script, but has ${String(scripts.length)}. React Router may have changed how it adds the data.`,
    );
  }
  const [script] = scripts;
  const data = JSON.parse(script?.groups?.data ?? '""') as string;
  const [first = '', ...rest] = data.split('\n');
  const values = JSON.parse(first) as unknown[];

  let swapped = 0;
  const slimmer = values.map((value) => {
    if (typeof value !== 'string' || value === '') return value;
    const id = shownIn(html, starts, value);
    if (id === undefined) return value;
    swapped++;
    return pageHtmlMarker(id);
  });

  if (swapped === 0) return html;
  const newData = [JSON.stringify(slimmer), ...rest].join('\n');

  return html.replace(
    script?.[0] ?? '',
    () =>
      `<script>window.__reactRouterContext.streamController.enqueue(${scriptString(newData)});</script>`,
  );
}
