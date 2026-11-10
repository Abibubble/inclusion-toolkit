import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MARK } from '../../brand/mark';
import { expectNoAxeViolations } from '../../test/axe';
import { renderWithRouter } from '../../test/render';
import { SiteHeader } from './SiteHeader';

describe('SiteHeader', () => {
  it('is the banner landmark', () => {
    renderWithRouter(<SiteHeader />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('links the site name to the home page, saying so for screen reader users', () => {
    renderWithRouter(<SiteHeader />);

    expect(
      within(screen.getByRole('banner')).getByRole('link', {
        name: 'Inclusion Toolkit home page',
      }),
    ).toHaveAttribute('href', '/');
  });

  it('shows the logo’s mark next to the name, hidden from screen readers as the name says the same', () => {
    renderWithRouter(<SiteHeader />);

    const link = within(screen.getByRole('banner')).getByRole('link', {
      name: 'Inclusion Toolkit home page',
    });
    const mark = link.querySelector('svg');

    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(mark?.querySelectorAll('rect')).toHaveLength(MARK.shapes.length + 1);
  });

  it('contains the main navigation', () => {
    renderWithRouter(<SiteHeader />);

    expect(
      within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' }),
    ).toBeInTheDocument();
  });

  it('has the display settings in a bar for wide screens, as well as in the menu', () => {
    renderWithRouter(<SiteHeader />);

    expect(
      within(screen.getByRole('banner')).getAllByRole('combobox', { name: 'Theme' }),
    ).toHaveLength(2);
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = renderWithRouter(<SiteHeader />);

    await expectNoAxeViolations(container);
  });
});
