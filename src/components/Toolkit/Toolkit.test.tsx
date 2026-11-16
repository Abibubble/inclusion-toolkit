import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ToolkitFolder, ToolkitItem } from '../../content/toolkit';
import type { ToolkitPageData } from '../../content/toolkitPage';
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
  topics: ['design', 'colour-and-vision'],
  audiences: ['designers', 'developers'],
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

const INFOGRAPHIC: ToolkitItem = {
  ...ITEM,
  slug: 'adhd',
  title: 'ADHD',
  description: 'An infographic about ADHD.',
  topics: ['neurodivergent-conditions'],
  audiences: ['everyone'],
};

const SECTION: ToolkitFolder = {
  slug: 'neurodiversity',
  title: 'Neurodiversity',
  description: 'Resources about neurodiversity.',
  items: [],
  folders: [
    {
      ...HIGHLIGHTS,
      title: 'Neurodiversity Highlights',
      items: [
        {
          ...ITEM,
          slug: 'neurodiversity-highlights',
          title: 'All highlights',
          topics: [],
          audiences: [],
        },
        ITEM,
        { ...INFOGRAPHIC, description: 'A highlight about ADHD.' },
      ],
    },
    {
      slug: 'infographics',
      title: 'Neurodiversity Infographics',
      description: 'One page about each condition.',
      folders: [],
      items: [INFOGRAPHIC],
    },
  ],
};

const CHECKLIST: ToolkitItem = {
  ...ITEM,
  slug: 'meeting-checklist',
  title: 'Meeting checklist',
  description: 'A checklist for meetings.',
  topics: ['meetings'],
  audiences: ['everyone'],
};

function renderSection(path = '/neurodiversity') {
  window.history.replaceState(null, '', path);
  return renderWithRouter(
    <ToolkitPage
      data={{
        kind: 'folder',
        folder: SECTION,
        slugs: ['neurodiversity'],
        trail: TRAIL.slice(0, 1),
      }}
    />,
    { path },
  );
}

function resourceLinks(): string[] {
  const list = within(screen.getByRole('region', { name: 'All resources' })).queryByRole('list');
  return list
    ? within(list)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href') ?? '')
    : [];
}

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

const HOME: ToolkitPageData = {
  kind: 'home',
  toolkit: { ...TOOLKIT, folders: [SECTION], items: [CHECKLIST] },
  startHere: [
    { item: CHECKLIST, path: '/meeting-checklist' },
    { item: ITEM, path: '/neurodiversity/highlights/dark-mode' },
  ],
  search: SEARCH,
};

const TRAIL = [
  { title: 'Home', path: '/' },
  { title: 'Highlights', path: '/highlights' },
];

describe('ToolkitPage', () => {
  it('shows the main page with search, where to start, each section, and the templates', () => {
    renderWithRouter(<ToolkitPage data={HOME} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Inclusion Toolkit' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search resources' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Start here' }))
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/meeting-checklist', '/neurodiversity/highlights/dark-mode']);
    expect(
      within(screen.getByRole('region', { name: 'Templates and checklists' })).getByRole('link', {
        name: 'Meeting checklist',
      }),
    ).toHaveAttribute('href', '/meeting-checklist');
  });

  it('says how many of each kind of resource a section has, and what each kind is', () => {
    renderWithRouter(<ToolkitPage data={HOME} />);

    const section = within(screen.getByRole('region', { name: 'Browse the toolkit' }));
    expect(section.getByRole('heading', { level: 3, name: 'Neurodiversity' })).toBeInTheDocument();
    expect(section.getAllByRole('listitem').map((item) => item.textContent)).toEqual(
      expect.arrayContaining([
        '2 highlights: each covers one topic, with a full guide and slides.',
        '1 infographic: each is one page about a condition.',
      ]),
    );
    expect(
      section.getByRole('link', { name: 'Browse all 3 neurodiversity resources' }),
    ).toHaveAttribute('href', '/neurodiversity');
  });

  it('links to each section’s list for a topic or who it’s for, naming the section (WCAG 2.4.9)', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ToolkitPage data={HOME} />);

    await user.click(screen.getByText('Browse by topic'));
    expect(
      screen.getByRole('link', { name: 'Neurodivergent conditions (2), Neurodiversity' }),
    ).toHaveAttribute('href', '/neurodiversity?topic=neurodivergent-conditions');

    await user.click(screen.getByText('Browse by who it’s for'));
    expect(screen.getByRole('link', { name: 'Designers (1), Neurodiversity' })).toHaveAttribute(
      'href',
      '/neurodiversity?for=designers',
    );
  });

  it('says resources are coming when there are none yet', () => {
    renderWithRouter(
      <ToolkitPage
        data={{ ...HOME, toolkit: { ...TOOLKIT, folders: [], items: [] }, startHere: [] }}
      />,
    );

    expect(screen.getByText('Resources are coming here soon.')).toBeInTheDocument();
  });

  it('asks for at least 2 characters before searching', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ToolkitPage data={HOME} />);

    await user.type(screen.getByRole('searchbox', { name: 'Search resources' }), 'h');

    expect(screen.getByRole('status')).toHaveTextContent('Type at least 2 characters to search.');
    expect(screen.queryByRole('list', { name: 'Search results' })).not.toBeInTheDocument();
  });

  it('shows results as you type, says how many there are, and can be cleared', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ToolkitPage data={HOME} />);
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
    renderWithRouter(<ToolkitPage data={HOME} />);

    expect(fetchIndex).not.toHaveBeenCalled();
    await user.type(screen.getByRole('searchbox'), 'ADHD');

    expect(fetchIndex).toHaveBeenCalledOnce();
    expect(await screen.findByRole('link', { name: 'Head pointer' })).toBeInTheDocument();
    expect(searchToolkit(SEARCH, 'adhd')).toEqual([]);
  });

  it('says when the words searched for are too common to search for', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ToolkitPage data={HOME} />);

    await user.type(screen.getByRole('searchbox'), 'the');

    expect(screen.getByRole('status')).toHaveTextContent(
      '“the” is too common to search for. Try a more specific word.',
    );
  });

  it('marks folders in the results, so they can be told apart from resources', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ToolkitPage data={HOME} />);

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
    renderWithRouter(<ToolkitPage data={{ ...HOME, search }} />);

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
          readNext: [],
        }}
      />,
    );

    const sizes = [...container.querySelectorAll('abbr')].filter((abbr) =>
      ['KB', 'MB'].includes(abbr.textContent),
    );
    expect(sizes.length).toBeGreaterThan(0);
    for (const size of sizes) {
      expect(size.closest('button')).toBeNull();
      expect(size).not.toHaveAttribute('title');
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

    const files = within(screen.getByRole('region', { name: 'Resources' }));
    expect(files.getByRole('link', { name: 'Dark mode' })).toHaveAttribute(
      'href',
      '/highlights/dark-mode',
    );
    expect(files.getByText(/^Topics:/)).toHaveTextContent('Topics: Design, Colour and vision');
    expect(files.getByText(/^Who it’s for:/)).toHaveTextContent(
      'Who it’s for: Designers, Developers',
    );
    // The date and files are on the resource's own page, so the cards stay short
    expect(files.queryByText(/Last updated/)).not.toBeInTheDocument();
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
          readNext: [],
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
    expect(view).not.toHaveAttribute('target');
    expect(
      guide.getByRole('link', { name: 'Download: Dark mode, full guide, Word document' }),
    ).toHaveAttribute('download');

    const summary = within(files.getByRole('region', { name: 'Visual summary' }));
    expect(
      summary.getByRole('link', {
        name: 'View: Dark mode, visual summary, PDF',
      }),
    ).toHaveAttribute('href', '/files/highlights/dark-mode-visual-summary.pdf');
    expect(
      summary.getByRole('link', { name: 'Download: Dark mode, visual summary, PowerPoint' }),
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
          readNext: [],
        }}
      />,
    );

    const pdf = within(screen.getByRole('region', { name: 'Full guide' })).getAllByRole(
      'listitem',
    )[1];
    expect(pdf?.textContent).toMatch(/^PDF \(120KB\): View.* or Download/);
  });

  it('shows a picture of the visual summary, with its size set and its text on the page', () => {
    renderWithRouter(
      <ToolkitPage
        data={{
          kind: 'item',
          item: { ...ITEM, picture: 'files/highlights/dark-mode-visual-summary' },
          slugs: ['highlights', 'dark-mode'],
          trail: TRAIL,
          textHtml: '<p>Text.</p>',
          readNext: [],
        }}
      />,
    );

    const picture = screen.getByRole('img', { name: 'The Dark mode visual summary.' });
    expect(picture).toHaveAttribute('src', '/files/highlights/dark-mode-visual-summary-960.png');
    expect(picture).toHaveAttribute(
      'srcset',
      '/files/highlights/dark-mode-visual-summary-960.png 960w, /files/highlights/dark-mode-visual-summary-1920.png 1920w',
    );
    expect(picture).toHaveAttribute('width', '960');
    expect(picture).toHaveAttribute('height', '540');
    expect(picture.closest('figure')?.querySelector('figcaption')).toHaveTextContent(
      'A preview of the visual summary. Everything in it is also in the section What’s in it.',
    );
    expect(screen.getByRole('link', { name: 'What’s in it' })).toHaveAttribute(
      'href',
      '/#whats-in-it',
    );
  });

  it('names an infographic’s picture as the infographic', () => {
    const infographic = {
      ...ITEM,
      versions: ITEM.versions
        .slice(0, 1)
        .map((version) => ({ ...version, name: 'Infographic' as const })),
      picture: 'files/infographics/adhd',
    };
    renderWithRouter(
      <ToolkitPage
        data={{
          kind: 'item',
          item: infographic,
          slugs: ['infographics', 'adhd'],
          trail: TRAIL,
          textHtml: '<p>Text.</p>',
          readNext: [],
        }}
      />,
    );

    expect(screen.getByRole('img', { name: 'The Dark mode infographic.' })).toBeInTheDocument();
  });

  it('suggests what to read next, naming each one’s folder (WCAG 2.4.9)', () => {
    renderWithRouter(
      <ToolkitPage
        data={{
          kind: 'item',
          item: ITEM,
          slugs: ['highlights', 'dark-mode'],
          trail: TRAIL,
          textHtml: '<p>Text.</p>',
          readNext: [
            {
              item: INFOGRAPHIC,
              path: '/neurodiversity/infographics/adhd',
              type: { slug: 'infographics', title: 'Neurodiversity Infographics' },
            },
          ],
        }}
      />,
    );

    const next = within(screen.getByRole('region', { name: 'Read next' }));
    expect(next.getByRole('link', { name: 'ADHD, Neurodiversity Infographics' })).toHaveAttribute(
      'href',
      '/neurodiversity/infographics/adhd',
    );
    expect(next.getByText('Type: Neurodiversity Infographics')).toBeInTheDocument();
  });

  it('leaves out Read next when there’s nothing to suggest', () => {
    renderWithRouter(
      <ToolkitPage
        data={{
          kind: 'item',
          item: ITEM,
          slugs: ['highlights', 'dark-mode'],
          trail: TRAIL,
          textHtml: '<p>Text.</p>',
          readNext: [],
        }}
      />,
    );

    expect(screen.queryByRole('region', { name: 'Read next' })).not.toBeInTheDocument();
  });

  it('shows no picture for a resource without slides', () => {
    renderWithRouter(
      <ToolkitPage
        data={{
          kind: 'item',
          item: ITEM,
          slugs: ['highlights', 'dark-mode'],
          trail: TRAIL,
          textHtml: '<p>Text.</p>',
          readNext: [],
        }}
      />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows no tags for an all-in-one resource, as it covers its whole folder', () => {
    renderWithRouter(
      <ToolkitPage
        data={{
          kind: 'item',
          item: { ...ITEM, topics: [], audiences: [] },
          slugs: ['highlights', 'dark-mode'],
          trail: TRAIL,
          textHtml: '<p>Text.</p>',
          readNext: [],
        }}
      />,
    );

    expect(screen.queryByText(/^Topics:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Who it’s for:/)).not.toBeInTheDocument();
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
          readNext: [],
        }}
      />,
    );

    expect(screen.queryByText('Full guide')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Download: Dark mode, Word document' }),
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
          readNext: [],
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
      screen.getByRole('link', { name: 'Download: Dark mode, full guide, PDF' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Last updated/)).toHaveTextContent('Last updated 1 June 2026');
    expect(screen.getByText(/^Topics:/)).toHaveTextContent('Topics: Design, Colour and vision');
    const text = within(screen.getByRole('region', { name: 'What’s in it' }));
    expect(text.getByRole('heading', { level: 3, name: 'Contrast' })).toBeInTheDocument();
  });

  it('lists a section’s resources from all its folders, with the all-in-ones apart', () => {
    renderSection();

    const allInOne = within(screen.getByRole('region', { name: 'Everything in one file' }));
    expect(allInOne.getByRole('link', { name: 'All highlights' })).toHaveAttribute(
      'href',
      '/neurodiversity/highlights/neurodiversity-highlights',
    );
    expect(resourceLinks()).toEqual([
      '/neurodiversity/highlights/adhd',
      '/neurodiversity/infographics/adhd',
      '/neurodiversity/highlights/dark-mode',
    ]);
    expect(screen.getByRole('status')).toHaveTextContent('Showing all 3 resources.');
  });

  it('names each resource’s type, so resources with the same title differ (WCAG 2.4.9)', () => {
    renderSection();

    expect(screen.getByRole('link', { name: 'ADHD, Highlights' })).toBeInTheDocument();
    const infographic = screen.getByRole('link', { name: 'ADHD, Infographics' });
    expect(
      within(infographic.closest('article') ?? document.body).getByText('Type: Infographics'),
    ).toBeInTheDocument();
  });

  it('filters the resources as boxes are ticked, says how many show, and puts them in the address', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByText(/^Filter by type, topic, or who it’s for/));
    expect(
      within(screen.getByRole('group', { name: 'Topic' }))
        .getAllByRole('checkbox')
        .map((box) => box.parentElement?.textContent),
    ).toEqual(['Design', 'Colour and vision', 'Neurodivergent conditions']);

    await user.click(screen.getByRole('checkbox', { name: 'Neurodivergent conditions' }));
    expect(resourceLinks()).toEqual([
      '/neurodiversity/highlights/adhd',
      '/neurodiversity/infographics/adhd',
    ]);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 2 of 3 resources.');

    await user.click(screen.getByRole('checkbox', { name: 'Infographics' }));
    expect(resourceLinks()).toEqual(['/neurodiversity/infographics/adhd']);
    expect(window.location.search).toBe('?type=infographics&topic=neurodivergent-conditions');
    expect(screen.getByText(/^Filter by/)).toHaveTextContent('(2 ticked)');

    await user.click(screen.getByRole('checkbox', { name: 'Designers' }));
    expect(resourceLinks()).toEqual([]);
    expect(screen.getByRole('status')).toHaveTextContent(
      'No resources match these filters. Untick some to see more.',
    );

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(resourceLinks()).toHaveLength(3);
    expect(window.location.search).toBe('');
    expect(screen.getByRole('button', { name: 'Clear filters' })).toHaveFocus();
  });

  it('starts with the filters in the address, open so they can be seen', () => {
    const { container } = renderSection('/neurodiversity?for=designers&topic=cats');

    expect(container.querySelector('details')).toHaveAttribute('open');
    expect(screen.getByRole('checkbox', { name: 'Designers' })).toBeChecked();
    expect(resourceLinks()).toEqual(['/neurodiversity/highlights/dark-mode']);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 of 3 resources.');
  });

  it('has no detectable accessibility issues on any kind of page', async () => {
    const pages = [
      renderWithRouter(<ToolkitPage data={HOME} />),
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
            readNext: [],
          }}
        />,
      ),
      renderSection('/neurodiversity?topic=design'),
    ];

    for (const { container } of pages) await expectNoAxeViolations(container);
  });
});
