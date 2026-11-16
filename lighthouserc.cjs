// Reports are saved in lighthouse-report/
const { readFileSync } = require('node:fs');

const { chromium } = require('playwright');

const SITE = 'http://localhost:4173';

// Resources in a folder's folders, such as each highlight, share one design, so only this sample
// of them is tested. e2e/support/routes.ts uses the same sample
const TOOLKIT_SAMPLE = [
  // The biggest page, a typical one with code in it, and a typical infographic
  'accessibility/highlights/accessibility-highlights',
  'accessibility/highlights/aria',
  'accessibility/infographics/arthritis',
];

function inSample(path) {
  const slugs = path.split('/').filter(Boolean);
  return slugs.length <= 2 || TOOLKIT_SAMPLE.includes(slugs.join('/'));
}

const sitemap = readFileSync('build/client/sitemap.xml', 'utf8');
const paths = [...sitemap.matchAll(/<loc>[^<]*?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map(
  ([, path]) => path,
);

// A renamed sample would quietly go untested, so this stops Lighthouse instead
for (const sample of TOOLKIT_SAMPLE) {
  if (!paths.some((path) => path.replace(/\/$/, '') === `/${sample}`)) {
    throw new Error(`The toolkit sample ${sample} isn't in the sitemap. Update TOOLKIT_SAMPLE.`);
  }
}

const allUrls = paths.filter(inSample).map((path) => `${SITE}${path}`);

// CI splits the pages between jobs. LIGHTHOUSE_SHARD, such as 2/3, says which share. Every third
// page goes to each, so the slower pages, which sit together in the list, are spread out
function shareOf(urlList, shard) {
  if (!shard) return urlList;
  const [number, total] = shard.split('/').map(Number);
  if (!(number >= 1 && number <= total)) {
    throw new Error(`LIGHTHOUSE_SHARD should be like 2/3, not ${shard}.`);
  }
  return urlList.filter((_, index) => index % total === number - 1);
}

const urls = shareOf(allUrls, process.env.LIGHTHOUSE_SHARD);

// Addresses ending like this need 0.9 for performance, not 0.95 (see assertMatrix)
const SLOWER_PAGES = '/accessibility/highlights/accessibility-highlights/$';

const ASSERTIONS = {
  'categories:performance': ['error', { minScore: 0.95 }],
  'categories:accessibility': ['error', { minScore: 1 }],
  'categories:best-practices': ['error', { minScore: 1 }],
  'categories:seo': ['error', { minScore: 1 }],
};

module.exports = {
  ci: {
    collect: {
      url: urls,
      startServerCommand: 'pnpm preview',
      startServerReadyPattern: 'Accepting connections',
      numberOfRuns: 3,
      chromePath: process.env.CHROME_PATH ?? chromium.executablePath(),
      // CI's Ubuntu 24.04 blocks Chrome's sandbox, so Chrome won't start with it. It only loads
      // this site. The small shared memory area in CI's container can crash Chrome
      settings: { chromeFlags: process.env.CI ? '--no-sandbox --disable-dev-shm-usage' : '' },
    },
    assert: {
      assertMatrix: [
        {
          // A very long page, so it scores a little lower: Lighthouse counts everything a slow
          // phone downloads before the first thing shows
          matchingUrlPattern: SLOWER_PAGES,
          assertions: { ...ASSERTIONS, 'categories:performance': ['error', { minScore: 0.9 }] },
        },
        { matchingUrlPattern: `^(?!.*${SLOWER_PAGES})`, assertions: ASSERTIONS },
      ],
    },
    upload: {
      target: 'filesystem',
      outputDir: 'lighthouse-report',
    },
  },
};
