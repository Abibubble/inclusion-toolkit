import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ToolkitFolder, ToolkitItem } from '../../content/toolkit';
import { type ToolkitSearchEntry, searchToolkit } from '../../content/toolkitSearch';
import { expectNoAxeViolations } from '../../test/axe';
import { renderWithRouter } from '../../test/render';
import { ToolkitPage } from './ToolkitPage';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ITEM: ToolkitItem = {
  slug: 'dark-mode',
  title: 'Dark mode',
  description: 'A highlight about dark mode.',
  updated: '2026-06-01',
  versions: [
    {
      name: 'Full guide',
      files: [
        { path: 'files/highlights/dark-mode.docx', size: '45KB' },
        { path: 'files/highlights/dark-mode.pdf', size: '120KB' },
      ],
    },
    {
      name: 'Visual summary',
      files: [
        { path: 'files/highlights/dark-mode-visual-summary.pptx', size: '300KB' },
        { path: 'files/highlights/dark-mode-visual-summary.pdf', size: '250KB' },
      ],
    },
  ],
};

const HIGHLIGHTS: ToolkitFolder = {
  slug: 'highlights',
  title: 'Highlights',
  description: 'Posts that highlight topics.',
  folders: [],
  items: [ITEM],
};

const TOOLKIT: ToolkitFolder = {
  slug: '',
  title: 'Inclusion Toolkit',
  description: '',
  folders: [HIGHLIGHTS],
  items: [],
};

const SEARCH: ToolkitSearchEntry[] = [
  {
    kind: 'folder',
    title: 'Highlights',
    description: 'Posts that highlight topics.',
    path: '/highlights',
  },
  {
    kind: 'item',
    title: 'Dark mode',
    description: 'A highlight about dark mode.',
    path: '/highlights/dark-mode',
  },
  {
    kind: 'item',
    title: 'Head pointer',
    description: 'Using a device with your head.',
    path: '/highlights/head-pointer',
  },
];

const TRAIL = [
  { title: 'Home', path: '/' },
  { title: 'Highlights', path: '/highlights' },
];

describe('ToolkitPage', () => {
  it('shows the main page with search, folders, and a link into each folder', () => {
    renderWithRouter(<ToolkitPage data={{ kind: 'home', toolkit: TOOLKIT, search: SEARCH }} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Inclusion Toolkit' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search resources' })).toBeInTheDocument();
    const folders = within(screen.getByRole('region', { name: 'Folders' }));
    expect(folders.getByRole('heading', { level: 3, name: 'Highlights' })).toBeInTheDocument();
    expect(folders.getByRole('link', { name: 'Open the Highlights folder' })).toHaveAttribute(
      'href',
      '/highlights',
    );
  });

  it('says resources are coming when there are none yet', () => {
    renderWithRouter(
      <ToolkitPage data={{ kind: 'home', toolkit: { ...TOOLKIT, folders: [] }, search: [] }} />,
    );

    expect(screen.getByText('Resources are coming here soon.')).toBeInTheDocument();
  });

  it('asks for at least 2 characters before searching', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ToolkitPage data={{ kind: 'home', toolkit: TOOLKIT, search: SEARCH }} />);

    await user.type(screen.getByRole('searchbox', { name: 'Search resources' }), 'h');

    expect(screen.getByRole('status')).toHaveTextContent('Type at least 2 characters to search.');
    expect(screen.queryByRole('list', { name: 'Search results' })).not.toBeInTheDocument();
  });

  it('shows results as you type, says how many there are, and can be cleared', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ToolkitPage data={{ kind: 'home', toolkit: TOOLKIT, search: SEARCH }} />);
    const searchbox = screen.getByRole('searchbox', { name: 'Search resources' });

    await user.type(searchbox, 'head');
    const results = within(screen.getByRole('list', { name: 'Search results' }));
    expect(results.getByRole('link', { name: 'Head pointer' })).toHaveAttribute(
      'href',
      '/highlights/head-pointer',
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 result found.');

    await user.type(searchbox, 'zzz');
    expect(screen.getByRole('status')).toHaveTextContent('No results found for “headzzz”.');
    expect(screen.queryByRole('list', { name: 'Search results' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(searchbox).toHaveValue('');
    expect(searchbox).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('fetches the full text’s words once someone starts searching, and finds them', async () => {
    const fetchIndex = vi.fn(() =>
      Promise.resolve(Response.json({ '/highlights/head-pointer': 'adhd tremor' })),
    );
    vi.stubGlobal('fetch', fetchIndex);
    const user = userEvent.setup();
    renderWithRouter(<ToolkitPage data={{ kind: 'home', toolkit: TOOLKIT, search: SEARCH }} />);

    expect(fetchIndex).not.toHaveBeenCalled();
    await user.type(screen.getByRole('searchbox'), 'ADHD');

    expect(fetchIndex).toHaveBeenCalledOnce();
    expect(await screen.findByRole('link', { name: 'Head pointer' })).toBeInTheDocument();
    expect(searchToolkit(SEARCH, 'adhd')).toEqual([]);
  });

  it('says when the words searched for are too common to search for', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ToolkitPage data={{ kind: 'home', toolkit: TOOLKIT, search: SEARCH }} />);

    await user.type(screen.getByRole('searchbox'), 'the');

    expect(screen.getByRole('status')).toHaveTextContent(
      '“the” is too common to search for. Try a more specific word.',
    );
  });

  it('marks folders in the results, so they can be told apart from resources', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ToolkitPage data={{ kind: 'home', toolkit: TOOLKIT, search: SEARCH }} />);

    await user.type(screen.getByRole('searchbox'), 'highlights');

    expect(screen.getByRole('link', { name: 'Highlights (folder)' })).toBeInTheDocument();
  });

  it('names each resource’s folder, so resources with the same title differ (WCAG 2.4.9)', async () => {
    const user = userEvent.setup();
    const search = [
      {
        kind: 'item' as const,
        title: 'Meetings',
        description: 'A.',
        path: '/a/meetings',
        folder: 'Accessibility Highlights',
      },
      {
        kind: 'item' as const,
        title: 'Meetings',
        description: 'N.',
        path: '/n/meetings',
        folder: 'Neurodiversity Highlights',
      },
    ];
    renderWithRouter(<ToolkitPage data={{ kind: 'home', toolkit: TOOLKIT, search }} />);

    await user.type(screen.getByRole('searchbox'), 'meetings');

    expect(
      screen.getByRole('link', { name: 'Meetings (Accessibility Highlights)' }),
    ).toHaveAttribute('href', '/a/meetings');
    expect(
      screen.getByRole('link', { name: 'Meetings (Neurodiversity Highlights)' }),
    ).toHaveAttribute('href', '/n/meetings');
  });

  it('marks file sizes as abbreviations, without adding a stop for each one (WCAG 3.1.4)', () => {
    const { container } = renderWithRouter(
      <ToolkitPage
        data={{
          kind: 'item',
          item: ITEM,
          slugs: ['highlights', 'dark-mode'],
          trail: TRAIL,
          textHtml: '<p>Text.</p>',
        }}
      />,
    );

    const sizes = [...container.querySelectorAll('abbr')].filter((abbr) =>
      ['KB', 'MB'].includes(abbr.textContent),
    );
    expect(sizes.length).toBeGreaterThan(0);
    for (const size of sizes) {
      expect(size).toHaveAttribute('title', size.textContent === 'KB' ? 'kilobytes' : 'megabytes');
      expect(size.closest('button')).toBeNull();
    }
  });

  it('shows a folder with breadcrumbs, and each resource’s links saying what they are', () => {
    renderWithRouter(
      <ToolkitPage
        data={{
          kind: 'folder',
          folder: HIGHLIGHTS,
          slugs: ['highlights'],
          trail: TRAIL.slice(0, 1),
        }}
      />,
    );

    const breadcrumbs = within(screen.getByRole('navigation', { name: 'Breadcrumbs' }));
    expect(breadcrumbs.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(breadcrumbs.getByText('Highlights')).toHaveAttribute('aria-current', 'page');

    const files = within(screen.getByRole('region', { name: 'Files' }));
    expect(files.getByRole('link', { name: 'Dark mode' })).toHaveAttribute(
      'href',
      '/highlights/dark-mode',
    );
    expect(files.getByText(/Last updated/)).toHaveTextContent('Last updated 1 June 2026');
    // The files are on the resource's own page, so the cards stay short
    expect(files.queryByRole('link', { name: /^Download/ })).not.toBeInTheDocument();
  });

  it('shows a resource’s files under headings for the full guide and the visual summary', () => {
    renderWithRouter(
      <ToolkitPage
        data={{
          kind: 'item',
          item: ITEM,
          slugs: ['highlights', 'dark-mode'],
          trail: TRAIL,
          textHtml: '<p>Text.</p>',
        }}
      />,
    );

    const files = within(screen.getByRole('region', { name: 'Files' }));
    expect(
      files.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(['Full guide', 'Visual summary']);

    const guide = within(files.getByRole('region', { name: 'Full guide' }));
    const view = guide.getByRole('link', { name: 'View: Dark mode, full guide, PDF' });
    expect(view).toHaveAttribute('href', '/files/highlights/dark-mode.pdf');
    // It opens in the same tab, so the Back button brings people back
    expect(view).not.toHaveAttribute('target');
    expect(
      guide.getByRole('link', { name: 'Download: Dark mode, full guide, Word document, 45KB' }),
    ).toHaveAttribute('download');

    const summary = within(files.getByRole('region', { name: 'Visual summary' }));
    expect(
      summary.getByRole('link', {
        name: 'View: Dark mode, visual summary, PDF',
      }),
    ).toHaveAttribute('href', '/files/highlights/dark-mode-visual-summary.pdf');
    expect(
      summary.getByRole('link', { name: 'Download: Dark mode, visual summary, PowerPoint, 300KB' }),
    ).toHaveAttribute('download');
  });

  it('keeps the spaces between each file’s words and links, for copying and reader views', () => {
    renderWithRouter(
      <ToolkitPage
        data={{
          kind: 'item',
          item: ITEM,
          slugs: ['highlights', 'dark-mode'],
          trail: TRAIL,
          textHtml: '<p>Text.</p>',
        }}
      />,
    );

    const pdf = within(screen.getByRole('region', { name: 'Full guide' })).getAllByRole(
      'listitem',
    )[1];
    expect(pdf?.textContent).toMatch(/^PDF \(120KB\): View.* or Download/);
  });

  it('doesn’t name the version when a resource only has one', () => {
    const fullGuideOnly = { ...ITEM, versions: ITEM.versions.slice(0, 1) };
    renderWithRouter(
      <ToolkitPage
        data={{
          kind: 'item',
          item: fullGuideOnly,
          slugs: ['highlights', 'dark-mode'],
          trail: TRAIL,
          textHtml: '<p>Text.</p>',
        }}
      />,
    );

    expect(screen.queryByText('Full guide')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Download: Dark mode, Word document, 45KB' }),
    ).toBeInTheDocument();
  });

  it('shows a resource with everything in it as text', () => {
    renderWithRouter(
      <ToolkitPage
        data={{
          kind: 'item',
          item: ITEM,
          slugs: ['highlights', 'dark-mode'],
          trail: TRAIL,
          textHtml: '<h3>Contrast</h3><p>Light text on a dark background.</p>',
        }}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Dark mode' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'Breadcrumbs' }))
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Home', 'Highlights']);
    expect(
      screen.getByRole('link', { name: 'Download: Dark mode, full guide, PDF, 120KB' }),
    ).toBeInTheDocument();
    const text = within(screen.getByRole('region', { name: 'What’s in it' }));
    expect(text.getByRole('heading', { level: 3, name: 'Contrast' })).toBeInTheDocument();
  });

  it('has no detectable accessibility issues on any kind of page', async () => {
    const pages = [
      renderWithRouter(<ToolkitPage data={{ kind: 'home', toolkit: TOOLKIT, search: SEARCH }} />),
      renderWithRouter(
        <ToolkitPage
          data={{ kind: 'folder', folder: HIGHLIGHTS, slugs: ['highlights'], trail: TRAIL }}
        />,
      ),
      renderWithRouter(
        <ToolkitPage
          data={{
            kind: 'item',
            item: ITEM,
            slugs: ['highlights', 'dark-mode'],
            trail: TRAIL,
            textHtml: '<p>Text.</p>',
          }}
        />,
      ),
    ];

    for (const { container } of pages) await expectNoAxeViolations(container);
  });
});
