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

interface Crumb {
  title: string;
  path: string;
}

/** The breadcrumbs from Home to a page, so search engines can show where it sits in the site */
export function breadcrumbSchema(trail: readonly Crumb[], current: Crumb) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [...trail, current].map(({ title, path }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: title,
      item: absolutePageUrl(path),
    })),
  };
}
