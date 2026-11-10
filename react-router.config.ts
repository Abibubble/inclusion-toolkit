import { readdir, rename, rm, rmdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

import type { Config } from '@react-router/dev/config';

import { BASE_PATH } from './build-constants.ts';

const NOT_FOUND_PATH = '/404';

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

export default {
  appDirectory: 'src',
  basename: BASE_PATH,
  ssr: false,
  prerender: ({ getStaticPaths }) => [...getStaticPaths(), NOT_FOUND_PATH],
  routeDiscovery: { mode: 'initial' },
  async buildEnd({ reactRouterConfig }) {
    const client = join(reactRouterConfig.buildDirectory, 'client');

    // Prerendered pages go under the base path, but GitHub Pages serves the build from there already
    const [baseFolder, ...rest] = BASE_PATH.split('/').filter(Boolean);
    if (baseFolder) {
      await moveInto(join(client, baseFolder, ...rest), client);
      await rm(join(client, baseFolder), { recursive: true });
    }

    // Static hosts, including GitHub Pages, serve 404.html with a 404 status for unknown addresses
    await rename(join(client, NOT_FOUND_PATH, 'index.html'), join(client, '404.html'));
    await rmdir(join(client, NOT_FOUND_PATH));
  },
} satisfies Config;
