import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LICENCE_URL } from '../content/about';
import { pageMeta } from '../seo/pageMeta';
import { expectNoAxeViolations } from '../test/axe';
import { renderWithRouter } from '../test/render';
import About, { meta } from './about';

describe('About page', () => {
  it('has the page heading', () => {
    renderWithRouter(<About />);

    expect(screen.getByRole('heading', { level: 1, name: 'About' })).toBeInTheDocument();
  });

  it('gives the credit the licence asks for, in the agreed words', () => {
    renderWithRouter(<About />);
    const credit = screen.getByText(/first made the Inclusion Toolkit/);

    expect(credit.textContent).toBe(
      'Abi Harrison-Nye first made the Inclusion Toolkit for giffgaff and HAND (Home of Accessibility and NeuroDiversity), and it has been updated since. Shared under CC BY 4.0 licence (external site).',
    );
  });

  it('links to the licence, saying what the link is for in the link itself (WCAG 2.4.9)', () => {
    renderWithRouter(<About />);

    expect(screen.getByRole('link', { name: 'CC BY 4.0 licence (external site)' })).toHaveAttribute(
      'href',
      LICENCE_URL,
    );
  });

  it('writes out what CC BY 4.0 is short for (WCAG 3.1.4)', () => {
    renderWithRouter(<About />);

    expect(
      screen.getByText(/short for the Creative Commons Attribution 4.0 International licence/),
    ).toBeInTheDocument();
  });

  it('has its own page title and description, at its own address', () => {
    expect(meta()).toEqual(
      pageMeta({
        title: 'About, Inclusion Toolkit',
        description: 'What the Inclusion Toolkit is, who first made it, and how you can share it.',
        path: '/about',
      }),
    );
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = renderWithRouter(<About />);

    await expectNoAxeViolations(container);
  });
});
