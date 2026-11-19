import { readFile, readdir, rename, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import { setDefaultAutoSelectFamily } from 'node:net';
import { join } from 'node:path';

import type { Config } from '@react-router/dev/config';

import { BASE_PATH, SITE_URL } from './build-constants.ts';
import { withoutRepeatedHtml } from './src/build/repeatedHtml.ts';
import { toolkitLastChanged, unpublishedToolkitFiles } from './src/content/toolkit.ts';
import { withContentSecurityPolicy } from './src/security/contentSecurityPolicy.ts';
import { pagePaths, robotsTxt, sitemapXml } from './src/seo/sitemap.ts';

const NOT_FOUND_PATH = '/404';

// Node gives each connection 250ms to open, and a big prerendered page sometimes kept it busy
// longer (connect ETIMEDOUT). The server is always local, so turn this off. Build only
setDefaultAutoSelectFamily(false);

async function isFolder(path: string): Promise<boolean> {
  return (await stat(path).catch(() => undefined))?.isDirectory() ?? false;
}

/** Moves everything in one folder into another, merging any folders both have */
async function moveInto(from: string, to: string): Promise<void> {
  for (const entry of await readdir(from)) {
    const source = join(from, entry);
    const target = join(to, entry);
    if ((await isFolder(source)) && (await isFolder(target))) {
      await moveInto(source, target);
      await rmdir(source);
    } else {
      await rename(source, target);
    }
  }
}

/** Pages prerender under the base path, but GitHub Pages already serves the build from there */
async function moveOutOfBasePath(client: string): Promise<void> {
  const [baseFolder, ...rest] = BASE_PATH.split('/').filter(Boolean);
  if (!baseFolder) return;
  await moveInto(join(client, baseFolder, ...rest), client);
  await rm(join(client, baseFolder), { recursive: true });
}

async function removeUnpublishedFiles(client: string): Promise<void> {
  await Promise.all(
    unpublishedToolkitFiles().map((path) => rm(join(client, path), { force: true })),
  );
}

/** Static hosts, including GitHub Pages, serve 404.html with a 404 status for unknown addresses */
async function moveNotFoundPage(client: string): Promise<void> {
  await rename(join(client, NOT_FOUND_PATH, 'index.html'), join(client, '404.html'));
  await rmdir(join(client, NOT_FOUND_PATH));
}

async function writeSeoFiles(client: string, htmlFiles: readonly string[]): Promise<void> {
  await writeFile(
    join(client, 'sitemap.xml'),
    sitemapXml(SITE_URL, pagePaths(htmlFiles), toolkitLastChanged()),
  );
  await writeFile(join(client, 'robots.txt'), robotsTxt(SITE_URL));
}

/** GitHub Pages can't send headers, so each page gets its own policy as a meta tag */
async function addSecurityPolicies(client: string, htmlFiles: readonly string[]): Promise<void> {
  await Promise.all(
    htmlFiles.map(async (file) => {
      const path = join(client, file);
      // The policy allows inline scripts by their hash, so it must come after any change to them
      const html = withoutRepeatedHtml(await readFile(path, 'utf8'));
      await writeFile(path, withContentSecurityPolicy(html));
    }),
  );
}

export default {
  appDirectory: 'src',
  basename: BASE_PATH,
  ssr: false,
  prerender: ({ getStaticPaths }) => [...getStaticPaths(), NOT_FOUND_PATH],
  routeDiscovery: { mode: 'initial' },
  async buildEnd({ reactRouterConfig }) {
    const client = join(reactRouterConfig.buildDirectory, 'client');
    await moveOutOfBasePath(client);
    await removeUnpublishedFiles(client);
    await moveNotFoundPage(client);

    const htmlFiles = (await readdir(client, { recursive: true })).filter((file) =>
      file.endsWith('.html'),
    );
    await writeSeoFiles(client, htmlFiles);
    await addSecurityPolicies(client, htmlFiles);
  },
} satisfies Config;
