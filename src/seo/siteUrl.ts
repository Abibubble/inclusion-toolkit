export const LOCAL_SITE_URL = 'http://localhost:4173';

export function siteUrlFromEnv(env: Partial<Record<string, string>>): string {
  const value = env.SITE_URL?.trim();

  if (!value) {
    if (env.GITHUB_PAGES) {
      throw new Error(
        'Set SITE_URL to the site’s address, such as https://abibubble.github.io/inclusion-toolkit, as a repository variable for GitHub Actions.',
      );
    }
    return LOCAL_SITE_URL;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `SITE_URL must be a full address, such as https://example.com, not “${value}”.`,
    );
  }
  if (url.search || url.hash) {
    throw new Error(
      `SITE_URL must be just the site’s address, with nothing after it, not “${value}”.`,
    );
  }
  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
}

export function basePathOf(siteUrl: string): string {
  const path = new URL(siteUrl).pathname.replace(/\/+$/, '');
  return `${path}/`;
}

export function pageUrl(siteUrl: string, path: string): string {
  const page = path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`;
  return `${siteUrl}${page}`;
}

export function fileUrl(siteUrl: string, path: string): string {
  return `${siteUrl}${path}`;
}
