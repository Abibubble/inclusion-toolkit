import { basePathOf, siteUrlFromEnv } from './src/seo/siteUrl.ts';

export const SITE_URL = siteUrlFromEnv(process.env);

export const BASE_PATH = basePathOf(SITE_URL);

export const BUILD_DEFINES = {
  __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()),
  __SITE_URL__: JSON.stringify(SITE_URL),
};
