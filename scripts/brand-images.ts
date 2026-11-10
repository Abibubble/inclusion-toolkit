/**
 * Draws the site's icons and share image from the mark in src/brand/mark.ts, into public/. Run it
 * with `pnpm brand-images` after changing the mark, the share image or the site description, then
 * commit the files it makes.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { chromium } from 'playwright';

import { MARK, markSvg } from '../src/brand/mark.ts';
import { SITE_DESCRIPTION, SITE_NAME } from '../src/content/site.ts';
import { SHARE_IMAGE } from '../src/seo/shareImage.ts';

const PUBLIC = join(import.meta.dirname, '..', 'public');
const FONT = join(
  import.meta.dirname,
  '..',
  'node_modules/@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2',
);
const COLOUR_TOKEN_FILES = ['primitives.css', 'colours.css'];
const COLOUR_TOKENS = (
  await Promise.all(
    COLOUR_TOKEN_FILES.map((file) =>
      readFile(join(import.meta.dirname, '../src/styles/tokens', file), 'utf8'),
    ),
  )
).join('\n');

const browser = await chromium.launch();

async function png(
  html: string,
  width: number,
  height: number,
): Promise<{ image: Buffer; pageBackground: string }> {
  const page = await browser.newPage({ viewport: { width, height } });
  const pageHtml = `
    <html data-theme="light">
      <head><style>${COLOUR_TOKENS}</style></head>
      <body style="margin:0">
        ${html}
        <span id="colour-probe" style="background:var(--color-bg)"></span>
      </body>
    </html>`;

  await page.setContent(pageHtml);
  await page.evaluate(() => document.fonts.ready);

  const pageBackground = await page
    .locator('#colour-probe')
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  const image = await page.screenshot({ omitBackground: true });

  await page.close();

  return { image, pageBackground };
}

function iconHtml(size: number, rounded: boolean): string {
  return `<div style="width:${String(size)}px;height:${String(size)}px">${markSvg({ rounded })}</div>`;
}

function ico(image: Buffer, size: number): Buffer {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(image.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, image]);
}

const font = (await readFile(FONT)).toString('base64');

const shareHtml = `
<style>
  @font-face {
    font-family: Atkinson;
    src: url(data:font/woff2;base64,${font});
  }
  .share-image {
    box-sizing: border-box;
    width: ${String(SHARE_IMAGE.width)}px;
    height: ${String(SHARE_IMAGE.height)}px;
    padding: 96px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 32px;
    background: var(--color-bg);
    border-bottom: 32px solid ${MARK.background};
    font-family: Atkinson;
    color: var(--color-text);
  }
  .share-image__mark {
    width: 128px;
    height: 128px;
  }
  .share-image__name {
    font-size: 88px;
    font-weight: 700;
    line-height: 1.1;
  }
  .share-image__headline {
    font-size: 44px;
    line-height: 1.3;
  }
</style>
<div class="share-image">
  <div class="share-image__mark">${markSvg()}</div>
  <div class="share-image__name">${SITE_NAME}</div>
  <div class="share-image__headline">${SITE_DESCRIPTION}</div>
</div>`;

const icon32 = await png(iconHtml(32, true), 32, 32);
const appleTouchIcon = await png(iconHtml(180, false), 180, 180);
const icon192 = await png(iconHtml(192, true), 192, 192);
const icon512 = await png(iconHtml(512, true), 512, 512);
const shareImage = await png(shareHtml, SHARE_IMAGE.width, SHARE_IMAGE.height);

await Promise.all([
  writeFile(join(PUBLIC, 'favicon.svg'), `${markSvg()}\n`),
  writeFile(join(PUBLIC, 'favicon.ico'), ico(icon32.image, 32)),
  writeFile(join(PUBLIC, 'apple-touch-icon.png'), appleTouchIcon.image),
  writeFile(join(PUBLIC, 'icon-192.png'), icon192.image),
  writeFile(join(PUBLIC, 'icon-512.png'), icon512.image),
  writeFile(join(PUBLIC, SHARE_IMAGE.path), shareImage.image),
  writeFile(
    join(PUBLIC, 'site.webmanifest'),
    `${JSON.stringify(
      {
        name: SITE_NAME,
        short_name: SITE_NAME,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        theme_color: shareImage.pageBackground,
        background_color: shareImage.pageBackground,
      },
      null,
      2,
    )}\n`,
  ),
]);

await browser.close();
