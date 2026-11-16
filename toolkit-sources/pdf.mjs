// Makes tagged PDFs from HTML pages with Playwright's Chromium, and pictures of single slides.
// export.py runs it with a list of jobs.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { chromium } from 'playwright';

const { jobs } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const browser = await chromium.launch();
const page = await browser.newPage();
// The slide's own size, and twice that for sharp screens
const picturePages = await Promise.all(
  [1, 2].map((deviceScaleFactor) =>
    browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor }),
  ),
);

/** Saves the slide as picture-{width}.png at each size */
async function savePictures(html, picture) {
  for (const picturePage of picturePages) {
    await picturePage.goto(pathToFileURL(html).href);
    await picturePage.evaluate(() => document.fonts.ready);
    const slide = picturePage.locator('.slide');
    const box = await slide.boundingBox();
    const scale = await picturePage.evaluate(() => devicePixelRatio);
    await slide.screenshot({ path: `${picture}-${String(Math.round(box.width * scale))}.png` });
  }
}

for (const { html, pdf, footer, sideMargin, slides, picture } of jobs) {
  await page.goto(pathToFileURL(html).href);
  await page.evaluate(() => document.fonts.ready);
  const layout = slides
    ? { preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } }
    : {
        format: 'A4',
        // Wider side margins keep lines under 80 characters (WCAG 1.4.8)
        margin: { top: '1in', right: sideMargin, bottom: '1in', left: sideMargin },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: footer,
      };
  await page.pdf({
    path: pdf,
    ...layout,
    printBackground: true,
    // Tags give the PDF its headings, lists, links and reading order, for screen readers, and the
    // outline lists the headings as bookmarks
    tagged: true,
    outline: true,
  });
  if (picture) await savePictures(html, picture);
}

await browser.close();
