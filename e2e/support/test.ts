import { test as base } from '@playwright/test';

export * from '@playwright/test';

interface Options {
  /** Wait for React to start after each page load. Turn off to test what happens before it does. */
  waitForReact: boolean;
}

export const test = base.extend<Options>({
  waitForReact: [true, { option: true }],
  // Pages are prerendered, so they appear before React starts. Using them sooner, as a slow test
  // runner can, means clicks and choices aren't handled yet. So each page load waits for React.
  page: async ({ page, waitForReact, javaScriptEnabled }, provide) => {
    // Without JavaScript, React never starts, so there's nothing to wait for.
    if (waitForReact && javaScriptEnabled) {
      const goto = page.goto.bind(page);
      page.goto = async (...args) => {
        const response = await goto(...args);
        await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
        return response;
      };
    }
    await provide(page);
  },
});
