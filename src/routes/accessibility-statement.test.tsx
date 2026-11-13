import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MANUAL_TESTING, NEW_ISSUE_URL } from '../content/statements';
import { pageMeta } from '../seo/pageMeta';
import { expectNoAxeViolations } from '../test/axe';
import { renderWithRouter } from '../test/render';
import Accessibility, { meta } from './accessibility-statement';

const region = (name: string) => within(screen.getByRole('region', { name }));

describe('Accessibility statement', () => {
  it('has the page heading, and lists its sections at the top', () => {
    renderWithRouter(<Accessibility />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Accessibility statement' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'On this page' })).getAllByRole('link'),
    ).toHaveLength(7);
  });

  it('says which standard the site aims for, writing out WCAG the first time', () => {
    renderWithRouter(<Accessibility />);

    expect(
      region('How accessible this site is').getByText(/version 2\.2 at Level AAA/),
    ).toHaveTextContent('Web Content Accessibility Guidelines (WCAG) version 2.2 at Level AAA');
  });

  it('lists each known issue with who it affects, how to get around it, and what’s being done', () => {
    renderWithRouter(<Accessibility />);
    const issues = region('Known issues');

    expect(issues.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    for (const term of ['Who it affects', 'How to get around it', 'What’s being done about it']) {
      expect(issues.getAllByRole('term').map((item) => item.textContent)).toContain(term);
    }
  });

  it('links to the display settings and the glossary', () => {
    renderWithRouter(<Accessibility />);

    expect(screen.getByRole('link', { name: 'Change the display settings' })).toHaveAttribute(
      'href',
      '/display-settings',
    );
    expect(screen.getByRole('link', { name: 'list of abbreviations' })).toHaveAttribute(
      'href',
      '/glossary#abbreviations',
    );
    expect(screen.getByRole('link', { name: 'glossary' })).toHaveAttribute('href', '/glossary');
  });

  it('says how to report a problem, and that it needs a GitHub account', () => {
    renderWithRouter(<Accessibility />);
    const report = region('Report a problem');

    expect(
      report.getByRole('link', { name: 'report a problem on GitHub (external site)' }),
    ).toHaveAttribute('href', NEW_ISSUE_URL);
    expect(report.getByText(/You need a free GitHub account/)).toBeInTheDocument();
  });

  it('says when it was last checked', () => {
    renderWithRouter(<Accessibility />);

    expect(region('How this site is tested').getByText(/last checked on/)).toHaveTextContent(
      'This statement was last checked on 13 November 2026.',
    );
  });

  it('lists how the site has been tested by hand', () => {
    renderWithRouter(<Accessibility />);
    const tested = region('How this site is tested');

    expect(tested.getByText(/also tested by hand/)).toBeInTheDocument();
    for (const item of MANUAL_TESTING) {
      expect(tested.getByText(item).tagName).toBe('LI');
    }
  });

  it('has its own page title and description, at its own address', () => {
    expect(meta()).toEqual(
      pageMeta({
        title: 'Accessibility statement, Inclusion Toolkit',
        description:
          'How accessible this site is, what doesn’t work yet, how to report a problem, and display settings to make it work for you.',
        path: '/accessibility-statement',
      }),
    );
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = renderWithRouter(<Accessibility />);

    await expectNoAxeViolations(container);
  });
});
