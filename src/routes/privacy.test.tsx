import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NEW_ISSUE_URL } from '../content/statements';
import { pageMeta } from '../seo/pageMeta';
import { expectNoAxeViolations } from '../test/axe';
import { renderWithRouter } from '../test/render';
import Privacy, { meta } from './privacy';

const region = (name: string) => within(screen.getByRole('region', { name }));

describe('Privacy page', () => {
  it('has the page heading, a short summary, and lists its sections at the top', () => {
    renderWithRouter(<Privacy />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy' })).toBeInTheDocument();
    expect(
      screen.getByText(/this site doesn’t collect any personal information/),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'On this page' })).getAllByRole('link'),
    ).toHaveLength(7);
  });

  it('explains what the display settings save, and how to remove it', () => {
    renderWithRouter(<Privacy />);
    const storage = region('What’s saved in your browser');

    expect(storage.getByRole('link', { name: 'display settings' })).toHaveAttribute(
      'href',
      '/display-settings',
    );
    expect(storage.getByText(/Reset to defaults/)).toBeInTheDocument();
  });

  it('says who hosts the site, linking to their privacy statement', () => {
    renderWithRouter(<Privacy />);

    expect(
      region('Hosting').getByRole('link', { name: 'GitHub’s privacy statement (external site)' }),
    ).toHaveAttribute(
      'href',
      'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
    );
  });

  it('says where to ask a question, and that it’s public', () => {
    renderWithRouter(<Privacy />);
    const questions = region('Questions');

    expect(
      questions.getByRole('link', { name: 'ask it on GitHub (external site)' }),
    ).toHaveAttribute('href', NEW_ISSUE_URL);
    expect(questions.getByText(/what you write there is public/)).toBeInTheDocument();
  });

  it('says when it was last updated', () => {
    renderWithRouter(<Privacy />);

    expect(region('Changes to this notice').getByText(/last updated on/)).toHaveTextContent(
      'It was last updated on 10 November 2026.',
    );
  });

  it('has its own page title and description, at its own address', () => {
    expect(meta()).toEqual(
      pageMeta({
        title: 'Privacy, Inclusion Toolkit',
        description:
          'What information this site collects, and what happens to it. There’s no tracking, analytics or advertising.',
        path: '/privacy',
      }),
    );
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = renderWithRouter(<Privacy />);

    await expectNoAxeViolations(container);
  });
});
