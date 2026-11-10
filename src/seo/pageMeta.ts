import type { MetaDescriptor } from 'react-router';

import { SITE_NAME } from '../content/site';
import { SHARE_IMAGE } from './shareImage';
import { fileUrl, pageUrl } from './siteUrl';

export function absolutePageUrl(path: string): string {
  return pageUrl(__SITE_URL__, path);
}

interface PageMetaOptions {
  // The whole page title, usually from pageTitle()
  title: string;
  description: string;
  // The page's address on this site, such as /about
  path: string;
}

export function pageMeta({ title, description, path }: PageMetaOptions): MetaDescriptor[] {
  const url = absolutePageUrl(path);

  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: 'en_GB' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: fileUrl(__SITE_URL__, SHARE_IMAGE.path) },
    { property: 'og:image:width', content: String(SHARE_IMAGE.width) },
    { property: 'og:image:height', content: String(SHARE_IMAGE.height) },
    { property: 'og:image:alt', content: SHARE_IMAGE.alt },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
}
