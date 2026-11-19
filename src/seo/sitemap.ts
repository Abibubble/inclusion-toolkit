import { fileUrl, pageUrl } from './siteUrl';

export function pagePaths(htmlFiles: readonly string[]): string[] {
  return htmlFiles
    .map((file) => file.replaceAll('\\', '/'))
    .filter((file) => file === 'index.html' || file.endsWith('/index.html'))
    .map((file) => `/${file.replace(/\/?index\.html$/, '')}`)
    .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));
}

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * Every page's address. Pages with a date, as YYYY-MM-DD, get it as their last change, so search
 * engines know which to check again
 */
export function sitemapXml(
  siteUrl: string,
  paths: readonly string[],
  lastChanged: ReadonlyMap<string, string> = new Map(),
): string {
  const urls = paths.map((path) => {
    const date = lastChanged.get(path);
    return [
      '  <url>',
      `    <loc>${escapeXml(pageUrl(siteUrl, path))}</loc>`,
      ...(date ? [`    <lastmod>${date}</lastmod>`] : []),
      '  </url>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

export function robotsTxt(siteUrl: string): string {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${fileUrl(siteUrl, '/sitemap.xml')}`, ''].join(
    '\n',
  );
}
