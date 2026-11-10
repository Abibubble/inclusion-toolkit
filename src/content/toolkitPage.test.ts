import { describe, expect, it } from 'vitest';

import type { ToolkitFolder } from './toolkit';
import { formatFileSize, loadToolkitPage } from './toolkitPage';

const TOOLKIT: ToolkitFolder = {
  slug: '',
  title: 'Inclusion Toolkit',
  description: '',
  folders: [
    {
      slug: 'highlights',
      title: 'Highlights',
      description: 'Highlights.',
      folders: [],
      items: [
        {
          slug: 'dark-mode',
          title: 'Dark mode',
          description: 'About dark mode.',
          updated: '2026-06-01',
          versions: [
            {
              name: 'Full guide',
              files: [{ path: 'files/highlights/dark-mode.pdf', size: '' }],
            },
          ],
        },
      ],
    },
  ],
  items: [],
};

const TEXTS = { 'highlights/dark-mode': '### Dark mode\n\nLight text on a dark background.' };

/** Every file is 100KB, as the example files aren't real */
const sizeOf = () => '100KB';

const WITH_SIZES: ToolkitFolder = {
  ...TOOLKIT,
  folders: TOOLKIT.folders.map((folder) => ({
    ...folder,
    items: folder.items.map((item) => ({
      ...item,
      versions: item.versions.map((version) => ({
        ...version,
        files: version.files.map((file) => ({ ...file, size: '100KB' })),
      })),
    })),
  })),
};

function thrownStatus(load: () => unknown): number | undefined {
  try {
    load();
  } catch (error) {
    return (error as { init?: { status?: number } }).init?.status;
  }
  return undefined;
}

describe('loadToolkitPage', () => {
  it('gives the main page, with every folder and resource to search', () => {
    expect(loadToolkitPage([], TOOLKIT, TEXTS, sizeOf)).toEqual({
      kind: 'home',
      toolkit: WITH_SIZES,
      search: [
        {
          kind: 'folder',
          title: 'Highlights',
          description: 'Highlights.',
          path: '/highlights',
        },
        {
          kind: 'item',
          title: 'Dark mode',
          description: 'About dark mode.',
          path: '/highlights/dark-mode',
        },
      ],
    });
  });

  it('gives a folder, with breadcrumbs', () => {
    const page = loadToolkitPage(['highlights'], TOOLKIT, TEXTS, sizeOf);

    expect(page.kind).toBe('folder');
    expect(page.kind === 'folder' && page.trail).toEqual([{ title: 'Home', path: '/' }]);
  });

  it('gives a resource, with its text as HTML and each file’s size', () => {
    const page = loadToolkitPage(['highlights', 'dark-mode'], TOOLKIT, TEXTS, sizeOf);

    expect(page.kind === 'item' && page.item.versions[0]?.files[0]?.size).toBe('100KB');

    expect(page.kind === 'item' && page.textHtml).toBe(
      '<h3>Dark mode</h3>\n<p>Light text on a dark background.</p>\n',
    );
  });

  it('gives a 404 for an address that isn’t in the toolkit, or a resource without its text', () => {
    expect(thrownStatus(() => loadToolkitPage(['missing'], TOOLKIT, TEXTS))).toBe(404);
    expect(thrownStatus(() => loadToolkitPage(['highlights', 'dark-mode'], TOOLKIT, {}))).toBe(404);
  });

  it('shows sizes as computers do, with 1000 bytes to a kilobyte', () => {
    expect(formatFileSize(307_400)).toBe('307KB');
    expect(formatFileSize(112_500)).toBe('113KB');
    expect(formatFileSize(1_234_567)).toBe('1.2MB');
  });

  it('uses the real toolkit by default', () => {
    expect(loadToolkitPage([]).kind).toBe('home');
    expect(thrownStatus(() => loadToolkitPage(['not-a-real-folder']))).toBe(404);
  });
});
