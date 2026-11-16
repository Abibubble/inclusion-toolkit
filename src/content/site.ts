export const SITE_NAME = 'Inclusion Toolkit';

export const SITE_DESCRIPTION = 'Free resources about accessibility and neurodiversity.';

export function pageTitle(page: string): string {
  return `${page}, ${SITE_NAME}`;
}
