import { describe, expect, it } from 'vitest';

import type { ToolkitPageData } from '../content/toolkitPage';
import { pageMeta } from '../seo/pageMeta';
import { websiteSchema } from '../seo/website';
import { loader, meta, toolkitSlugsFrom, withFolder } from './toolkit';

const ITEM = {
  slug: 'dark-mode',
  title: 'Dark mode',
  description: 'About dark mode.',
  updated: '2026-06-01',
  versions: [],
};

const metaFor = (loaderData: ToolkitPageData | undefined) =>
  meta({ loaderData } as Parameters<typeof meta>[0]);

describe('Inclusion Toolkit pages', () => {
  it.each([
    ['http://localhost/', []],
    ['http://localhost/_.data', []],
    ['http://localhost/highlights.data', ['highlights']],
    ['https://inclusiontoolkit.org/highlights/dark-mode/', ['highlights', 'dark-mode']],
  ])('finds the folders and resource in its address: %s', (url, slugs) => {
    expect(toolkitSlugsFrom(url)).toEqual(slugs);
  });

  it.each([
    ['https://abibubble.github.io/inclusion-toolkit/', []],
    ['https://abibubble.github.io/inclusion-toolkit/_.data', []],
    [
      'https://abibubble.github.io/inclusion-toolkit/highlights/dark-mode/',
      ['highlights', 'dark-mode'],
    ],
  ])('leaves out the base path, when the site has one: %s', (url, slugs) => {
    expect(toolkitSlugsFrom(url, '/inclusion-toolkit/')).toEqual(slugs);
  });

  it('gives the main page its own title and description', () => {
    expect(
      metaFor({
        kind: 'home',
        toolkit: { slug: '', title: 'Inclusion Toolkit', description: '', folders: [], items: [] },
        search: [],
      }),
    ).toEqual([
      ...pageMeta({
        title: 'Inclusion Toolkit',
        description: 'Free resources about accessibility and neurodiversity.',
        path: '/',
      }),
      { 'script:ld+json': websiteSchema() },
    ]);
  });

  it('gives each resource a title that says it’s part of the toolkit, at its own address', () => {
    expect(
      metaFor({
        kind: 'item',
        item: ITEM,
        slugs: ['highlights', 'dark-mode'],
        trail: [],
        textHtml: '',
      }),
    ).toEqual(
      pageMeta({
        title: 'Dark mode, Inclusion Toolkit',
        description: 'About dark mode.',
        path: '/highlights/dark-mode',
      }),
    );
  });

  it('adds the folder to a resource’s title, so two resources with the same name differ (WCAG 2.4.2)', () => {
    const trail = [
      { title: 'Home', path: '/' },
      { title: 'Highlights', path: '/highlights' },
      { title: 'Neurodiversity Highlights', path: '/highlights/neurodiversity' },
    ];

    expect(
      metaFor({
        kind: 'item',
        item: { ...ITEM, title: 'Meetings' },
        slugs: [],
        trail,
        textHtml: '',
      }),
    ).toContainEqual({ title: 'Meetings, Neurodiversity Highlights, Inclusion Toolkit' });
  });

  it.each([
    ['at the top of the toolkit', [{ title: 'Home', path: '/' }], 'Highlights'],
    [
      'named after their folder',
      [
        { title: 'Home', path: '/' },
        { title: 'Accessibility Infographics', path: '/infographics/accessibility' },
      ],
      'Accessibility Infographics',
    ],
  ])('keeps just the name for pages %s', (_, trail, title) => {
    expect(withFolder(title, trail)).toBe(title);
  });

  it('leaves the title to the not found page when there’s nothing to show', () => {
    expect(metaFor(undefined)).toEqual([]);
  });

  it('gives a 404 for an address that isn’t in the toolkit', () => {
    const args = {
      request: new Request('http://localhost/not-a-real-folder'),
    } as Parameters<typeof loader>[0];
    let thrown: unknown;
    try {
      loader(args);
    } catch (error) {
      thrown = error;
    }

    expect((thrown as { init?: { status?: number } }).init?.status).toBe(404);
  });
});
