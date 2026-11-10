import { spawn } from 'node:child_process';
import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

import { basePathOf, siteUrlFromEnv } from '../src/seo/siteUrl.ts';

const ROOT = join(import.meta.dirname, '..');
const PREVIEW = join(ROOT, '.pages-preview');
const site = join(PREVIEW, ...basePathOf(siteUrlFromEnv(process.env)).split('/').filter(Boolean));

await rm(PREVIEW, { recursive: true, force: true });
await mkdir(site, { recursive: true });
await cp(join(ROOT, 'build', 'client'), site, { recursive: true });

spawn('pnpm', ['exec', 'serve', PREVIEW, '--listen', '4174', '--no-clipboard'], {
  cwd: ROOT,
  stdio: 'inherit',
});
