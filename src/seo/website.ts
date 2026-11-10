import { LICENCE_URL } from '../content/about';
import { SITE_DESCRIPTION, SITE_NAME } from '../content/site';
import { absolutePageUrl } from './pageMeta';

/** Describes the site to search engines, so they show its name and know its licence */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absolutePageUrl('/'),
    description: SITE_DESCRIPTION,
    inLanguage: 'en-GB',
    license: LICENCE_URL,
  };
}
