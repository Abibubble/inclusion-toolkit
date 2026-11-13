import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ABBREVIATIONS } from '../content/abbreviations';
import { GLOSSARY } from '../content/glossary';
import { pageMeta } from '../seo/pageMeta';
import { expectNoAxeViolations } from '../test/axe';
import { renderWithRouter } from '../test/render';
import Glossary, { meta } from './glossary';

const region = (name: string) => within(screen.getByRole('region', { name }));

/** Pretends the screen is small, so the words show as a list that opens one at a time */
function smallScreen() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('width <'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * The text of a table's column headers, row headers, and other cells. Read straight from the
 * markup, as finding hundreds of cells by their roles is slow enough to time out on a busy
 * computer. The axe test below checks the table's structure
 */
function tableText(section: HTMLElement) {
  const text = (selector: string) =>
    [...section.querySelectorAll(selector)].map((cell) => cell.textContent);
  return {
    columns: text('thead th[scope="col"]'),
    rows: text('tbody th[scope="row"]'),
    cells: text('tbody td'),
  };
}

describe('Glossary page', () => {
  it('has the page heading, and lists its sections at the top', () => {
    renderWithRouter(<Glossary />);

    expect(screen.getByRole('heading', { level: 1, name: 'Glossary' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'On this page' }))
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['#words', '#abbreviations']);
  });

  it('explains every technical word (WCAG 3.1.3)', () => {
    renderWithRouter(<Glossary />);
    const words = tableText(screen.getByRole('region', { name: 'Technical words' }));

    expect(words.columns).toEqual(['Word', 'What it means']);
    expect(words.rows).toEqual(GLOSSARY.map((entry) => entry.term));
    expect(words.cells).toEqual(GLOSSARY.map((entry) => entry.definition));
  });

  it('lists every abbreviation used on the site, with what it stands for (WCAG 3.1.4)', () => {
    renderWithRouter(<Glossary />);
    const abbreviations = tableText(screen.getByRole('region', { name: 'Abbreviations' }));

    expect(abbreviations.columns).toEqual(['Abbreviation', 'What it stands for']);
    expect(abbreviations.rows).toEqual(Object.keys(ABBREVIATIONS));
    expect(abbreviations.cells).toEqual(Object.values(ABBREVIATIONS));
  });

  it('on small screens, shows each word closed, opening to show what it means', async () => {
    smallScreen();
    const user = userEvent.setup();
    renderWithRouter(<Glossary />);
    const words = region('Technical words');

    expect(words.queryByRole('table')).not.toBeInTheDocument();
    const [first] = GLOSSARY;
    const summary = words.getByText(first?.term ?? '');
    const details = summary.closest('details');
    expect(details).not.toHaveAttribute('open');
    expect(details).toHaveAttribute('id', 'a11y');

    await user.click(summary);

    expect(details).toHaveAttribute('open');
    expect(within(details as HTMLElement).getByText(first?.definition ?? '')).toBeVisible();
  });

  it('on small screens, opens the word a toolkit page linked to', () => {
    smallScreen();
    renderWithRouter(<Glossary />, { path: '/glossary#screen-reader' });

    expect(screen.getByText('Screen reader').closest('details')).toHaveAttribute('open');
  });

  it('searches the words and abbreviations, and says how many match', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Glossary />);

    await user.type(screen.getByRole('searchbox', { name: 'Search the glossary' }), 'screen');

    expect(
      region('Technical words')
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent),
    ).toEqual(
      GLOSSARY.filter(({ term, definition }) =>
        `${term} ${definition}`.toLowerCase().includes('screen'),
      ).map(({ term }) => term),
    );
    expect(screen.getByRole('status').textContent).toMatch(
      /^\d+ words and \d+ abbreviations? match “screen”\.$/,
    );
  });

  it('waits for at least 2 characters before searching', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Glossary />);

    await user.type(screen.getByRole('searchbox', { name: 'Search the glossary' }), 'z');

    expect(screen.getByRole('status')).toHaveTextContent('Type at least 2 characters to search.');
    expect(tableText(screen.getByRole('region', { name: 'Technical words' })).rows).toHaveLength(
      GLOSSARY.length,
    );
  });

  it('on small screens, shows each abbreviation closed, opening to show what it stands for', async () => {
    smallScreen();
    const user = userEvent.setup();
    renderWithRouter(<Glossary />);
    const abbreviations = region('Abbreviations');

    expect(abbreviations.queryByRole('table')).not.toBeInTheDocument();
    const summary = abbreviations.getByText('ADHD');
    const details = summary.closest('details');
    expect(details).not.toHaveAttribute('open');

    await user.click(summary);

    expect(details).toHaveAttribute('open');
    expect(within(details as HTMLElement).getByText(ABBREVIATIONS.ADHD)).toBeVisible();
  });

  it('says when nothing matches, and can be cleared', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Glossary />);
    const search = screen.getByRole('searchbox', { name: 'Search the glossary' });

    await user.type(search, 'zzzz');

    expect(screen.getByRole('status')).toHaveTextContent('No words or abbreviations match “zzzz”.');
    expect(screen.getByText('No words match your search.')).toBeInTheDocument();
    expect(screen.getByText('No abbreviations match your search.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    expect(tableText(screen.getByRole('region', { name: 'Technical words' })).rows).toHaveLength(
      GLOSSARY.length,
    );
  });

  it('has its own page title and description, at its own address', () => {
    expect(meta()).toEqual(
      pageMeta({
        title: 'Glossary, Inclusion Toolkit',
        description:
          'Technical words used on this site, explained in plain words, and what each abbreviation stands for.',
        path: '/glossary',
      }),
    );
  });

  // The glossary is long, so axe takes longer than most pages to check it
  it('has no detectable accessibility issues', { timeout: 20_000 }, async () => {
    const { container } = renderWithRouter(<Glossary />);

    await expectNoAxeViolations(container);
  });
});
