// Makes tagged PDFs from HTML pages with Playwright's Chromium.
// export.py runs it with a list of jobs.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { chromium } from 'playwright';

const { jobs } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const browser = await chromium.launch();
const page = await browser.newPage();

for (const { html, pdf, footer, sideMargin, slides } of jobs) {
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
}

await browser.close();
