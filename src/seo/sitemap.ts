import { fileUrl, pageUrl } from './siteUrl';

export function pagePaths(htmlFiles: readonly string[]): string[] {
  return htmlFiles
    .map((file) => file.split('\\').join('/'))
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

export function sitemapXml(siteUrl: string, paths: readonly string[]): string {
  const urls = paths.map(
    (path) => `  <url>\n    <loc>${escapeXml(pageUrl(siteUrl, path))}</loc>\n  </url>`,
  );

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
