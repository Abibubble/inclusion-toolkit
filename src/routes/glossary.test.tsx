import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ABBREVIATIONS } from '../content/abbreviations';
import { GLOSSARY } from '../content/glossary';
import { pageMeta } from '../seo/pageMeta';
import { expectNoAxeViolations } from '../test/axe';
import { renderWithRouter } from '../test/render';
import Glossary, { meta } from './glossary';

const region = (name: string) => within(screen.getByRole('region', { name }));

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
    const words = region('Technical words');

    expect(words.getAllByRole('term').map((term) => term.textContent)).toEqual(
      GLOSSARY.map((entry) => entry.term),
    );
    expect(words.getAllByRole('definition').map((item) => item.textContent)).toEqual(
      GLOSSARY.map((entry) => entry.definition),
    );
  });

  it('lists every abbreviation used on the site, with what it stands for (WCAG 3.1.4)', () => {
    renderWithRouter(<Glossary />);
    const abbreviations = region('Abbreviations');

    expect(abbreviations.getAllByRole('term').map((term) => term.textContent)).toEqual(
      Object.keys(ABBREVIATIONS),
    );
    expect(abbreviations.getAllByRole('definition').map((item) => item.textContent)).toEqual(
      Object.values(ABBREVIATIONS),
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

  it('has no detectable accessibility issues', async () => {
    const { container } = renderWithRouter(<Glossary />);

    await expectNoAxeViolations(container);
  });
});
