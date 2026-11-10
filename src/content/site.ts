export const SITE_NAME = 'Inclusion Toolkit';

/** What the site is, in one sentence. Used on the home page and in the share image */
export const SITE_DESCRIPTION = 'Free resources about accessibility and neurodiversity.';

export function pageTitle(page: string): string {
  return `${page}, ${SITE_NAME}`;
}
