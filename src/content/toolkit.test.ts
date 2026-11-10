import { existsSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { formatDate } from '../components/Time';
import { ABOUT_PATH, MAIN_NAV } from './navigation';
import {
  TOOLKIT,
  TOOLKIT_RECORD,
  type ToolkitFolderRecord,
  type ToolkitItemRecord,
  fileType,
  findInToolkit,
  publicToolkit,
  toolkitEntries,
  toolkitFilePaths,
  toolkitItemRecords,
  toolkitPath,
  toolkitVersions,
  unpublishedToolkitFiles,
} from './toolkit';
import { TOOLKIT_TEXT } from './toolkitPage';

/** A top level resource's full guide, as the site lists it before the build adds the sizes */
const fullGuide = (slug: string) => ({
  name: 'Full guide',
  files: ['docx', 'pdf'].map((extension) => ({
    path: `files/${slug}.${extension}`,
    size: '',
  })),
});

const item = (slug: string, overrides: Partial<ToolkitItemRecord> = {}): ToolkitItemRecord => ({
  slug,
  title: slug,
  description: `About ${slug}.`,
  updated: '2026-06-01',
  slides: false,
  text: 'checked',
  todo: [],
  ...overrides,
});

const folder = (
  slug: string,
  items: ToolkitItemRecord[],
  folders: ToolkitFolderRecord[] = [],
): ToolkitFolderRecord => ({
  slug,
  title: slug,
  description: `The ${slug} folder.`,
  folders,
  items,
});

const EXAMPLE = folder(
  '',
  [item('checklist')],
  [
    folder(
      'highlights',
      [],
      [folder('accessibility', [item('dark-mode'), item('draft', { text: 'draft' })])],
    ),
    folder('empty', [item('not-written', { text: 'none' })]),
  ],
);

/** Every resource record in the real toolkit, with the slugs leading to it */
const realItems = () => toolkitItemRecords();

function realFolders(record: ToolkitFolderRecord = TOOLKIT_RECORD): ToolkitFolderRecord[] {
  return record.folders.flatMap((child) => [child, ...realFolders(child)]);
}

describe('publicToolkit', () => {
  const toolkit = publicToolkit(EXAMPLE);

  it('only shows resources whose text is checked, without what’s being tracked', () => {
    expect(toolkit.items).toEqual([
      {
        slug: 'checklist',
        title: 'checklist',
        description: 'About checklist.',
        updated: '2026-06-01',
        versions: [fullGuide('checklist')],
      },
    ]);
    expect(toolkit.folders[0]?.folders[0]?.items.map((entry) => entry.slug)).toEqual(['dark-mode']);
  });

  it('gives an infographic only its PowerPoint file and PDF, with no Word file', () => {
    expect(
      toolkitVersions(['infographics', 'asthma'], { slides: false, infographic: true }),
    ).toEqual([
      {
        name: 'Infographic',
        files: [
          { path: 'files/infographics/asthma.pptx', size: '' },
          { path: 'files/infographics/asthma.pdf', size: '' },
        ],
      },
    ]);
  });

  it('gives every other resource a full guide, and a visual summary if it has slides', () => {
    expect(toolkitVersions(['checklist'], { slides: false })).toEqual([fullGuide('checklist')]);
    expect(toolkitVersions(['deck'], { slides: true })).toEqual([
      fullGuide('deck'),
      {
        name: 'Visual summary',
        files: [
          { path: 'files/deck-visual-summary.pptx', size: '' },
          { path: 'files/deck-visual-summary.pdf', size: '' },
        ],
      },
    ]);
  });

  it('names each resource’s files after the slugs leading to it', () => {
    expect(toolkitFilePaths(['highlights', 'dark-mode'], { slides: true })).toEqual([
      'files/highlights/dark-mode.docx',
      'files/highlights/dark-mode.pdf',
      'files/highlights/dark-mode-visual-summary.pptx',
      'files/highlights/dark-mode-visual-summary.pdf',
    ]);
  });

  it('leaves out folders with nothing to show', () => {
    expect(toolkit.folders.map((child) => child.slug)).toEqual(['highlights']);
  });
});

describe('finding things in the toolkit', () => {
  const toolkit = publicToolkit(EXAMPLE);

  it('makes addresses from the slugs leading to a folder or resource', () => {
    expect(toolkitPath([])).toBe('/');
    expect(toolkitPath(['highlights', 'accessibility', 'dark-mode'])).toBe(
      '/highlights/accessibility/dark-mode',
    );
  });

  it('lists every folder and resource, each folder followed by what’s in it', () => {
    expect(
      toolkitEntries(toolkit).map((entry) => `${entry.kind} ${entry.slugs.join('/')}`),
    ).toEqual([
      'folder highlights',
      'folder highlights/accessibility',
      'item highlights/accessibility/dark-mode',
      'item checklist',
    ]);
  });

  it('finds a folder, with the folders above it as breadcrumbs', () => {
    const found = findInToolkit(['highlights', 'accessibility'], toolkit);

    expect(found?.kind).toBe('folder');
    expect(found?.trail).toEqual([
      { title: 'Home', path: '/' },
      { title: 'highlights', path: '/highlights' },
    ]);
  });

  it('finds a resource, at the top level or in a folder', () => {
    expect(findInToolkit(['checklist'], toolkit)?.kind).toBe('item');
    expect(findInToolkit(['highlights', 'accessibility', 'dark-mode'], toolkit)).toMatchObject({
      kind: 'item',
      item: { slug: 'dark-mode' },
    });
  });

  it('finds nothing for an address that isn’t in the toolkit, or a resource that isn’t ready', () => {
    expect(findInToolkit(['missing'], toolkit)).toBeUndefined();
    expect(findInToolkit(['checklist', 'more'], toolkit)).toBeUndefined();
    expect(findInToolkit(['highlights', 'accessibility', 'draft'], toolkit)).toBeUndefined();
  });
});

describe('toolkit files', () => {
  it('says what kind of file each one is, from its extension', () => {
    expect(fileType({ path: 'a/b.pdf', size: '1KB' })).toBe('PDF');
    expect(fileType({ path: 'a/b.DOCX', size: '1KB' })).toBe('Word document');
    expect(fileType({ path: 'a/b.pptx', size: '1KB' })).toBe('PowerPoint');
  });

  it('lists the files of resources that aren’t ready, for the build to remove', () => {
    expect(unpublishedToolkitFiles(EXAMPLE)).toEqual([
      'files/highlights/accessibility/draft.docx',
      'files/highlights/accessibility/draft.pdf',
      'files/empty/not-written.docx',
      'files/empty/not-written.pdf',
    ]);
  });
});

describe('toolkit.json', () => {
  it('uses addresses made of lowercase words and hyphens, used once in each folder', () => {
    for (const record of [TOOLKIT_RECORD, ...realFolders()]) {
      const slugs = [...record.folders, ...record.items].map((entry) => entry.slug);

      expect(new Set(slugs).size, record.title).toBe(slugs.length);
      for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('gives every folder and resource a title and description', () => {
    for (const entry of [...realFolders(), ...realItems().map(({ item: record }) => record)]) {
      expect(entry.title, entry.slug).not.toBe('');
      expect(entry.description, entry.slug).toMatch(/\.$/);
    }
  });

  it('has a real date for when each resource was last updated', () => {
    for (const { item: record } of realItems()) {
      expect(record.updated, record.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(() => formatDate(record.updated), record.slug).not.toThrow();
    }
  });

  it('has every file each ready resource needs, so it can’t go live without them', () => {
    for (const { slugs, item: record } of realItems()) {
      if (record.text !== 'checked') continue;
      for (const path of toolkitFilePaths(slugs, record)) {
        expect(existsSync(`public/${path}`), path).toBe(true);
      }
    }
  });

  it('has no files in public/files/ that don’t belong to a resource, as they’d go live', () => {
    const expected = new Set(
      realItems().flatMap(({ slugs, item: record }) => toolkitFilePaths(slugs, record)),
    );
    const folder = 'public/files';
    const onDisk = existsSync(folder)
      ? readdirSync(folder, { recursive: true, withFileTypes: true })
          .filter((entry) => entry.isFile() && entry.name !== '.DS_Store')
          .map((entry) => `${entry.parentPath.replace(/^public\//, '')}/${entry.name}`)
      : [];

    expect(onDisk.filter((path) => !expected.has(path))).toEqual([]);
  });

  it('has a text file for every resource whose text is written, and no others', () => {
    const written = realItems()
      .filter(({ item: record }) => record.text !== 'none')
      .map(({ slugs }) => slugs.join('/'));

    expect(Object.keys(TOOLKIT_TEXT).toSorted()).toEqual(written.toSorted());
  });

  it('only marks text checked once nothing in it is left to check, starting headings at level 3', () => {
    for (const { slugs, item: record } of realItems()) {
      if (record.text !== 'checked') continue;
      const markdown = TOOLKIT_TEXT[slugs.join('/')] ?? '';

      expect(markdown, record.slug).not.toContain('[check:');
      for (const heading of markdown.match(/^#+ /gm) ?? []) {
        expect(heading.length, record.slug).toBeGreaterThanOrEqual(4);
      }
    }
  });
});

describe('the toolkit’s addresses', () => {
  // Other pages and files at the top of the site, which a top level folder or resource would clash with
  const RESERVED = [
    'about',
    'display-settings',
    'search.json',
    'files',
    'accessibility',
    'glossary',
    'privacy',
    '404',
  ];

  it('never use a name another page or folder at the top of the site needs', () => {
    const topLevel = [...TOOLKIT_RECORD.folders, ...TOOLKIT_RECORD.items].map(({ slug }) => slug);

    expect(topLevel.filter((slug) => RESERVED.includes(slug))).toEqual([]);
  });

  it('match the menu, which links to the top level folders by name', () => {
    for (const { label, to } of MAIN_NAV.filter(({ to }) => to !== '/' && to !== ABOUT_PATH)) {
      const folder = TOOLKIT.folders.find(({ slug }) => toolkitPath([slug]) === to);

      expect(folder?.title, to).toBe(label);
    }
  });
});
