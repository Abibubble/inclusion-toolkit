import { test as base } from '@playwright/test';

export * from '@playwright/test';

interface Options {
  /** Turn off to test what happens before React starts. */
  waitForReact: boolean;
}

export const test = base.extend<Options>({
  waitForReact: [true, { option: true }],
  // Pages are prerendered, so they show before React handles clicks. Each page load waits for
  // React, so slow runners don't act too soon.
  page: async ({ page, waitForReact, javaScriptEnabled }, provide) => {
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
