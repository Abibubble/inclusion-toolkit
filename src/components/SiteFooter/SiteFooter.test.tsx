import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ABOUT_PATH, FOOTER_NAV } from '../../content/navigation';
import { expectNoAxeViolations } from '../../test/axe';
import { renderWithRouter } from '../../test/render';
import { SiteFooter } from './SiteFooter';

describe('SiteFooter', () => {
  it('is the content info landmark, and is left out of printed pages', () => {
    renderWithRouter(<SiteFooter />);

    expect(screen.getByRole('contentinfo')).toHaveAttribute('data-print', 'hide');
  });

  it('links to every footer page', () => {
    renderWithRouter(<SiteFooter />);
    const footerNav = screen.getByRole('navigation', { name: 'Footer' });

    for (const item of FOOTER_NAV) {
      expect(within(footerNav).getByRole('link', { name: item.label })).toHaveAttribute(
        'href',
        item.to,
      );
    }
  });

  it('links to the About page on every page, as the licence credit is there', () => {
    renderWithRouter(<SiteFooter />);

    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', ABOUT_PATH);
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = renderWithRouter(<SiteFooter />);

    await expectNoAxeViolations(container);
  });
});
