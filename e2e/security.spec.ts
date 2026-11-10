import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  toolkitFilePaths,
  toolkitItemRecords,
  unpublishedToolkitFiles,
} from '../src/content/toolkit';
import { ROUTES } from './support/routes';
import { type Page, expect, test } from './support/test';

async function recordViolations(page: Page): Promise<() => Promise<string[]>> {
  await page.addInitScript(() => {
    const blocked: string[] = [];
    Object.assign(window, { blockedByPolicy: blocked });
    document.addEventListener('securitypolicyviolation', (event) => {
      blocked.push(`${event.violatedDirective}: ${event.blockedURI || 'inline'}`);
    });
  });
  return () =>
    page.evaluate(() => (window as unknown as { blockedByPolicy: string[] }).blockedByPolicy);
}

test.describe('Content Security Policy', () => {
  for (const { name, path } of ROUTES) {
    test(`${name} runs everything it needs, with nothing blocked`, async ({ page }) => {
      const violations = await recordViolations(page);
      await page.goto(path);

      await expect(page.locator('html')).toHaveAttribute('data-js', '');
      await expect(page.getByRole('combobox', { name: 'Theme' })).toBeEnabled();
      expect(await violations()).toEqual([]);
    });
  }

  test('allows moving between pages, and searching the toolkit', async ({ page }) => {
    const violations = await recordViolations(page);
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Search resources' }).fill('tremor');
    await expect(page.getByText(/results? found/)).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Neurodiversity' })
      .click();

    await expect(page.getByRole('heading', { level: 1, name: 'Neurodiversity' })).toBeVisible();
    expect(await violations()).toEqual([]);
  });

  test('blocks a script the policy doesn’t know about', async ({ page }) => {
    const violations = await recordViolations(page);
    await page.goto('/');

    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = 'window.injected = true;';
      document.body.append(script);
    });

    expect(await page.evaluate(() => 'injected' in window)).toBe(false);
    expect(await violations()).toEqual(['script-src-elem: inline']);
  });
});

/** Every page in the built site, as text */
function builtPages(): { file: string; html: string }[] {
  return readdirSync('build/client', { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.html'))
    .map((file) => ({ file, html: readFileSync(join('build/client', file), 'utf8') }));
}

test.describe('The built site', () => {
  test('has nothing about the toolkit’s resources that’s only for tracking', () => {
    const tracking = toolkitItemRecords().flatMap(({ item }) => item.todo);
    const site = builtPages()
      .map(({ html }) => html)
      .join('\n');

    for (const text of tracking) {
      expect(site.includes(text), text).toBe(false);
    }
  });

  test('has no files for resources that aren’t ready, and every file for ones that are', () => {
    const unpublished = new Set(unpublishedToolkitFiles());

    for (const { slugs, item } of toolkitItemRecords()) {
      for (const path of toolkitFilePaths(slugs, item)) {
        expect(existsSync(join('build/client', path)), path).toBe(!unpublished.has(path));
      }
    }
  });

  test('never links to the old toolkit address on abiharrisonnye.dev', () => {
    for (const { file, html } of builtPages()) {
      expect(html.includes('abiharrisonnye.dev'), file).toBe(false);
    }
  });
});
