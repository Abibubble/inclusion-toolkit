import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { MAIN_NAV } from '../../content/navigation';
import { expectNoAxeViolations } from '../../test/axe';
import { renderWithRouter } from '../../test/render';
import { SiteNav } from './SiteNav';

const mainNav = () => screen.getByRole('navigation', { name: 'Main' });
const menuButton = () => screen.getByRole('button', { name: 'Menu' });

describe('SiteNav', () => {
  it('links to every main section of the site', () => {
    renderWithRouter(<SiteNav />);

    for (const item of MAIN_NAV) {
      expect(within(mainNav()).getByRole('link', { name: item.label })).toHaveAttribute(
        'href',
        item.to,
      );
    }
  });

  it('marks the current page (WCAG 2.4.8)', () => {
    renderWithRouter(<SiteNav />, { path: '/neurodiversity' });

    expect(within(mainNav()).getByRole('link', { name: 'Neurodiversity' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(mainNav()).getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks the section, but not as the current page, on a page inside it (WCAG 2.4.8)', () => {
    renderWithRouter(<SiteNav />, { path: '/neurodiversity/highlights' });

    expect(within(mainNav()).getByRole('link', { name: 'Neurodiversity' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('marks the current page when its path ends with a slash, as when prerendered', () => {
    renderWithRouter(<SiteNav />, { path: '/neurodiversity/' });

    expect(within(mainNav()).getByRole('link', { name: 'Neurodiversity' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('only marks Home as current on the home page itself', () => {
    renderWithRouter(<SiteNav />, { path: '/' });

    expect(within(mainNav()).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  describe('menu button', () => {
    it('controls the panel with the links and theme switcher, and starts closed', () => {
      renderWithRouter(<SiteNav />);
      const panelId = menuButton().getAttribute('aria-controls') ?? '';
      const panel = document.getElementById(panelId);

      expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
      expect(panel).toContainElement(mainNav());
      expect(panel).toContainElement(screen.getByRole('combobox', { name: 'Theme' }));
    });

    it('closes with Escape while the theme switcher has focus', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SiteNav />);

      await user.click(menuButton());
      screen.getByRole('combobox', { name: 'Theme' }).focus();
      await user.keyboard('{Escape}');

      expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton()).toHaveFocus();
    });

    it('opens and closes the menu', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SiteNav />);

      await user.click(menuButton());
      expect(menuButton()).toHaveAttribute('aria-expanded', 'true');

      await user.click(menuButton());
      expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes with Escape and returns focus to the menu button', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SiteNav />);

      await user.click(menuButton());
      within(mainNav()).getByRole('link', { name: 'Neurodiversity' }).focus();
      await user.keyboard('{Escape}');

      expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton()).toHaveFocus();
    });

    it('closes with Escape while the menu button itself has focus', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SiteNav />);

      await user.click(menuButton());
      await user.keyboard('{Escape}');

      expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton()).toHaveFocus();
    });

    it('leaves the menu and focus alone when Escape is pressed elsewhere on the page', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <>
          <SiteNav />
          <button type="button">Elsewhere</button>
        </>,
      );

      await user.click(menuButton());
      screen.getByRole('button', { name: 'Elsewhere' }).focus();
      await user.keyboard('{Escape}');

      expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
    });

    it('ignores Escape when the menu is already closed', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SiteNav />);

      within(mainNav()).getByRole('link', { name: 'Neurodiversity' }).focus();
      await user.keyboard('{Escape}');

      expect(within(mainNav()).getByRole('link', { name: 'Neurodiversity' })).toHaveFocus();
    });

    it('closes after choosing a page', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SiteNav />);

      await user.click(menuButton());
      await user.click(within(mainNav()).getByRole('link', { name: 'Neurodiversity' }));

      expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('is left out of printed pages, along with the navigation', () => {
      renderWithRouter(<SiteNav />);

      expect(menuButton()).toHaveAttribute('data-print', 'hide');
      expect(mainNav()).toHaveAttribute('data-print', 'hide');
    });
  });

  it('has no detectable accessibility issues', async () => {
    const { container } = renderWithRouter(<SiteNav />);

    await expectNoAxeViolations(container, { disableRules: ['region'] });
  });
});
